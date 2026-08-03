const crypto = require('crypto');
const { User, DoctorInvite } = require('../models');
const { sendDoctorInviteEmail } = require('../utils/emailService');

const INVITE_EXPIRY_DAYS = 7;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createInviteToken = () => crypto.randomBytes(32).toString('hex');

const getClinicDisplayName = (clinic) =>
  clinic.organizationProfile?.organizationName ||
  clinic.clinicProfile?.clinicName ||
  `${clinic.firstName} ${clinic.lastName}`;

const assertClinicCanInvite = (clinic) => {
  if (clinic.role !== 'clinic_admin') {
    const error = new Error('Only clinic or hospital admins can invite doctors');
    error.statusCode = 403;
    throw error;
  }

  if (clinic.organizationProfile?.verificationStatus !== 'approved') {
    const error = new Error('Your organization must be approved before inviting doctors');
    error.statusCode = 403;
    throw error;
  }
};

const getDoctorSeatUsage = async (clinicId) => {
  const [activeDoctors, pendingInvites] = await Promise.all([
    User.countDocuments({ role: 'doctor', 'doctorProfile.clinicId': clinicId, isActive: true }),
    DoctorInvite.countDocuments({ clinicId, status: 'pending', expiresAt: { $gt: new Date() } })
  ]);

  return { activeDoctors, pendingInvites, used: activeDoctors + pendingInvites };
};

