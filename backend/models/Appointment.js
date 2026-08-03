const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Participants
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  clinic: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Appointment Details
  type: { 
    type: String, 
    enum: ['video', 'chat', 'in_person'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'in_waiting_room', 'in_progress', 'completed', 'cancelled', 'postponed', 'no_show', 'referred'], 
    default: 'pending' 
  },
  
  // Scheduling
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  duration: { type: Number, default: 30 }, // minutes
  timezone: { type: String, default: 'Africa/Kampala' },
  
  // Waiting Room
  waitingRoom: {
    joinedAt: { type: Date },
    position: { type: Number },
    estimatedWaitMinutes: { type: Number },
    patientsAhead: { type: Number }
  },
  
  // AI Pre-Screening
  aiScreening: {
    symptoms: [{ type: String }],
    vitalSigns: {
      temperature: Number,
      bloodPressureSystolic: Number,
      bloodPressureDiastolic: Number,
      heartRate: Number,
      oxygenSaturation: Number
    },
    severity: { type: Number, min: 1, max: 10 },
    aiRecommendation: { type: String },
    aiUrgency: { 
      type: String, 
      enum: ['low', 'moderate', 'high', 'emergency'] 
    }
  },
  
  // Consultation
  symptoms: { type: String },
  diagnosis: { type: String },
  notes: { type: String },
  prescription: [{
    medicineName: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    isChronic: { type: Boolean, default: false }
  }],
  
  // Lab Orders
  labOrders: [{
    testName: String,
    testCode: String,
    instructions: String,
    status: { 
      type: String, 
      enum: ['ordered', 'sample_collected', 'processing', 'completed'], 
      default: 'ordered' 
    },
    results: {
      value: String,
      unit: String,
      referenceRange: String,
      status: { type: String, enum: ['normal', 'abnormal', 'critical'] },
      reportUrl: String,
      completedAt: Date
    }
  }],
  
  // Referral
  referral: {
    referredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    notes: String,
    status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' }
  },
  
  // Video Call
  videoCall: {
    roomId: { type: String },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number }, // seconds
    recordingUrl: { type: String }
  },
  
  // Payment
  payment: {
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 2000 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'UGX' },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'refunded', 'failed'], 
      default: 'pending' 
    },
    method: { 
      type: String, 
      enum: ['mtn_momo', 'airtel_money', 'insurance', 'cash'] 
    },
    transactionId: { type: String },
    paidAt: { type: Date },
    flutterwaveRef: { type: String }
  },
  
  // Insurance Claim
  insuranceClaim: {
    claimNumber: { type: String },
    amountClaimed: { type: Number },
    status: { 
      type: String, 
      enum: ['pending', 'submitted', 'approved', 'rejected', 'paid'], 
      default: 'pending' 
    },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    approvedAmount: { type: Number }
  },
  
  // Reviews
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date }
  },
  
  // Reminders Sent
  remindersSent: [{
    type: { type: String, enum: ['sms', 'email', 'push'] },
    sentAt: { type: Date },
    status: { type: String, enum: ['sent', 'delivered', 'failed'] }
  }],
  
  // Cancellation
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  
  // Postponement
  postponedTo: { type: Date },
  postponedReason: { type: String },
  postponedAt: { type: Date },
  
  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ patient: 1, scheduledDate: -1 });
appointmentSchema.index({ doctor: 1, scheduledDate: -1 });
appointmentSchema.index({ status: 1, scheduledDate: 1 });
appointmentSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);