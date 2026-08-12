const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'telehealth-dev-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact support.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please log in again.' 
      });
    }
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Check role authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

// Check if user owns resource or is admin
const authorizeOwnerOrAdmin = (getOwnerId) => {
  return (req, res, next) => {
    const ownerId = getOwnerId(req);
    if (req.user.role === 'admin' || req.user._id.toString() === ownerId) {
      return next();
    }
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access your own resources.' 
    });
  };
};

const ORG_ROLES = ['clinic_admin', 'lab_tech', 'insurance', 'pharmacist'];

/** Block dashboard APIs until super admin approves the organization */
const requireApprovedOrganization = (req, res, next) => {
  if (!ORG_ROLES.includes(req.user.role)) {
    return next();
  }

  const status = req.user.organizationProfile?.verificationStatus || 'pending';
  if (status !== 'approved') {
    return res.status(403).json({
      success: false,
      code: 'ORGANIZATION_NOT_APPROVED',
      message:
        status === 'rejected'
          ? 'Your organization registration was not approved.'
          : 'Your organization is awaiting super admin approval. You cannot manage doctors or facility operations until approved.',
      verificationStatus: status
    });
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  requireApprovedOrganization
};