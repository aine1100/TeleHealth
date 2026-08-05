const { User } = require('../models');
const doctorInviteService = require('./doctorInviteService');
const { sendSupportRequestEmail } = require('../utils/emailService');

const ORG_TYPES = ['clinic', 'hospital', 'pharmacy', 'lab', 'insurance_company', 'other'];
const LANGUAGES = ['en', 'lg', 'sw', 'rn', 'luo', 'acholi'];

const displayFacilityName = (user) =>
  user.organizationProfile?.organizationName ||
  user.clinicProfile?.clinicName ||
  `${user.firstName} ${user.lastName}`;

exports.serializeFacilityProfile = (user) => {
  const org = user.organizationProfile || {};
  const clinic = user.clinicProfile || {};

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    preferredLanguage: user.preferredLanguage || 'en',
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    organizationName: org.organizationName || clinic.clinicName || '',
    organizationType: org.organizationType || clinic.clinicType || 'clinic',
    registrationNumber: org.registrationNumber || clinic.registrationNumber || '',
    contactPerson: org.contactPerson || `${user.firstName} ${user.lastName}`,
    website: org.website || '',
    address: org.address || user.address || '',
    city: org.city || user.city || '',
    district: org.district || user.district || '',
    verificationStatus: org.verificationStatus || 'pending',
    verificationNotes: org.verificationNotes || '',
    verificationDocuments: org.verificationDocuments || [],
    plan: clinic.plan || 'pay_per_visit',
    planStatus: clinic.planStatus || 'trial',
    maxDoctors: null,
    monthlyVisitLimit: clinic.monthlyVisitLimit ?? null,
    currentMonthVisits: clinic.currentMonthVisits || 0,
    notificationSettings: {
      email: user.notificationSettings?.email !== false,
      sms: user.notificationSettings?.sms !== false,
      push: user.notificationSettings?.push !== false,
      appointmentReminders: user.notificationSettings?.appointmentReminders !== false,
      medicineReminders: user.notificationSettings?.medicineReminders !== false,
      labResults: user.notificationSettings?.labResults !== false
    }
  };
};

exports.getFacilityProfile = async (clinicUser) => {
  const seats = await doctorInviteService.getDoctorSeatUsage(clinicUser._id);
  const profile = exports.serializeFacilityProfile(clinicUser);

  return {
    ...profile,
    seats: {
      ...seats,
      unlimited: true,
      maxDoctors: null,
      remaining: null
    }
  };
};

