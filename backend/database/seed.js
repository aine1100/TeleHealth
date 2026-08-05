/**
 * Seed platform data — currently bootstraps / refreshes the super admin account.
 *
 * Usage (from backend/):
 *   npm run seed
 *
 * Env vars (backend/.env):
 *   MONGODB_URI
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *   ADMIN_PHONE (optional)
 *   ADMIN_FIRST_NAME (optional)
 *   ADMIN_LAST_NAME (optional)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');

const log = (...args) => console.log('🌱', ...args);

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const phone = process.env.ADMIN_PHONE || '+256700000001';
  const firstName = process.env.ADMIN_FIRST_NAME || 'Super';
  const lastName = process.env.ADMIN_LAST_NAME || 'Admin';

  if (!password || password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  let admin = await User.findOne({ email });

  if (!admin) {
    admin = await User.findOne({ role: 'admin' });
  }

  if (admin) {
    admin.firstName = firstName;
    admin.lastName = lastName;
    admin.email = email;
    admin.phone = phone;
    admin.role = 'admin';
    admin.password = password;
    admin.isActive = true;
    admin.isEmailVerified = true;
    admin.isPhoneVerified = true;
    await admin.save();
    log(`Updated existing super admin: ${email}`);
  } else {
    admin = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true
    });
    log(`Created super admin: ${email}`);
  }

  return {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    firstName: admin.firstName,
    lastName: admin.lastName
  };
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required in .env');
  }

  log('Connecting to MongoDB…');
  await mongoose.connect(uri);
  log('MongoDB connected');

  const admin = await seedAdmin();

  console.log('\n✅ Seed complete');
  console.log('────────────────────────────────');
  console.log(` Super admin email: ${admin.email}`);
  console.log(` Super admin name:  ${admin.firstName} ${admin.lastName}`);
  console.log(` Login path:        /login → /admin/home`);
  console.log('────────────────────────────────\n');
};

run()
  .catch((error) => {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
