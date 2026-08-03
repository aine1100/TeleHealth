const mongoose = require('mongoose');

const doctorInviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  specialty: { type: String, trim: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'cancelled', 'expired'],
    default: 'pending'
  },
  acceptedAt: { type: Date },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

doctorInviteSchema.index({ clinicId: 1, email: 1 });
doctorInviteSchema.index({ tokenHash: 1 });
doctorInviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('DoctorInvite', doctorInviteSchema);
