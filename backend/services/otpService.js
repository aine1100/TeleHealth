const { Otp, User } = require('../models');
const { createOtp, hashValue } = require('../utils/authTokens');

/** Email/SMS codes expire after this many minutes. */
const OTP_TTL_MINUTES = 5;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

const getOtpExpiry = () => new Date(Date.now() + OTP_TTL_MS);

const issueOtp = async ({ userId, purpose, channel = 'email', code: providedCode }) => {
  await Otp.updateMany({ userId, purpose, used: false }, { $set: { used: true } });

  const code = providedCode || createOtp();
  const record = await Otp.create({
    userId,
    purpose,
    channel,
    codeHash: hashValue(code),
    expiresAt: getOtpExpiry()
  });

  return { code, record, expiresInMinutes: OTP_TTL_MINUTES };
};

/** Remove an unverified account and its OTPs when registration could not finish. */
const rollbackRegistration = async (userId) => {
  if (!userId) return;

  const user = await User.findById(userId).select('isEmailVerified');
  if (!user || user.isEmailVerified) return;

  await Otp.deleteMany({ userId });
  await User.deleteOne({ _id: userId, isEmailVerified: false });
};

const assertCanResend = async ({ userId, purpose }) => {
  const latest = await Otp.findOne({ userId, purpose }).sort({ createdAt: -1 });
  if (latest && Date.now() - new Date(latest.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    const error = new Error('Please wait a moment before requesting a new code');
    error.statusCode = 429;
    throw error;
  }
};

const findValidOtp = async ({ userId, purpose }) => {
  const record = await Otp.findOne({ userId, purpose, used: false }).sort({ createdAt: -1 });
  if (!record) return null;

  if (record.expiresAt <= new Date()) {
    record.used = true;
    await record.save();
    return null;
  }

  return record;
};

module.exports = {
  OTP_TTL_MINUTES,
  OTP_TTL_MS,
  issueOtp,
  assertCanResend,
  findValidOtp,
  rollbackRegistration
};
