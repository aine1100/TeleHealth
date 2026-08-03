const doctorService = require('../services/doctorService');

const getErrorStatus = (error) => error.statusCode || 500;

exports.searchDoctors = async (req, res) => {
  try {
    const doctors = await doctorService.searchDoctors(req.query);
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};

exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorProfile(req.params.id);
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(getErrorStatus(error)).json({ success: false, message: error.message });
  }
};
