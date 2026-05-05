import jwt from 'jsonwebtoken';
import User from '../models/user-model.js';
import LandModel from '../models/landModel.js';
import TransactionModel from '../models/transactionModel.js';

// Helper: get JWT secret, throw if missing
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) throw new Error('JWT_SECRET_KEY is not configured in environment variables');
  return secret;
};

// ─────────────────────────────────────────────────────────────────────────────
// Authenticate token middleware
// ─────────────────────────────────────────────────────────────────────────────
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Fall back to cookie
    if (!token && req.cookies) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required. Please sign in.'
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select('-authentication.password -authentication.twoFactorSecret -security.passwordResetToken -security.emailVerificationToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token — user not found. Please sign in again.'
      });
    }

    // Check account status
    if (user.activity && user.activity.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.activity.accountStatus.toLowerCase()}. Please contact support.`
      });
    }

    // Check if account is locked
    if (user.authentication.lockUntil && user.authentication.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Please sign in again.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({ success: false, message: 'Authentication error. Please try again.' });
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Role-based authorization
// ─────────────────────────────────────────────────────────────────────────────
export const authorizeRoles = (...roles) => {
  // Supports both authorizeRoles('ADMIN', 'SELLER') and authorizeRoles(['ADMIN', 'SELLER'])
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): [${allowedRoles.join(', ')}]. Your role: ${req.user?.role || 'NONE'}`
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Resource ownership check
// ─────────────────────────────────────────────────────────────────────────────
const getResourceModel = (routePath) => {
  if (routePath.includes('/land')) return LandModel;
  if (routePath.includes('/transaction')) return TransactionModel;
  if (routePath.includes('/user')) return User;
  throw new Error('Unknown resource type for ownership check');
};

export const checkOwnershipOrAdmin = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.landId || req.params.transactionId;

      // Admins and municipal officers bypass ownership checks
      if (['SYSTEM_ADMIN', 'MUNICIPAL_OFFICER'].includes(req.user.role)) {
        return next();
      }

      const model = getResourceModel(req.route.path);
      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found.' });
      }

      const resourceUserId = resource[resourceField]?.toString();
      if (resourceUserId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied — you can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Simple in-memory rate limiter (per IP + user)
// ─────────────────────────────────────────────────────────────────────────────
export const createRateLimiter = (windowMs, max, message) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user._id : '');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Prune expired entries
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter(ts => ts > windowStart);
      if (valid.length === 0) requests.delete(ip);
      else requests.set(ip, valid);
    }

    const timestamps = requests.get(key) || [];

    if (timestamps.length >= max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later.'
      });
    }

    timestamps.push(now);
    requests.set(key, timestamps);
    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Optional guards
// ─────────────────────────────────────────────────────────────────────────────
export const requireTwoFactor = (req, res, next) => {
  if (req.user?.authentication?.twoFactorEnabled && !req.session?.twoFactorVerified) {
    return res.status(403).json({ success: false, message: 'Two-factor authentication required.' });
  }
  next();
};

export const requireEmailVerification = (req, res, next) => {
  if (!req.user?.verification?.isVerified && req.user?.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ success: false, message: 'Email verification required before accessing this resource.' });
  }
  next();
};

// ── Backward-compatibility aliases ────────────────────────────────────────────
// Several route files import 'verifyUser' — alias to authenticateToken
export const verifyUser = authenticateToken;
