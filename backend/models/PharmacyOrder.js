const mongoose = require('mongoose');

const pharmacyOrderItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' },
    catalogMedicine: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyMedicine' },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const pharmacyOrderSchema = new mongoose.Schema(
  {
    pharmacy: {
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
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedByRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true
    },
    orderType: {
      type: String,
      enum: ['prescription', 'catalog'],
      default: 'prescription',
      index: true
    },
    fulfillmentMethod: {
      type: String,
      enum: ['delivery', 'pickup'],
      required: true
    },
    deliveryAddress: { type: String, trim: true },
    deliveryNotes: { type: String, trim: true },
    items: {
      type: [pharmacyOrderItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one item is required']
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'preparing',
        'ready',
        'out_for_delivery',
        'completed',
        'cancelled',
        'rejected'
      ],
      default: 'pending',
      index: true
    },
    pharmacyNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'UGX' },
    /** True after catalog item quantities were subtracted from PharmacyMedicine stock */
    inventoryDeducted: { type: Boolean, default: false },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
        index: true
      },
      method: {
        type: String,
        enum: ['mtn_momo', 'airtel_money', 'cash', 'card'],
        default: null
      },
      phoneNumber: { type: String, default: null },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

pharmacyOrderSchema.index({ pharmacy: 1, status: 1, createdAt: -1 });
pharmacyOrderSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('PharmacyOrder', pharmacyOrderSchema);
