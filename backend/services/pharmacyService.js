const { User, PharmacyMedicine, PharmacyOrder, Appointment } = require('../models');
const { uploadPharmacyImage } = require('./pharmacyStorageService');
const notificationService = require('./notificationService');

const pharmacyPublicFields =
  'firstName lastName phone email city district address avatar pharmacyProfile organizationProfile isActive';

const assertPharmacist = (user) => {
  if (user.role !== 'pharmacist' && user.role !== 'admin') {
    const error = new Error('Only pharmacists can manage pharmacy inventory');
    error.statusCode = 403;
    throw error;
  }
};

const getPharmacyDisplayName = (user) =>
  user?.pharmacyProfile?.pharmacyName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
  'Pharmacy';

const mapMedicinePayload = (body = {}) => ({
  name: String(body.name || '').trim(),
  genericName: body.genericName ? String(body.genericName).trim() : '',
  brandName: body.brandName ? String(body.brandName).trim() : '',
  description: body.description ? String(body.description).trim() : '',
  form: body.form || 'tablet',
  strength: body.strength ? String(body.strength).trim() : '',
  category: body.category ? String(body.category).trim() : 'General',
  sku: body.sku ? String(body.sku).trim() : '',
  manufacturer: body.manufacturer ? String(body.manufacturer).trim() : '',
  price: Number(body.price) || 0,
  currency: body.currency || 'UGX',
  stockQuantity: Math.max(0, Number(body.stockQuantity) || 0),
  reorderLevel: Math.max(0, Number(body.reorderLevel) || 10),
  requiresPrescription:
    body.requiresPrescription === undefined
      ? true
      : body.requiresPrescription === true || body.requiresPrescription === 'true',
  isActive:
    body.isActive === undefined ? true : body.isActive === true || body.isActive === 'true'
});

exports.listPharmacies = async ({ q, city } = {}) => {
  const filter = {
    role: 'pharmacist',
    isActive: true,
    'pharmacyProfile.isOpen': { $ne: false }
  };

  if (city?.trim()) {
    filter.$or = [
      { city: new RegExp(city.trim(), 'i') },
      { 'pharmacyProfile.city': new RegExp(city.trim(), 'i') }
    ];
  }

  if (q?.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { 'pharmacyProfile.pharmacyName': regex },
          { 'pharmacyProfile.city': regex },
          { city: regex }
        ]
      }
    ];
  }

  const pharmacies = await User.find(filter).select(pharmacyPublicFields).sort({ 'pharmacyProfile.pharmacyName': 1 }).lean();

  const counts = await PharmacyMedicine.aggregate([
    { $match: { pharmacy: { $in: pharmacies.map((p) => p._id) }, isActive: true } },
    { $group: { _id: '$pharmacy', count: { $sum: 1 }, lowStock: { $sum: { $cond: [{ $lte: ['$stockQuantity', '$reorderLevel'] }, 1, 0] } } } }
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c]));

  return pharmacies.map((pharmacy) => ({
    ...pharmacy,
    displayName: getPharmacyDisplayName(pharmacy),
    medicineCount: countMap[String(pharmacy._id)]?.count || 0
  }));
};

exports.getPharmacyById = async (pharmacyId) => {
  const pharmacy = await User.findOne({
    _id: pharmacyId,
    role: 'pharmacist',
    isActive: true
  })
    .select(pharmacyPublicFields)
    .lean();

  if (!pharmacy) {
    const error = new Error('Pharmacy not found');
    error.statusCode = 404;
    throw error;
  }

  const medicines = await PharmacyMedicine.find({
    pharmacy: pharmacyId,
    isActive: true
  })
    .sort({ name: 1 })
    .lean();

  return {
    ...pharmacy,
    displayName: getPharmacyDisplayName(pharmacy),
    medicines
  };
};

