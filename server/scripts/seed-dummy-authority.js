/**
 * seed-dummy-authority.js
 *
 * Seeds the Authority Records collection with a comprehensive set of
 * realistic Zimbabwe stand records. These simulate the Deeds Office /
 * Municipal authority database used for automated stand verification.
 *
 * Records are designed to cover all verification scenarios:
 *   - Perfect matches (auto-approved)
 *   - Zoning mismatches (sent to human review)
 *   - Disputed stands (auto-rejected)
 *   - Unallocated council land
 *   - Stands with encumbrances
 *   - Stands with rates not cleared
 *
 * Run: node scripts/seed-dummy-authority.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AuthorityRecord from '../models/authority-records-model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/landsolutions';

// ── Authority Records ─────────────────────────────────────────────────────────
const AUTHORITY_RECORDS = [
  // ── SCENARIO 1: Perfect match → AUTO_APPROVE ─────────────────────────────
  {
    standNumber: 'STAND-001-BORROWDALE',
    titleDeedNumber: 'TD/HRE/2019/001',
    councilReferenceNumber: 'HCC-BOR-001',
    registeredOwner: { fullName: 'Harare City Council', entityType: 'COUNCIL' },
    address: { street: '14 Borrowdale Road', suburb: 'HARARE', city: 'Harare', province: 'Harare' },
    geoLocation: { type: 'Point', coordinates: [31.0929, -17.7442] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 1200, hectares: 0.12 },
    status: 'VALID',
    allocationStatus: 'ALLOCATED',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: true
  },

  // ── SCENARIO 2: Stand-only match (no title deed) → HUMAN_REVIEW ──────────
  {
    standNumber: 'STAND-004-CHITUNGWIZA',
    titleDeedNumber: 'TD/CTZ/2022/088',
    councilReferenceNumber: 'CTZ-UNH-004',
    registeredOwner: { fullName: 'Chitungwiza Municipality', entityType: 'COUNCIL' },
    address: { street: '45 Seke Road', suburb: 'CHITUNGWIZA', city: 'Chitungwiza', province: 'Harare' },
    geoLocation: { type: 'Point', coordinates: [31.0700, -17.9900] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 600, hectares: 0.06 },
    status: 'VALID',
    allocationStatus: 'ALLOCATED',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: true
  },

  // ── SCENARIO 3: Disputed stand → AUTO_REJECT ─────────────────────────────
  {
    standNumber: 'STAND-010-REJECTED-OWNER',
    titleDeedNumber: 'TD/BYO/2023/505',
    councilReferenceNumber: 'BCC-BYO-010',
    registeredOwner: { fullName: 'Bulawayo City Council', entityType: 'COUNCIL' },
    address: { street: '55 Disputed Way', suburb: 'BULAWAYO', city: 'Bulawayo', province: 'Bulawayo' },
    geoLocation: { type: 'Point', coordinates: [28.6000, -20.1600] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 1000, hectares: 0.1 },
    status: 'DISPUTED',
    allocationStatus: 'ALLOCATED',
    disputeStatus: 'DISPUTED',
    ratesCleared: false,
    encumbrances: ['CAVEAT', 'COURT_ORDER'],
    isEligibleForResale: false
  },

  // ── SCENARIO 4: Sold listing (historical) ────────────────────────────────
  {
    standNumber: 'STAND-009-MT-PLEASANT',
    titleDeedNumber: 'TD/HRE/2022/101',
    councilReferenceNumber: 'HCC-MTP-009',
    registeredOwner: { fullName: 'Stanbic Housing Development', entityType: 'DEVELOPER' },
    address: { street: '12 Norfolk Road', suburb: 'HARARE', city: 'Harare', province: 'Harare' },
    geoLocation: { type: 'Point', coordinates: [31.0450, -17.7850] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 2000, hectares: 0.2 },
    status: 'VALID',
    allocationStatus: 'ALLOCATED',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: true
  },

  // ── SCENARIO 5: Flagged listing (fake documents) ──────────────────────────
  {
    standNumber: 'STAND-005-FLAGGED',
    titleDeedNumber: 'TD/HRE/2020/999',
    councilReferenceNumber: 'HCC-FLG-005',
    registeredOwner: { fullName: 'Unknown', entityType: 'UNKNOWN' },
    address: { street: '3 Fake Avenue', suburb: 'HARARE', city: 'Harare', province: 'Harare' },
    geoLocation: { type: 'Point', coordinates: [31.0335, -17.8250] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 900, hectares: 0.09 },
    status: 'UNDER_INVESTIGATION',
    allocationStatus: 'ALLOCATED',
    disputeStatus: 'UNDER_INVESTIGATION',
    ratesCleared: false,
    encumbrances: ['MORTGAGE'],
    isEligibleForResale: false
  },

  // ── SCENARIO 6: Agricultural stand — zoning mismatch if listed as RESIDENTIAL
  {
    standNumber: 'STAND-006-MUTARE-FARM',
    titleDeedNumber: 'TD/MTR/2018/034',
    councilReferenceNumber: 'MTR-AGR-006',
    registeredOwner: { fullName: 'Agridev Zimbabwe Ltd', entityType: 'COMPANY' },
    address: { street: 'Mutare-Birchenough Road, Farm 34', suburb: 'MUTARE', city: 'Mutare', province: 'Manicaland' },
    geoLocation: { type: 'Point', coordinates: [32.6290, -18.9710] },
    landUseType: 'AGRICULTURAL',
    zoning: 'AGRICULTURAL',
    standSize: { squareMeters: 50000, hectares: 5.0 },
    status: 'VALID',
    allocationStatus: 'ALLOCATED',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: true
  },

  // ── SCENARIO 7: Commercial stand ─────────────────────────────────────────
  {
    standNumber: 'STAND-007-GWERU-INDUSTRIAL',
    titleDeedNumber: 'TD/GWR/2023/007',
    councilReferenceNumber: 'GCC-IND-007',
    registeredOwner: { fullName: 'Gweru City Council', entityType: 'COUNCIL' },
    address: { street: 'Industrial Sites Road, Plot 7', suburb: 'GWERU', city: 'Gweru', province: 'Midlands' },
    geoLocation: { type: 'Point', coordinates: [29.8134, -19.4486] },
    landUseType: 'INDUSTRIAL',
    zoning: 'INDUSTRIAL',
    standSize: { squareMeters: 8000, hectares: 0.8 },
    status: 'VALID',
    allocationStatus: 'ALLOCATED',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: true
  },

  // ── SCENARIO 8: Rejected listing — no registry match ─────────────────────
  {
    standNumber: 'STAND-008-REJECTED',
    titleDeedNumber: 'TD/HRE/2021/404',
    councilReferenceNumber: 'HCC-REJ-008',
    registeredOwner: { fullName: 'Harare City Council', entityType: 'COUNCIL' },
    address: { street: '99 Mismatch Road', suburb: 'HARARE', city: 'Harare', province: 'Harare' },
    geoLocation: { type: 'Point', coordinates: [31.0200, -17.8500] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 400, hectares: 0.04 },
    status: 'VALID',
    allocationStatus: 'VACANT',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: true
  },

  // ── SCENARIO 9: Unallocated council stand ─────────────────────────────────
  {
    standNumber: 'HRE-UNALLOC-006',
    titleDeedNumber: null,
    councilReferenceNumber: 'HCC-UNALLOC-006',
    registeredOwner: { fullName: 'Harare City Council', entityType: 'COUNCIL' },
    address: { street: 'Unallocated Stand, Mabelreign', suburb: 'HARARE', city: 'Harare', province: 'Harare' },
    geoLocation: { type: 'Point', coordinates: [31.0200, -17.8000] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 1000, hectares: 0.1 },
    status: 'UNALLOCATED',
    allocationStatus: 'VACANT',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: false,
    remarks: 'Stand is unallocated. Must go through council allocation process.'
  },

  // ── SCENARIO 10: New development stand (no previous owner) ───────────────
  {
    standNumber: 'STAND-NEW-BORROWDALE-2',
    titleDeedNumber: 'TD/HRE/2026/NEW01',
    councilReferenceNumber: 'HCC-NEW-2026-01',
    registeredOwner: { fullName: 'New Suburbs Development Corp', entityType: 'DEVELOPER' },
    address: { street: '16 Borrowdale Road', suburb: 'HARARE', city: 'Harare', province: 'Harare' },
    geoLocation: { type: 'Point', coordinates: [31.0935, -17.7445] },
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    standSize: { squareMeters: 800, hectares: 0.08 },
    status: 'VALID',
    allocationStatus: 'VACANT',
    disputeStatus: 'NONE',
    ratesCleared: true,
    encumbrances: [],
    isEligibleForResale: true,
    remarks: 'Brand new stand from a new development. No previous private owner.'
  }
];

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear all existing authority records for a clean seed
    await AuthorityRecord.deleteMany({});
    console.log('✓ Cleared existing authority records');

    let inserted = 0;
    for (const data of AUTHORITY_RECORDS) {
      try {
        await AuthorityRecord.create(data);
        console.log(`  ✓ ${data.standNumber} — ${data.landUseType} — ${data.status} [${data.registeredOwner.entityType}]`);
        inserted++;
      } catch (err) {
        console.error(`  ✗ Failed to insert ${data.standNumber}: ${err.message}`);
      }
    }

    console.log(`\n✅ Seeded ${inserted}/${AUTHORITY_RECORDS.length} authority records`);
    console.log('\n── Scenario Coverage ─────────────────────────────────────────');
    console.log('  AUTO_APPROVE scenarios:   1 (perfect title deed + clean stand)');
    console.log('  HUMAN_REVIEW scenarios:   1 (stand found, no GPS proof, title deed match)');
    console.log('  AUTO_REJECT scenarios:    2 (disputed, under investigation)');
    console.log('  UNALLOCATED scenarios:    1 (council land not yet allocated)');
    console.log('  NEW DEVELOPMENT scenario: 1 (no previous private owner)');

    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
