import mongoose from 'mongoose';
import Stands from '../models/stands-model.js';
import AuthorityRecords from '../models/authority-records-model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/landsolutions';

const testingStands = [
  // ── PERFECT MATCH (For Auto-Verification Demo) ──────────────────────────
  {
    standNumber: 'STAND-001-BORROWDALE',
    suburb: 'HARARE',
    ownerFullName: 'John Mutasa',
    nationalId: '94-4567890D94', // Matches seller1 in seed.js
    coordinates: { latitude: -17.7442, longitude: 31.0929 },
    size: { squareMeters: 1200, hectares: 0.12 },
    zoning: 'RESIDENTIAL',
    status: 'VALID',
    landUseType: 'RESIDENTIAL'
  },
  // ── NAME MISMATCH (For Manual Review Demo) ──────────────────────────────
  {
    standNumber: 'STAND-004-CHITUNGWIZA',
    suburb: 'CHITUNGWIZA',
    ownerFullName: 'Previous Owner Name', // Different from Mary Chikwanda
    nationalId: '00-0000000X00',
    coordinates: { latitude: -17.9900, longitude: 31.0700 },
    size: { squareMeters: 600, hectares: 0.06 },
    zoning: 'RESIDENTIAL',
    status: 'VALID',
    landUseType: 'RESIDENTIAL'
  },
  // ── DISPUTED RECORD (For Rejection Demo) ────────────────────────────────
  {
    standNumber: 'STAND-010-REJECTED-OWNER',
    suburb: 'BULAWAYO',
    ownerFullName: 'Multiple Claimants',
    nationalId: 'DISPUTE-999',
    coordinates: { latitude: -20.1600, longitude: 28.6000 },
    size: { squareMeters: 1000, hectares: 0.1 },
    zoning: 'RESIDENTIAL',
    status: 'DISPUTED',
    landUseType: 'RESIDENTIAL'
  },
  // ── COUNCIL LAND (For Unallocated Demo) ─────────────────────────────────
  {
    standNumber: 'HRE-UNALLOC-006',
    suburb: 'HARARE',
    ownerFullName: 'Harare City Council',
    nationalId: '00-0000001C00',
    coordinates: { latitude: -17.8000, longitude: 31.0200 },
    size: { squareMeters: 1000, hectares: 0.1 },
    zoning: 'RESIDENTIAL',
    status: 'UNALLOCATED',
    landUseType: 'RESIDENTIAL'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing testing data
    await Stands.deleteMany({ standNumber: { $regex: /^(STAND-|HRE-)/ } });
    await AuthorityRecords.deleteMany({ standNumber: { $regex: /^(STAND-|HRE-)/ } });
    console.log('✓ Cleared old testing data');

    for (const data of testingStands) {
      // Seed AuthorityRecords (used for ownership/ID checks)
      await AuthorityRecords.create({
        standNumber: data.standNumber,
        currentOwner: {
          name: data.ownerFullName,
          nationalId: data.nationalId,
        },
        address: {
          street: `${data.standNumber} Street`,
          suburb: data.suburb,
          city: 'Harare',
          province: 'Harare'
        },
        standSize: data.size,
        landUseType: data.landUseType,
        location: {
          type: 'Point',
          coordinates: [data.coordinates.longitude, data.coordinates.latitude]
        },
        status: data.status,
        titleDeedNumber: `TD-${data.standNumber}`,
        councilReferenceNumber: `REF-${data.standNumber}`
      });

      // Seed Stands (used for zoning/compliance/geospatial checks)
      await Stands.create({
        standNumber: data.standNumber,
        suburb: data.suburb,
        coordinates: data.coordinates,
        size: data.size,
        zoning: data.zoning,
        intendedUse: data.landUseType,
        status: data.status === 'VALID' ? 'VACANT' : 'DISPUTED',
        authority: {
          authorityName: 'Harare City Council',
          allocationType: 'LOCAL_AUTHORITY'
        },
        compliance: {
          plotRatioApproved: true,
          buildingHeightLimitMeters: 12,
          hasEIA: true,
          restrictions: data.zoning === 'RESIDENTIAL' ? ['Residential only'] : []
        },
        verificationStatus: {
          isVerified: true,
          verificationDate: new Date()
        }
      });
    }

    console.log(`✓ Seeded ${testingStands.length} testing records into both AuthorityRecords and Stands collections`);
    
    // Print a summary for the user
    console.log('\n--- TESTING DATA SUMMARY ---');
    testingStands.forEach(s => {
      console.log(`Stand: ${s.standNumber} | Suburb: ${s.suburb} | Zoning: ${s.zoning} | Status: ${s.status}`);
      console.log(`  Owner: ${s.ownerFullName} | ID: ${s.nationalId}`);
      console.log(`  Coords: ${s.coordinates.latitude}, ${s.coordinates.longitude}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