exports.getMyPharmacyProfile = async (user) => {
  assertPharmacist(user);
  const pharmacy = await User.findById(user._id).select('-password -refreshToken').lean();
  return pharmacy;
};

const LANGUAGES = ['en', 'lg', 'sw', 'rn', 'luo', 'acholi'];

exports.serializePharmacyAccount = (user) => ({
  preferredLanguage: user.preferredLanguage || 'en',
  notificationSettings: {
    email: user.notificationSettings?.email !== false,
    sms: user.notificationSettings?.sms !== false,
    push: user.notificationSettings?.push !== false,
    appointmentReminders: user.notificationSettings?.appointmentReminders !== false,
    medicineReminders: user.notificationSettings?.medicineReminders !== false,
    labResults: user.notificationSettings?.labResults !== false
  },
  pharmacyProfile: {
    isOpen: user.pharmacyProfile?.isOpen !== false,
    offersDelivery: user.pharmacyProfile?.offersDelivery !== false,
    offersPickup: user.pharmacyProfile?.offersPickup !== false
  }
});

exports.getMyAccount = async (user) => {
  assertPharmacist(user);
  const pharmacy = await User.findById(user._id).select('-password -refreshToken');
  if (!pharmacy) {
    const error = new Error('Pharmacy account not found');
    error.statusCode = 404;
    throw error;
  }
  return exports.serializePharmacyAccount(pharmacy);
};

exports.updateMySettings = async (user, payload = {}) => {
  assertPharmacist(user);
  const pharmacy = await User.findById(user._id);
  if (!pharmacy) {
    const error = new Error('Pharmacy account not found');
    error.statusCode = 404;
    throw error;
  }

  if (!pharmacy.notificationSettings) {
    pharmacy.notificationSettings = {
      email: true,
      sms: true,
      push: true,
      appointmentReminders: true,
      medicineReminders: true,
      labResults: true
    };
  }

  if (payload.notificationSettings && typeof payload.notificationSettings === 'object') {
    ['email', 'sms', 'push', 'appointmentReminders', 'medicineReminders', 'labResults'].forEach(
      (key) => {
        if (typeof payload.notificationSettings[key] === 'boolean') {
          pharmacy.notificationSettings[key] = payload.notificationSettings[key];
        }
      }
    );
  }

  if (payload.preferredLanguage !== undefined) {
    if (!LANGUAGES.includes(payload.preferredLanguage)) {
      const error = new Error('Invalid preferred language');
      error.statusCode = 400;
      throw error;
    }
    pharmacy.preferredLanguage = payload.preferredLanguage;
  }

  if (typeof payload.isOpen === 'boolean') {
    if (!pharmacy.pharmacyProfile) pharmacy.pharmacyProfile = {};
    pharmacy.pharmacyProfile.isOpen = payload.isOpen;
  }

  await pharmacy.save();
  return exports.serializePharmacyAccount(pharmacy);
};

exports.submitSupportRequest = async (user, payload) => {
  assertPharmacist(user);
  const doctorAccountService = require('./doctorAccountService');
  return doctorAccountService.submitSupportRequest(user, payload);
};

