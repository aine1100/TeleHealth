const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  appointment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointment' 
  },
  
  // Medicine Details
  medicineName: { type: String, required: true },
  genericName: { type: String },
  brandName: { type: String },
  strength: { type: String }, // e.g., "500mg"
  form: { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler'] },
  
  // Dosage Schedule
  dosage: { type: String, required: true }, // e.g., "1 tablet"
  frequency: { 
    type: String, 
    enum: ['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 'every_4_hours', 'every_6_hours', 'every_8_hours', 'every_12_hours', 'weekly', 'as_needed'],
    required: true 
  },
  times: [{ type: String }], // ["08:00", "14:00", "20:00"]
  
  // Duration
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  duration: { type: String }, // e.g., "7 days", "30 days", "ongoing"
  isChronic: { type: Boolean, default: false },
  
  // Instructions
  instructions: { type: String }, // e.g., "Take with food", "Take before meals"
  specialInstructions: { type: String },
  
  // Refill
  refill: {
    totalRefills: { type: Number, default: 0 },
    refillsRemaining: { type: Number, default: 0 },
    lastRefillDate: { type: Date },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Tracking
  logs: [{
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['taken', 'skipped', 'missed'], required: true },
    notes: { type: String }
  }],
  
  // Adherence Stats
  adherenceRate: { type: Number, default: 100, min: 0, max: 100 },
  streakDays: { type: Number, default: 0 },
  totalDoses: { type: Number, default: 0 },
  dosesTaken: { type: Number, default: 0 },
  dosesMissed: { type: Number, default: 0 },
  
  // Reminder Settings
  reminderSettings: {
    enabled: { type: Boolean, default: true },
    reminderTime: { type: Number, default: 15 }, // minutes before dose
    notificationMethods: [{ 
      type: String, 
      enum: ['push', 'sms', 'email'] 
    }],
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true }
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'discontinued'], 
    default: 'active' 
  },
  discontinuedReason: { type: String },
  discontinuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  discontinuedAt: { type: Date }
}, {
  timestamps: true
});

// Index for reminder queries
medicineReminderSchema.index({ patient: 1, status: 1 });
medicineReminderSchema.index({ 'reminderSettings.enabled': 1, times: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);