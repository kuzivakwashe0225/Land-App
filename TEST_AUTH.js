/**
 * Comprehensive Authentication & Validation Test Suite
 * Tests password validation, duplicate prevention, and form validation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const API = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true // Don't throw on any status
});

// Test data
const testUsers = {
  valid: {
    firstName: 'Test',
    lastName: 'User',
    email: `testuser${Date.now()}@example.com`,
    phoneNumber: '+263781234567',
    nationalId: `${Math.random().toString().slice(2, 4)}-${Math.random().toString().slice(2, 10)}A${Math.random().toString().slice(2, 4)}`,
    password: 'TestPassword123!',
    role: 'BUYER'
  },
  weakPassword: {
    firstName: 'Test',
    lastName: 'User',
    email: `weakpass${Date.now()}@example.com`,
    phoneNumber: '+263781234568',
    nationalId: '01-1111111A11',
    password: 'weak', // Too short, missing uppercase, number, special char
    role: 'BUYER'
  },
  noUppercase: {
    firstName: 'Test',
    lastName: 'User',
    email: `noupper${Date.now()}@example.com`,
    phoneNumber: '+263781234569',
    nationalId: '02-2222222A22',
    password: 'password123!', // Missing uppercase
    role: 'BUYER'
  },
  noNumber: {
    firstName: 'Test',
    lastName: 'User',
    email: `nonumber${Date.now()}@example.com`,
    phoneNumber: '+263781234570',
    nationalId: '03-3333333A33',
    password: 'TestPassword!', // Missing number
    role: 'BUYER'
  },
  noSpecial: {
    firstName: 'Test',
    lastName: 'User',
    email: `nospecial${Date.now()}@example.com`,
    phoneNumber: '+263781234571',
    nationalId: '04-4444444A44',
    password: 'TestPassword123', // Missing special character
    role: 'BUYER'
  }
};

// Test results tracking
let results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ status: 'PASS', name });
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ status: 'FAIL', name, error: error.message });
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n🧪 Starting Authentication & Validation Tests\n');

  // Test 1: Valid signup should succeed
  await test('Valid signup with strong password', async () => {
    const response = await API.post('/signup', testUsers.valid);
    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}: ${response.data.message}`);
    }
    if (!response.data.success) {
      throw new Error(`Signup failed: ${response.data.message}`);
    }
  });

  // Test 2: Weak password (too short) should fail
  await test('Reject password with less than 8 characters', async () => {
    const response = await API.post('/signup', testUsers.weakPassword);
    if (response.status === 201) {
      throw new Error('Weak password was accepted');
    }
    if (!response.data.errors || response.data.errors.length === 0) {
      throw new Error('No validation errors returned');
    }
    const hasLengthError = response.data.errors.some(e => e.includes('8 characters'));
    if (!hasLengthError) {
      throw new Error('Missing length requirement error');
    }
  });

  // Test 3: Password without uppercase should fail
  await test('Reject password without uppercase letter', async () => {
    const response = await API.post('/signup', testUsers.noUppercase);
    if (response.status === 201) {
      throw new Error('Password without uppercase was accepted');
    }
    if (!response.data.errors || response.data.errors.length === 0) {
      throw new Error('No validation errors returned');
    }
    const hasUppercaseError = response.data.errors.some(e => e.includes('uppercase'));
    if (!hasUppercaseError) {
      throw new Error('Missing uppercase requirement error');
    }
  });

  // Test 4: Password without number should fail
  await test('Reject password without number', async () => {
    const response = await API.post('/signup', testUsers.noNumber);
    if (response.status === 201) {
      throw new Error('Password without number was accepted');
    }
    if (!response.data.errors || response.data.errors.length === 0) {
      throw new Error('No validation errors returned');
    }
    const hasNumberError = response.data.errors.some(e => e.includes('number'));
    if (!hasNumberError) {
      throw new Error('Missing number requirement error');
    }
  });

  // Test 5: Password without special character should fail
  await test('Reject password without special character', async () => {
    const response = await API.post('/signup', testUsers.noSpecial);
    if (response.status === 201) {
      throw new Error('Password without special char was accepted');
    }
    if (!response.data.errors || response.data.errors.length === 0) {
      throw new Error('No validation errors returned');
    }
    const hasSpecialError = response.data.errors.some(e => e.includes('special character'));
    if (!hasSpecialError) {
      throw new Error('Missing special character requirement error');
    }
  });

  // Test 6: Duplicate email should fail
  await test('Prevent duplicate email registration', async () => {
    const user = {
      firstName: 'Duplicate',
      lastName: 'Test',
      email: `duplicate${Date.now()}@example.com`,
      phoneNumber: '+263781234572',
      nationalId: '05-5555555A55',
      password: 'DuplicateTest123!',
      role: 'BUYER'
    };

    // First signup should succeed
    const response1 = await API.post('/signup', user);
    if (response1.status !== 201) {
      throw new Error(`First signup failed: ${response1.data.message}`);
    }

    // Second signup with same email should fail
    const response2 = await API.post('/signup', {
      ...user,
      phoneNumber: '+263781234573',
      nationalId: '06-6666666A66'
    });
    if (response2.status === 201) {
      throw new Error('Duplicate email was accepted');
    }
    if (response2.data.field !== 'email') {
      throw new Error('Error field should be "email"');
    }
  });

  // Test 7: Duplicate national ID should fail
  await test('Prevent duplicate national ID registration', async () => {
    const uniqueId = `${Math.random().toString().slice(2, 4)}-${Math.random().toString().slice(2, 10)}A${Math.random().toString().slice(2, 4)}`;
    const user = {
      firstName: 'DupID',
      lastName: 'Test',
      email: `dupid${Date.now()}@example.com`,
      phoneNumber: '+263781234574',
      nationalId: uniqueId,
      password: 'DupIDTest123!',
      role: 'BUYER'
    };

    // First signup should succeed
    const response1 = await API.post('/signup', user);
    if (response1.status !== 201) {
      throw new Error(`First signup failed: ${response1.data.message}`);
    }

    // Second signup with same ID should fail
    const response2 = await API.post('/signup', {
      ...user,
      email: `dupid2${Date.now()}@example.com`,
      phoneNumber: '+263781234575'
    });
    if (response2.status === 201) {
      throw new Error('Duplicate national ID was accepted');
    }
    if (response2.data.field !== 'nationalId') {
      throw new Error('Error field should be "nationalId"');
    }
  });

  // Test 8: Duplicate phone should fail
  await test('Prevent duplicate phone number registration', async () => {
    const phoneNumber = '+263781234576';
    const user = {
      firstName: 'DupPhone',
      lastName: 'Test',
      email: `dupphone${Date.now()}@example.com`,
      phoneNumber: phoneNumber,
      nationalId: '07-7777777A77',
      password: 'DupPhoneTest123!',
      role: 'BUYER'
    };

    // First signup should succeed
    const response1 = await API.post('/signup', user);
    if (response1.status !== 201) {
      throw new Error(`First signup failed: ${response1.data.message}`);
    }

    // Second signup with same phone should fail
    const response2 = await API.post('/signup', {
      ...user,
      email: `dupphone2${Date.now()}@example.com`,
      nationalId: '08-8888888A88'
    });
    if (response2.status === 201) {
      throw new Error('Duplicate phone was accepted');
    }
    if (response2.data.field !== 'phoneNumber') {
      throw new Error('Error field should be "phoneNumber"');
    }
  });

  // Test 9: Case-insensitive email check
  await test('Email validation is case-insensitive', async () => {
    const email = `caseinsen${Date.now()}@example.com`;
    const user = {
      firstName: 'CaseTest',
      lastName: 'User',
      email: email,
      phoneNumber: '+263781234577',
      nationalId: '09-9999999A99',
      password: 'CaseTest123!',
      role: 'BUYER'
    };

    // First signup with lowercase
    const response1 = await API.post('/signup', user);
    if (response1.status !== 201) {
      throw new Error(`First signup failed: ${response1.data.message}`);
    }

    // Second signup with uppercase should fail
    const response2 = await API.post('/signup', {
      ...user,
      email: email.toUpperCase(),
      phoneNumber: '+263781234578',
      nationalId: '10-0000000A00'
    });
    if (response2.status === 201) {
      throw new Error('Uppercase email was treated as different email');
    }
  });

  // Test 10: Required fields validation
  await test('Missing required fields should fail', async () => {
    const response = await API.post('/signup', {
      firstName: 'Test',
      // Missing other fields
      password: 'TestPassword123!'
    });
    if (response.status === 201) {
      throw new Error('Signup succeeded with missing required fields');
    }
  });

  // Test 11: All 4 password requirements in one error response
  await test('All password validation errors returned together', async () => {
    const response = await API.post('/signup', {
      firstName: 'Test',
      lastName: 'User',
      email: `allerrors${Date.now()}@example.com`,
      phoneNumber: '+263781234579',
      nationalId: '11-1111111A11',
      password: 'a', // Fails all 4 requirements
      role: 'BUYER'
    });
    if (response.status === 201) {
      throw new Error('Invalid password was accepted');
    }
    if (!response.data.errors || response.data.errors.length !== 4) {
      throw new Error(`Expected 4 validation errors, got ${response.data.errors?.length || 0}`);
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🎯 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('='.repeat(50) + '\n');

  if (results.failed > 0) {
    console.log('Failed tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  ❌ ${t.name}`);
        console.log(`     ${t.error}`);
      });
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:5000/api/auth/health').catch(() => {});
    return true;
  } catch (error) {
    return false;
  }
}

// Main entry point
(async () => {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('❌ Server is not running at http://localhost:5000');
    console.log('Please start the server with: npm start (in server directory)');
    process.exit(1);
  }

  console.log('✅ Server is running\n');
  await runTests();
})();
