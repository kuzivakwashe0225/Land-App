/**
 * db-seed-demo-stands.js
 * 
 * Seeds the AuthorityRecords collection with 3 perfect-match stands.
 * Use these stands in your demos to showcase 100% verification matching.
 * 
 * Run: node scripts/db-seed-demo-stands.js
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

const DEMO_STANDS = [
  {
    standNumber: '1000',
    titleDeedNumber: 'TD-2023-1000',
    source: 'DEEDS_OFFICE',
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    address: {
      street: '1000 Borrowdale Road',
      suburb: 'HARARE',
      city: 'HARARE',
      province: 'HARARE'
    },
    geoLocation: {
      type: 'Point',
      coordinates: [31.0827, -17.7588] // Longitude, Latitude
    },
    registeredOwner: {
      fullName: 'JOHN DOE',
      entityType: 'INDIVIDUAL'
    },
    status: 'VALID',
    registeredDate: new Date('2023-01-15')
  },
  {
    standNumber: '2500',
    titleDeedNumber: 'TD-2023-2500',
    source: 'MUNICIPALITY',
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    address: {
      street: '2500 Upper East Road',
      suburb: 'HARARE',
      city: 'HARARE',
      province: 'HARARE'
    },
    geoLocation: {
      type: 'Point',
      coordinates: [31.0500, -17.7800]
    },
    registeredOwner: {
      fullName: 'JANE SMITH',
      entityType: 'INDIVIDUAL'
    },
    status: 'VALID',
    registeredDate: new Date('2022-11-20')
  },
  {
    standNumber: '500',
    titleDeedNumber: 'TD-2023-0500',
    source: 'DEEDS_OFFICE',
    landUseType: 'RESIDENTIAL',
    zoning: 'RESIDENTIAL',
    address: {
      street: '500 Killarney Drive',
      suburb: 'BULAWAYO',
      city: 'BULAWAYO',
      province: 'BULAWAYO'
    },
    geoLocation: {
      type: 'Point',
      coordinates: [28.6167, -20.1500]
    },
    registeredOwner: {
      fullName: 'MICHAEL JOHNSON',
      entityType: 'INDIVIDUAL'
    },
    status: 'VALID',
    registeredDate: new Date('2021-08-05')
  }
];

async function seedDemoStands() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Remove existing demo stands to avoid duplicates if run multiple times
    await AuthorityRecord.deleteMany({ standNumber: { $in: ['1000', '2500', '500'] } });
    console.log('✓ Cleared previous demo stands');

    await AuthorityRecord.insertMany(DEMO_STANDS);
    console.log(`✓ Successfully inserted ${DEMO_STANDS.length} perfect-match demo stands into the Authority database.`);
    
    console.log('\n========================================================');
    console.log('🎉 YOU CAN NOW DEMO THE SYSTEM WITH THESE EXACT DETAILS:');
    console.log('========================================================');
    console.log('\n--- DEMO STAND 1 ---');
    console.log('Stand Number: 1000');
    console.log('Title Deed: TD-2023-1000');
    console.log('Suburb: BORROWDALE');
    console.log('City: HARARE');
    console.log('Coordinates: Latitude -17.7588, Longitude 31.0827');
    
    console.log('\n--- DEMO STAND 2 ---');
    console.log('Stand Number: 2500');
    console.log('Title Deed: TD-2023-2500');
    console.log('Suburb: MOUNT PLEASANT');
    console.log('City: HARARE');
    console.log('Coordinates: Latitude -17.7800, Longitude 31.0500');
    
    console.log('\n--- DEMO STAND 3 ---');
    console.log('Stand Number: 500');
    console.log('Title Deed: TD-2023-0500');
    console.log('Suburb: KILLARNEY');
    console.log('City: BULAWAYO');
    console.log('Coordinates: Latitude -20.1500, Longitude 28.6167');
    console.log('========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo stands:', err.message);
    process.exit(1);
  }
}

seedDemoStands();