exports.updateMyPharmacyProfile = async (user, body = {}) => {
  assertPharmacist(user);
  const pharmacy = await User.findById(user._id);
  if (!pharmacy) {
    const error = new Error('Pharmacy account not found');
    error.statusCode = 404;
    throw error;
  }

  pharmacy.pharmacyProfile = {
    ...(pharmacy.pharmacyProfile?.toObject?.() || pharmacy.pharmacyProfile || {}),
    pharmacyName: body.pharmacyName ?? pharmacy.pharmacyProfile?.pharmacyName,
    licenseNumber: body.licenseNumber ?? pharmacy.pharmacyProfile?.licenseNumber,
    phone: body.phone ?? pharmacy.pharmacyProfile?.phone ?? pharmacy.phone,
    address: body.address ?? pharmacy.pharmacyProfile?.address ?? pharmacy.address,
    city: body.city ?? pharmacy.pharmacyProfile?.city ?? pharmacy.city,
    district: body.district ?? pharmacy.pharmacyProfile?.district ?? pharmacy.district,
    description: body.description ?? pharmacy.pharmacyProfile?.description,
    openingHours: {
      start: body.openingHours?.start || pharmacy.pharmacyProfile?.openingHours?.start || '08:00',
      end: body.openingHours?.end || pharmacy.pharmacyProfile?.openingHours?.end || '20:00'
    },
    offersDelivery:
      body.offersDelivery === undefined
        ? pharmacy.pharmacyProfile?.offersDelivery !== false
        : Boolean(body.offersDelivery),
    offersPickup:
      body.offersPickup === undefined
        ? pharmacy.pharmacyProfile?.offersPickup !== false
        : Boolean(body.offersPickup),
    deliveryFee:
      body.deliveryFee === undefined
        ? pharmacy.pharmacyProfile?.deliveryFee ?? 5000
        : Number(body.deliveryFee) || 0,
    deliveryRadiusKm:
      body.deliveryRadiusKm === undefined
        ? pharmacy.pharmacyProfile?.deliveryRadiusKm ?? 15
        : Number(body.deliveryRadiusKm) || 0,
    isOpen: body.isOpen === undefined ? pharmacy.pharmacyProfile?.isOpen !== false : Boolean(body.isOpen)
  };

  if (body.city) pharmacy.city = body.city;
  if (body.address) pharmacy.address = body.address;
  if (body.district) pharmacy.district = body.district;

  await pharmacy.save();
  return pharmacy;
};

exports.getOverview = async (user) => {
  assertPharmacist(user);
  const pharmacyId = user._id;

  const [medicineCount, lowStock, pendingOrders, activeOrders, recentOrders] = await Promise.all([
    PharmacyMedicine.countDocuments({ pharmacy: pharmacyId, isActive: true }),
    PharmacyMedicine.countDocuments({
      pharmacy: pharmacyId,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }
    }),
    PharmacyOrder.countDocuments({ pharmacy: pharmacyId, status: 'pending', 'payment.status': 'paid' }),
    PharmacyOrder.countDocuments({
      pharmacy: pharmacyId,
      'payment.status': 'paid',
      status: { $in: ['accepted', 'preparing', 'ready', 'out_for_delivery'] }
    }),
    PharmacyOrder.find({ pharmacy: pharmacyId, 'payment.status': 'paid' })
      .populate('patient', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()
  ]);

  return {
    stats: {
      medicineCount,
      lowStock,
      pendingOrders,
      activeOrders
    },
    recentOrders
  };
};

exports.listMyMedicines = async (user, { q, status } = {}) => {
  assertPharmacist(user);
  const filter = { pharmacy: user._id };

  if (status === 'inactive') filter.isActive = false;
  else if (status === 'active') filter.isActive = true;
  else if (status === 'low') {
    filter.isActive = true;
    filter.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
  }

  if (q?.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ name: regex }, { genericName: regex }, { brandName: regex }, { sku: regex }, { category: regex }];
  }

  return PharmacyMedicine.find(filter).sort({ updatedAt: -1 }).lean();
};

exports.createMedicine = async ({ user, body, file }) => {
  assertPharmacist(user);
  const payload = mapMedicinePayload(body);
  if (!payload.name) {
    const error = new Error('Medicine name is required');
    error.statusCode = 400;
    throw error;
  }

  let imageUrl = body.imageUrl || '';
  if (file) {
    imageUrl = await uploadPharmacyImage(file, user._id);
  }

  return PharmacyMedicine.create({
    ...payload,
    imageUrl,
    pharmacy: user._id,
    createdBy: user._id,
    updatedBy: user._id
  });
};

