const { User, Appointment } = require('../models');

const ORG_ROLES = ['clinic_admin', 'lab_tech', 'insurance', 'pharmacist'];

const orgSelect =
  'firstName lastName email phone role isActive isEmailVerified createdAt organizationProfile clinicProfile lastLogin';

const patientSelect =
  'firstName lastName email phone gender dateOfBirth bloodType city district address isActive createdAt lastLogin emergencyContact allergies chronicConditions';

const mapRoleType = (role) => {
  if (role === 'clinic_admin') return 'clinic';
  if (role === 'lab_tech') return 'lab';
  if (role === 'insurance') return 'insurance';
  return 'other';
};

const serializeOrganization = (user) => {
  const doc = user.toObject ? user.toObject() : user;
  const org = doc.organizationProfile || {};
  const clinic = doc.clinicProfile || {};

  return {
    id: doc._id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    role: doc.role,
    type: mapRoleType(doc.role),
    isActive: doc.isActive,
    isEmailVerified: Boolean(doc.isEmailVerified),
    createdAt: doc.createdAt,
    lastLogin: doc.lastLogin,
    organizationName: org.organizationName || clinic.clinicName || `${doc.firstName} ${doc.lastName}`,
    organizationType: org.organizationType || clinic.clinicType || mapRoleType(doc.role),
    registrationNumber: org.registrationNumber || clinic.registrationNumber || '',
    contactPerson: org.contactPerson || `${doc.firstName} ${doc.lastName}`,
    website: org.website || '',
    address: org.address || doc.address || '',
    city: org.city || doc.city || '',
    district: org.district || doc.district || '',
    verificationStatus: org.verificationStatus || 'pending',
    verificationNotes: org.verificationNotes || '',
    verificationDocuments: org.verificationDocuments || [],
    plan: clinic.plan || null,
    planStatus: clinic.planStatus || null,
    // Convenience flags for admin UI
    canOperate: (org.verificationStatus || 'pending') === 'approved' && Boolean(doc.isActive),
    needsEmailVerification: !doc.isEmailVerified
  };
};

exports.getOverview = async () => {
  const [
    patientsCount,
    clinicsCount,
    labsCount,
    insuranceCount,
    pendingOrgs,
    unverifiedEmailOrgs,
    approvedOrgs,
    rejectedOrgs,
    appointmentsCount,
    recentOrgs,
    recentPatients
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'clinic_admin' }),
    User.countDocuments({ role: 'lab_tech' }),
    User.countDocuments({ role: 'insurance' }),
    User.countDocuments({
      role: { $in: ORG_ROLES },
      $or: [
        { 'organizationProfile.verificationStatus': 'pending' },
        { 'organizationProfile.verificationStatus': { $exists: false } },
        { 'organizationProfile.verificationStatus': null }
      ]
    }),
    User.countDocuments({
      role: { $in: ORG_ROLES },
      isEmailVerified: { $ne: true }
    }),
    User.countDocuments({
      role: { $in: ORG_ROLES },
      'organizationProfile.verificationStatus': 'approved'
    }),
    User.countDocuments({
      role: { $in: ORG_ROLES },
      'organizationProfile.verificationStatus': 'rejected'
    }),
    Appointment.countDocuments(),
    User.find({ role: { $in: ORG_ROLES } })
      .sort({ createdAt: -1 })
      .limit(8)
      .select(orgSelect),
    User.find({ role: 'patient' })
      .sort({ createdAt: -1 })
      .limit(6)
      .select(patientSelect)
  ]);

  const statusRank = { pending: 0, rejected: 1, approved: 2 };
  const sortedRecent = recentOrgs
    .map(serializeOrganization)
    .sort((a, b) => (statusRank[a.verificationStatus] ?? 9) - (statusRank[b.verificationStatus] ?? 9));

  return {
    stats: {
      patients: patientsCount,
      clinics: clinicsCount,
      labs: labsCount,
      insurance: insuranceCount,
      pendingApprovals: pendingOrgs,
      unverifiedEmails: unverifiedEmailOrgs,
      approvedOrganizations: approvedOrgs,
      rejectedOrganizations: rejectedOrgs,
      appointments: appointmentsCount
    },
    recentOrganizations: sortedRecent,
    recentPatients: recentPatients.map((p) => {
      const doc = p.toObject ? p.toObject() : p;
      return {
        id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        phone: doc.phone,
        isActive: doc.isActive,
        createdAt: doc.createdAt
      };
    })
  };
};

exports.listOrganizations = async ({ status, type, q, page = 1, limit = 50 } = {}) => {
  const filter = { role: { $in: ORG_ROLES } };

  if (status && status !== 'all') {
    if (status === 'pending') {
      // Treat missing verificationStatus as pending (legacy registrations)
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { 'organizationProfile.verificationStatus': 'pending' },
            { 'organizationProfile.verificationStatus': { $exists: false } },
            { 'organizationProfile.verificationStatus': null }
          ]
        }
      ];
    } else {
      filter['organizationProfile.verificationStatus'] = status;
    }
  }

  if (type === 'clinic') filter.role = 'clinic_admin';
  if (type === 'lab') filter.role = 'lab_tech';
  if (type === 'insurance') filter.role = 'insurance';

  if (q) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
      { 'organizationProfile.organizationName': regex },
      { 'clinicProfile.clinicName': regex },
      { 'organizationProfile.registrationNumber': regex }
    ];
  }

  const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);
  const take = Math.min(Math.max(Number(limit), 1), 100);

  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take).select(orgSelect),
    User.countDocuments(filter)
  ]);

  const statusRank = { pending: 0, rejected: 1, approved: 2 };
  const data = rows
    .map(serializeOrganization)
    .sort((a, b) => {
      const rankDiff = (statusRank[a.verificationStatus] ?? 9) - (statusRank[b.verificationStatus] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      // Unverified emails float higher within the same approval status
      if (Boolean(a.isEmailVerified) !== Boolean(b.isEmailVerified)) {
        return a.isEmailVerified ? 1 : -1;
      }
      return 0;
    });

  return {
    total,
    page: Math.max(Number(page), 1),
    limit: take,
    data
  };
};

