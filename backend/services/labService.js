const { User, LabOrder, Appointment } = require('../models');
const { uploadLabReport } = require('./labStorageService');
const notificationService = require('./notificationService');

const PLATFORM_URL = process.env.PLATFORM_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const labPublicFields =
  'firstName lastName email phone city district organizationProfile clinicProfile isActive';

const assertLab = (user) => {
  if (user.role !== 'lab_tech' && user.role !== 'admin') {
    const error = new Error('Only laboratory staff can perform this action');
    error.statusCode = 403;
    throw error;
  }
};

const labDisplayName = (user) =>
  user?.organizationProfile?.organizationName ||
  user?.clinicProfile?.clinicName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
  'Laboratory';

const parsePage = (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const syncAppointmentLabOrder = async (order) => {
  if (!order.appointment) return;
  const appointment = await Appointment.findById(order.appointment);
  if (!appointment) return;

  const idx = (appointment.labOrders || []).findIndex(
    (row) =>
      String(row.labOrderId) === String(order._id) ||
      (row.testName === order.testName && !row.labOrderId)
  );

  const patch = {
    testName: order.testName,
    testCode: order.testCode,
    instructions: order.instructions,
    lab: order.lab,
    labOrderId: order._id,
    status: order.status === 'accepted' ? 'ordered' : order.status,
    results: {
      value: order.results?.value || '',
      unit: order.results?.unit || '',
      referenceRange: order.results?.referenceRange || '',
      status: order.results?.interpretation || undefined,
      reportUrl: order.results?.reportUrl || '',
      completedAt: order.results?.completedAt
    }
  };

  if (idx >= 0) {
    appointment.labOrders[idx] = { ...appointment.labOrders[idx].toObject?.() || appointment.labOrders[idx], ...patch };
  } else {
    appointment.labOrders.push(patch);
  }
  appointment.markModified('labOrders');
  await appointment.save();
};

exports.listLabs = async ({ q, page = 1, limit = 50 } = {}) => {
  const filter = {
    role: 'lab_tech',
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

  const take = Math.min(50, Math.max(1, Number(limit) || 50));
  const current = Math.max(1, Number(page) || 1);
  const skip = (current - 1) * take;

  const [rows, total] = await Promise.all([
    User.find(filter).select(labPublicFields).sort({ 'organizationProfile.organizationName': 1 }).skip(skip).limit(take).lean(),
    User.countDocuments(filter)
  ]);

  return {
    data: rows.map((row) => ({ ...row, displayName: labDisplayName(row) })),
    total,
    page: current,
    limit: take
  };
};

exports.createOrdersFromCarePlan = async ({ appointment, labOrders = [], doctorId }) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const clinicId = appointment.clinic || null;

  // Replace non-completed orders for this appointment when care plan is re-saved
  await LabOrder.deleteMany({
    appointment: appointment._id,
    status: { $in: ['ordered', 'accepted'] }
  });

  const created = [];
  for (const item of labOrders) {
    if (!item?.testName?.trim()) continue;
    const labId = item.labId || item.lab || null;
    const order = await LabOrder.create({
      lab: labId || null,
      patient: patientId,
      doctor: doctorId,
      appointment: appointment._id,
      clinic: clinicId,
      testName: String(item.testName).trim(),
      testCode: item.testCode || '',
      instructions: item.instructions || '',
      priority: item.priority === 'urgent' ? 'urgent' : 'routine',
      status: labId ? 'ordered' : 'ordered',
      fee: Math.max(0, Number(item.fee) || 0)
    });
    created.push(order);

    if (labId) {
      notificationService
        .createNotification({
          recipientId: labId,
          type: 'lab_results_ready',
          title: 'New lab order',
          message: `${order.testName} ordered for a patient.`,
          relatedModel: 'Appointment',
          relatedId: appointment._id,
          actionUrl: `${PLATFORM_URL}/lab/orders`,
          actionLabel: 'Open orders',
          priority: order.priority === 'urgent' ? 'high' : 'normal'
        })
        .catch(() => {});
    }
  }

  return created;
};

exports.getOverview = async (user) => {
  assertLab(user);
  const labId = user._id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const last14 = new Date(startOfDay);
  last14.setDate(last14.getDate() - 13);

  const mine = { lab: labId };
  const pool = { lab: null, status: 'ordered' };

  const [
    openPool,
    myOpen,
    completedToday,
    completedWeek,
    urgentOpen,
    volumeByDay,
    recentOrders
  ] = await Promise.all([
    LabOrder.countDocuments(pool),
    LabOrder.countDocuments({
      ...mine,
      status: { $in: ['ordered', 'accepted', 'sample_collected', 'processing'] }
    }),
    LabOrder.countDocuments({ ...mine, status: 'completed', completedAt: { $gte: startOfDay } }),
    LabOrder.countDocuments({ ...mine, status: 'completed', completedAt: { $gte: startOfWeek } }),
    LabOrder.countDocuments({
      $or: [
        { ...mine, priority: 'urgent', status: { $nin: ['completed', 'cancelled'] } },
        { ...pool, priority: 'urgent' }
      ]
    }),
    LabOrder.aggregate([
      { $match: { lab: labId, createdAt: { $gte: last14 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    LabOrder.find({ $or: [mine, pool] })
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
  ]);

  const dayMap = Object.fromEntries(
    (volumeByDay || []).map((row) => [row._id, { orders: row.orders || 0, completed: row.completed || 0 }])
  );
  const volumeByDaySeries = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    volumeByDaySeries.push({
      date: key,
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      orders: dayMap[key]?.orders || 0,
      completed: dayMap[key]?.completed || 0
    });
  }

  return {
    stats: {
      openPool,
      myOpen,
      completedToday,
      completedWeek,
      urgentOpen
    },
    volumeByDay: volumeByDaySeries,
    recentOrders
  };
};

exports.listOrders = async (user, query = {}) => {
  assertLab(user);
  const { page, limit, skip } = parsePage(query);
  const filter = {
    $or: [{ lab: user._id }, { lab: null, status: 'ordered' }]
  };
  if (query.status && query.status !== 'all') {
    if (query.status === 'pool') {
      filter.$or = [{ lab: null, status: 'ordered' }];
    } else {
      filter.$or = [{ lab: user._id, status: query.status }];
    }
  }
  if (query.priority && query.priority !== 'all') filter.priority = query.priority;

  const [data, total] = await Promise.all([
    LabOrder.find(filter)
      .populate('patient', 'firstName lastName phone email')
      .populate('doctor', 'firstName lastName doctorProfile.specialty')
      .populate('appointment', 'scheduledDate scheduledTime')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LabOrder.countDocuments(filter)
  ]);

  return { data, total, page, limit };
};

exports.acceptOrder = async (user, orderId) => {
  assertLab(user);
  const order = await LabOrder.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  if (order.lab && String(order.lab) !== String(user._id)) {
    const error = new Error('Order already assigned to another lab');
    error.statusCode = 409;
    throw error;
  }
  if (['completed', 'cancelled'].includes(order.status)) {
    const error = new Error('Order can no longer be accepted');
    error.statusCode = 400;
    throw error;
  }

  order.lab = user._id;
  order.status = 'accepted';
  order.acceptedAt = new Date();
  await order.save();
  await syncAppointmentLabOrder(order);

  await order.populate([
    { path: 'patient', select: 'firstName lastName phone email' },
    { path: 'doctor', select: 'firstName lastName' }
  ]);
  return order;
};

exports.updateOrder = async (user, orderId, body = {}, file) => {
  assertLab(user);
  const order = await LabOrder.findOne({ _id: orderId, lab: user._id });
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const { status, results } = body;
  const allowed = ['accepted', 'sample_collected', 'processing', 'completed', 'cancelled'];
  if (status && !allowed.includes(status)) {
    const error = new Error('Invalid status');
    error.statusCode = 400;
    throw error;
  }

  if (status) order.status = status;

  if (results || file) {
    order.results = order.results || {};
    if (results?.value !== undefined) order.results.value = String(results.value);
    if (results?.unit !== undefined) order.results.unit = String(results.unit);
    if (results?.referenceRange !== undefined) order.results.referenceRange = String(results.referenceRange);
    if (results?.interpretation !== undefined) order.results.interpretation = results.interpretation;
    if (results?.notes !== undefined) order.results.notes = String(results.notes);
    if (file) {
      order.results.reportUrl = await uploadLabReport(file, user._id);
      order.results.reportName = file.originalname || 'report';
    }
  }

  if (order.status === 'completed') {
    order.completedAt = new Date();
    order.results.completedAt = new Date();
    if (!order.results.interpretation) order.results.interpretation = 'normal';
  }

  await order.save();
  await syncAppointmentLabOrder(order);

  if (order.status === 'completed') {
    notificationService
      .createNotification({
        recipientId: order.patient,
        type: 'lab_results_ready',
        title: 'Lab results ready',
        message: `Results for ${order.testName} are available.`,
        relatedModel: 'Appointment',
        relatedId: order.appointment,
        actionUrl: `${PLATFORM_URL}/patient/care`,
        actionLabel: 'View results',
        priority: 'high'
      })
      .catch(() => {});
  }

  await order.populate([
    { path: 'patient', select: 'firstName lastName phone email' },
    { path: 'doctor', select: 'firstName lastName' }
  ]);
  return order;
};

exports.getAccount = async (user) => {
  assertLab(user);
  return User.findById(user._id).select('-password -refreshToken -otpCode -resetOtpCode').lean();
};

exports.updateProfile = async (user, body = {}) => {
  assertLab(user);
  const fresh = await User.findById(user._id);
  if (body.firstName) fresh.firstName = String(body.firstName).trim();
  if (body.lastName) fresh.lastName = String(body.lastName).trim();
  if (body.phone) fresh.phone = String(body.phone).trim();
  if (body.organizationName) {
    fresh.organizationProfile = fresh.organizationProfile || {};
    fresh.organizationProfile.organizationName = String(body.organizationName).trim();
  }
  if (body.city !== undefined) fresh.city = String(body.city).trim();
  if (body.district !== undefined) fresh.district = String(body.district).trim();
  if (body.address !== undefined) fresh.address = String(body.address).trim();
  await fresh.save();
  return fresh;
};

exports.updateSettings = async (user, body = {}) => {
  assertLab(user);
  const fresh = await User.findById(user._id);
  if (body.preferredLanguage) fresh.preferredLanguage = body.preferredLanguage;
  if (body.notificationSettings) {
    fresh.notificationSettings = {
      ...(fresh.notificationSettings?.toObject?.() || fresh.notificationSettings || {}),
      ...body.notificationSettings
    };
  }
  await fresh.save();
  return fresh;
};