exports.updateMedicine = async ({ user, medicineId, body, file }) => {
  assertPharmacist(user);
  const medicine = await PharmacyMedicine.findOne({ _id: medicineId, pharmacy: user._id });
  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    throw error;
  }

  const payload = mapMedicinePayload({ ...medicine.toObject(), ...body });
  Object.assign(medicine, payload);

  if (file) {
    medicine.imageUrl = await uploadPharmacyImage(file, user._id);
  } else if (body.imageUrl !== undefined) {
    medicine.imageUrl = body.imageUrl || '';
  }

  medicine.updatedBy = user._id;
  await medicine.save();
  return medicine;
};

exports.deleteMedicine = async ({ user, medicineId }) => {
  assertPharmacist(user);
  const medicine = await PharmacyMedicine.findOneAndDelete({ _id: medicineId, pharmacy: user._id });
  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    throw error;
  }
  return medicine;
};

exports.adjustStock = async ({ user, medicineId, quantity, mode = 'set' }) => {
  assertPharmacist(user);
  const medicine = await PharmacyMedicine.findOne({ _id: medicineId, pharmacy: user._id });
  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    throw error;
  }

  const value = Number(quantity);
  if (Number.isNaN(value)) {
    const error = new Error('Quantity must be a number');
    error.statusCode = 400;
    throw error;
  }

  if (mode === 'add') medicine.stockQuantity = Math.max(0, medicine.stockQuantity + value);
  else if (mode === 'subtract') medicine.stockQuantity = Math.max(0, medicine.stockQuantity - value);
  else medicine.stockQuantity = Math.max(0, value);

  medicine.updatedBy = user._id;
  await medicine.save();
  return medicine;
};

