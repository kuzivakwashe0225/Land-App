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

const COMMON_PASS = 'Test@1234';
const hashed = hash(COMMON_PASS);

// ── Seed Users ────────────────────────────────────────────────────────────────
const USERS = [
  // ── System Admins ──────────────────────────────────────────────────────────
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
    phoneNumber: '+263770000001',
    nationalId: '00-0000001A00',
    role: 'SYSTEM_ADMIN',
    authentication: { password: hashed },
    verification: { kycStatus: 'APPROVED', isVerified: true },
    activity: { accountStatus: 'ACTIVE' },
  },

  // ── Verification Officer ───────────────────────────────────────────────────
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

  // ── Municipal Officer ──────────────────────────────────────────────────────
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

  // ── Sellers (KYC Approved — can list land) ────────────────────────────────
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
    // Intentionally NOT KYC approved — to show the KYC gate
    verification: { kycStatus: 'PENDING', isVerified: false },
    activity: { accountStatus: 'ACTIVE' },
  },

  // ── Buyers ────────────────────────────────────────────────────────────────
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

  // ── STORY 1: FULLY VERIFIED — Perfect authority registry match ────────────
  // Stand number + title deed both exist in dummy authority DB.
  // Seller KYC approved. All gates passed. isPublic = true.
  {
    standNumber: 'STAND-001-BORROWDALE',
    titleDeedNumber: 'TD/HRE/2019/001',
    owner: ownerIds.seller1,
    location: {
      address: { street: '14 Borrowdale Road', suburb: 'HARARE', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0929, -17.7442] }
    },
    landDetails: {
      size: { squareMeters: 1200, hectares: 0.12 },
      zoning: 'RESIDENTIAL',
      landUse: 'VACANT',
      description: 'DEMO: Fully verified. Title deed matched authority registry, KYC approved, officer reviewed documents.'
    },
    transaction: { listedPrice: { amount: 45000, currency: 'USD' }, status: 'AVAILABLE' },
    isPublic: true,
    listingStatus: 'verified',
    verification: {
      status: 'VERIFIED',
      isVerified: true,
      sellerVerified: true,
      authorityVerified: true,
      documentVerified: true,
      mapVerified: true,
      verifiedBy: ownerIds.officer,
      verificationDate: new Date(),
      authorityMatch: { titleDeedMatched: true, score: 90, decision: 'AUTO_APPROVE', flags: [] },
      autoVerification: { ranAt: new Date(), verificationScore: 90, riskScore: 10, decision: 'AUTO_APPROVE', flags: [] }
    }
  },

  // ── STORY 2: AUTO-REJECTED — Disputed stand in authority registry ─────────
  // Title deed found in registry but stand has DISPUTED status + encumbrances.
  // Score drops below threshold → AUTO_REJECT.
  {
    standNumber: 'STAND-010-REJECTED-OWNER',
    titleDeedNumber: 'TD/BYO/2023/505',
    owner: ownerIds.seller2,
    location: {
      address: { street: '55 Disputed Way', suburb: 'BULAWAYO', province: 'BULAWAYO' },
      coordinates: { type: 'Point', coordinates: [28.6000, -20.1600] }
    },
    landDetails: {
      size: { squareMeters: 1000, hectares: 0.1 },
      zoning: 'RESIDENTIAL',
      landUse: 'VACANT',
      description: 'DEMO: Auto-rejected. Authority registry shows an active dispute and encumbrances on this stand.'
    },
    transaction: { listedPrice: { amount: 15000, currency: 'USD' }, status: 'FLAGGED' },
    isPublic: false,
    listingStatus: 'rejected',
    verification: {
      status: 'REJECTED',
      isVerified: false,
      sellerVerified: true,
      authorityVerified: false,
      rejectionReason: 'Stand has active dispute in authority registry. Encumbrances: CAVEAT, COURT_ORDER.',
      authorityMatch: { titleDeedMatched: true, score: 20, decision: 'AUTO_REJECT', flags: ['DISPUTE_OR_ENCUMBRANCE_FOUND'] },
      autoVerification: { ranAt: new Date(), verificationScore: 20, riskScore: 80, decision: 'AUTO_REJECT', isDuplicateRejection: false, flags: ['DISPUTE_OR_ENCUMBRANCE_FOUND'] }
    }
  },

  // ── STORY 3: PENDING OFFICER REVIEW — Stand found, GPS slightly off ───────
  // Score: 75 (HUMAN_REVIEW range). Waiting for officer to approve or reject.
  {
    standNumber: 'STAND-004-CHITUNGWIZA',
    titleDeedNumber: 'TD/CTZ/2022/088',
    owner: ownerIds.seller2,
    location: {
      address: { street: '45 Seke Road', suburb: 'CHITUNGWIZA', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0700, -17.9900] }
    },
    landDetails: {
      size: { squareMeters: 600, hectares: 0.06 },
      zoning: 'RESIDENTIAL',
      landUse: 'VACANT',
      description: 'DEMO: Pending officer review. Stand is in the registry but GPS pin was 120m from the authority coordinate.'
    },
    transaction: { listedPrice: { amount: 12000, currency: 'USD' }, status: 'UNDER_REVIEW' },
    isPublic: false,
    listingStatus: 'pending_verification',
    verification: {
      status: 'PENDING_VERIFICATION',
      isVerified: false,
      sellerVerified: true,
      authorityVerified: false,
      authorityMatch: { titleDeedMatched: true, score: 75, decision: 'HUMAN_REVIEW', flags: ['LOCATION_APPROXIMATE'], coordinateDistanceMeters: 120 },
      autoVerification: { ranAt: new Date(), verificationScore: 75, riskScore: 25, decision: 'HUMAN_REVIEW', flags: ['LOCATION_APPROXIMATE'] }
    }
  },

  // ── STORY 4: SOLD — Historical record ────────────────────────────────────
  {
    standNumber: 'STAND-009-MT-PLEASANT',
    titleDeedNumber: 'TD/HRE/2022/101',
    owner: ownerIds.seller1,
    location: {
      address: { street: '12 Norfolk Road', suburb: 'HARARE', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0450, -17.7850] }
    },
    landDetails: {
      size: { squareMeters: 2000, hectares: 0.2 },
      zoning: 'RESIDENTIAL',
      landUse: 'VACANT',
      description: 'DEMO: This stand was sold. It appears in seller historical records.'
    },
    transaction: { listedPrice: { amount: 85000, currency: 'USD' }, status: 'SOLD' },
    isPublic: true,
    listingStatus: 'sold',
    verification: {
      status: 'VERIFIED',
      isVerified: true,
      sellerVerified: true,
      authorityVerified: true,
      documentVerified: true,
      verificationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      authorityMatch: { titleDeedMatched: true, score: 95, decision: 'AUTO_APPROVE', flags: [] }
    }
  },

  // ── STORY 5: SUSPICIOUS — AI-flagged, under investigation ────────────────
  {
    standNumber: 'STAND-005-FLAGGED',
    titleDeedNumber: 'TD/HRE/2020/999',
    owner: ownerIds.seller2,
    location: {
      address: { street: '3 Fake Avenue', suburb: 'HARARE', province: 'HARARE' },
      coordinates: { type: 'Point', coordinates: [31.0335, -17.8250] }
    },
    landDetails: {
      size: { squareMeters: 900, hectares: 0.09 },
      zoning: 'RESIDENTIAL',
      landUse: 'VACANT',
      description: 'DEMO: System flagged as suspicious. Stand is under investigation in authority registry.'
    },
    transaction: { listedPrice: { amount: 25000, currency: 'USD' }, status: 'FLAGGED' },
    isPublic: false,
    listingStatus: 'pending_verification',
    verification: {
      status: 'SUSPICIOUS',
      isVerified: false,
      sellerVerified: true,
      authorityVerified: false,
      authorityMatch: { titleDeedMatched: true, score: 0, decision: 'AUTO_REJECT', flags: ['DISPUTE_OR_ENCUMBRANCE_FOUND'] },
      autoVerification: { ranAt: new Date(), verificationScore: 0, riskScore: 100, decision: 'AUTO_REJECT', flags: ['DISPUTE_OR_ENCUMBRANCE_FOUND'] }
    },
    fraudFlags: [{
      flagType: 'FAKE_DOCUMENTS',
      description: 'Auto-detected: Stand under investigation in authority registry. Encumbrances present.',
      triggeredBySystem: true,
      status: 'PENDING'
    }]
  },
];

