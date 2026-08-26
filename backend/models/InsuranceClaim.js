const mongoose = require('mongoose');

const claimItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const insuranceClaimSchema = new mongoose.Schema(
  {
    insurer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsurancePolicy',
      required: true
    },
    claimNumber: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['consultation', 'pharmacy', 'lab', 'other'],
      required: true,
      index: true
    },
    relatedTo: {
      model: {
        type: String,
        enum: ['Appointment', 'PharmacyOrder', 'Other'],
        default: 'Other'
      },
      id: { type: mongoose.Schema.Types.ObjectId }
    },
    providerName: { type: String, trim: true, default: '' },
    amountClaimed: { type: Number, required: true, min: 0 },
    patientShare: { type: Number, default: 0, min: 0 },
    insurerShare: { type: Number, default: 0, min: 0 },
    approvedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'UGX' },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'paid'],
      default: 'submitted',
      index: true
    },
    rejectionReason: { type: String, trim: true, default: '' },
    items: [claimItemSchema],
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
    notes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

insuranceClaimSchema.index({ insurer: 1, status: 1, createdAt: -1 });
insuranceClaimSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
