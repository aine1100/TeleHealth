const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema(
  {
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    testName: { type: String, required: true, trim: true },
    testCode: { type: String, trim: true, default: '' },
    instructions: { type: String, trim: true, default: '' },
    priority: {
      type: String,
      enum: ['routine', 'urgent'],
      default: 'routine',
      index: true
    },
    status: {
      type: String,
      enum: ['ordered', 'accepted', 'sample_collected', 'processing', 'completed', 'cancelled'],
      default: 'ordered',
      index: true
    },
    results: {
      value: { type: String, default: '' },
      unit: { type: String, default: '' },
      referenceRange: { type: String, default: '' },
      interpretation: {
        type: String,
        enum: ['normal', 'abnormal', 'critical', ''],
        default: ''
      },
      notes: { type: String, default: '' },
      reportUrl: { type: String, default: '' },
      reportName: { type: String, default: '' },
      completedAt: { type: Date }
    },
    fee: { type: Number, default: 0, min: 0 },
    acceptedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

labOrderSchema.index({ lab: 1, status: 1, createdAt: -1 });
labOrderSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);