const buildInviteLink = (token) => {
  const baseUrl = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${baseUrl}/doctor/setup?token=${token}`;
};

exports.inviteDoctor = async ({ clinic, email, firstName, lastName, specialty }) => {
  assertClinicCanInvite(clinic);

  const normalizedEmail = email.toLowerCase().trim();
  const maxDoctors = clinic.clinicProfile?.maxDoctors || 3;
  const usage = await getDoctorSeatUsage(clinic._id);

  if (usage.used >= maxDoctors) {
    const error = new Error(`Doctor limit reached (${maxDoctors}). Upgrade your plan or remove pending invites.`);
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error(
      existingUser.role === 'doctor'
        ? 'A doctor account with this email already exists'
        : 'An account with this email already exists'
    );
    error.statusCode = 400;
    throw error;
  }

  const existingInvite = await DoctorInvite.findOne({
    clinicId: clinic._id,
    email: normalizedEmail,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  if (existingInvite) {
    const error = new Error('A pending invite already exists for this email');
    error.statusCode = 400;
    throw error;
  }

  const token = createInviteToken();
  const invite = await DoctorInvite.create({
    email: normalizedEmail,
    clinicId: clinic._id,
    invitedBy: clinic._id,
    firstName,
    lastName,
    specialty,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    status: 'pending'
  });

  const inviteLink = buildInviteLink(token);
  const clinicName = getClinicDisplayName(clinic);

  await sendDoctorInviteEmail({
    email: normalizedEmail,
    clinicName,
    inviteLink,
    firstName,
    specialty,
    expiresInDays: INVITE_EXPIRY_DAYS
  });

  return {
    invite: {
      id: invite._id,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      specialty: invite.specialty,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt
    },
    inviteLink: process.env.NODE_ENV === 'production' ? undefined : inviteLink
  };
};

exports.resendInvite = async ({ clinic, inviteId }) => {
  assertClinicCanInvite(clinic);

  const invite = await DoctorInvite.findOne({ _id: inviteId, clinicId: clinic._id });
  if (!invite) {
    const error = new Error('Invite not found');
    error.statusCode = 404;
    throw error;
  }

  if (invite.status !== 'pending') {
    const error = new Error(`Cannot resend an invite with status "${invite.status}"`);
    error.statusCode = 400;
    throw error;
  }

  const token = createInviteToken();
  invite.tokenHash = hashToken(token);
  invite.expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await invite.save();

  const inviteLink = buildInviteLink(token);
  await sendDoctorInviteEmail({
    email: invite.email,
    clinicName: getClinicDisplayName(clinic),
    inviteLink,
    firstName: invite.firstName,
    specialty: invite.specialty,
    expiresInDays: INVITE_EXPIRY_DAYS
  });

  return {
    invite: {
      id: invite._id,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt
    },
    inviteLink: process.env.NODE_ENV === 'production' ? undefined : inviteLink
  };
};

exports.cancelInvite = async ({ clinic, inviteId }) => {
  assertClinicCanInvite(clinic);

  const invite = await DoctorInvite.findOne({ _id: inviteId, clinicId: clinic._id });
  if (!invite) {
    const error = new Error('Invite not found');
    error.statusCode = 404;
    throw error;
  }

  if (invite.status !== 'pending') {
    const error = new Error('Only pending invites can be cancelled');
    error.statusCode = 400;
    throw error;
  }

  invite.status = 'cancelled';
  await invite.save();

  return invite;
};

exports.getInviteByToken = async (token) => {
  if (!token) {
    const error = new Error('Invite token is required');
    error.statusCode = 400;
    throw error;
  }

  const invite = await DoctorInvite.findOne({ tokenHash: hashToken(token) }).populate(
    'clinicId',
    'firstName lastName organizationProfile clinicProfile'
  );

  if (!invite) {
    const error = new Error('Invalid invite token');
    error.statusCode = 404;
    throw error;
  }

  if (invite.status === 'cancelled') {
    const error = new Error('This invite has been cancelled');
    error.statusCode = 400;
    throw error;
  }

  if (invite.status === 'accepted') {
    const error = new Error('This invite has already been used');
    error.statusCode = 400;
    throw error;
  }

  if (invite.expiresAt < new Date()) {
    invite.status = 'expired';
    await invite.save();
    const error = new Error('This invite has expired. Ask your clinic to send a new one.');
    error.statusCode = 400;
    throw error;
  }

  const clinic = invite.clinicId;

  return {
    email: invite.email,
    firstName: invite.firstName,
    lastName: invite.lastName,
    specialty: invite.specialty,
    expiresAt: invite.expiresAt,
    clinic: {
      id: clinic._id,
      name: getClinicDisplayName(clinic),
      type: clinic.organizationProfile?.organizationType || clinic.clinicProfile?.clinicType
    }
  };
};

exports.setupDoctorAccount = async ({
  token,
  firstName,
  lastName,
  phone,
  password,
  specialty,
  licenseNumber,
  qualifications,
  experience,
  bio,
  languages,
  consultationFee,
  consultationTypes,
  availableDays,
  availableHours
}) => {
  const invite = await DoctorInvite.findOne({ tokenHash: hashToken(token) }).populate('clinicId');

  if (!invite) {
    const error = new Error('Invalid invite token');
    error.statusCode = 404;
    throw error;
  }

  if (invite.status !== 'pending') {
    const error = new Error(`Invite is ${invite.status} and cannot be used`);
    error.statusCode = 400;
    throw error;
  }

  if (invite.expiresAt < new Date()) {
    invite.status = 'expired';
    await invite.save();
    const error = new Error('This invite has expired. Ask your clinic to send a new one.');
    error.statusCode = 400;
    throw error;
  }

  const clinic = invite.clinicId;
  if (!clinic || clinic.role !== 'clinic_admin') {
    const error = new Error('Invite clinic is invalid');
    error.statusCode = 400;
    throw error;
  }

  const existingEmail = await User.findOne({ email: invite.email });
  if (existingEmail) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    const error = new Error('An account with this phone number already exists');
    error.statusCode = 400;
    throw error;
  }

  const clinicName = getClinicDisplayName(clinic);

  const doctor = new User({
    firstName: firstName || invite.firstName,
    lastName: lastName || invite.lastName,
    email: invite.email,
    phone,
    password,
    role: 'doctor',
    isActive: true,
    isEmailVerified: true,
    doctorProfile: {
      specialty: specialty || invite.specialty,
      licenseNumber,
      qualifications: qualifications || [],
      experience,
      hospital: clinicName,
      clinicId: clinic._id,
      invitedBy: invite.invitedBy,
      inviteAcceptedAt: new Date(),
      languages: languages || [],
      bio,
      consultationFee,
      consultationTypes: consultationTypes || ['video', 'chat'],
      availableDays: availableDays || ['mon', 'tue', 'wed', 'thu', 'fri'],
      availableHours: availableHours || { start: '09:00', end: '17:00' },
      isVerified: true,
      isAvailable: true
    }
  });

  await doctor.save();

  invite.status = 'accepted';
  invite.acceptedAt = new Date();
  invite.doctorId = doctor._id;
  await invite.save();

  return doctor;
};

exports.listClinicDoctors = async (clinicId) => {
  return User.find({ role: 'doctor', 'doctorProfile.clinicId': clinicId })
    .select('-password -refreshToken')
    .sort({ createdAt: -1 });
};

exports.listClinicInvites = async (clinicId, status) => {
  const filter = { clinicId };
  if (status) filter.status = status;

  const invites = await DoctorInvite.find(filter).sort({ createdAt: -1 });

  const now = new Date();
  for (const invite of invites) {
    if (invite.status === 'pending' && invite.expiresAt < now) {
      invite.status = 'expired';
      await invite.save();
    }
  }

  return invites;
};

exports.getDoctorSeatUsage = getDoctorSeatUsage;
