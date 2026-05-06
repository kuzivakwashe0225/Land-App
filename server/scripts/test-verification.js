/**
 * test-verification.js
 *
 * Test-Driven Verification Tests
 * Tests the authorityVerificationService against the dummy authority DB.
 *
 * Run AFTER seeding:
 *   node scripts/seed-dummy-authority.js
 *   node scripts/seed.js
 *   node scripts/test-verification.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyListingAgainstAuthority } from '../services/authorityVerificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/landsolutions';

// ── Test runner ───────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS  ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL  ${testName}${details ? `\n         → ${details}` : ''}`);
    failed++;
  }
}

// ── Test Scenarios ─────────────────────────────────────────────────────────────

async function test_blockedIfKycNotApproved() {
  console.log('\n── TEST 1: Seller without KYC approval must be blocked ──────────────');
  const fakeLand = {
    _id: new mongoose.Types.ObjectId(),
    standNumber: 'STAND-001-BORROWDALE',
    titleDeedNumber: 'TD/HRE/2019/001',
    landDetails: { zoning: 'RESIDENTIAL' },
    location: { coordinates: { coordinates: [31.0929, -17.7442] } }
  };

  const result = await verifyListingAgainstAuthority(fakeLand, false); // KYC NOT approved
  assert(result.decision === 'AUTO_REJECT', 'Decision should be AUTO_REJECT', `Got: ${result.decision}`);
  assert(result.flags.includes('SELLER_KYC_NOT_APPROVED'), 'Flag SELLER_KYC_NOT_APPROVED present', `Flags: ${result.flags}`);
  assert(result.score === 0, 'Score should be 0', `Got: ${result.score}`);
}

async function test_perfectMatchAutoApproves() {
  console.log('\n── TEST 2: Perfect title deed match → AUTO_APPROVE ─────────────────');
  const land = {
    _id: new mongoose.Types.ObjectId(), // New ID — not a duplicate
    standNumber: 'STAND-001-BORROWDALE',
    titleDeedNumber: 'TD/HRE/2019/001',
    landDetails: { zoning: 'RESIDENTIAL' },
    location: { coordinates: { coordinates: [31.0929, -17.7442] } } // ~0m from authority record
  };

  const result = await verifyListingAgainstAuthority(land, true);
  console.log(`   Score: ${result.score}/100 | Decision: ${result.decision} | Flags: ${result.flags.join(', ') || 'none'}`);

  assert(result.score >= 85, `Score >= 85 (actual: ${result.score})`, `Score: ${result.score}`);
  assert(result.decision === 'AUTO_APPROVE', 'Decision: AUTO_APPROVE', `Got: ${result.decision}`);
  assert(result.verificationStatus === 'AUTHORITY_VERIFIED', 'Status: AUTHORITY_VERIFIED', `Got: ${result.verificationStatus}`);
}

async function test_disputedStandAutoRejects() {
  console.log('\n── TEST 3: Disputed stand in registry → AUTO_REJECT ────────────────');
  const land = {
    _id: new mongoose.Types.ObjectId(),
    standNumber: 'STAND-010-REJECTED-OWNER',
    titleDeedNumber: 'TD/BYO/2023/505',
    landDetails: { zoning: 'RESIDENTIAL' },
    location: { coordinates: { coordinates: [28.6000, -20.1600] } }
  };

  const result = await verifyListingAgainstAuthority(land, true);
  console.log(`   Score: ${result.score}/100 | Decision: ${result.decision} | Flags: ${result.flags.join(', ')}`);

  assert(result.decision === 'AUTO_REJECT', 'Decision: AUTO_REJECT', `Got: ${result.decision}`);
  assert(result.flags.includes('DISPUTE_OR_ENCUMBRANCE_FOUND'), 'DISPUTE flag present');
  assert(result.score < 65, `Score < 65 (actual: ${result.score})`);
}

async function test_missingTitleDeedGoesToHumanReview() {
  console.log('\n── TEST 4: Stand found but title deed not matched → HUMAN_REVIEW ───');
  const land = {
    _id: new mongoose.Types.ObjectId(),
    standNumber: 'STAND-004-CHITUNGWIZA',
    titleDeedNumber: 'TD/CTZ/WRONG/000',   // Wrong title deed → partial credit only
    landDetails: { zoning: 'RESIDENTIAL' },
    location: { coordinates: { coordinates: [31.0700, -17.9900] } }
  };

  const result = await verifyListingAgainstAuthority(land, true);
  console.log(`   Score: ${result.score}/100 | Decision: ${result.decision} | Flags: ${result.flags.join(', ')}`);

  assert(result.decision === 'HUMAN_REVIEW', 'Decision: HUMAN_REVIEW', `Got: ${result.decision}`);
  assert(result.flags.includes('TITLE_DEED_NOT_MATCHED'), 'TITLE_DEED_NOT_MATCHED flag present');
}

async function test_noAuthorityRecordFoundSendToReview() {
  console.log('\n── TEST 5: No authority record → HUMAN_REVIEW (not blocking) ───────');
  const land = {
    _id: new mongoose.Types.ObjectId(),
    standNumber: 'STAND-NONEXISTENT-XYZ',
    titleDeedNumber: 'TD/ZZZ/9999/000',
    landDetails: { zoning: 'RESIDENTIAL' },
    location: {} // No coordinates
  };

  const result = await verifyListingAgainstAuthority(land, true);
  console.log(`   Score: ${result.score}/100 | Decision: ${result.decision} | Flags: ${result.flags.join(', ')}`);

  // Policy: New stands not yet in registry → human review (not auto-reject)
  // so new developments can still be processed
  assert(result.decision === 'HUMAN_REVIEW', 'Decision: HUMAN_REVIEW (not AUTO_REJECT)', `Got: ${result.decision}`);
  assert(result.flags.includes('TITLE_DEED_NOT_FOUND_IN_REGISTRY'), 'TITLE_DEED_NOT_FOUND flag present');
}

async function test_zoningMismatchReducesScore() {
  console.log('\n── TEST 6: Agricultural stand listed as RESIDENTIAL → score drops ──');
  const land = {
    _id: new mongoose.Types.ObjectId(),
    standNumber: 'STAND-006-MUTARE-FARM',
    titleDeedNumber: 'TD/MTR/2018/034',
    landDetails: { zoning: 'RESIDENTIAL' },  // Listing says RESIDENTIAL
    location: { coordinates: { coordinates: [32.6290, -18.9710] } }
  };

  const result = await verifyListingAgainstAuthority(land, true);
  console.log(`   Score: ${result.score}/100 | Decision: ${result.decision} | Flags: ${result.flags.join(', ')}`);

  assert(result.flags.includes('ZONING_MISMATCH'), 'ZONING_MISMATCH flag present');
  assert(result.score < 85, `Score reduced below 85 (actual: ${result.score})`);
}

async function test_isPublicNeverSetByVerificationService() {
  console.log('\n── TEST 7: Verification service NEVER sets isPublic=true ────────────');
  const land = {
    _id: new mongoose.Types.ObjectId(),
    standNumber: 'STAND-NEW-BORROWDALE-2',
    titleDeedNumber: 'TD/HRE/2026/NEW01',
    landDetails: { zoning: 'RESIDENTIAL' },
    location: { coordinates: { coordinates: [31.0935, -17.7445] } }
  };

  const result = await verifyListingAgainstAuthority(land, true);
  // The verification service never returns isPublic — that is set by the officer approval
  assert(!('isPublic' in result), 'verifyListingAgainstAuthority does NOT return isPublic', `Keys: ${Object.keys(result)}`);
}

// ── Run all tests ─────────────────────────────────────────────────────────────
async function runTests() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  LandSolutions — Verification Engine Test Suite');
    console.log('  Business Rule: Seller KYC = identity. Stand check = validity.');
    console.log('════════════════════════════════════════════════════════════');

    await test_blockedIfKycNotApproved();
    await test_perfectMatchAutoApproves();
    await test_disputedStandAutoRejects();
    await test_missingTitleDeedGoesToHumanReview();
    await test_noAuthorityRecordFoundSendToReview();
    await test_zoningMismatchReducesScore();
    await test_isPublicNeverSetByVerificationService();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
    if (failed === 0) {
      console.log('  🎉 All tests passed!');
    } else {
      console.log(`  ⚠️  ${failed} test(s) failed — review output above`);
    }
    console.log('════════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test runner error:', err.message);
    process.exit(1);
  }
}

runTests();
