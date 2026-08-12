/**
 * Seed platform demo users (admin, clinic, doctors, patients, lab, insurance).
 *
 * Usage:
 *   node database/seed.js
 *   SEED_DEMO=true node database/seed.js
 *
 * Docker runs this automatically on app start when SEED_ON_BOOT=true (default).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const { User, PharmacyMedicine } = require('../models');

const log = (...args) => console.log('🌱', ...args);

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@123';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const upsertUser = async (data) => {
  const email = data.email.toLowerCase().trim();
  let user = await User.findOne({ email });

  if (user) {
    Object.assign(user, data, { email });
    user.password = data.password;
    await user.save();
    log(`Updated ${data.role}: ${email}`);
    return user;
  }

  user = await User.create({ ...data, email });
  log(`Created ${data.role}: ${email}`);
  return user;
};

const seedAdmin = async () =>
  upsertUser({
    firstName: process.env.ADMIN_FIRST_NAME || 'Super',
    lastName: process.env.ADMIN_LAST_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@alivehealth.ug',
    phone: process.env.ADMIN_PHONE || '+256700000001',
    password: ADMIN_PASSWORD,
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true
  });

const seedClinic = async () =>
  upsertUser({
    firstName: 'Kampala',
    lastName: 'Clinic',
    email: 'clinic@alivehealth.ug',
    phone: '+256700000010',
    password: DEMO_PASSWORD,
    role: 'clinic_admin',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    city: 'Kampala',
    district: 'Central',
    clinicProfile: {
      clinicName: 'Alive Care Clinic',
      clinicType: 'clinic',
      registrationNumber: 'CLN-UG-001',
      plan: 'professional',
      planStatus: 'active',
      planStartDate: new Date(),
      maxDoctors: 10
    },
    organizationProfile: {
      organizationName: 'Alive Care Clinic',
      organizationType: 'clinic',
      registrationNumber: 'CLN-UG-001',
      contactPerson: 'Clinic Admin',
      city: 'Kampala',
      district: 'Central',
      verificationStatus: 'approved'
    }
  });

const seedDoctors = async (clinicId) => {
  const doctors = [
    {
      firstName: 'Sarah',
      lastName: 'Nalubega',
      email: 'doctor@alivehealth.ug',
      phone: '+256700000021',
      gender: 'female',
      specialty: 'General Practice',
      experience: 8,
      fee: 30000
    },
    {
      firstName: 'James',
      lastName: 'Okello',
      email: 'doctor2@alivehealth.ug',
      phone: '+256700000022',
      gender: 'male',
      specialty: 'Pediatrics',
      experience: 6,
      fee: 35000
    },
    {
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'doctor3@alivehealth.ug',
      phone: '+256700000023',
      gender: 'female',
      specialty: 'Dermatology',
      experience: 5,
      fee: 40000
    }
  ];

  const created = [];
  for (const doc of doctors) {
    const user = await upsertUser({
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phone: doc.phone,
      password: DEMO_PASSWORD,
      role: 'doctor',
      gender: doc.gender,
      city: 'Kampala',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      doctorProfile: {
        specialty: doc.specialty,
        licenseNumber: `MD-UG-${doc.phone.slice(-4)}`,
        qualifications: ['MBChB', 'UMDPC'],
        experience: doc.experience,
        hospital: 'Alive Care Clinic',
        clinicId,
        inviteAcceptedAt: new Date(),
        languages: ['en', 'lg'],
        bio: `${doc.specialty} specialist at Alive Care Clinic.`,
        consultationFee: doc.fee,
        rating: 4.6,
        reviewCount: 12,
        isVerified: true,
        isAvailable: true,
        availableDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        availableHours: { start: '09:00', end: '17:00' },
        consultationTypes: ['video', 'chat', 'in_person']
      }
    });
    created.push(user);
  }
  return created;
};

const seedPatients = async () => {
  const patients = [
    {
      firstName: 'John',
      lastName: 'Mugisha',
      email: 'patient@alivehealth.ug',
      phone: '+256700000031',
      gender: 'male',
      bloodType: 'O+'
    },
    {
      firstName: 'Grace',
      lastName: 'Achieng',
      email: 'patient2@alivehealth.ug',
      phone: '+256700000032',
      gender: 'female',
      bloodType: 'A+'
    },
    {
      firstName: 'Peter',
      lastName: 'Ssekandi',
      email: 'patient3@alivehealth.ug',
      phone: '+256700000033',
      gender: 'male',
      bloodType: 'B+'
    }
  ];

  const created = [];
  for (const p of patients) {
    const user = await upsertUser({
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      password: DEMO_PASSWORD,
      role: 'patient',
      gender: p.gender,
      bloodType: p.bloodType,
      city: 'Kampala',
      district: 'Central',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      emergencyContact: {
        name: 'Next of Kin',
        phone: '+256700000099',
        relationship: 'Family'
      }
    });
    created.push(user);
  }
  return created;
};

const seedLab = async () =>
  upsertUser({
    firstName: 'Lab',
    lastName: 'Tech',
    email: 'lab@alivehealth.ug',
    phone: '+256700000040',
    password: DEMO_PASSWORD,
    role: 'lab_tech',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    clinicProfile: {
      clinicName: 'Alive Diagnostics Lab',
      clinicType: 'lab',
      registrationNumber: 'LAB-UG-001',
      plan: 'starter',
      planStatus: 'active'
    },
    organizationProfile: {
      organizationName: 'Alive Diagnostics Lab',
      organizationType: 'lab',
      registrationNumber: 'LAB-UG-001',
      contactPerson: 'Lab Manager',
      city: 'Kampala',
      verificationStatus: 'approved'
    }
  });

const seedInsurance = async () =>
  upsertUser({
    firstName: 'Insurance',
    lastName: 'Partner',
    email: 'insurance@alivehealth.ug',
    phone: '+256700000050',
    password: DEMO_PASSWORD,
    role: 'insurance',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    clinicProfile: {
      clinicName: 'Alive Health Insurance',
      clinicType: 'insurance_company',
      registrationNumber: 'INS-UG-001',
      plan: 'enterprise',
      planStatus: 'active'
    },
    organizationProfile: {
      organizationName: 'Alive Health Insurance',
      organizationType: 'insurance_company',
      registrationNumber: 'INS-UG-001',
      contactPerson: 'Claims Officer',
      city: 'Kampala',
      verificationStatus: 'approved'
    }
  });

const seedPharmacist = async () =>
  upsertUser({
    firstName: 'Mary',
    lastName: 'Pharmacy',
    email: 'pharmacy@alivehealth.ug',
    phone: '+256700000060',
    password: DEMO_PASSWORD,
    role: 'pharmacist',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    city: 'Kampala',
    district: 'Kampala',
    address: 'Plot 12, Kampala Road',
    pharmacyProfile: {
      pharmacyName: 'Alive Care Pharmacy',
      licenseNumber: 'PHARM-UG-001',
      phone: '+256700000060',
      address: 'Plot 12, Kampala Road',
      city: 'Kampala',
      district: 'Kampala',
      description: 'Community pharmacy for prescription fulfilment, OTC medicines, and home delivery.',
      openingHours: { start: '08:00', end: '20:00' },
      offersDelivery: true,
      offersPickup: true,
      deliveryFee: 5000,
      deliveryRadiusKm: 15,
      isOpen: true
    },
    organizationProfile: {
      organizationName: 'Alive Care Pharmacy',
      organizationType: 'pharmacy',
      registrationNumber: 'PHARM-UG-001',
      contactPerson: 'Mary Pharmacy',
      city: 'Kampala',
      district: 'Kampala',
      address: 'Plot 12, Kampala Road',
      verificationStatus: 'approved'
    }
  });

const seedPharmacyMedicines = async (pharmacyId) => {
  const samples = [
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      description: 'Broad-spectrum antibiotic for bacterial infections.',
      form: 'capsule',
      strength: '500mg',
      category: 'Antibiotics',
      price: 12000,
      stockQuantity: 120,
      reorderLevel: 20,
      requiresPrescription: true
    },
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      brandName: 'Panadol',
      description: 'Pain relief and fever reduction.',
      form: 'tablet',
      strength: '500mg',
      category: 'Pain relief',
      price: 3000,
      stockQuantity: 250,
      reorderLevel: 40,
      requiresPrescription: false
    },
    {
      name: 'ORS Sachets',
      genericName: 'Oral rehydration salts',
      description: 'Rehydration therapy for diarrhoea and dehydration.',
      form: 'other',
      strength: '20.5g',
      category: 'First aid',
      price: 1500,
      stockQuantity: 80,
      reorderLevel: 15,
      requiresPrescription: false
    }
  ];

  for (const sample of samples) {
    const existing = await PharmacyMedicine.findOne({ pharmacy: pharmacyId, name: sample.name });
    if (existing) {
      Object.assign(existing, sample, { isActive: true });
      await existing.save();
    } else {
      await PharmacyMedicine.create({
        ...sample,
        pharmacy: pharmacyId,
        createdBy: pharmacyId,
        updatedBy: pharmacyId,
        isActive: true
      });
    }
  }

  log(`Pharmacy medicines ready for ${pharmacyId}`);
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  log('Connecting to MongoDB…');
  await mongoose.connect(uri);
  log('MongoDB connected');

  const admin = await seedAdmin();
  const clinic = await seedClinic();
  const doctors = await seedDoctors(clinic._id);
  const patients = await seedPatients();
  const lab = await seedLab();
  const insurance = await seedInsurance();
  const pharmacist = await seedPharmacist();
  await seedPharmacyMedicines(pharmacist._id);

  console.log('\n✅ Seed complete');
  console.log('────────────────────────────────────────────────────────');
  console.log(' Demo logins (password in parentheses)');
  console.log(`  Admin:      ${admin.email}  (${ADMIN_PASSWORD})`);
  console.log(`  Clinic:     clinic@alivehealth.ug  (${DEMO_PASSWORD})`);
  console.log(`  Doctor:     doctor@alivehealth.ug  (${DEMO_PASSWORD})`);
  console.log(`  Doctor 2:   doctor2@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log(`  Doctor 3:   doctor3@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log(`  Patient:    patient@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log(`  Patient 2:  patient2@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log(`  Patient 3:  patient3@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log(`  Lab:        lab@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log(`  Insurance:  insurance@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log(`  Pharmacy:   pharmacy@alivehealth.ug (${DEMO_PASSWORD})`);
  console.log('────────────────────────────────────────────────────────');
  console.log(
    ` Totals → admin:1 clinic:1 doctors:${doctors.length} patients:${patients.length} lab:1 insurance:1 pharmacy:1`
  );
  console.log('');

  await mongoose.connection.close().catch(() => {});
};

if (require.main === module) {
  run()
    .catch((error) => {
      console.error('❌ Seed failed:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close().catch(() => {});
    });
}

module.exports = { run };
