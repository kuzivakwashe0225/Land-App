import User from '../models/user-model.js';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

// Only SYSTEM_ADMIN can create new admin accounts
export const createAdminAccount = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, nationalId, password, role } = req.body;

    // Check if requesting user is SYSTEM_ADMIN
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only System Administrators can create admin accounts.'
      });
    }

    // Validate role — can only be VERIFICATION_OFFICER, MUNICIPAL_OFFICER, SYSTEM_ADMIN
    const validAdminRoles = ['VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN'];
    if (!validAdminRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Can only create: VERIFICATION_OFFICER, MUNICIPAL_OFFICER, or SYSTEM_ADMIN'
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
    if (!email) {
      errors.email = 'Email is required';
    }
    if (!phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!nationalId) {
      errors.nationalId = 'National ID is required';
    }
    if (!password || password.length < 8) {
      errors.password = 'Password is required (minimum 8 characters)';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check for duplicates
    const existEmail = await User.findOne({ email: email.toLowerCase() });
    if (existEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
        errors: { email: 'This email is already registered.' }
      });
    }

    const existPhone = await User.findOne({ phoneNumber });
    if (existPhone) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already exists',
        errors: { phoneNumber: 'This phone number is already registered.' }
      });
    }

    const existNationalId = await User.findOne({ nationalId: nationalId.toUpperCase() });
    if (existNationalId) {
      return res.status(409).json({
        success: false,
        message: 'National ID already exists',
        errors: { nationalId: 'This National ID is already registered.' }
      });
    }

    // Create new admin account
    const hashedPassword = bcryptjs.hashSync(password, 12);

    const newAdmin = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      nationalId: nationalId.toUpperCase().trim(),
      role,
      isEmailVerified: true, // Admin accounts pre-verified
      authentication: {
        password: hashedPassword
      },
      activity: {
        accountStatus: 'ACTIVE'
      }
    });

    await newAdmin.save();
    console.log(`✓ Admin account created: ${role} - ${newAdmin.email}`);

    res.status(201).json({
      success: true,
      message: `${role} account created successfully.`,
      user: {
        id: newAdmin._id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        role: newAdmin.role,
        phoneNumber: newAdmin.phoneNumber,
        nationalId: newAdmin.nationalId
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        errors: { [field]: `This ${field} is already registered.` }
      });
    }
    next(error);
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only System Administrators can view all users.'
      });
    }

    const users = await User.find({}, {
      email: 1,
      firstName: 1,
      lastName: 1,
      role: 1,
      phoneNumber: 1,
      nationalId: 1,
      'activity.accountStatus': 1,
      isEmailVerified: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    next(error);
  }
};

// Suspend/unsuspend user (admin only)
export const suspendUser = async (req, res, next) => {
  try {
    const { userId, suspend } = req.body;

    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only System Administrators can suspend users.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.activity.accountStatus = suspend ? 'SUSPENDED' : 'ACTIVE';
    await user.save();

    console.log(`✓ User ${suspend ? 'suspended' : 'unsuspended'}: ${user.email}`);

    res.status(200).json({
      success: true,
      message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        status: user.activity.accountStatus
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    next(error);
  }
};

// Delete user (admin only)
export const deleteUserAccount = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only System Administrators can delete users.'
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✓ User deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
};

// Change user role (admin only)
export const changeUserRole = async (req, res, next) => {
  try {
    const { userId, newRole } = req.body;

    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only System Administrators can change user roles.'
      });
    }

    const validRoles = ['BUYER', 'SELLER', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    console.log(`✓ User role changed: ${user.email} (${oldRole} → ${newRole})`);

    res.status(200).json({
      success: true,
      message: `User role changed from ${oldRole} to ${newRole}`,
      user: {
        id: user._id,
        email: user.email,
        oldRole,
        newRole
      }
    });
  } catch (error) {
    console.error('Change role error:', error);
    next(error);
  }
};

// Get dashboard statistics (admin only)
export const getAdminDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.role !== 'VERIFICATION_OFFICER' && req.user.role !== 'MUNICIPAL_OFFICER') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view dashboard.'
      });
    }

    const totalUsers = await User.countDocuments();
    const buyers = await User.countDocuments({ role: 'BUYER' });
    const sellers = await User.countDocuments({ role: 'SELLER' });
    const officers = await User.countDocuments({ role: { $in: ['VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER'] } });
    const admins = await User.countDocuments({ role: 'SYSTEM_ADMIN' });
    const activeUsers = await User.countDocuments({ 'activity.accountStatus': 'ACTIVE' });
    const suspendedUsers = await User.countDocuments({ 'activity.accountStatus': 'SUSPENDED' });
    const emailVerifiedUsers = await User.countDocuments({ isEmailVerified: true });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        usersByRole: {
          buyers,
          sellers,
          officers,
          admins
        },
        accountStatus: {
          active: activeUsers,
          suspended: suspendedUsers
        },
        emailVerified: emailVerifiedUsers,
        emailNotVerified: totalUsers - emailVerifiedUsers
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(error);
  }
};
