import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/user-model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/land-solutions';

async function createSuperAdmin() {
  try {
    console.log('\n🔐 SUPER ADMIN ACCOUNT CREATION\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log(`✓ Connected to: ${MONGODB_URI}\n`);

    const adminEmail = 'admin@landsolutions.co.zw';
    const adminPassword = 'AdminPassword123!';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`⚠ User already exists: ${existingUser.email}`);
      console.log('Updating role to SYSTEM_ADMIN and ensuring verified status...');
      
      existingUser.role = 'SYSTEM_ADMIN';
      existingUser.isEmailVerified = true;
      existingUser.activity.accountStatus = 'ACTIVE';
      
      // Update password
      const hashedPassword = bcryptjs.hashSync(adminPassword, 12);
      existingUser.authentication.password = hashedPassword;
      
      await existingUser.save();
      console.log('✓ Super Admin account updated successfully!\n');
    } else {
      console.log('Creating new Super Admin Account...\n');

      const hashedPassword = bcryptjs.hashSync(adminPassword, 12);

      const superAdmin = new User({
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        phoneNumber: '+263771234567',
        nationalId: '00-0000000X00',
        role: 'SYSTEM_ADMIN',
        isEmailVerified: true,
        authentication: {
          password: hashedPassword
        },
        activity: {
          accountStatus: 'ACTIVE'
        }
      });

      await superAdmin.save();
      console.log('✓ Super Admin account created successfully!\n');
    }

    console.log('═'.repeat(60));
    console.log('📊 CREDENTIALS:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: SYSTEM_ADMIN`);
    console.log('═'.repeat(60));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
