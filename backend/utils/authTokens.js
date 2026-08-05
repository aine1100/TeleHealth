const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.signToken = (user, expiresIn = process.env.JWT_EXPIRE || '15m') => {
  const secret = process.env.JWT_SECRET || 'telehealth-dev-secret';
  return jwt.sign({ id: user._id, role: user.role }, secret, {
    expiresIn
  });
};

exports.createRefreshToken = () => crypto.randomBytes(40).toString('hex');

exports.createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

exports.createUserResponse = (user, accessToken, refreshToken) => ({
  accessToken,
  refreshToken,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    preferredLanguage: user.preferredLanguage || 'en',
    organizationProfile: user.organizationProfile || null,
    clinicProfile: user.clinicProfile || null,
    doctorProfile: user.doctorProfile || null,
    notificationSettings: user.notificationSettings || null
  }
});
