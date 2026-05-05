/**
 * Clear all database collections and reseed with fresh data
 * Run: node scripts/clear-and-seed.js
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/user-model.js';
import Land from '../models/landModel.js';
import AuditLog from '../models/audit-log-model.js';
import Report from '../models/report-model.js';

const hash = (pw) => bcryptjs.hashSync(pw, 10);
const COMMON_PASS = 'Test@1234';
const hashed = hash(COMMON_PASS);

async function clearAndSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop all collections
    console.log('🗑️  Clearing all collections...');
    await User.deleteMany({});
    await Land.deleteMany({});
    await AuditLog.deleteMany({});
    await Report.deleteMany({});
    console.log('✅ All collections cleared');

    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [
      {
        firstName: 'Admin',
        lastName: 'LandSolutions',
        email: 'admin@landsolutions.zw',
        phoneNumber: '+263771234567',
        nationalId: '63-123456A63',
        role: 'SYSTEM_ADMIN',
        authentication: { password: hashed },
        verification: {
          sellerDetailsApproved: true,
          sellerDetailsSubmittedAt: new Date(),
          sellerDetailsApprovedAt: new Date()
        },
        activity: { accountStatus: 'ACTIVE' },
      },
      {
        firstName: 'Officer',
        lastName: 'Verification',
        email: 'officer@landsolutions.zw',
        phoneNumber: '+263772345678',
        nationalId: '63-234567B63',
        role: 'VERIFICATION_OFFICER',
        authentication: { password: hashed },
        verification: {
          sellerDetailsApproved: true,
          sellerDetailsSubmittedAt: new Date(),
          sellerDetailsApprovedAt: new Date()
        },
        activity: { accountStatus: 'ACTIVE' },
      },
      {
        firstName: 'John',
        lastName: 'Seller',
        email: 'seller@landsolutions.zw',
        phoneNumber: '+263773456789',
        nationalId: '63-345678C63',
        role: 'SELLER',
        authentication: { password: hashed },
        verification: {
          sellerDetailsApproved: true,
          sellerDetailsSubmittedAt: new Date(),
          sellerDetailsApprovedAt: new Date()
        },
        activity: { accountStatus: 'ACTIVE' },
      },
      {
        firstName: 'Jane',
        lastName: 'Buyer',
        email: 'buyer@landsolutions.zw',
        phoneNumber: '+263774567890',
        nationalId: '63-456789D63',
        role: 'BUYER',
        authentication: { password: hashed },
        verification: { sellerDetailsApproved: false },
        activity: { accountStatus: 'ACTIVE' },
      },
    ];

    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users`);

    // Get seller ID for creating listings
    const seller = createdUsers.find(u => u.role === 'SELLER');
    if (!seller) throw new Error('Seller not found');

    // Create test listings
    console.log('🏠 Creating test land listings...');
    const testListings = [
      {
        standNumber: 'STAND-001',
        titleDeedNumber: 'TD-001-2024',
        owner: seller._id,
        location: {
          address: {
            street: '1234 Borrowdale Road',
            suburb: 'HARARE',
            province: 'HARARE'
          },
          coordinates: { latitude: -17.8252, longitude: 31.0335 }
        },
        landDetails: {
          size: { squareMeters: 2500, hectares: 0.25 },
          zoning: 'RESIDENTIAL',
          landUse: 'VACANT',
          boundaryType: 'WALLED',
          description: 'Prime residential stand in Borrowdale'
        },
        transaction: {
          listedPrice: { amount: 125000, currency: 'USD' },
          status: 'AVAILABLE'
        },
        verification: {
          status: 'VERIFIED',
          isVerified: true
        }
      },
      {
        standNumber: 'STAND-002',
        titleDeedNumber: 'TD-002-2024',
        owner: seller._id,
        location: {
          address: {
            street: '5678 Enterprise Road',
            suburb: 'HARARE',
            province: 'HARARE'
          },
          coordinates: { latitude: -17.8300, longitude: 31.0400 }
        },
        landDetails: {
          size: { squareMeters: 5000, hectares: 0.5 },
          zoning: 'COMMERCIAL',
          landUse: 'VACANT',
          boundaryType: 'WALLED',
          description: 'Commercial stand in Enterprise City'
        },
        transaction: {
          listedPrice: { amount: 250000, currency: 'USD' },
          status: 'AVAILABLE'
        },
        verification: {
          status: 'VERIFIED',
          isVerified: true
        }
      },
      {
        standNumber: 'STAND-003',
        titleDeedNumber: 'TD-003-2024',
        owner: seller._id,
        location: {
          address: {
            street: '91011 Bulawayo Road',
            suburb: 'BULAWAYO',
            province: 'BULAWAYO'
          },
          coordinates: { latitude: -20.1500, longitude: 28.5833 }
        },
        landDetails: {
          size: { squareMeters: 1500, hectares: 0.15 },
          zoning: 'RESIDENTIAL',
          landUse: 'VACANT',
          boundaryType: 'FENCED',
          description: 'Cozy residential stand in Bulawayo'
        },
        transaction: {
          listedPrice: { amount: 85000, currency: 'USD' },
          status: 'AVAILABLE'
        },
        verification: {
          status: 'VERIFIED',
          isVerified: true
        }
      },
    ];

    const createdListings = await Land.insertMany(testListings);
    console.log(`✅ Created ${createdListings.length} test listings`);

    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE CLEARED AND RESEEDED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📝 TEST CREDENTIALS:\n');
    testUsers.forEach(user => {
      console.log(`${user.role}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${COMMON_PASS}\n`);
    });
    console.log('🏠 LISTINGS CREATED: 3 verified listings\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearAndSeed();