exports.getOrganizationById = async (id) => {
  const user = await User.findOne({ _id: id, role: { $in: ORG_ROLES } }).select(
    `${orgSelect} organizationProfile clinicProfile`
  );
  if (!user) return null;
  return serializeOrganization(user);
};

exports.reviewOrganization = async (id, { status, notes }) => {
  if (!['approved', 'rejected'].includes(status)) {
    const error = new Error('Invalid verification status. Use approved or rejected.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ _id: id, role: { $in: ORG_ROLES } });
  if (!user) {
    const error = new Error('Organization not found');
    error.statusCode = 404;
    throw error;
  }

  // Ensure nested profile always exists for reliable admin review
  if (!user.organizationProfile) {
    user.organizationProfile = {};
  }

  user.organizationProfile.verificationStatus = status;
  user.organizationProfile.verificationNotes =
    notes !== undefined && notes !== null ? notes : user.organizationProfile.verificationNotes || '';
  user.markModified('organizationProfile');

  if (status === 'approved') {
    // Admin approval unlocks dashboard use even if email OTP was never completed
    user.isActive = true;
    user.isEmailVerified = true;

    if (user.role === 'clinic_admin') {
      if (!user.clinicProfile) user.clinicProfile = {};
      user.clinicProfile.clinicName =
        user.clinicProfile.clinicName ||
        user.organizationProfile.organizationName ||
        `${user.firstName} ${user.lastName}`;
      user.clinicProfile.clinicType =
        user.clinicProfile.clinicType || user.organizationProfile.organizationType || 'clinic';
      user.clinicProfile.registrationNumber =
        user.clinicProfile.registrationNumber || user.organizationProfile.registrationNumber || '';
      if (!user.clinicProfile.planStatus || user.clinicProfile.planStatus === 'suspended') {
        user.clinicProfile.planStatus = 'trial';
      }
      user.markModified('clinicProfile');
    }
  }

  if (status === 'rejected') {
    // Keep account recoverable for reviewing the decision after email verify;
    // dashboard APIs remain blocked via verificationStatus.
    if (user.isEmailVerified) {
      user.isActive = true;
    }
  }

  await user.save();
  return serializeOrganization(user);
};

exports.listClinics = async (query = {}) => {
  return exports.listOrganizations({ ...query, type: 'clinic' });
};

exports.listLabs = async (query = {}) => {
  return exports.listOrganizations({ ...query, type: 'lab' });
};

exports.listPatients = async ({ q, page = 1, limit = 50 } = {}) => {
  const filter = { role: 'patient' };

  if (q) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
      { city: regex },
      { district: regex }
    ];
  }

  const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);
  const take = Math.min(Math.max(Number(limit), 1), 100);

  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take).select(patientSelect),
    User.countDocuments(filter)
  ]);

  const patientIds = rows.map((p) => p._id);
  const appointmentCounts = await Appointment.aggregate([
    { $match: { patient: { $in: patientIds } } },
    { $group: { _id: '$patient', visits: { $sum: 1 }, lastVisit: { $max: '$scheduledDate' } } }
  ]);

  const countMap = new Map(
    appointmentCounts.map((item) => [String(item._id), { visits: item.visits, lastVisit: item.lastVisit }])
  );

  return {
    total,
    page: Math.max(Number(page), 1),
    limit: take,
    data: rows.map((patient) => {
      const doc = patient.toObject ? patient.toObject() : patient;
      const appt = countMap.get(String(doc._id)) || { visits: 0, lastVisit: null };
      let age = null;
      if (doc.dateOfBirth) {
        const dob = new Date(doc.dateOfBirth);
        const now = new Date();
        age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
      }

      return {
        id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        phone: doc.phone,
        gender: doc.gender || '—',
        age,
        bloodType: doc.bloodType || '—',
        city: doc.city || '',
        district: doc.district || '',
        address: doc.address || '',
        isActive: doc.isActive,
        status: doc.isActive ? 'active' : 'inactive',
        visits: appt.visits,
        lastVisit: appt.lastVisit,
        emergencyContact: doc.emergencyContact || null,
        allergies: doc.allergies || [],
        chronicConditions: doc.chronicConditions || [],
        createdAt: doc.createdAt,
        lastLogin: doc.lastLogin
      };
    })
  };
};

exports.getPatientById = async (id) => {
  const patient = await User.findOne({ _id: id, role: 'patient' }).select(patientSelect);
  if (!patient) return null;

  const result = await exports.listPatients({ q: patient.email, limit: 1 });
  return result.data[0] || null;
};