exports.updateFacilityProfile = async (clinicUser, payload = {}) => {
  const user = await User.findById(clinicUser._id);
  if (!user) {
    const error = new Error('Clinic account not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.organizationProfile) user.organizationProfile = {};
  if (!user.clinicProfile) user.clinicProfile = {};

  const orgName =
    payload.organizationName !== undefined
      ? String(payload.organizationName).trim()
      : user.organizationProfile.organizationName;

  if (payload.organizationName !== undefined && !orgName) {
    const error = new Error('Facility name is required');
    error.statusCode = 400;
    throw error;
  }

  if (payload.organizationType !== undefined) {
    if (!ORG_TYPES.includes(payload.organizationType)) {
      const error = new Error('Invalid facility type');
      error.statusCode = 400;
      throw error;
    }
    user.organizationProfile.organizationType = payload.organizationType;
    user.clinicProfile.clinicType = payload.organizationType;
  }

  if (payload.organizationName !== undefined) {
    user.organizationProfile.organizationName = orgName;
    user.clinicProfile.clinicName = orgName;
  }

  if (payload.registrationNumber !== undefined) {
    const reg = String(payload.registrationNumber || '').trim();
    user.organizationProfile.registrationNumber = reg;
    user.clinicProfile.registrationNumber = reg;
  }

  if (payload.contactPerson !== undefined) {
    user.organizationProfile.contactPerson = String(payload.contactPerson || '').trim();
  }
  if (payload.website !== undefined) {
    user.organizationProfile.website = String(payload.website || '').trim();
  }
  if (payload.address !== undefined) {
    const address = String(payload.address || '').trim();
    user.organizationProfile.address = address;
    user.address = address;
  }
  if (payload.city !== undefined) {
    const city = String(payload.city || '').trim();
    user.organizationProfile.city = city;
    user.city = city;
  }
  if (payload.district !== undefined) {
    const district = String(payload.district || '').trim();
    user.organizationProfile.district = district;
    user.district = district;
  }

  if (payload.firstName !== undefined) {
    const firstName = String(payload.firstName || '').trim();
    if (!firstName) {
      const error = new Error('First name is required');
      error.statusCode = 400;
      throw error;
    }
    user.firstName = firstName;
  }
  if (payload.lastName !== undefined) {
    const lastName = String(payload.lastName || '').trim();
    if (!lastName) {
      const error = new Error('Last name is required');
      error.statusCode = 400;
      throw error;
    }
    user.lastName = lastName;
  }
  if (payload.phone !== undefined) {
    const phone = String(payload.phone || '').trim();
    if (!phone) {
      const error = new Error('Phone is required');
      error.statusCode = 400;
      throw error;
    }
    const phoneTaken = await User.findOne({ phone, _id: { $ne: user._id } });
    if (phoneTaken) {
      const error = new Error('Phone number is already in use');
      error.statusCode = 400;
      throw error;
    }
    user.phone = phone;
  }

  // Keep contact person aligned when names change and contact was blank
  if (!user.organizationProfile.contactPerson) {
    user.organizationProfile.contactPerson = `${user.firstName} ${user.lastName}`;
  }

  await user.save();
  return exports.getFacilityProfile(user);
};

exports.updateFacilitySettings = async (clinicUser, payload = {}) => {
  const user = await User.findById(clinicUser._id);
  if (!user) {
    const error = new Error('Clinic account not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.notificationSettings) {
    user.notificationSettings = {
      email: true,
      sms: true,
      push: true,
      appointmentReminders: true,
      medicineReminders: true,
      labResults: true
    };
  }

  if (payload.notificationSettings && typeof payload.notificationSettings === 'object') {
    const keys = [
      'email',
      'sms',
      'push',
      'appointmentReminders',
      'medicineReminders',
      'labResults'
    ];
    keys.forEach((key) => {
      if (typeof payload.notificationSettings[key] === 'boolean') {
        user.notificationSettings[key] = payload.notificationSettings[key];
      }
    });
  }

  if (payload.preferredLanguage !== undefined) {
    if (!LANGUAGES.includes(payload.preferredLanguage)) {
      const error = new Error('Invalid preferred language');
      error.statusCode = 400;
      throw error;
    }
    user.preferredLanguage = payload.preferredLanguage;
  }

  await user.save();
  return exports.getFacilityProfile(user);
};

exports.submitSupportRequest = async (clinicUser, { subject, message, category }) => {
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();
  const cleanCategory = String(category || 'general').trim() || 'general';

  if (!cleanSubject) {
    const error = new Error('Subject is required');
    error.statusCode = 400;
    throw error;
  }
  if (cleanSubject.length > 160) {
    const error = new Error('Subject is too long');
    error.statusCode = 400;
    throw error;
  }
  if (!cleanMessage || cleanMessage.length < 10) {
    const error = new Error('Please describe your request in at least 10 characters');
    error.statusCode = 400;
    throw error;
  }
  if (cleanMessage.length > 4000) {
    const error = new Error('Message is too long');
    error.statusCode = 400;
    throw error;
  }

  const facilityName = displayFacilityName(clinicUser);
  const result = await sendSupportRequestEmail({
    fromUser: {
      name: `${clinicUser.firstName} ${clinicUser.lastName}`,
      email: clinicUser.email,
      phone: clinicUser.phone,
      facilityName,
      role: clinicUser.role
    },
    subject: cleanSubject,
    message: cleanMessage,
    category: cleanCategory
  });

  return {
    received: true,
    emailed: Boolean(result?.success),
    reference: result?.reference || null
  };
};