exports.createPharmacyOrder = async ({ user, body }) => {
  if (!['patient', 'doctor', 'admin'].includes(user.role)) {
    const error = new Error('Only patients or doctors can send orders to a pharmacy');
    error.statusCode = 403;
    throw error;
  }

  const {
    pharmacyId,
    appointmentId,
    patientId,
    fulfillmentMethod,
    deliveryAddress,
    deliveryNotes,
    items,
    orderType: requestedOrderType
  } = body;

  if (!pharmacyId || !fulfillmentMethod) {
    const error = new Error('Pharmacy and fulfillment method are required');
    error.statusCode = 400;
    throw error;
  }

  if (!['delivery', 'pickup'].includes(fulfillmentMethod)) {
    const error = new Error('Fulfillment method must be delivery or pickup');
    error.statusCode = 400;
    throw error;
  }

  const pharmacy = await User.findOne({ _id: pharmacyId, role: 'pharmacist', isActive: true });
  if (!pharmacy) {
    const error = new Error('Pharmacy not found');
    error.statusCode = 404;
    throw error;
  }

  if (pharmacy.pharmacyProfile?.isOpen === false) {
    const error = new Error('This pharmacy is not accepting orders right now');
    error.statusCode = 400;
    throw error;
  }

  if (fulfillmentMethod === 'delivery' && pharmacy.pharmacyProfile?.offersDelivery === false) {
    const error = new Error('This pharmacy does not offer delivery');
    error.statusCode = 400;
    throw error;
  }

  if (fulfillmentMethod === 'pickup' && pharmacy.pharmacyProfile?.offersPickup === false) {
    const error = new Error('This pharmacy does not offer onsite pickup');
    error.statusCode = 400;
    throw error;
  }

  if (fulfillmentMethod === 'delivery' && !String(deliveryAddress || '').trim()) {
    const error = new Error('Delivery address is required for delivery orders');
    error.statusCode = 400;
    throw error;
  }

  let patient = user._id;
  let doctor = user.role === 'doctor' ? user._id : undefined;
  let prescriptionItems = Array.isArray(items) ? items : [];
  let orderType = requestedOrderType === 'catalog' ? 'catalog' : 'prescription';

  if (appointmentId) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    const isPatient = appointment.patient?.toString() === user._id.toString();
    const isDoctor = appointment.doctor?.toString() === user._id.toString();
    if (!isPatient && !isDoctor && user.role !== 'admin') {
      const error = new Error('Access denied for this appointment');
      error.statusCode = 403;
      throw error;
    }

    patient = appointment.patient;
    doctor = appointment.doctor;
    orderType = 'prescription';
    if (!prescriptionItems.length && appointment.prescription?.length) {
      prescriptionItems = appointment.prescription.map((rx) => ({
        medicineName: rx.medicineName,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration,
        instructions: rx.instructions,
        quantity: 1
      }));
    }
  } else if (user.role === 'doctor') {
    if (!patientId) {
      const error = new Error('patientId is required when no appointment is selected');
      error.statusCode = 400;
      throw error;
    }
    patient = patientId;
  }

  // Resolve catalog medicines for direct patient/doctor catalog orders
  const resolvedItems = [];
  for (const item of prescriptionItems || []) {
    if (item?.catalogMedicine) {
      const med = await PharmacyMedicine.findOne({
        _id: item.catalogMedicine,
        pharmacy: pharmacy._id,
        isActive: true
      });
      if (!med) {
        const error = new Error('One or more catalog medicines were not found at this pharmacy');
        error.statusCode = 400;
        throw error;
      }
      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (Number(med.stockQuantity) < quantity) {
        const error = new Error(`${med.name} does not have enough stock`);
        error.statusCode = 400;
        throw error;
      }
      resolvedItems.push({
        medicineName: med.name,
        dosage: med.strength || '',
        frequency: '',
        duration: '',
        instructions: med.requiresPrescription
          ? 'Prescription may be required — pharmacy will verify'
          : item.instructions || '',
        catalogMedicine: med._id,
        quantity,
        unitPrice: Math.max(0, Number(med.price) || 0)
      });
      orderType = 'catalog';
      continue;
    }

    if (!item?.medicineName?.trim()) continue;
    resolvedItems.push({
      medicineName: String(item.medicineName).trim(),
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      duration: item.duration || '',
      instructions: item.instructions || '',
      catalogMedicine: undefined,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0)
    });
  }

  if (!resolvedItems.length) {
    const error = new Error('Add at least one medicine to send to the pharmacy');
    error.statusCode = 400;
    throw error;
  }

  const deliveryFee =
    fulfillmentMethod === 'delivery' ? Math.max(0, Number(pharmacy.pharmacyProfile?.deliveryFee) || 0) : 0;
  const itemsTotal = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalAmount = itemsTotal + deliveryFee;

  const order = await PharmacyOrder.create({
    pharmacy: pharmacy._id,
    patient,
    doctor,
    appointment: appointmentId || undefined,
    requestedBy: user._id,
    requestedByRole: user.role === 'admin' ? 'doctor' : user.role,
    orderType,
    fulfillmentMethod,
    deliveryAddress: fulfillmentMethod === 'delivery' ? String(deliveryAddress).trim() : '',
    deliveryNotes: deliveryNotes ? String(deliveryNotes).trim() : '',
    items: resolvedItems,
    totalAmount,
    status: 'pending',
    payment: {
      status: 'pending',
      method: null,
      phoneNumber: null,
      transactionId: null,
      paidAt: null
    }
  });

  await order.populate([
    { path: 'pharmacy', select: pharmacyPublicFields },
    { path: 'patient', select: 'firstName lastName phone' },
    { path: 'doctor', select: 'firstName lastName' },
    { path: 'appointment', select: 'scheduledDate scheduledTime diagnosis prescription' }
  ]);

  // Pharmacy is notified only after the patient pays.
  return order;
};

