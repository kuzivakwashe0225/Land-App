import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/user-model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/land-solutions';

async function createSuperAdmin() {
  try {
    console.log('\n🔐 SUPER ADMIN ACCOUNT CREATION\n');
    console.log('═'.repeat(60));

    // Connect to database
    console.log('1️⃣  Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(`✓ Connected to: ${MONGODB_URI}\n`);

    // Check if super admin already exists
    console.log('2️⃣  Checking for existing admin accounts...');
    const existingAdmin = await User.findOne({ role: 'SYSTEM_ADMIN' });
    if (existingAdmin) {
      console.log(`⚠ Super Admin already exists: ${existingAdmin.email}`);
      console.log('\nExisting Admin:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  First Name: ${existingAdmin.firstName}`);
      console.log(`  Last Name: ${existingAdmin.lastName}`);
      console.log(`  Phone: ${existingAdmin.phoneNumber}`);
      console.log(`  National ID: ${existingAdmin.nationalId}`);
      console.log(`  Account Status: ${existingAdmin.activity?.accountStatus || 'ACTIVE'}`);
      console.log(`  Email Verified: ${existingAdmin.isEmailVerified}`);
      console.log('\n✓ Super Admin account already created\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create super admin account
    console.log('3️⃣  Creating Super Admin Account...\n');

    const adminData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@landsolutions.local',
      phoneNumber: '+263771234567',
      nationalId: '63-245678Z45',
      password: 'AdminPass123',
      role: 'SYSTEM_ADMIN'
    };

    console.log('Super Admin Details:');
    console.log(`  First Name: ${adminData.firstName}`);
    console.log(`  Last Name: ${adminData.lastName}`);
    console.log(`  Email: ${adminData.email}`);
    console.log(`  Phone: ${adminData.phoneNumber}`);
    console.log(`  National ID: ${adminData.nationalId}`);
    console.log(`  Password: ${adminData.password}`);
    console.log(`  Role: ${adminData.role}\n`);

    // Hash password
    const hashedPassword = bcryptjs.hashSync(adminData.password, 12);

    // Create user
    const superAdmin = new User({
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      phoneNumber: adminData.phoneNumber,
      nationalId: adminData.nationalId,
      role: adminData.role,
      isEmailVerified: true, // Admin account pre-verified
      authentication: {
        password: hashedPassword
      },
      activity: {
        accountStatus: 'ACTIVE'
      }
    });

    await superAdmin.save();
    console.log('✓ Super Admin account created successfully!\n');

    // Create verification officer account
    console.log('4️⃣  Creating Verification Officer Account...\n');

    const officerData = {
      firstName: 'Land',
      lastName: 'Verifier',
      email: 'officer@landsolutions.local',
      phoneNumber: '+263772345678',
      nationalId: '45-123456A78',
      password: 'OfficerPass123',
      role: 'VERIFICATION_OFFICER'
    };

    console.log('Verification Officer Details:');
    console.log(`  First Name: ${officerData.firstName}`);
    console.log(`  Last Name: ${officerData.lastName}`);
    console.log(`  Email: ${officerData.email}`);
    console.log(`  Phone: ${officerData.phoneNumber}`);
    console.log(`  National ID: ${officerData.nationalId}`);
    console.log(`  Password: ${officerData.password}`);
    console.log(`  Role: ${officerData.role}\n`);

    const hashedOfficerPassword = bcryptjs.hashSync(officerData.password, 12);

    const officer = new User({
      firstName: officerData.firstName,
      lastName: officerData.lastName,
      email: officerData.email,
      phoneNumber: officerData.phoneNumber,
      nationalId: officerData.nationalId,
      role: officerData.role,
      isEmailVerified: true, // Officer account pre-verified
      authentication: {
        password: hashedOfficerPassword
      },
      activity: {
        accountStatus: 'ACTIVE'
      }
    });

    await officer.save();
    console.log('✓ Verification Officer account created successfully!\n');

    // Create municipal officer account
    console.log('5️⃣  Creating Municipal Officer Account...\n');

    const municipalData = {
      firstName: 'Municipal',
      lastName: 'Officer',
      email: 'municipal@landsolutions.local',
      phoneNumber: '+263773456789',
      nationalId: '00-999999Z99',
      password: 'MunicipalPass123',
      role: 'MUNICIPAL_OFFICER'
    };

    console.log('Municipal Officer Details:');
    console.log(`  First Name: ${municipalData.firstName}`);
    console.log(`  Last Name: ${municipalData.lastName}`);
    console.log(`  Email: ${municipalData.email}`);
    console.log(`  Phone: ${municipalData.phoneNumber}`);
    console.log(`  National ID: ${municipalData.nationalId}`);
    console.log(`  Password: ${municipalData.password}`);
    console.log(`  Role: ${municipalData.role}\n`);

    const hashedMunicipalPassword = bcryptjs.hashSync(municipalData.password, 12);

    const municipal = new User({
      firstName: municipalData.firstName,
      lastName: municipalData.lastName,
      email: municipalData.email,
      phoneNumber: municipalData.phoneNumber,
      nationalId: municipalData.nationalId,
      role: municipalData.role,
      isEmailVerified: true, // Officer account pre-verified
      authentication: {
        password: hashedMunicipalPassword
      },
      activity: {
        accountStatus: 'ACTIVE'
      }
    });

    await municipal.save();
    console.log('✓ Municipal Officer account created successfully!\n');

    // Summary
    console.log('═'.repeat(60));
    console.log('📊 ACCOUNTS CREATED SUCCESSFULLY\n');
    console.log('✅ SYSTEM_ADMIN (Super Admin)');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Status: Can do EVERYTHING\n`);

    console.log('✅ VERIFICATION_OFFICER');
    console.log(`   Email: ${officerData.email}`);
    console.log(`   Password: ${officerData.password}`);
    console.log(`   Status: Can verify listings & resolve flags\n`);

    console.log('✅ MUNICIPAL_OFFICER');
    console.log(`   Email: ${municipalData.email}`);
    console.log(`   Password: ${municipalData.password}`);
    console.log(`   Status: Can override verifications\n`);

    console.log('📝 NEXT STEPS:');
    console.log('1. Use admin@landsolutions.local to sign in');
    console.log('2. Go to /admin to access admin dashboard');
    console.log('3. Create more officer accounts via Admin Panel');
    console.log('4. Manage users, verify listings, view reports');
    console.log('5. Public users can only sign up as BUYER or SELLER\n');

    console.log('🔐 SECURITY NOTES:');
    console.log('⚠ These are LOCAL accounts (not for production)');
    console.log('⚠ Change passwords in production');
    console.log('⚠ Only admins can create VERIFICATION_OFFICER accounts');
    console.log('⚠ Public signup limited to BUYER and SELLER roles\n');

    await mongoose.disconnect();
    console.log('✓ Done\n');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.error(`   ${field} already exists in database`);
    }
    process.exit(1);
  }
}

createSuperAdmin();
