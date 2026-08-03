const { User } = require('../models');

exports.searchDoctors = async (filters = {}) => {
  const { specialty, query, minRating, availableNow } = filters;
  const filter = { role: 'doctor', 'doctorProfile.isVerified': true };

  if (specialty) filter['doctorProfile.specialty'] = specialty;
  if (minRating) filter['doctorProfile.rating'] = { $gte: parseFloat(minRating) };
  if (availableNow === 'true') filter['doctorProfile.isAvailable'] = true;
  if (query) {
    filter.$or = [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { 'doctorProfile.specialty': { $regex: query, $options: 'i' } }
    ];
  }

  return User.find(filter)
    .select('firstName lastName avatar doctorProfile rating reviewCount')
    .sort({ 'doctorProfile.rating': -1 });
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
