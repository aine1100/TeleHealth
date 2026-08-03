const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  
  // Role
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'pharmacist', 'lab_tech', 'admin', 'clinic_admin', 'insurance'], 
    default: 'patient' 
  },
  
  // Profile
  avatar: { type: String, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: { type: String },
  city: { type: String },
  district: { type: String },
  
  // Language Preference
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'lg', 'sw', 'rn', 'luo', 'acholi'], 
    default: 'en' 
  },
  
  // For Patients
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  allergies: [{ type: String }],
  chronicConditions: [{ type: String }],
  
  // For Doctors
  doctorProfile: {
    specialty: { type: String },
    subSpecialty: { type: String },
    licenseNumber: { type: String },
    qualifications: [{ type: String }],
    experience: { type: Number }, // years
    hospital: { type: String },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inviteAcceptedAt: { type: Date },
    languages: [{ type: String }],
    bio: { type: String },
    consultationFee: { type: Number, default: 25000 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    availableDays: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }],
    availableHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    consultationTypes: [{ 
      type: String, 
      enum: ['video', 'chat', 'in_person'] 
    }]
  },
  
  // For Clinic Admins / Labs / Insurance organizations (B2B)
  clinicProfile: {
    clinicName: { type: String },
    clinicType: { type: String, enum: ['clinic', 'hospital', 'pharmacy', 'lab', 'insurance_company', 'other'] },
    registrationNumber: { type: String },
    plan: { 
      type: String, 
      enum: ['starter', 'professional', 'enterprise', 'pay_per_visit'], 
      default: 'pay_per_visit' 
    },
    planStatus: { 
      type: String, 
      enum: ['trial', 'active', 'suspended', 'cancelled'], 
      default: 'trial' 
    },
    planStartDate: { type: Date },
    planEndDate: { type: Date },
    maxDoctors: { type: Number, default: 3 },
    monthlyVisitLimit: { type: Number },
    currentMonthVisits: { type: Number, default: 0 },
    whiteLabelEnabled: { type: Boolean, default: false },
    customDomain: { type: String },
    branding: {
      primaryColor: { type: String, default: '#0047CC' },
      logo: { type: String },
      favicon: { type: String }
    }
  },

  organizationProfile: {
    organizationName: { type: String },
    organizationType: { type: String, enum: ['clinic', 'hospital', 'pharmacy', 'lab', 'insurance_company', 'other'] },
    registrationNumber: { type: String },
    contactPerson: { type: String },
    website: { type: String },
    address: { type: String },
    city: { type: String },
    district: { type: String },
    verificationDocuments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }],
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verificationNotes: { type: String }
  },
  
  // Insurance
  insurance: {
    provider: { type: String }, // NHIF, UAP, Jubilee, AAR, etc.
    policyNumber: { type: String },
    coverageType: { type: String },
    validFrom: { type: Date },
    validUntil: { type: Date },
    isVerified: { type: Boolean, default: false }
  },
  
  // Status
  isActive: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  refreshToken: { type: String, default: null },
  otpCode: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  resetOtpCode: { type: String, default: null },
  resetOtpExpiresAt: { type: Date, default: null },
  resetOtpChannel: { type: String, enum: ['email', 'phone'], default: null },
  
  // Notifications
  notificationSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
    medicineReminders: { type: Boolean, default: true },
    labResults: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);