const {
  User,
  InsurancePlan,
  InsurancePolicy,
  InsuranceClaim
} = require('../models');
const { uploadInsuranceDocument } = require('./insuranceStorageService');
const notificationService = require('./notificationService');

const PLATFORM_URL = process.env.PLATFORM_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const insurerPublicFields =
  'firstName lastName email phone city district organizationProfile clinicProfile isActive';

const assertInsurer = (user) => {
  if (user.role !== 'insurance' && user.role !== 'admin') {
    const error = new Error('Only insurance partners can perform this action');
    error.statusCode = 403;
    throw error;
  }
};

const insurerDisplayName = (user) =>
  user?.organizationProfile?.organizationName ||
  user?.clinicProfile?.clinicName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
  'Insurance partner';

const parsePage = (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const generateClaimNumber = () =>
  `CLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/**
 * African-style split: insurer % + optional flat co-pay floor for the patient.
 * Caps by per-visit and remaining annual limit.
 */
exports.computeBenefitSplit = ({ plan, policy, billAmount, benefitType = 'consult' }) => {
  const bill = Math.max(0, Number(billAmount) || 0);
  const percentKey = `${benefitType}CoveragePercent`;
  const copayKey = `${benefitType}CopayFixed`;
  const percent = Math.min(100, Math.max(0, Number(plan?.[percentKey]) || 0));
  const fixedCopay = Math.max(0, Number(plan?.[copayKey]) || 0);

  let patientShare = Math.round(bill * ((100 - percent) / 100));
  if (fixedCopay > 0) {
    patientShare = Math.max(patientShare, fixedCopay);
  }
  patientShare = Math.min(patientShare, bill);
  let insurerShare = bill - patientShare;

  const perVisit = Math.max(0, Number(plan?.perVisitLimit) || 0);
  if (perVisit > 0 && insurerShare > perVisit) {
    insurerShare = perVisit;
    patientShare = bill - insurerShare;
  }

  const annualLimit = Math.max(0, Number(plan?.annualLimit) || 0);
  const annualUsed = Math.max(0, Number(policy?.annualUsed) || 0);
  const remaining = annualLimit > 0 ? Math.max(0, annualLimit - annualUsed) : insurerShare;
  if (annualLimit > 0 && insurerShare > remaining) {
    insurerShare = remaining;
    patientShare = bill - insurerShare;
  }

  return {
    billAmount: bill,
    coveragePercent: percent,
    fixedCopay,
    patientShare,
    insurerShare,
    annualRemaining: annualLimit > 0 ? remaining : null,
    currency: 'UGX'
  };
};

exports.listProviders = async ({ q, page = 1, limit = 20 } = {}) => {
  const filter = {
    role: 'insurance',
    isActive: true,
    'organizationProfile.verificationStatus': 'approved'
  };
  if (q?.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { firstName: rx },
      { lastName: rx },
      { 'organizationProfile.organizationName': rx },
      { 'clinicProfile.clinicName': rx }
    ];
  }

  const take = Math.min(50, Math.max(1, Number(limit) || 20));
  const current = Math.max(1, Number(page) || 1);
  const skip = (current - 1) * take;

  const [rows, total] = await Promise.all([
    User.find(filter)
      .select(insurerPublicFields)
      .sort({ 'organizationProfile.organizationName': 1, firstName: 1 })
      .skip(skip)
      .limit(take)
      .lean(),
    User.countDocuments(filter)
  ]);

  const data = rows.map((row) => ({
    ...row,
    displayName: insurerDisplayName(row)
  }));

  return { data, total, page: current, limit: take };
};

exports.ensureDefaultPlan = async (insurerId) => {
  let plan = await InsurancePlan.findOne({ insurer: insurerId, isDefault: true, isActive: true });
  if (plan) return plan;
  plan = await InsurancePlan.create({
    insurer: insurerId,
    name: 'Standard outpatient',
    description:
      'Default plan: insurer covers most of the consult and pharmacy bill; patient pays co-pay share.',
    consultCoveragePercent: 80,
    pharmacyCoveragePercent: 70,
    labCoveragePercent: 70,
    consultCopayFixed: 5000,
    pharmacyCopayFixed: 3000,
    annualLimit: 5000000,
    perVisitLimit: 500000,
    isDefault: true,
    isActive: true
  });
  return plan;
};

exports.getOverview = async (user) => {
  assertInsurer(user);
  const insurerId = user._id;
  await exports.ensureDefaultPlan(insurerId);

  const [pendingPolicies, verifiedPolicies, pendingClaims, approvedClaims, paidClaims, recentClaims] =
    await Promise.all([
      InsurancePolicy.countDocuments({ insurer: insurerId, status: 'pending' }),
      InsurancePolicy.countDocuments({ insurer: insurerId, status: 'verified' }),
      InsuranceClaim.countDocuments({
        insurer: insurerId,
        status: { $in: ['submitted', 'under_review'] }
      }),
      InsuranceClaim.countDocuments({ insurer: insurerId, status: 'approved' }),
      InsuranceClaim.aggregate([
        { $match: { insurer: insurerId, status: { $in: ['approved', 'paid'] } } },
        {
          $group: {
            _id: null,
            totalApproved: { $sum: '$approvedAmount' },
            totalPaid: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$approvedAmount', 0] }
            }
          }
        }
      ]),
      InsuranceClaim.find({ insurer: insurerId })
        .populate('patient', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

  const money = paidClaims[0] || { totalApproved: 0, totalPaid: 0 };

  return {
    stats: {
      pendingPolicies,
      verifiedPolicies,
      pendingClaims,
      approvedClaims,
      totalApprovedAmount: money.totalApproved || 0,
      totalPaidAmount: money.totalPaid || 0
    },
    recentClaims
  };
};

exports.listPlans = async (user) => {
  assertInsurer(user);
  await exports.ensureDefaultPlan(user._id);
  return InsurancePlan.find({ insurer: user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
};

exports.createPlan = async (user, body = {}) => {
  assertInsurer(user);
  const plan = await InsurancePlan.create({
    insurer: user._id,
    name: String(body.name || '').trim() || 'Plan',
    description: body.description ? String(body.description).trim() : '',
    consultCoveragePercent: Number(body.consultCoveragePercent ?? 80),
    pharmacyCoveragePercent: Number(body.pharmacyCoveragePercent ?? 70),
    labCoveragePercent: Number(body.labCoveragePercent ?? 70),
    consultCopayFixed: Number(body.consultCopayFixed ?? 0),
    pharmacyCopayFixed: Number(body.pharmacyCopayFixed ?? 0),
    labCopayFixed: Number(body.labCopayFixed ?? 0),
    annualLimit: Number(body.annualLimit ?? 5000000),
    perVisitLimit: Number(body.perVisitLimit ?? 500000),
    isActive: body.isActive !== false,
    isDefault: Boolean(body.isDefault)
  });

  if (plan.isDefault) {
    await InsurancePlan.updateMany(
      { insurer: user._id, _id: { $ne: plan._id } },
      { $set: { isDefault: false } }
    );
  }

  return plan;
};

exports.updatePlan = async (user, planId, body = {}) => {
  assertInsurer(user);
  const plan = await InsurancePlan.findOne({ _id: planId, insurer: user._id });
  if (!plan) {
    const error = new Error('Plan not found');
    error.statusCode = 404;
    throw error;
  }

  const fields = [
    'name',
    'description',
    'consultCoveragePercent',
    'pharmacyCoveragePercent',
    'labCoveragePercent',
    'consultCopayFixed',
    'pharmacyCopayFixed',
    'labCopayFixed',
    'annualLimit',
    'perVisitLimit',
    'isActive',
    'isDefault'
  ];
  fields.forEach((key) => {
    if (body[key] !== undefined) plan[key] = body[key];
  });
  await plan.save();

  if (plan.isDefault) {
    await InsurancePlan.updateMany(
      { insurer: user._id, _id: { $ne: plan._id } },
      { $set: { isDefault: false } }
    );
  }

  return plan;
};

exports.listPolicies = async (user, query = {}) => {
  assertInsurer(user);
  const { page, limit, skip } = parsePage(query);
  const filter = { insurer: user._id };
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.q?.trim()) {
    const rx = new RegExp(query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ policyNumber: rx }, { memberName: rx }];
  }

  const [data, total] = await Promise.all([
    InsurancePolicy.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate('plan', 'name consultCoveragePercent pharmacyCoveragePercent')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InsurancePolicy.countDocuments(filter)
  ]);

  return { data, total, page, limit };
};

exports.updatePolicyStatus = async (user, policyId, body = {}) => {
  assertInsurer(user);
  const policy = await InsurancePolicy.findOne({ _id: policyId, insurer: user._id }).populate(
    'patient',
    'firstName lastName'
  );
  if (!policy) {
    const error = new Error('Policy not found');
    error.statusCode = 404;
    throw error;
  }

  const { status, rejectionReason, planId, notes } = body;
  const allowed = ['pending', 'verified', 'rejected', 'expired', 'cancelled'];
  if (!allowed.includes(status)) {
    const error = new Error('Invalid policy status');
    error.statusCode = 400;
    throw error;
  }

  policy.status = status;
  if (rejectionReason !== undefined) policy.rejectionReason = String(rejectionReason || '').trim();
  if (notes !== undefined) policy.notes = String(notes || '').trim();
  if (planId) policy.plan = planId;

  if (status === 'verified') {
    policy.verifiedAt = new Date();
    policy.verifiedBy = user._id;
    if (!policy.plan) {
      const plan = await exports.ensureDefaultPlan(user._id);
      policy.plan = plan._id;
    }
  }

  await policy.save();

  const patient = await User.findById(policy.patient);
  if (patient) {
    const providerName = insurerDisplayName(user);
    patient.insurance = {
      ...(patient.insurance?.toObject?.() || patient.insurance || {}),
      provider: providerName,
      providerId: user._id,
      policyId: policy._id,
      policyNumber: policy.policyNumber,
      coverageType: policy.coverageType,
      validFrom: policy.validFrom,
      validUntil: policy.validUntil,
      documentUrl: policy.documentUrl,
      isVerified: status === 'verified'
    };
    await patient.save();

    notificationService
      .createNotification({
        recipientId: patient._id,
        type: 'insurance_claim_update',
        title: status === 'verified' ? 'Insurance verified' : `Insurance ${status}`,
        message:
          status === 'verified'
            ? `${providerName} verified your policy ${policy.policyNumber}.`
            : status === 'rejected'
              ? `${providerName} could not verify your policy.${policy.rejectionReason ? ` ${policy.rejectionReason}` : ''}`
              : `Your insurance status is now ${status}.`,
        relatedModel: 'InsurancePolicy',
        relatedId: policy._id,
        actionUrl: `${PLATFORM_URL}/patient/insurance`,
        actionLabel: 'View insurance',
        priority: 'high'
      })
      .catch(() => {});
  }

  await policy.populate([
    { path: 'patient', select: 'firstName lastName email phone' },
    { path: 'plan', select: 'name consultCoveragePercent pharmacyCoveragePercent' }
  ]);

  return policy;
};

exports.listClaims = async (user, query = {}) => {
  assertInsurer(user);
  const { page, limit, skip } = parsePage(query);
  const filter = { insurer: user._id };
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.type && query.type !== 'all') filter.type = query.type;

  const [data, total] = await Promise.all([
    InsuranceClaim.find(filter)
      .populate('patient', 'firstName lastName phone email')
      .populate('policy', 'policyNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InsuranceClaim.countDocuments(filter)
  ]);

  return { data, total, page, limit };
};

exports.updateClaim = async (user, claimId, body = {}) => {
  assertInsurer(user);
  const claim = await InsuranceClaim.findOne({ _id: claimId, insurer: user._id });
  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  const { status, approvedAmount, rejectionReason, notes } = body;
  const allowed = ['submitted', 'under_review', 'approved', 'rejected', 'paid'];
  if (status && !allowed.includes(status)) {
    const error = new Error('Invalid claim status');
    error.statusCode = 400;
    throw error;
  }

  const prevStatus = claim.status;
  if (status) claim.status = status;
  if (approvedAmount !== undefined) {
    claim.approvedAmount = Math.max(0, Number(approvedAmount) || 0);
  }
  if (rejectionReason !== undefined) claim.rejectionReason = String(rejectionReason || '').trim();
  if (notes !== undefined) claim.notes = String(notes || '').trim();

  if (['approved', 'rejected', 'paid', 'under_review'].includes(claim.status)) {
    claim.reviewedAt = new Date();
    claim.reviewedBy = user._id;
  }
  if (claim.status === 'approved' && !claim.approvedAmount) {
    claim.approvedAmount = claim.insurerShare;
  }
  if (claim.status === 'paid') {
    claim.paidAt = new Date();
    if (!claim.approvedAmount) claim.approvedAmount = claim.insurerShare;
  }

  await claim.save();

  // Update annual used when moving into approved/paid
  if (
    ['approved', 'paid'].includes(claim.status) &&
    !['approved', 'paid'].includes(prevStatus) &&
    claim.policy
  ) {
    await InsurancePolicy.findByIdAndUpdate(claim.policy, {
      $inc: { annualUsed: claim.approvedAmount || claim.insurerShare || 0 }
    });
  }

  notificationService
    .createNotification({
      recipientId: claim.patient,
      type: 'insurance_claim_update',
      title: `Claim ${claim.status.replace(/_/g, ' ')}`,
      message: `Claim ${claim.claimNumber} is now ${claim.status.replace(/_/g, ' ')}.${
        claim.status === 'approved'
          ? ` Approved amount: UGX ${Number(claim.approvedAmount || 0).toLocaleString()}.`
          : ''
      }${claim.rejectionReason ? ` ${claim.rejectionReason}` : ''}`,
      relatedModel: 'InsuranceClaim',
      relatedId: claim._id,
      actionUrl: `${PLATFORM_URL}/patient/insurance`,
      actionLabel: 'View insurance',
      priority: 'high'
    })
    .catch(() => {});

  await claim.populate([
    { path: 'patient', select: 'firstName lastName phone email' },
    { path: 'policy', select: 'policyNumber status' }
  ]);

  return claim;
};

exports.getMyPolicies = async (patientUser, query = {}) => {
  const { page, limit, skip } = parsePage(query);
  const filter = { patient: patientUser._id, status: { $ne: 'cancelled' } };
  if (query.status && query.status !== 'all') filter.status = query.status;

  const [data, total] = await Promise.all([
    InsurancePolicy.find(filter)
      .populate('insurer', insurerPublicFields)
      .populate('plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InsurancePolicy.countDocuments(filter)
  ]);

  return {
    data: data.map((row) => ({
      ...row,
      insurer: row.insurer
        ? { ...row.insurer, displayName: insurerDisplayName(row.insurer) }
        : null
    })),
    total,
    page,
    limit
  };
};

exports.getMyClaims = async (patientUser, query = {}) => {
  const { page, limit, skip } = parsePage(query);
  const filter = { patient: patientUser._id };
  if (query.status && query.status !== 'all') filter.status = query.status;

  const [data, total] = await Promise.all([
    InsuranceClaim.find(filter)
      .populate('insurer', insurerPublicFields)
      .populate('policy', 'policyNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InsuranceClaim.countDocuments(filter)
  ]);

  return {
    data: data.map((row) => ({
      ...row,
      insurer: row.insurer
        ? { ...row.insurer, displayName: insurerDisplayName(row.insurer) }
        : null
    })),
    total,
    page,
    limit
  };
};

exports.submitMyPolicy = async (patientUser, body = {}, file) => {
  const insurerId = body.insurerId;
  if (!insurerId) {
    const error = new Error('Select an insurance provider');
    error.statusCode = 400;
    throw error;
  }

  const insurer = await User.findOne({
    _id: insurerId,
    role: 'insurance',
    isActive: true,
    'organizationProfile.verificationStatus': 'approved'
  });
  if (!insurer) {
    const error = new Error('Insurance provider not found or not approved');
    error.statusCode = 404;
    throw error;
  }

  const policyNumber = String(body.policyNumber || '').trim();
  if (!policyNumber) {
    const error = new Error('Policy number is required');
    error.statusCode = 400;
    throw error;
  }

  const plan = await exports.ensureDefaultPlan(insurer._id);
  let documentUrl = '';
  let documentName = '';
  let documentMimeType = '';
  if (file) {
    documentUrl = await uploadInsuranceDocument(file, patientUser._id);
    documentName = file.originalname || 'insurance-document';
    documentMimeType = file.mimetype || '';
  }

  // One active/pending policy per insurer per patient
  let policy = await InsurancePolicy.findOne({
    patient: patientUser._id,
    insurer: insurer._id,
    status: { $in: ['pending', 'verified', 'rejected'] }
  });

  if (policy) {
    policy.policyNumber = policyNumber;
    policy.memberName =
      String(body.memberName || '').trim() ||
      `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim();
    policy.coverageType = body.coverageType || policy.coverageType || 'individual';
    policy.validFrom = body.validFrom ? new Date(body.validFrom) : policy.validFrom;
    policy.validUntil = body.validUntil ? new Date(body.validUntil) : policy.validUntil;
    policy.plan = plan._id;
    policy.status = 'pending';
    policy.rejectionReason = '';
    if (documentUrl) {
      policy.documentUrl = documentUrl;
      policy.documentName = documentName;
      policy.documentMimeType = documentMimeType;
    }
    await policy.save();
  } else {
    policy = await InsurancePolicy.create({
      insurer: insurer._id,
      patient: patientUser._id,
      plan: plan._id,
      policyNumber,
      memberName:
        String(body.memberName || '').trim() ||
        `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim(),
      coverageType: body.coverageType || 'individual',
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      documentUrl,
      documentName,
      documentMimeType,
      status: 'pending'
    });
  }

  const providerName = insurerDisplayName(insurer);
  patientUser.insurance = {
    provider: providerName,
    providerId: insurer._id,
    policyId: policy._id,
    policyNumber,
    coverageType: policy.coverageType,
    validFrom: policy.validFrom,
    validUntil: policy.validUntil,
    documentUrl: policy.documentUrl,
    isVerified: false
  };
  await patientUser.save();

  notificationService
    .createNotification({
      recipientId: insurer._id,
      type: 'insurance_claim_update',
      title: 'New member verification request',
      message: `${patientUser.firstName || 'A patient'} submitted policy ${policyNumber} for verification.`,
      relatedModel: 'InsurancePolicy',
      relatedId: policy._id,
      actionUrl: `${PLATFORM_URL}/insurance/members`,
      actionLabel: 'Review member',
      priority: 'high'
    })
    .catch(() => {});

  await policy.populate([
    { path: 'insurer', select: insurerPublicFields },
    { path: 'plan' }
  ]);

  return policy;
};

exports.cancelMyPolicy = async (patientUser, policyId) => {
  const policy = await InsurancePolicy.findOne({ _id: policyId, patient: patientUser._id });
  if (!policy) {
    const error = new Error('Policy not found');
    error.statusCode = 404;
    throw error;
  }
  policy.status = 'cancelled';
  await policy.save();

  if (String(patientUser.insurance?.policyId) === String(policy._id)) {
    patientUser.insurance = {
      provider: '',
      providerId: undefined,
      policyId: undefined,
      policyNumber: '',
      coverageType: '',
      validFrom: undefined,
      validUntil: undefined,
      documentUrl: '',
      isVerified: false
    };
    await patientUser.save();
  }

  return policy;
};

exports.quoteForPatient = async (patientUser, { amount, benefitType = 'consult', policyId } = {}) => {
  const bill = Math.max(0, Number(amount) || 0);
  let policy;
  if (policyId) {
    policy = await InsurancePolicy.findOne({
      _id: policyId,
      patient: patientUser._id,
      status: 'verified'
    }).populate('plan');
  } else {
    policy = await InsurancePolicy.findOne({
      patient: patientUser._id,
      status: 'verified'
    })
      .sort({ verifiedAt: -1 })
      .populate('plan');
  }

  if (!policy || !policy.plan) {
    return {
      eligible: false,
      billAmount: bill,
      patientShare: bill,
      insurerShare: 0,
      message: 'No verified insurance policy on file'
    };
  }

  const split = exports.computeBenefitSplit({
    plan: policy.plan,
    policy,
    billAmount: bill,
    benefitType
  });

  return {
    eligible: true,
    policyId: policy._id,
    insurerId: policy.insurer,
    policyNumber: policy.policyNumber,
    planName: policy.plan.name,
    ...split
  };
};

exports.createClaimFromPayment = async ({
  patientUser,
  amount,
  benefitType = 'consult',
  relatedModel = 'Appointment',
  relatedId,
  providerName = '',
  items = []
}) => {
  const quote = await exports.quoteForPatient(patientUser, { amount, benefitType });
  if (!quote.eligible || quote.insurerShare <= 0) {
    return { quote, claim: null };
  }

  const policy = await InsurancePolicy.findById(quote.policyId);
  const claim = await InsuranceClaim.create({
    insurer: quote.insurerId,
    patient: patientUser._id,
    policy: policy._id,
    claimNumber: generateClaimNumber(),
    type: benefitType === 'pharmacy' ? 'pharmacy' : benefitType === 'lab' ? 'lab' : 'consultation',
    relatedTo: { model: relatedModel, id: relatedId },
    providerName,
    amountClaimed: amount,
    patientShare: quote.patientShare,
    insurerShare: quote.insurerShare,
    approvedAmount: 0,
    status: 'submitted',
    items:
      items.length > 0
        ? items
        : [{ description: `${benefitType} cover`, quantity: 1, unitPrice: amount, amount }]
  });

  notificationService
    .createNotification({
      recipientId: quote.insurerId,
      type: 'insurance_claim_update',
      title: 'New insurance claim',
      message: `${patientUser.firstName || 'Patient'} submitted claim ${claim.claimNumber} for UGX ${Number(
        quote.insurerShare
      ).toLocaleString()}.`,
      relatedModel: 'InsuranceClaim',
      relatedId: claim._id,
      actionUrl: `${PLATFORM_URL}/insurance/claims`,
      actionLabel: 'Review claim',
      priority: 'high'
    })
    .catch(() => {});

  return { quote, claim };
};

exports.getAccount = async (user) => {
  assertInsurer(user);
  const fresh = await User.findById(user._id)
    .select('-password -refreshToken -otpCode -resetOtpCode')
    .lean();
  return fresh;
};

exports.updateProfile = async (user, body = {}) => {
  assertInsurer(user);
  const fresh = await User.findById(user._id);
  if (body.firstName) fresh.firstName = String(body.firstName).trim();
  if (body.lastName) fresh.lastName = String(body.lastName).trim();
  if (body.phone) fresh.phone = String(body.phone).trim();
  if (body.organizationName) {
    fresh.organizationProfile = fresh.organizationProfile || {};
    fresh.organizationProfile.organizationName = String(body.organizationName).trim();
  }
  if (body.address !== undefined) fresh.address = String(body.address).trim();
  if (body.city !== undefined) fresh.city = String(body.city).trim();
  if (body.district !== undefined) fresh.district = String(body.district).trim();
  await fresh.save();
  return fresh;
};

exports.updateSettings = async (user, body = {}) => {
  assertInsurer(user);
  const fresh = await User.findById(user._id);
  if (body.preferredLanguage) fresh.preferredLanguage = body.preferredLanguage;
  if (body.notificationSettings) {
    fresh.notificationSettings = {
      ...fresh.notificationSettings?.toObject?.() || fresh.notificationSettings || {},
      ...body.notificationSettings
    };
  }
  await fresh.save();
  return fresh;
};
