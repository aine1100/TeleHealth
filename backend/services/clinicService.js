const { User, Appointment } = require('../models');

exports.getDoctorDetail = async (doctorId) => {
  const doctor = await User.findById(doctorId).select('firstName lastName email phone role doctorProfile avatar createdAt');

  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  const appointments = await Appointment.find({ doctor: doctorId })
    .populate('patient', 'firstName lastName email phone avatar')
    .sort({ scheduledDate: -1 })
    .limit(10);

  return { doctor, recentAppointments: appointments };
};

exports.createClinicAppointment = async ({ clinicId, doctorId, patientId, scheduledDate, scheduledTime, type, paymentAmount }) => {
  if (!doctorId || !patientId || !scheduledDate || !scheduledTime || !type) {
    const error = new Error('Missing required appointment fields');
    error.statusCode = 400;
    throw error;
  }

  const doctor = await User.findById(doctorId);
  const patient = await User.findById(patientId);

  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  if (!patient || patient.role !== 'patient') {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const appointment = new Appointment({
    patient: patient._id,
    doctor: doctor._id,
    clinic: clinicId,
    type,
    scheduledDate,
    scheduledTime,
    payment: {
      amount: paymentAmount || 25000,
      totalAmount: paymentAmount || 25000,
      status: 'pending',
      currency: 'UGX'
    },
    createdBy: clinicId
  });

  await appointment.save();
  await appointment.populate('patient doctor', 'firstName lastName phone avatar');

  return appointment;
};

exports.getClinicAppointments = async (clinicId) => {
  return Appointment.find({ clinic: clinicId })
    .populate('patient doctor', 'firstName lastName phone avatar')
    .sort({ scheduledDate: -1 });
};
