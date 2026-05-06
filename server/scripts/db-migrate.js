/**
 * db-migrate.js
 * One-time migration script to fix the duplicate 2dsphere index issue
 * on the AuthorityRecords collection.
 *
 * The old model had index on 'location' (2dsphere).
 * The new model uses 'geoLocation' (2dsphere).
 * MongoDB throws "more than one 2dsphere index" error if both exist.
 *
 * Run ONCE: node scripts/db-migrate.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/landsolutions';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('authorityrecords');

    // List existing indexes
    const existingIndexes = await collection.indexes();
    console.log('\nExisting indexes on authorityrecords:');
    existingIndexes.forEach(idx => {
      console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop the old 'location' 2dsphere index if it exists
    const oldLocationIndex = existingIndexes.find(idx => idx.key && idx.key['location'] === '2dsphere');
    if (oldLocationIndex) {
      await collection.dropIndex(oldLocationIndex.name);
      console.log(`\n✓ Dropped old index: ${oldLocationIndex.name} (location 2dsphere)`);
    } else {
      console.log('\n✓ No old "location" 2dsphere index found — nothing to drop.');
    }

    // Drop the old 'standNumber_1_nationalId_1' index that referenced nationalId at top level
    const oldNationalIdIndex = existingIndexes.find(idx => idx.key && idx.key['currentOwner.nationalId']);
    if (oldNationalIdIndex) {
      await collection.dropIndex(oldNationalIdIndex.name);
      console.log(`✓ Dropped old index: ${oldNationalIdIndex.name}`);
    }

    // Now drop and rebuild the entire collection indexes cleanly
    // First check if geoLocation index already exists
    const geoLocationIndex = existingIndexes.find(idx => idx.key && idx.key['geoLocation'] === '2dsphere');
    if (!geoLocationIndex) {
      await collection.createIndex({ geoLocation: '2dsphere' }, { name: 'geoLocation_2dsphere' });
      console.log('✓ Created new geoLocation 2dsphere index');
    } else {
      console.log('✓ geoLocation 2dsphere index already exists — no action needed');
    }

    // List updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('\nUpdated indexes on authorityrecords:');
    updatedIndexes.forEach(idx => {
      console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Migration complete. The 2dsphere conflict is resolved.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
