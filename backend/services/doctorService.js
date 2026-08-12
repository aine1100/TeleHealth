const { User } = require('../models');

const matchesAvailability = (hours = {}, period) => {
  if (!period || period === 'all') return true;
  const start = hours.start || '09:00';
  const end = hours.end || '17:00';
  const startHour = parseInt(start.split(':')[0], 10);
  const endHour = parseInt(end.split(':')[0], 10);

  if (period === 'morning') return startHour < 12;
  if (period === 'afternoon') return startHour <= 14 && endHour >= 12;
  if (period === 'evening') return endHour >= 17 || startHour >= 17;
  return true;
};

exports.searchDoctors = async (filters = {}) => {
  const {
    specialty,
    query,
    minRating,
    availableNow,
    gender,
    minExperience,
    minFee,
    maxFee,
    consultType,
    availability
  } = filters;

  const filter = { role: 'doctor', isActive: true };

  if (specialty) filter['doctorProfile.specialty'] = { $regex: specialty, $options: 'i' };
  if (minRating) filter['doctorProfile.rating'] = { $gte: parseFloat(minRating) };
  if (availableNow === 'true' || availableNow === true) filter['doctorProfile.isAvailable'] = true;
  if (gender && gender !== 'all') filter.gender = gender;

  if (minExperience) {
    filter['doctorProfile.experience'] = { $gte: parseInt(minExperience, 10) };
  }

  const feeFilter = {};
  if (minFee != null && minFee !== '') feeFilter.$gte = parseFloat(minFee);
  if (maxFee != null && maxFee !== '') feeFilter.$lte = parseFloat(maxFee);
  if (Object.keys(feeFilter).length) filter['doctorProfile.consultationFee'] = feeFilter;

  if (consultType && consultType !== 'all') {
    filter['doctorProfile.consultationTypes'] = consultType;
  }

  if (query) {
    filter.$or = [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { 'doctorProfile.specialty': { $regex: query, $options: 'i' } },
      { 'doctorProfile.hospital': { $regex: query, $options: 'i' } },
      { city: { $regex: query, $options: 'i' } }
    ];
  }

  let doctors = await User.find(filter)
    .select('firstName lastName phone avatar gender city doctorProfile')
    .sort({ 'doctorProfile.isAvailable': -1, 'doctorProfile.rating': -1 });

  if (availability && availability !== 'all') {
    doctors = doctors.filter((doctor) =>
      matchesAvailability(doctor.doctorProfile?.availableHours, availability)
    );
  }

  return doctors;
};

exports.getDoctorAvailability = async (doctorId, options = {}) => {
  const doctorAvailabilityService = require('./doctorAvailabilityService');
  return doctorAvailabilityService.getDoctorAvailability(doctorId, options);
};

exports.getDoctorProfile = async (doctorId) => {
  const doctor = await User.findById(doctorId).select('-password');

  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  return doctor;
};
