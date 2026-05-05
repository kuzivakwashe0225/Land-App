import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user-model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/landsolutions';

async function createAdmin(email, password, firstName, lastName) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      firstName,
      lastName,
      email,
      phoneNumber: '+263' + Math.floor(Math.random() * 1000000000),
      nationalId: '00-' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0') + 'A00',
      role: 'SYSTEM_ADMIN',
      authentication: { password: hashedPassword },
      verification: { kycStatus: 'APPROVED', isVerified: true },
      activity: { accountStatus: 'ACTIVE' }
    });

    await admin.save();
    console.log(`✅ Admin account created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.error('❌ Error: A user with this email or national ID already exists.');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/create-admin.js <email> <password> [firstName] [lastName]');
  process.exit(1);
}

createAdmin(args[0], args[1], args[2] || 'Admin', args[3] || 'User');
