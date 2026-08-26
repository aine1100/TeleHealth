const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema(
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
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsurancePlan'
    },
    policyNumber: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true, default: '' },
    coverageType: {
      type: String,
      enum: ['individual', 'family', 'corporate', 'other'],
      default: 'individual'
    },
    validFrom: { type: Date },
    validUntil: { type: Date },
    documentUrl: { type: String, default: '' },
    documentName: { type: String, default: '' },
    documentMimeType: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired', 'cancelled'],
      default: 'pending',
      index: true
    },
    rejectionReason: { type: String, trim: true, default: '' },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /** Running total of approved insurer shares this benefit year (UGX). */
    annualUsed: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

insurancePolicySchema.index({ insurer: 1, policyNumber: 1 });
insurancePolicySchema.index({ patient: 1, status: 1 });
insurancePolicySchema.index({ insurer: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