exports.payPharmacyOrder = async ({ user, orderId, body = {} }) => {
  if (process.env.MOCK_PAYMENTS === 'false') {
    const error = new Error('Mock payments are disabled on this server.');
    error.statusCode = 403;
    throw error;
  }

  const method = body.method || 'mtn_momo';
  const allowedMethods = ['mtn_momo', 'airtel_money', 'cash'];
  if (!allowedMethods.includes(method)) {
    const error = new Error('Invalid payment method');
    error.statusCode = 400;
    throw error;
  }

  const order = await PharmacyOrder.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const isPatient = order.patient?.toString() === user._id.toString();
  const isRequester = order.requestedBy?.toString() === user._id.toString();
  if (!isPatient && !isRequester && user.role !== 'admin') {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  if (order.payment?.status === 'paid') {
    await order.populate([
      { path: 'pharmacy', select: pharmacyPublicFields },
      { path: 'patient', select: 'firstName lastName phone' },
      { path: 'doctor', select: 'firstName lastName' }
    ]);
    return order;
  }

  if (['cancelled', 'rejected'].includes(order.status)) {
    const error = new Error('This order can no longer be paid');
    error.statusCode = 400;
    throw error;
  }

  const transactionId = `PHARM-MOCK-${Date.now()}-${order._id.toString().slice(-6)}`;
  order.payment = {
    status: 'paid',
    method,
    phoneNumber: body.phoneNumber ? String(body.phoneNumber).trim() : null,
    transactionId,
    paidAt: new Date()
  };
  await order.save();

  await order.populate([
    { path: 'pharmacy', select: pharmacyPublicFields },
    { path: 'patient', select: 'firstName lastName phone' },
    { path: 'doctor', select: 'firstName lastName' }
  ]);

  notificationService.notifyPharmacyOrderReceived(order).catch((err) => {
    console.error('[Notification] pharmacy order received', err.message);
  });

  return order;
};

exports.listMyOrders = async (user) => {
  const filter = {};
  if (user.role === 'pharmacist') {
    filter.pharmacy = user._id;
    filter['payment.status'] = 'paid';
  } else if (user.role === 'patient') filter.patient = user._id;
  else if (user.role === 'doctor') filter.$or = [{ doctor: user._id }, { requestedBy: user._id }];
  else if (user.role !== 'admin') {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return PharmacyOrder.find(filter)
    .populate('pharmacy', pharmacyPublicFields)
    .populate('patient', 'firstName lastName phone')
    .populate('doctor', 'firstName lastName')
    .populate('appointment', 'scheduledDate scheduledTime diagnosis')
    .sort({ createdAt: -1 })
    .lean();
};

exports.updateOrderStatus = async ({ user, orderId, body }) => {
  assertPharmacist(user);
  const order = await PharmacyOrder.findOne({ _id: orderId, pharmacy: user._id });
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.payment?.status !== 'paid') {
    const error = new Error('Order has not been paid yet');
    error.statusCode = 400;
    throw error;
  }

  const { status, pharmacyNotes, rejectionReason } = body;
  const allowed = [
    'pending',
    'accepted',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled',
    'rejected'
  ];

  if (!allowed.includes(status)) {
    const error = new Error('Invalid order status');
    error.statusCode = 400;
    throw error;
  }

  if (status === 'out_for_delivery' && order.fulfillmentMethod !== 'delivery') {
    const error = new Error('Only delivery orders can be marked out for delivery');
    error.statusCode = 400;
    throw error;
  }

  order.status = status;
  if (pharmacyNotes !== undefined) order.pharmacyNotes = pharmacyNotes;
  if (rejectionReason !== undefined) order.rejectionReason = rejectionReason;
  await order.save();

  await order.populate([
    { path: 'pharmacy', select: pharmacyPublicFields },
    { path: 'patient', select: 'firstName lastName phone' },
    { path: 'doctor', select: 'firstName lastName' }
  ]);

  notificationService.notifyPharmacyOrderUpdate(order).catch((err) => {
    console.error('[Notification] pharmacy order update', err.message);
  });

  return order;
};
