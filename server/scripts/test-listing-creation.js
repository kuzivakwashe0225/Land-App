/**
 * Test Land Listing Creation
 * Simulates creating a land listing with complete error logging
 * Run: node scripts/test-listing-creation.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/user-model.js';
import Land from '../models/landModel.js';

async function testListingCreation() {
  try {
    console.log('🔍 Testing Land Listing Creation\n');

    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get seller user
    console.log('2️⃣ Finding seller user...');
    const seller = await User.findOne({ role: 'SELLER' });
    if (!seller) throw new Error('No seller user found');
    console.log('✅ Found seller:', seller.email);
    console.log('   - ID:', seller._id);
    console.log('   - Seller details approved:', seller.verification?.sellerDetailsApproved);
    console.log();

    // Prepare listing data exactly like the frontend would send it
    console.log('3️⃣ Preparing listing data...');
    const listingData = {
      standNumber: 'TEST-LISTING-' + Date.now(),
      titleDeedNumber: 'TD-TEST-' + Date.now(),
      location: {
        address: {
          street: '123 Test Street',
          suburb: 'HARARE',
          province: 'HARARE'
        },
        coordinates: {
          latitude: -17.8252,
          longitude: 31.0335
        }
      },
      landDetails: {
        size: {
          squareMeters: 1000,
          hectares: 0.1
        },
        zoning: 'RESIDENTIAL',
        landUse: 'VACANT',
        boundaryType: 'WALLED',
        description: 'Test listing for validation'
      },
      transaction: {
        listedPrice: {
          amount: 100000,
          currency: 'USD'
        },
        status: 'AVAILABLE'
      }
    };
    console.log('✅ Listing data prepared');
    console.log('   - Stand Number:', listingData.standNumber);
    console.log('   - Title Deed:', listingData.titleDeedNumber);
    console.log('   - Coordinates:', listingData.location.coordinates);
    console.log();

    // Validate all required fields
    console.log('4️⃣ Validating required fields...');
    const requiredFields = {
      standNumber: listingData.standNumber,
      titleDeedNumber: listingData.titleDeedNumber,
      location: listingData.location,
      landDetails: listingData.landDetails,
      transaction: listingData.transaction
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) throw new Error(`Missing required field: ${field}`);
      console.log(`   ✓ ${field}: present`);
    }
    console.log('✅ All required fields present\n');

    // Create the Land document
    console.log('5️⃣ Creating Land document...');
    const land = new Land({
      standNumber: listingData.standNumber.toUpperCase(),
      titleDeedNumber: listingData.titleDeedNumber,
      owner: seller._id,
      location: {
        address: listingData.location.address || {},
        coordinates: {
          latitude: listingData.location.coordinates.latitude,
          longitude: listingData.location.coordinates.longitude
        }
      },
      landDetails: listingData.landDetails || {},
      transaction: listingData.transaction || { status: 'AVAILABLE' },
      verification: {
        status: seller.verification?.sellerDetailsApproved ? 'VERIFIED' : 'PENDING_VERIFICATION',
        isVerified: seller.verification?.sellerDetailsApproved === true
      },
      fraudFlags: []
    });
    console.log('✅ Land document created (not saved yet)');
    console.log('   - Verification status:', land.verification.status);
    console.log();

    // Validate the document
    console.log('6️⃣ Validating Land document schema...');
    try {
      await land.validate();
      console.log('✅ Document schema validation passed\n');
    } catch (validationErr) {
      console.error('❌ Validation error:', validationErr.message);
      console.error('Details:', validationErr.errors);
      throw validationErr;
    }

    // Save the document
    console.log('7️⃣ Saving Land document to database...');
    await land.save();
    console.log('✅ Document saved successfully');
    console.log('   - ID:', land._id);
    console.log('   - Stand Number:', land.standNumber);
    console.log('   - Status:', land.verification.status);
    console.log();

    // Verify it was saved
    console.log('8️⃣ Verifying saved document...');
    const savedLand = await Land.findById(land._id);
    if (!savedLand) throw new Error('Document was not saved');
    console.log('✅ Document verified in database');
    console.log('   - Found:', savedLand.standNumber);
    console.log();

    // Count total listings
    console.log('9️⃣ Checking total listings...');
    const totalCount = await Land.countDocuments();
    const verifiedCount = await Land.countDocuments({ 'verification.status': 'VERIFIED' });
    const pendingCount = await Land.countDocuments({ 'verification.status': 'PENDING_VERIFICATION' });
    console.log('✅ Listing counts:');
    console.log('   - Total:', totalCount);
    console.log('   - Verified:', verifiedCount);
    console.log('   - Pending Verification:', pendingCount);
    console.log();

    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════');
    console.log('The listing creation system is working correctly!');
    console.log('If you still see errors in the browser, it may be a:');
    console.log('  1. Proxy/CORS issue');
    console.log('  2. Cookie/authentication issue');
    console.log('  3. Frontend data validation issue');
    console.log();

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('═══════════════════════');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Details:', error.toString());

    if (error.errors) {
      console.error('\nValidation Errors:');
      for (const [field, err] of Object.entries(error.errors)) {
        console.error(`  - ${field}: ${err.message}`);
      }
    }

    if (error.stack) {
      console.error('\nStack Trace:');
      console.error(error.stack);
    }

    process.exit(1);
  } finally {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
      console.log('\n✅ Disconnected from MongoDB');
    }
  }
}

testListingCreation();
