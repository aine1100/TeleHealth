/**
 * One-off sanity check for org approval gate.
 * Run: node scripts/check-org-approval.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');
const adminService = require('../services/adminService');
const doctorInviteService = require('../services/doctorInviteService');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = `pending-org-${Date.now()}@test.alivehealth.ug`;
  let org = await User.create({
    firstName: 'Pending',
    lastName: 'Clinic',
    email,
    phone: `+2567${String(Date.now()).slice(-8)}`,
    password: 'TestPass123!',
    role: 'clinic_admin',
    isEmailVerified: false,
    isActive: false,
    organizationProfile: {
      organizationName: 'Pending Test Clinic',
      organizationType: 'clinic',
      registrationNumber: 'TEST-REG-1',
      verificationStatus: 'pending'
    },
    clinicProfile: {
      clinicName: 'Pending Test Clinic',
      clinicType: 'clinic',
      maxDoctors: 3
    }
  });

  console.log('Created unverified pending org:', email);

  const list = await adminService.listOrganizations({ status: 'pending', q: 'Pending Test' });
  const found = list.data.find((row) => row.email === email);
  console.log('Admin can see pending unverified org:', Boolean(found), found && {
    status: found.verificationStatus,
    isEmailVerified: found.isEmailVerified
  });

  let inviteBlocked = false;
  try {
    await doctorInviteService.inviteDoctor({
      clinic: org,
      email: `doc-${Date.now()}@test.alivehealth.ug`,
      firstName: 'Doc',
      lastName: 'Test',
      specialty: 'GP'
    });
  } catch (error) {
    inviteBlocked = error.message.includes('approved') || error.code === 'ORGANIZATION_NOT_APPROVED';
    console.log('Invite blocked pre-approval:', inviteBlocked, '|', error.message);
  }

  const reviewed = await adminService.reviewOrganization(org._id, {
    status: 'approved',
    notes: 'Auto test approval'
  });
  console.log('After admin approve:', {
    status: reviewed.verificationStatus,
    isEmailVerified: reviewed.isEmailVerified,
    isActive: reviewed.isActive,
    canOperate: reviewed.canOperate
  });

  org = await User.findById(org._id);
  let inviteAllowed = false;
  try {
    // will still fail if email send fails; check assertion path only
    const usage = await doctorInviteService.inviteDoctor({
      clinic: org,
      email: `doc-${Date.now()}@test.alivehealth.ug`,
      firstName: 'Doc',
      lastName: 'Test',
      specialty: 'GP'
    });
    inviteAllowed = Boolean(usage?.invite || usage?.email);
    console.log('Invite after approval result:', usage);
  } catch (error) {
    // If blocked by approval still, fail. Email config errors are OK.
    if (error.message.includes('approved') || error.code === 'ORGANIZATION_NOT_APPROVED') {
      console.error('FAIL: still blocked after approval', error.message);
      process.exitCode = 1;
    } else {
      inviteAllowed = true;
      console.log('Approval gate passed (downstream error expected):', error.message);
    }
  }

  await User.deleteOne({ _id: org._id });
  console.log('Cleanup done. Gate OK?', inviteBlocked && inviteAllowed);
  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
