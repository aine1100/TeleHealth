const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { buildStorageKey, buildPublicUrl } = require('../services/storageService');
const { uploadFileToR2 } = require('../services/r2Service');

const signToken = (user, expiresIn = process.env.JWT_EXPIRE || '15m') => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn
  });
};

const createRefreshToken = () => crypto.randomBytes(40).toString('hex');

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

    const user = new User(normalizedBody);
    await user.save();

    const accessToken = signToken(user);
    const refreshToken = createRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json(createUserResponse(user, accessToken, refreshToken));
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
