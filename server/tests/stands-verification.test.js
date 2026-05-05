import mongoose from 'mongoose';
import Stands from '../models/stands-model.js';
import {
  verifyCoordinatesAgainstStands,
  verifyZoningCompatibility,
  getStandByCoordinates,
  getVacantStands,
  verifyStandNumber,
  getStandStatistics
} from '../services/standsVerificationService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/landsolutions-test';

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, fn) {
    try {
      await fn();
      this.passed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
    }
  }

  report() {
    const total = this.passed + this.failed;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST REPORT: ${this.passed}/${total} passed, ${this.failed}/${total} failed`);
    console.log(`${'='.repeat(60)}\n`);
    return this.failed === 0;
  }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function runTests() {
  const runner = new TestRunner();

  try {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to test database\n');

    // Clean up before tests
    await Stands.deleteMany({});

    // Create test data
    const testStands = [
      {
        standNumber: 'TEST-HAR-001',
        suburb: 'HARARE',
        coordinates: { latitude: -17.8233, longitude: 31.0340 },
        size: { squareMeters: 1000, hectares: 0.1 },
        zoning: 'RESIDENTIAL',
        intendedUse: 'RESIDENTIAL',
        status: 'VACANT',
        authority: { authorityName: 'Harare City Council' },
        compliance: { plotRatioApproved: true }
      },
      {
        standNumber: 'TEST-HAR-002',
        suburb: 'HARARE',
        coordinates: { latitude: -17.8412, longitude: 31.0445 },
        size: { squareMeters: 1500, hectares: 0.15 },
        zoning: 'COMMERCIAL',
        intendedUse: 'COMMERCIAL',
        status: 'ALLOCATED',
        allocation: { allocatedTo: 'John Doe' },
        authority: { authorityName: 'Harare City Council' }
      },
      {
        standNumber: 'TEST-CHI-001',
        suburb: 'CHITUNGWIZA',
        coordinates: { latitude: -17.9933, longitude: 31.0733 },
        size: { squareMeters: 800, hectares: 0.08 },
        zoning: 'RESIDENTIAL',
        intendedUse: 'RESIDENTIAL',
        status: 'VACANT',
        authority: { authorityName: 'Chitungwiza Local Authority' }
      }
    ];

    await Stands.insertMany(testStands);
    console.log(`Inserted ${testStands.length} test stands\n`);

    // COORDINATE VERIFICATION TESTS
    console.log('📍 COORDINATE VERIFICATION TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should verify valid coordinates within tolerance',
      async () => {
        const result = await verifyCoordinatesAgainstStands(-17.8233, 31.0340, 'HARARE');
        assert(result.valid === true, 'Coordinates should be valid');
        assert(result.riskScore < 20, 'Risk score should be low');
      }
    );

    await runner.test(
      'Should reject coordinates for allocated stand',
      async () => {
        const result = await verifyCoordinatesAgainstStands(-17.8412, 31.0445, 'HARARE');
        assert(result.valid === false, 'Should reject allocated stand');
        assert(result.reason === 'STAND_ALREADY_ALLOCATED', 'Reason should be allocated');
      }
    );

    await runner.test(
      'Should reject coordinates far from registered stands',
      async () => {
        const result = await verifyCoordinatesAgainstStands(-17.5, 31.5, 'HARARE');
        assert(result.valid === false, 'Should reject unknown coordinates');
        assert(result.reason === 'COORDINATES_NOT_AUTHORIZED', 'Reason should be not authorized');
      }
    );

    await runner.test(
      'Should handle suburb without stands',
      async () => {
        const result = await verifyCoordinatesAgainstStands(-17.8, 31.0, 'MASVINGO');
        assert(result.valid === false, 'Should fail for unknown suburb');
        assert(result.reason === 'SUBURB_NOT_FOUND', 'Reason should be suburb not found');
      }
    );

    // ZONING COMPATIBILITY TESTS
    console.log('\n📋 ZONING COMPATIBILITY TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should verify matching zoning',
      async () => {
        const result = await verifyZoningCompatibility(-17.8233, 31.0340, 'RESIDENTIAL', 'HARARE');
        assert(result.compatible === true, 'Zoning should be compatible');
      }
    );

    await runner.test(
      'Should reject incompatible zoning',
      async () => {
        const result = await verifyZoningCompatibility(-17.8233, 31.0340, 'COMMERCIAL', 'HARARE');
        assert(result.compatible === false, 'Zoning should be incompatible');
      }
    );

    // STAND LOOKUP TESTS
    console.log('\n🔍 STAND LOOKUP TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should find stand by coordinates',
      async () => {
        const stand = await getStandByCoordinates(-17.8233, 31.0340, 'HARARE');
        assert(stand !== null, 'Should find stand');
        assert(stand.standNumber === 'TEST-HAR-001', 'Should match correct stand');
      }
    );

    await runner.test(
      'Should return null for unknown coordinates',
      async () => {
        const stand = await getStandByCoordinates(-17.5, 31.5, 'HARARE');
        assert(stand === null, 'Should return null for unknown coords');
      }
    );

    // VACANT STANDS TEST
    console.log('\n🏗️ VACANT STANDS TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should return only vacant stands',
      async () => {
        const stands = await getVacantStands('HARARE');
        assert(stands.length === 1, 'Should return 1 vacant stand in Harare');
        assert(stands[0].standNumber === 'TEST-HAR-001', 'Should be correct stand');
      }
    );

    await runner.test(
      'Should return empty array for suburb with no vacant stands',
      async () => {
        await Stands.updateMany({ suburb: 'HARARE' }, { status: 'ALLOCATED' });
        const stands = await getVacantStands('HARARE');
        assert(stands.length === 0, 'Should return empty array');
        // Restore data
        await Stands.updateOne({ standNumber: 'TEST-HAR-001' }, { status: 'VACANT' });
      }
    );

    // STAND NUMBER VERIFICATION TESTS
    console.log('\n📌 STAND NUMBER VERIFICATION TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should verify valid stand number',
      async () => {
        const result = await verifyStandNumber('TEST-HAR-001', 'HARARE');
        assert(result.valid === true, 'Stand should be valid');
        assert(result.riskScore < 20, 'Risk score should be low');
      }
    );

    await runner.test(
      'Should reject unknown stand number',
      async () => {
        const result = await verifyStandNumber('FAKE-001', 'HARARE');
        assert(result.valid === false, 'Stand should be invalid');
      }
    );

    await runner.test(
      'Should reject allocated stand numbers',
      async () => {
        const result = await verifyStandNumber('TEST-HAR-002', 'HARARE');
        assert(result.valid === false, 'Allocated stand should be invalid');
      }
    );

    // STATISTICS TESTS
    console.log('\n📊 STATISTICS TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should calculate correct statistics',
      async () => {
        const stats = await getStandStatistics('HARARE');
        assert(stats !== null, 'Should return statistics');
        assert(stats.totalStands === 2, 'Should have 2 total stands in Harare');
        assert(stats.vacantStands === 1, 'Should have 1 vacant stand');
        assert(stats.allocatedStands === 1, 'Should have 1 allocated stand');
      }
    );

    // DATA INTEGRITY TESTS
    console.log('\n🔒 DATA INTEGRITY TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should reject coordinates outside Zimbabwe bounds',
      async () => {
        const result = await verifyCoordinatesAgainstStands(-5, 45, 'HARARE');
        assert(result.valid === false, 'Should reject out-of-bounds coords');
      }
    );

    await runner.test(
      'Should handle missing suburb gracefully',
      async () => {
        const result = await verifyCoordinatesAgainstStands(-17.8, 31.0, 'UNKNOWN');
        assert(result.valid === false, 'Should fail for unknown suburb');
      }
    );

    // MULTI-SUBURB TESTS
    console.log('\n🏙️ MULTI-SUBURB TESTS');
    console.log('─'.repeat(60));

    await runner.test(
      'Should handle multiple suburbs correctly',
      async () => {
        const harareVacant = await getVacantStands('HARARE');
        const chitungwizaVacant = await getVacantStands('CHITUNGWIZA');
        assert(harareVacant.length === 1, 'Should find Harare stands');
        assert(chitungwizaVacant.length === 1, 'Should find Chitungwiza stands');
      }
    );

    // Print report
    const success = runner.report();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test setup error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run tests
runTests();
