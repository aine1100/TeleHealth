const { User } = require('../models');
const doctorAccountService = require('./doctorAccountService');

const LANGUAGES = ['en', 'lg', 'sw', 'rn', 'luo', 'acholi'];
const GENDERS = ['male', 'female', 'other'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

exports.serializePatientAccount = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  dateOfBirth: user.dateOfBirth || null,
  gender: user.gender || '',
  address: user.address || '',
  city: user.city || '',
  district: user.district || '',
  preferredLanguage: user.preferredLanguage || 'en',
  bloodType: user.bloodType || '',
  allergies: user.allergies || [],
  chronicConditions: user.chronicConditions || [],
  emergencyContact: {
    name: user.emergencyContact?.name || '',
    phone: user.emergencyContact?.phone || '',
    relationship: user.emergencyContact?.relationship || ''
  },
  isActive: user.isActive,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  notificationSettings: {
    email: user.notificationSettings?.email !== false,
    sms: user.notificationSettings?.sms !== false,
    push: user.notificationSettings?.push !== false,
    appointmentReminders: user.notificationSettings?.appointmentReminders !== false,
    medicineReminders: user.notificationSettings?.medicineReminders !== false,
    labResults: user.notificationSettings?.labResults !== false
  }
});

exports.getMyAccount = async (patientUser) => {
  const user = await User.findById(patientUser._id);
  if (!user || user.role !== 'patient') {
    const error = new Error('Patient account not found');
    error.statusCode = 404;
    throw error;
  }
  return exports.serializePatientAccount(user);
};

exports.updateMyProfile = async (patientUser, payload = {}) => {
  const user = await User.findById(patientUser._id);
  if (!user || user.role !== 'patient') {
    const error = new Error('Patient account not found');
    error.statusCode = 404;
    throw error;
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
    const taken = await User.findOne({ phone, _id: { $ne: user._id } });
    if (taken) {
      const error = new Error('Phone number is already in use');
      error.statusCode = 400;
      throw error;
    }
    user.phone = phone;
  }
  if (payload.dateOfBirth !== undefined) {
    user.dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined;
  }
  if (payload.gender !== undefined) {
    if (payload.gender && !GENDERS.includes(payload.gender)) {
      const error = new Error('Invalid gender');
      error.statusCode = 400;
      throw error;
    }
    user.gender = payload.gender || undefined;
  }
  if (payload.address !== undefined) user.address = String(payload.address || '').trim();
  if (payload.city !== undefined) user.city = String(payload.city || '').trim();
  if (payload.district !== undefined) user.district = String(payload.district || '').trim();
  if (payload.bloodType !== undefined) {
    if (payload.bloodType && !BLOOD_TYPES.includes(payload.bloodType)) {
      const error = new Error('Invalid blood type');
      error.statusCode = 400;
      throw error;
    }
    user.bloodType = payload.bloodType || undefined;
  }
  if (Array.isArray(payload.allergies)) {
    user.allergies = payload.allergies.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 30);
  }
  if (Array.isArray(payload.chronicConditions)) {
    user.chronicConditions = payload.chronicConditions
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 30);
  }
  if (payload.emergencyContact && typeof payload.emergencyContact === 'object') {
    if (!user.emergencyContact) user.emergencyContact = {};
    if (payload.emergencyContact.name !== undefined) {
      user.emergencyContact.name = String(payload.emergencyContact.name || '').trim();
    }
    if (payload.emergencyContact.phone !== undefined) {
      user.emergencyContact.phone = String(payload.emergencyContact.phone || '').trim();
    }
    if (payload.emergencyContact.relationship !== undefined) {
      user.emergencyContact.relationship = String(payload.emergencyContact.relationship || '').trim();
    }
  }

  await user.save();
  return exports.serializePatientAccount(user);
};

exports.updateMySettings = async (patientUser, payload = {}) => {
  const user = await User.findById(patientUser._id);
  if (!user || user.role !== 'patient') {
    const error = new Error('Patient account not found');
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
    ['email', 'sms', 'push', 'appointmentReminders', 'medicineReminders', 'labResults'].forEach((key) => {
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
  return exports.serializePatientAccount(user);
};

exports.submitSupportRequest = (user, payload) => doctorAccountService.submitSupportRequest(user, payload);
