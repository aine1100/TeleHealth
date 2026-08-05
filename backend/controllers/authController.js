const { validationResult } = require('express-validator');
const { User, Otp } = require('../models');
const { buildStorageKey } = require('../services/storageService');
const { uploadFileToR2 } = require('../services/r2Service');
const { sendVerificationEmail, sendOtpNotification } = require('../utils/emailService');
const {
  signToken,
  createRefreshToken,
  createOtp,
  hashValue,
  createUserResponse
} = require('../utils/authTokens');

const PUBLIC_REGISTER_ROLES = new Set(['patient']);

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

exports.registerUser = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  try {
    const { firstName, lastName, email, phone, password, role = 'patient', ...rest } = req.body;

    if (role === 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Doctors cannot self-register. Ask your clinic or hospital to send an invite.'
      });
    }

    // Role-specific register routes set role explicitly; public /register is patient-only
    if (!req.forcedRole && !PUBLIC_REGISTER_ROLES.has(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role for public registration. Use the dedicated organization register endpoint.'
      });
    }

    const resolvedRole = req.forcedRole || role;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const parseMaybeJson = (value) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    };

    const normalizedBody = {
      firstName,
      lastName,
      email,
      phone,
      password,
      role: resolvedRole,
      ...rest
    };

    if (normalizedBody.organizationProfile) {
      normalizedBody.organizationProfile = parseMaybeJson(normalizedBody.organizationProfile);
    }
    if (normalizedBody.clinicProfile) {
      normalizedBody.clinicProfile = parseMaybeJson(normalizedBody.clinicProfile);
    }

    // Organizations start pending super-admin review after registration
    if (['clinic_admin', 'lab_tech', 'insurance'].includes(resolvedRole)) {
      const orgProfile = normalizedBody.organizationProfile || {};
      normalizedBody.organizationProfile = {
        ...orgProfile,
        verificationStatus: 'pending',
        verificationNotes: ''
      };
      // Stay inactive until email is verified (login) or super admin approves (which also verifies)
      normalizedBody.isActive = false;
      normalizedBody.isEmailVerified = false;
    }

    if (['clinic_admin', 'lab_tech', 'insurance'].includes(resolvedRole) && req.files && req.files.length) {
      const documents = [];
      for (const file of req.files) {
        const key = buildStorageKey('verification-documents', file.originalname);
        const fileUrl = await uploadFileToR2(file, key);
        documents.push({
          fileName: file.originalname,
          fileUrl,
          fileType: file.mimetype,
          uploadedAt: new Date()
        });
      }

      normalizedBody.organizationProfile = {
        ...(normalizedBody.organizationProfile || {}),
        verificationDocuments: documents,
        verificationStatus: 'pending'
      };
    }

    const otpCode = createOtp();
    const user = new User(normalizedBody);

    // Super admins are ready after registration (no org approval gate)
    if (resolvedRole === 'admin') {
      user.isEmailVerified = true;
      user.isActive = true;
    }

    await user.save();

    if (resolvedRole === 'admin') {
      return res.status(201).json({
        success: true,
        message: 'Super admin account created. You can log in now.',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    }

    await Otp.create({
      userId: user._id,
      purpose: 'email_verification',
      channel: 'email',
      codeHash: hashValue(otpCode),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendVerificationEmail(user.email, otpCode);

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email using the OTP sent to your inbox.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const orgRoles = ['clinic_admin', 'lab_tech', 'insurance'];
    const isOrg = orgRoles.includes(user.role);
    const orgStatus = user.organizationProfile?.verificationStatus || 'pending';

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: isOrg
          ? 'Please verify your email before logging in. Your organization will also need super admin approval before you can manage doctors or operations.'
          : 'Please verify your email before logging in.',
        email: user.email
      });
    }

    if (isOrg && orgStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        code: 'ORGANIZATION_REJECTED',
        message: 'Your organization registration was not approved. Contact Alive Health support for help.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    const accessToken = signToken(user);
    const refreshToken = createRefreshToken();
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    res.json({ success: true, ...createUserResponse(user, accessToken, refreshToken) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  const user = req.user?.toObject ? req.user.toObject() : req.user;
  res.json({
    success: true,
    user: {
      ...user,
      id: user?._id || user?.id,
      password: undefined,
      refreshToken: undefined
    }
  });
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpRecord = await Otp.findOne({
      userId: user._id,
      purpose: 'email_verification',
      used: false
    }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ success: false, message: 'Too many OTP attempts' });
    }

    otpRecord.attempts += 1;
    if (hashValue(otp) !== otpRecord.codeHash) {
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    otpRecord.used = true;
    await otpRecord.save();

    user.isEmailVerified = true;
    user.isActive = true;
    // Organization approval is a separate gate — email verify alone never unlocks ops APIs
    if (['clinic_admin', 'lab_tech', 'insurance'].includes(user.role)) {
      if (!user.organizationProfile) user.organizationProfile = {};
      if (!user.organizationProfile.verificationStatus) {
        user.organizationProfile.verificationStatus = 'pending';
        user.markModified('organizationProfile');
      }
    }
    await user.save();

    const isOrg = ['clinic_admin', 'lab_tech', 'insurance'].includes(user.role);
    const orgStatus = user.organizationProfile?.verificationStatus || 'pending';

    res.json({
      success: true,
      message: isOrg && orgStatus !== 'approved'
        ? 'Email verified. Your organization is pending super admin approval before full access.'
        : 'Email verified successfully',
      organizationStatus: isOrg ? orgStatus : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    const accessToken = signToken(user);
    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { identifier, channel = 'email' } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpCode = createOtp();
    await Otp.create({
      userId: user._id,
      purpose: 'password_reset',
      channel,
      codeHash: hashValue(otpCode),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOtpNotification({
      email: user.email,
      phone: user.phone,
      otp: otpCode,
      channel
    });

    res.json({
      success: true,
      message: `Password reset OTP sent via ${channel}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Identifier, OTP, and new password are required'
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpRecord = await Otp.findOne({
      userId: user._id,
      purpose: 'password_reset',
      used: false
    }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset OTP expired or invalid' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ success: false, message: 'Too many reset attempts' });
    }

    otpRecord.attempts += 1;
    if (hashValue(otp) !== otpRecord.codeHash) {
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid reset OTP' });
    }

    otpRecord.used = true;
    await otpRecord.save();

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingOrganizations = async (req, res) => {
  try {
    const adminService = require('../services/adminService');
    const result = await adminService.listOrganizations({ status: 'pending' });
    res.json({ success: true, count: result.total, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewOrganization = async (req, res) => {
  try {
    const adminService = require('../services/adminService');
    const { status, notes } = req.body;
    const data = await adminService.reviewOrganization(req.params.id, { status, notes });
    res.json({ success: true, message: 'Organization verification updated', data });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
