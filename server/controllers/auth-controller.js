import User from "../models/user-model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/notifications.js";

// Ensure JWT secret is configured
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error('JWT_SECRET_KEY is not configured in environment variables');
  }
  return secret;
};

// Password validation function — min 8 chars, 1 uppercase, 1 number (special char optional but shown in UI)
const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  return errors;
};

// Field validation helpers
const validateEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

const validatePhoneNumber = (phone) => {
  // Format: +263xxxxxxxxx or 0xxxxxxxxx (11 digits total)
  const regex = /^(\+263|0)[0-9]{9}$/;
  return regex.test(phone);
};

const validateNationalId = (id) => {
  // Format: XX-XXXXXXXAXX (e.g., 63-245678Z45)
  const regex = /^[0-9]{2}-[0-9]{7}[A-Z][0-9]{2}$/;
  return regex.test(id);
};

export const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, nationalId, password, role } = req.body;

    // Only public users can be BUYER or SELLER
    // VERIFICATION_OFFICER, MUNICIPAL_OFFICER, SYSTEM_ADMIN created by admins only
    const requestedRole = role || 'BUYER';
    if (!['BUYER', 'SELLER'].includes(requestedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid role. Public users can only sign up as BUYER or SELLER.',
        errors: { role: 'Admin and officer accounts are created by system administrators only.' }
      });
    }

    // Validate required fields
    const errors = {};
    if (!firstName || firstName.trim().length < 2) {
      errors.firstName = 'First name is required (minimum 2 characters)';
    }
    if (!lastName || lastName.trim().length < 2) {
      errors.lastName = 'Last name is required (minimum 2 characters)';
    }
    if (!email || !validateEmail(email)) {
      errors.email = 'Please enter a valid email address (e.g., john@example.com)';
    }
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      errors.phoneNumber = 'Phone must be in format +263xxxxxxxxx or 0xxxxxxxxx (11 digits)';
    }
    if (!nationalId || !validateNationalId(nationalId)) {
      errors.nationalId = 'National ID must be in format XX-XXXXXXXAXX (e.g., 63-245678Z45)';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the following errors:',
        errors,
        fields: Object.keys(errors)
      });
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: { password: passwordErrors.join('; ') }
      });
    }

    // Check for duplicate email (case-insensitive)
    const existUser = await User.findOne({ email: email.toLowerCase() });
    if (existUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'This email is already registered. Please sign in or use a different email.' },
        field: 'email'
      });
    }

    // Check for duplicate national ID
    const existNationalId = await User.findOne({ nationalId: nationalId.toUpperCase() });
    if (existNationalId) {
      return res.status(409).json({
        success: false,
        message: 'This National ID is already registered.',
        errors: { nationalId: 'This National ID is already in use. Please check your details.' },
        field: 'nationalId'
      });
    }

    // Check for duplicate phone number
    const existPhone = await User.findOne({ phoneNumber });
    if (existPhone) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered.',
        errors: { phoneNumber: 'This phone number is already registered. Please use a different number.' },
        field: 'phoneNumber'
      });
    }

    const hashedPassword = bcryptjs.hashSync(password, 12);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      nationalId: nationalId.toUpperCase().trim(),
      role: requestedRole, // Already validated to be BUYER or SELLER
      isEmailVerified: true,
      authentication: { password: hashedPassword },
      security: {
        emailVerificationToken: null,
        emailVerificationExpires: null
      },
      activity: {
        accountStatus: 'ACTIVE'
      }
    });

    await newUser.save();
    console.log(`✓ User registered successfully: ${newUser.email}`);

    // Send verification email (non-blocking)
    /* 
    // Email verification disabled as per user request
    try {
      await sendVerificationEmail(newUser, verificationToken);
      console.log(`✓ Verification email sent to: ${newUser.email}`);
    } catch (emailError) {
      console.warn(`⚠ Failed to send verification email to ${newUser.email}:`, emailError.message);
    }
    */

    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
      const fieldErrors = {};
      Object.keys(error.errors).forEach(field => {
        fieldErrors[field] = error.errors[field].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check the fields below:',
        errors: fieldErrors,
        fields: Object.keys(fieldErrors)
      });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldLabels = { email: 'Email', nationalId: 'National ID', phoneNumber: 'Phone number' };
      return res.status(409).json({
        success: false,
        message: `${fieldLabels[field] || field} is already in use.`,
        errors: { [field]: `This ${fieldLabels[field] || field} is already registered.` },
        field
      });
    }
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email (case-insensitive)
    const validUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!validUser) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please sign up first.'
      });
    }

    // Check if email is verified
    /* 
    // Email verification check disabled
    if (!validUser.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before signing in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    */

    // Check if account is active
    if (validUser.activity && validUser.activity.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${validUser.activity.accountStatus.toLowerCase()}. Please contact support.`
      });
    }

    // Check if account is locked
    if (validUser.authentication.lockUntil && validUser.authentication.lockUntil > Date.now()) {
      const unlockTime = new Date(validUser.authentication.lockUntil).toLocaleTimeString();
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again after ${unlockTime}.`
      });
    }

    const validPassword = bcryptjs.compareSync(password, validUser.authentication.password);
    if (!validPassword) {
      // Increment login attempts
      const attempts = (validUser.authentication.loginAttempts || 0) + 1;
      const updateData = { 'authentication.loginAttempts': attempts };
      if (attempts >= 5) {
        // Lock account for 15 minutes after 5 failed attempts
        updateData['authentication.lockUntil'] = new Date(Date.now() + 15 * 60 * 1000);
      }
      await User.findByIdAndUpdate(validUser._id, { $set: updateData });

      const remaining = Math.max(0, 5 - attempts);
      return res.status(401).json({
        success: false,
        message: remaining > 0
          ? `Invalid password. ${remaining} attempt(s) remaining before account lockout.`
          : 'Account locked for 15 minutes due to too many failed attempts.'
      });
    }

    // Reset login attempts on successful login
    await User.findByIdAndUpdate(validUser._id, {
      $set: {
        'authentication.loginAttempts': 0,
        'authentication.lockUntil': null,
        'authentication.lastLogin': new Date()
      }
    });

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      { id: validUser._id, role: validUser.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userObj = validUser.toObject();
    if (userObj.authentication) {
      delete userObj.authentication.password;
      delete userObj.authentication.twoFactorSecret;
    }
    if (userObj.security) {
      delete userObj.security.passwordResetToken;
      delete userObj.security.emailVerificationToken;
    }

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      .status(200)
      .json({
        success: true,
        message: 'Signed in successfully',
        user: userObj,
        token
      });
  } catch (error) {
    console.error('Signin error:', error);
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const jwtSecret = getJwtSecret();
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (user) {
      // Check account status
      if (user.activity && user.activity.accountStatus !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.activity.accountStatus.toLowerCase()}. Please contact support.`
        });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      const userObj = user.toObject();
      if (userObj.authentication) delete userObj.authentication.password;
      if (userObj.security) delete userObj.security.passwordResetToken;

      return res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
        .status(200)
        .json({ success: true, user: userObj, token });
    } else {
      const generatedRandomPassword =
        Math.random().toString(36).slice(-8).toUpperCase() +
        Math.random().toString(36).slice(-8) +
        Math.floor(Math.random() * 9999);
      const hashedPassword = bcryptjs.hashSync(generatedRandomPassword, 12);

      const nameParts = (req.body.name || '').split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Google';

      const newUser = new User({
        firstName,
        lastName,
        email: req.body.email.toLowerCase(),
        phoneNumber: req.body.phoneNumber || '0700000000',
        nationalId: '00-0000000A00', // Placeholder — user must update profile
        authentication: { password: hashedPassword },
        profile: { profilePicture: req.body.photo },
      });

      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      const userObj = newUser.toObject();
      if (userObj.authentication) delete userObj.authentication.password;

      return res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
        .status(201)
        .json({ success: true, user: userObj, token });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      'security.emailVerificationToken': hashedToken,
      'security.emailVerificationExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link. Please request a new verification email.'
      });
    }

    user.isEmailVerified = true;
    user.security.emailVerificationToken = undefined;
    user.security.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
      redirectUrl: '/sign-in'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    next(error);
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email is already verified. You can sign in.'
      });
    }

    // Rate limit: only resend if last verification email was sent more than 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (user.security.emailVerificationExpires && new Date(user.security.emailVerificationExpires) > fiveMinutesAgo) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another verification email. Try again in a few minutes.'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.security.emailVerificationToken = hashedVerificationToken;
    user.security.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send verification email (non-blocking)
    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Verification email has been sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json({
      success: true,
      message: "User has been logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/*
Syntax to throw error forcefully.

import {errorHandler} from "../utils/error.js"

next(errorHandler(501, "Login Failed!!! Unregistered user"))
*/
