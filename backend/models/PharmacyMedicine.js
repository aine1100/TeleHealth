const mongoose = require('mongoose');

const pharmacyMedicineSchema = new mongoose.Schema(
  {
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    brandName: { type: String, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, default: '' },
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'],
      default: 'tablet'
    },
    strength: { type: String, trim: true },
    category: { type: String, trim: true, default: 'General' },
    sku: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'UGX' },
    stockQuantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    requiresPrescription: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

pharmacyMedicineSchema.index({ pharmacy: 1, name: 1 });
pharmacyMedicineSchema.index({ pharmacy: 1, isActive: 1 });

module.exports = mongoose.model('PharmacyMedicine', pharmacyMedicineSchema);
