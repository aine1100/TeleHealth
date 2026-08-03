const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { User, Otp } = require('../models');
const { buildStorageKey } = require('../services/storageService');
const { uploadFileToR2 } = require('../services/r2Service');
const { sendVerificationEmail, sendOtpNotification } = require('../utils/emailService');

const signToken = (user, expiresIn = process.env.JWT_EXPIRE || '15m') => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn
  });
};

const createRefreshToken = () => crypto.randomBytes(40).toString('hex');
const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const createUserResponse = (user, accessToken, refreshToken) => ({
  success: true,
  accessToken,
  refreshToken,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role
  }
});

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

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const normalizedBody = { firstName, lastName, email, phone, password, role, ...rest };

    if (['clinic_admin', 'lab_tech', 'insurance'].includes(role) && req.files && req.files.length) {
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
        verificationDocuments: documents
      };
    }

    const otpCode = createOtp();
    const user = new User(normalizedBody);
    await user.save();

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

    if (!user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    const accessToken = signToken(user);
    const refreshToken = createRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    res.json(createUserResponse(user, accessToken, refreshToken));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpRecord = await Otp.findOne({ userId: user._id, purpose: 'email_verification', used: false }).sort({ createdAt: -1 });
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
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
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
      return res.status(400).json({ success: false, message: 'Identifier, OTP, and new password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpRecord = await Otp.findOne({ userId: user._id, purpose: 'password_reset', used: false }).sort({ createdAt: -1 });
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
    const pending = await User.find({
      role: { $in: ['clinic_admin', 'lab_tech', 'insurance'] },
      'organizationProfile.verificationStatus': 'pending'
    }).select('firstName lastName email phone role organizationProfile');

    res.json({ success: true, count: pending.length, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    user.organizationProfile = {
      ...user.organizationProfile,
      verificationStatus: status,
      verificationNotes: notes || ''
    };

    await user.save();

    res.json({ success: true, message: 'Organization verification updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
