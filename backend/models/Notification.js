const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Notification Content
  type: { 
    type: String, 
    enum: [
      'appointment_reminder',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_postponed',
      'doctor_assigned',
      'waiting_room_ready',
      'consultation_started',
      'consultation_ended',
      'prescription_ready',
      'lab_results_ready',
      'medicine_reminder',
      'medicine_refill',
      'pharmacy_order_received',
      'pharmacy_order_update',
      'payment_received',
      'payment_failed',
      'insurance_claim_update',
      'referral_update',
      'system_announcement',
      'review_request'
    ],
    required: true 
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Related Entity
  relatedTo: {
    model: { type: String, enum: ['Appointment', 'MedicineReminder', 'User', 'PharmacyOrder'] },
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  
  // Delivery
  channels: [{ 
    type: String, 
    enum: ['push', 'sms', 'email', 'in_app'] 
  }],
  
  deliveryStatus: [{
    channel: { type: String, enum: ['push', 'sms', 'email', 'in_app'] },
    status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed', 'read'], default: 'pending' },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    error: { type: String }
  }],
  
  // In-App
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Action
  actionUrl: { type: String },
  actionLabel: { type: String },
  
  // Priority
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  
  // Expiry
  expiresAt: { type: Date }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);