// ── Main Seeder ───────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    console.log('\n🌱 ── LandSolutions Database Seeder ──────────────────────────────');
    console.log(`📡 Connecting to: ${process.env.MONGODB_URI}`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing existing test data...');
    await User.deleteMany({});
    await Land.deleteMany({});
    console.log('   Users cleared ✓');
    console.log('   Lands cleared ✓\n');

    console.log('👤 Creating users...');
    const createdUsers = await User.insertMany(USERS);
    const userMap = {};
    createdUsers.forEach(u => {
      const key = u.role === 'VERIFICATION_OFFICER' ? 'officer'
        : u.role === 'MUNICIPAL_OFFICER' ? 'municipal'
        : u.email.includes('seller1') ? 'seller1'
        : u.email.includes('seller2') ? 'seller2'
        : u.email.includes('seller3') ? 'seller3'
        : u.email.includes('buyer1') ? 'buyer1'
        : u.email.includes('buyer2') ? 'buyer2'
        : 'admin';
      userMap[key] = u._id;
      console.log(`   ✓ ${u.role.padEnd(22)} ${u.email}`);
    });

    console.log('\n🏡 Creating land listings...');
    const lands = buildLands(userMap);
    const createdLands = await Land.insertMany(lands);
    createdLands.forEach(l => {
      const status = (l.verification.status || 'UNKNOWN').padEnd(20);
      const pub = l.isPublic ? '🌐 PUBLIC' : '🔒 HIDDEN';
      console.log(`   ✓ ${status} ${pub}  ${l.standNumber}`);
    });

    console.log('\n' + '═'.repeat(65));
    console.log('🔑 TEST CREDENTIALS — password: Test@1234');
    console.log('═'.repeat(65));
    console.log('  SYSTEM ADMIN         admin@landsolutions.zw');
    console.log('  PERSONAL ADMIN       isaia@landsolutions.zw');
    console.log('  VERIFICATION OFFICER officer@landsolutions.zw');
    console.log('  MUNICIPAL OFFICER    municipal@landsolutions.zw');
    console.log('  SELLER (KYC OK)      seller1@test.zw');
    console.log('  SELLER (KYC OK)      seller2@test.zw');
    console.log('  SELLER (KYC PENDING) seller3@test.zw  ← blocked from listing');
    console.log('  BUYER                buyer1@test.zw');
    console.log('═'.repeat(65));

    console.log('\n📊 Seed Summary:');
    console.log(`   Users:    ${createdUsers.length}`);
    console.log(`   Lands:    ${createdLands.length}`);
    console.log(`   Verified: ${createdLands.filter(l => l.verification.status === 'VERIFIED').length}`);
    console.log(`   Pending:  ${createdLands.filter(l => l.verification.status === 'PENDING_VERIFICATION').length}`);
    console.log(`   Rejected: ${createdLands.filter(l => ['REJECTED', 'SUSPICIOUS'].includes(l.verification.status)).length}`);
    console.log(`   Public (buyer-visible): ${createdLands.filter(l => l.isPublic).length}`);

    console.log('\n✅ Seed complete!');
    console.log('   Run: node scripts/seed-dummy-authority.js  to seed authority records');
    console.log('   Run: node scripts/test-verification.js  to run verification tests\n');
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
