/**
 * LandSolutions — Complete Database Seeder
 * Seeds: System Admin, Verification Officers, Sellers, Buyers,
 *        KYC-verified users, and a variety of land listings across Zimbabwe.
 *
 * Run: node scripts/seed.js
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Models ────────────────────────────────────────────────────────────────────
import User from '../models/user-model.js';
import Land from '../models/landModel.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const hash = (pw) => bcryptjs.hashSync(pw, 10);

const COMMON_PASS = 'Test@1234';       // All test accounts use this password
const hashed = hash(COMMON_PASS);

// ── Seed Data ─────────────────────────────────────────────────────────────────
const USERS = [
  // ── System Admin ────────────────────────────────────────────────────────────
  {
    firstName: 'Admin',
    lastName: 'LandSolutions',
    email: 'admin@landsolutions.zw',
    phoneNumber: '+263771234567',
    nationalId: '63-1234567A63',
    role: 'SYSTEM_ADMIN',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },
  {
    firstName: 'Isaia',
    lastName: 'Admin',
    email: 'isaia@landsolutions.zw',
    phoneNumber: '+263770000000',
    nationalId: '00-0000000A00',
    role: 'SYSTEM_ADMIN',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },

  // ── Verification Officer ─────────────────────────────────────────────────────
  {
    firstName: 'Tendai',
    lastName: 'Moyo',
    email: 'officer@landsolutions.zw',
    phoneNumber: '+263772345678',
    nationalId: '72-2345678B72',
    role: 'VERIFICATION_OFFICER',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },

  // ── Municipal Officer ────────────────────────────────────────────────────────
  {
    firstName: 'Farai',
    lastName: 'Chigumbura',
    email: 'municipal@landsolutions.zw',
    phoneNumber: '+263773456789',
    nationalId: '83-3456789C83',
    role: 'MUNICIPAL_OFFICER',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },

  // ── Sellers (KYC Approved — can list land) ──────────────────────────────────
  {
    firstName: 'John',
    lastName: 'Mutasa',
    email: 'seller1@test.zw',
    phoneNumber: '+263774567890',
    nationalId: '94-4567890D94',
    role: 'SELLER',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },
  {
    firstName: 'Mary',
    lastName: 'Chikwanda',
    email: 'seller2@test.zw',
    phoneNumber: '+263775678901',
    nationalId: '95-5678901E95',
    role: 'SELLER',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },
  {
    firstName: 'David',
    lastName: 'Ncube',
    email: 'seller3@test.zw',
    phoneNumber: '+263776789012',
    nationalId: '96-6789012F96',
    role: 'SELLER',
    authentication: { password: hashed },
    // NOT KYC approved — to test the KYC gate on land listing
    verification: { kycStatus: 'PENDING', isVerified: false },
    activity: { accountStatus: 'ACTIVE' },
  },

  // ── Buyers ──────────────────────────────────────────────────────────────────
  {
    firstName: 'Grace',
    lastName: 'Ndlovu',
    email: 'buyer1@test.zw',
    phoneNumber: '+263777890123',
    nationalId: '97-7890123G97',
    role: 'BUYER',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },
  {
    firstName: 'Simba',
    lastName: 'Dube',
    email: 'buyer2@test.zw',
    phoneNumber: '+263778901234',
    nationalId: '98-8901234H98',
    role: 'BUYER',
    authentication: { password: hashed },
    verification: { kycStatus: 'NOT_SUBMITTED', isVerified: false },
    activity: { accountStatus: 'ACTIVE' },
  },
];

// ── Land Listings ─────────────────────────────────────────────────────────────
const buildLands = (ownerIds) => [
  // ── STORY 1: THE PERFECT LISTING (Verified) ──────────────────────────────
  {
    standNumber: 'STAND-001-BORROWDALE',
    titleDeedNumber: 'TD/HRE/2019/001',
    owner: ownerIds.seller1,
    location: {
      address: { street: '14 Borrowdale Road', suburb: 'HARARE', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0929, -17.7442] }
    },
    landDetails: { size: { squareMeters: 1200, hectares: 0.12 }, zoning: 'RESIDENTIAL', landUse: 'VACANT', description: 'DEMO: This listing was automatically verified because it matches Council records perfectly.' },
    transaction: { listedPrice: { amount: 45000, currency: 'USD' }, status: 'AVAILABLE' },
    isPublic: true,
    listingStatus: 'verified',
    verification: {
      status: 'VERIFIED',
      isVerified: true,
      verifiedBy: ownerIds.officer,
      verificationDate: new Date(),
      autoVerification: { ranAt: new Date(), riskScore: 5, decision: 'AUTO_APPROVE', signals: { nameMatched: true, documentTampered: false, gpsProofSubmitted: true, gpsProofValid: true } }
    }
  },

  // ── STORY 2: THE DISPUTED STAND (Rejected) ──────────────────────────────
  {
    standNumber: 'STAND-010-REJECTED-OWNER',
    titleDeedNumber: 'TD/BYO/2023/505',
    owner: ownerIds.seller2,
    location: {
      address: { street: '55 Disputed Way', suburb: 'BULAWAYO', province: 'BULAWAYO' },
      coordinates: { type: 'Point', coordinates: [28.6000, -20.1600] }
    },
    landDetails: { size: { squareMeters: 1000, hectares: 0.1 }, zoning: 'RESIDENTIAL', landUse: 'VACANT', description: 'DEMO: This was rejected by an Officer because the Council Registry shows a dispute.' },
    transaction: { listedPrice: { amount: 15000, currency: 'USD' }, status: 'REJECTED' },
    verification: {
      status: 'REJECTED',
      isVerified: false,
      rejectionReason: 'Ownership dispute detected in deeds office records during manual audit.',
      verifiedBy: ownerIds.admin
    }
  },

  // ── STORY 3: NEEDS OFFICER ATTENTION (Pending) ──────────────────────────
  {
    standNumber: 'STAND-004-CHITUNGWIZA',
    titleDeedNumber: 'TD/CTZ/2022/088',
    owner: ownerIds.seller2,
    location: {
      address: { street: '45 Seke Road', suburb: 'CHITUNGWIZA', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0700, -17.9900] }
    },
    landDetails: { size: { squareMeters: 600, hectares: 0.06 }, zoning: 'RESIDENTIAL', landUse: 'VACANT', description: 'DEMO: This is waiting for an Officer to review because the owner name slightly differs from registry.' },
    transaction: { listedPrice: { amount: 12000, currency: 'USD' }, status: 'UNDER_REVIEW' },
    verification: {
      status: 'PENDING_VERIFICATION',
      isVerified: false,
      autoVerification: { ranAt: new Date(), riskScore: 40, decision: 'HUMAN_REVIEW', flags: ['NAME_MISMATCH'], signals: { nameMatched: false, documentTampered: false } }
    }
  },

  // ── STORY 4: RECENTLY SOLD (Historical Data) ─────────────────────────────
  {
    standNumber: 'STAND-009-MT-PLEASANT',
    titleDeedNumber: 'TD/HRE/2022/101',
    owner: ownerIds.seller1,
    location: {
      address: { street: '12 Norfolk Road', suburb: 'HARARE', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0450, -17.7850] }
    },
    landDetails: { size: { squareMeters: 2000, hectares: 0.2 }, zoning: 'RESIDENTIAL', landUse: 'VACANT', description: 'DEMO: This listing was recently sold. It appears in the Seller historical records.' },
    transaction: { listedPrice: { amount: 85000, currency: 'USD' }, status: 'SOLD' },
    isPublic: true,
    listingStatus: 'sold',
    verification: { status: 'VERIFIED', isVerified: true, verificationDate: new Date() }
  },

  // ── STORY 5: AI-DETECTED FRAUD (Flagged) ────────────────────────────────
  {
    standNumber: 'STAND-005-FLAGGED',
    titleDeedNumber: 'TD/HRE/2020/999',
    owner: ownerIds.seller2,
    location: {
      address: { street: '3 Fake Avenue', suburb: 'HARARE', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0335, -17.8250] }
    },
    landDetails: { size: { squareMeters: 900, hectares: 0.09 }, zoning: 'RESIDENTIAL', landUse: 'VACANT', description: 'DEMO: AI flagged this as fraudulent due to suspicious document metadata.' },
    transaction: { listedPrice: { amount: 25000, currency: 'USD' }, status: 'FLAGGED' },
    verification: {
      status: 'SUSPICIOUS',
      isVerified: false,
      autoVerification: { ranAt: new Date(), riskScore: 85, decision: 'AUTO_REJECT', flags: ['TAMPERED_DOC'], signals: { documentTampered: true, elaScore: 92 } }
    },
    fraudFlags: [{ flagType: 'FAKE_DOCUMENTS', description: 'Auto-detected: Document metadata suggests digital modification.', status: 'PENDING' }]
  },
];

// ── Main Seeder ───────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    console.log('\n🌱 ── LandSolutions Database Seeder ──────────────────────────────');
    console.log(`📡 Connecting to: ${process.env.MONGODB_URI}`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing test data...');
    await User.deleteMany({});
    await Land.deleteMany({});
    console.log('   Users cleared ✓');
    console.log('   Lands cleared ✓\n');

    // Insert users
    console.log('👤 Creating users...');
    const createdUsers = await User.insertMany(USERS);
    const userMap = {};
    createdUsers.forEach(u => {
      const key = u.role === 'SYSTEM_ADMIN' ? 'admin'
        : u.role === 'VERIFICATION_OFFICER' ? 'officer'
        : u.role === 'MUNICIPAL_OFFICER' ? 'municipal'
        : u.email.includes('seller1') ? 'seller1'
        : u.email.includes('seller2') ? 'seller2'
        : u.email.includes('seller3') ? 'seller3'
        : u.email.includes('buyer1') ? 'buyer1'
        : 'buyer2';
      userMap[key] = u._id;
      console.log(`   ✓ ${u.role.padEnd(22)} ${u.email}`);
    });

    // Insert lands
    console.log('\n🏡 Creating land listings...');
    const lands = buildLands(userMap);
    const createdLands = await Land.insertMany(lands);
    createdLands.forEach(l => {
      console.log(`   ✓ ${l.verification.status.padEnd(12)} Stand ${l.standNumber} — $${l.transaction.listedPrice.amount.toLocaleString()} USD`);
    });

    // Print test credentials
    console.log('\n' + '═'.repeat(65));
    console.log('🔑 TEST CREDENTIALS (all use password: Test@1234)');
    console.log('═'.repeat(65));
    console.log('  SYSTEM ADMIN         admin@landsolutions.zw');
    console.log('  VERIFICATION OFFICER officer@landsolutions.zw');
    console.log('  MUNICIPAL OFFICER    municipal@landsolutions.zw');
    console.log('  SELLER (KYC OK)      seller1@test.zw');
    console.log('  SELLER (KYC OK)      seller2@test.zw');
    console.log('  SELLER (KYC PENDING) seller3@test.zw  ← cannot list land');
    console.log('  BUYER (KYC OK)       buyer1@test.zw');
    console.log('  BUYER (no KYC)       buyer2@test.zw');
    console.log('─'.repeat(65));
    console.log('  PASSWORD (all):      Test@1234');
    console.log('═'.repeat(65));

    console.log('\n📊 Seed Summary:');
    console.log(`   Users created:  ${createdUsers.length}`);
    console.log(`   Lands created:  ${createdLands.length}`);
    console.log(`   Verified:       ${createdLands.filter(l => l.verification.status === 'VERIFIED').length}`);
    console.log(`   Pending:        ${createdLands.filter(l => l.verification.status === 'PENDING').length}`);
    console.log(`   Flagged/Susp:   ${createdLands.filter(l => ['SUSPENDED', 'REJECTED'].includes(l.verification.status)).length}`);

    console.log('\n✅ Seed complete! Run tests with: node scripts/test-api.js\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.errors) {
      Object.entries(err.errors).forEach(([field, error]) => {
        console.error(`   ${field}: ${error.message}`);
      });
    }
    process.exit(1);
  }
};

seed();
