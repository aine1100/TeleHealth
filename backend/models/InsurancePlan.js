const mongoose = require('mongoose');

const insurancePlanSchema = new mongoose.Schema(
  {
    insurer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    /** Percentage the insurer pays (0–100). Patient pays the rest unless a fixed co-pay applies. */
    consultCoveragePercent: { type: Number, default: 80, min: 0, max: 100 },
    pharmacyCoveragePercent: { type: Number, default: 70, min: 0, max: 100 },
    labCoveragePercent: { type: Number, default: 70, min: 0, max: 100 },
    /** Flat patient co-pay in UGX (0 = use percentage only). */
    consultCopayFixed: { type: Number, default: 0, min: 0 },
    pharmacyCopayFixed: { type: Number, default: 0, min: 0 },
    labCopayFixed: { type: Number, default: 0, min: 0 },
    annualLimit: { type: Number, default: 5000000, min: 0 },
    perVisitLimit: { type: Number, default: 500000, min: 0 },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

insurancePlanSchema.index({ insurer: 1, isDefault: 1 });

module.exports = mongoose.model('InsurancePlan', insurancePlanSchema);
