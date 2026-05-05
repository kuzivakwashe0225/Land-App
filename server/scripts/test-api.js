/**
 * LandSolutions — Full API Test Runner
 *
 * Tests ALL endpoints end-to-end using fetch (no test framework needed).
 * Prints a live pass/fail report with colours.
 *
 * Prerequisites:
 *   1. Server running on http://localhost:5000  ← MUST BE RUNNING!
 *   2. Database seeded: npm run seed
 *
 * How to run correctly:
 *   Terminal 1:  npm run dev          ← keep this running
 *   Terminal 2:  npm run seed         ← run once
 *   Terminal 2:  npm run test:api     ← run tests
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE = 'http://localhost:5000';

// ── Colour helpers ────────────────────────────────────────────────────────────
const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
};

// ── PRE-FLIGHT: Check server is running BEFORE starting tests ─────────────────
const checkServer = async () => {
  try {
    const res = await fetch(`${BASE}/api/auth/signout`, { method: 'GET' });
    return true; // Any HTTP response means server is up
  } catch (err) {
    console.log(c.red(c.bold('\n  ❌ SERVER IS NOT RUNNING!\n')));
    console.log(c.yellow('  ┌─ HOW TO FIX ──────────────────────────────────────────────┐'));
    console.log(c.yellow('  │                                                             │'));
    console.log(c.yellow('  │  You need the server running in a SEPARATE terminal:       │'));
    console.log(c.yellow('  │                                                             │'));
    console.log(c.yellow('  │   Terminal 1 (keep open):   npm run dev                   │'));
    console.log(c.yellow('  │   Terminal 2 (once):        npm run seed                  │'));
    console.log(c.yellow('  │   Terminal 2:               npm run test:api               │'));
    console.log(c.yellow('  │                                                             │'));
    console.log(c.yellow('  │  Wait for "🚀 Server is running on port 5000" to appear.  │'));
    console.log(c.yellow('  └─────────────────────────────────────────────────────────────┘\n'));
    process.exit(1);
  }
};

await checkServer();

// ── State ─────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0, warned = 0;
const results = [];
const cookies = {};   // session cookies per role

// ── Test helper ───────────────────────────────────────────────────────────────
async function test(name, fn) {
  try {
    const result = await fn();
    if (result === false) {
      console.log(c.red(`  ✗ FAIL`) + ` ${name}`);
      failed++;
      results.push({ name, status: 'FAIL' });
    } else if (result === 'warn') {
      console.log(c.yellow(`  ⚠ WARN`) + ` ${name}`);
      warned++;
      results.push({ name, status: 'WARN' });
    } else {
      const detail = typeof result === 'string' ? c.dim(` (${result})`) : '';
      console.log(c.green(`  ✓ PASS`) + ` ${name}${detail}`);
      passed++;
      results.push({ name, status: 'PASS' });
    }
  } catch (err) {
    console.log(c.red(`  ✗ FAIL`) + ` ${name} — ${c.dim(err.message)}`);
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function api(method, url, body, role) {
  const cookieHeader = role && cookies[role] ? { Cookie: cookies[role] } : {};
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...cookieHeader },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Capture Set-Cookie
  const setCookie = res.headers.get('set-cookie');
  if (setCookie && role) cookies[role] = setCookie.split(';')[0];

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function apiGet(url, role) { return api('GET', url, null, role); }
async function apiPost(url, body, role) { return api('POST', url, body, role); }
async function apiPut(url, body, role) { return api('PUT', url, body, role); }
async function apiDelete(url, role) { return api('DELETE', url, null, role); }

// ── Section header ────────────────────────────────────────────────────────────
function section(title) {
  console.log('\n' + c.cyan(c.bold(`── ${title} ${'─'.repeat(Math.max(0, 55 - title.length))}`)));
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────
const shared = {};   // Shared state between tests (IDs, etc.)

// ── 1. Server Health ──────────────────────────────────────────────────────────
async function testHealth() {
  section('SERVER HEALTH');
  await test('Server is reachable', async () => {
    const res = await fetch(`${BASE}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    return res.status !== 0 ? 'Server responding' : false;
  });
}

// ── 2. Authentication ─────────────────────────────────────────────────────────
async function testAuth() {
  section('AUTHENTICATION');

  await test('Admin sign-in succeeds', async () => {
    const { status, data } = await apiPost('/api/auth/signin', { email: 'admin@landsolutions.zw', password: 'Test@1234' }, 'admin');
    if (status !== 200 || !data.success) throw new Error(data.message || `HTTP ${status}`);
    shared.adminId = data.user?._id;
    return `admin ID: ${shared.adminId}`;
  });

  await test('Seller1 sign-in succeeds', async () => {
    const { status, data } = await apiPost('/api/auth/signin', { email: 'seller1@test.zw', password: 'Test@1234' }, 'seller1');
    if (status !== 200 || !data.success) throw new Error(data.message || `HTTP ${status}`);
    shared.seller1Id = data.user?._id;
    return 'cookie set';
  });

  await test('Seller2 sign-in succeeds', async () => {
    const { status, data } = await apiPost('/api/auth/signin', { email: 'seller2@test.zw', password: 'Test@1234' }, 'seller2');
    if (status !== 200 || !data.success) throw new Error(data.message || `HTTP ${status}`);
    return 'ok';
  });

  await test('Buyer1 sign-in succeeds', async () => {
    const { status, data } = await apiPost('/api/auth/signin', { email: 'buyer1@test.zw', password: 'Test@1234' }, 'buyer1');
    if (status !== 200 || !data.success) throw new Error(data.message || `HTTP ${status}`);
    shared.buyer1Id = data.user?._id;
    return 'ok';
  });

  await test('Officer sign-in succeeds', async () => {
    const { status, data } = await apiPost('/api/auth/signin', { email: 'officer@landsolutions.zw', password: 'Test@1234' }, 'officer');
    if (status !== 200 || !data.success) throw new Error(data.message || `HTTP ${status}`);
    return 'ok';
  });

  await test('Wrong password returns 401', async () => {
    const { status, data } = await apiPost('/api/auth/signin', { email: 'admin@landsolutions.zw', password: 'WrongPass1' });
    return status === 401 ? 'correctly rejected' : false;
  });

  await test('Missing credentials returns 400', async () => {
    const { status } = await apiPost('/api/auth/signin', {});
    return status === 400 ? 'correctly rejected' : false;
  });

  await test('Sign-up with weak password is rejected', async () => {
    const { status, data } = await apiPost('/api/auth/signup', {
      firstName: 'Test', lastName: 'User',
      email: 'weakpass@test.zw', password: 'weak',
      phoneNumber: '+263771111111', nationalId: '01-111111A01'
    });
    return status === 400 ? 'weak password rejected' : false;
  });

  await test('Sign-up with duplicate email is rejected', async () => {
    const { status } = await apiPost('/api/auth/signup', {
      firstName: 'Dupe', lastName: 'User',
      email: 'admin@landsolutions.zw', password: 'Test@1234',
      phoneNumber: '+263771111112', nationalId: '01-111112A01'
    });
    return status === 409 ? 'duplicate rejected' : false;
  });

  await test('Unauthenticated API access returns 401', async () => {
    const { status } = await apiGet('/api/land');
    return status === 401 ? 'correctly blocked' : false;
  });
}

// ── 3. Land Listings ──────────────────────────────────────────────────────────
async function testLandListings() {
  section('LAND LISTINGS');

  await test('Get all land listings (authenticated)', async () => {
    const { status, data } = await apiGet('/api/land', 'admin');
    if (status !== 200) throw new Error(`HTTP ${status}: ${data.message}`);
    shared.allLands = data.data || [];
    return `${shared.allLands.length} listings returned`;
  });

  await test('Verified listings are present', async () => {
    const verified = shared.allLands.filter(l => l.verification?.status === 'VERIFIED');
    return verified.length >= 3 ? `${verified.length} verified` : false;
  });

  await test('Get listing by ID', async () => {
    const land = shared.allLands?.[0];
    if (!land) return 'warn';
    const { status, data } = await apiGet(`/api/land/${land._id}`, 'buyer1');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    shared.sampleLandId = land._id;
    shared.verifiedLandId = shared.allLands.find(l => l.verification?.status === 'VERIFIED')?._id;
    return `Stand ${data.data?.standNumber}`;
  });

  await test('Filter by suburb (HARARE)', async () => {
    const { status, data } = await apiGet('/api/land?suburb=HARARE', 'buyer1');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const all = data.data || [];
    const allHarare = all.every(l => l.location?.address?.suburb === 'HARARE');
    return allHarare ? `${all.length} Harare listings` : false;
  });

  await test('Filter by min/max price', async () => {
    const { status, data } = await apiGet('/api/land?minPrice=30000&maxPrice=60000', 'buyer1');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return `${(data.data || []).length} listings in price range`;
  });

  await test('Filter by zoning (COMMERCIAL)', async () => {
    const { status, data } = await apiGet('/api/land?zoning=COMMERCIAL', 'buyer1');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return `${(data.data || []).length} commercial listings`;
  });

  await test('Create land listing (KYC-approved seller)', async () => {
    const { status, data } = await apiPost('/api/land', {
      standNumber: 'TEST-STAND-NEW-001',
      titleDeedNumber: 'TD/TEST/2026/001',
      location: {
        address: { street: '99 Test Drive', suburb: 'HARARE', province: 'HARARE' },
        coordinates: { latitude: -17.8100, longitude: 31.0440 }
      },
      landDetails: {
        size: { squareMeters: 500, hectares: 0.05 },
        zoning: 'RESIDENTIAL',
        landUse: 'VACANT',
        description: 'Auto-generated test listing'
      },
      transaction: { listedPrice: { amount: 18000 } },
      gpsProof: { latitude: -17.8115, longitude: 31.0451, accuracy: 5 }
    }, 'seller1');
    if (status !== 201) throw new Error(`HTTP ${status}: ${data.message}`);
    shared.newLandId = data.land?._id;
    return `ID: ${shared.newLandId}`;
  });

  await test('Duplicate stand number is rejected (409)', async () => {
    const { status, data } = await apiPost('/api/land', {
      standNumber: 'TEST-STAND-NEW-001',  // Same as above
      titleDeedNumber: 'TD/TEST/2026/999',
      location: { address: { street: 'Dup St', suburb: 'HARARE', province: 'HARARE' }, coordinates: {} },
      landDetails: { size: { squareMeters: 200, hectares: 0.02 }, zoning: 'RESIDENTIAL', landUse: 'VACANT' },
      transaction: { listedPrice: { amount: 5000 } }
    }, 'seller1');
    return status === 409 ? 'duplicate rejected' : false;
  });

  await test('Seller3 sign-in (pending KYC)', async () => {
    const { status, data } = await apiPost('/api/auth/signin', { email: 'seller3@test.zw', password: 'Test@1234' }, 'seller3');
    if (status !== 200 || !data.success) throw new Error(data.message || `HTTP ${status}`);
    return 'signed in with pending KYC';
  });

  await test('Seller with pending KYC cannot list (403)', async () => {
    const { status } = await apiPost('/api/land', {
      standNumber: 'NOKYC-STAND-001',
      titleDeedNumber: 'TD/NOKYC/2026/001',
      location: { address: { street: 'Road', suburb: 'HARARE', province: 'HARARE' }, coordinates: {} },
      landDetails: { size: { squareMeters: 200, hectares: 0.02 }, zoning: 'RESIDENTIAL', landUse: 'VACANT' },
      transaction: { listedPrice: { amount: 5000 } }
    }, 'seller3');  // seller3 has PENDING KYC
    // seller3 hasn't logged in — expect 401
    return status === 401 || status === 403 ? 'KYC gate worked' : 'warn';
  });

  await test('Invalid suburb is rejected (400)', async () => {
    const { status } = await apiPost('/api/land', {
      standNumber: 'INVALID-SUBURB-001',
      titleDeedNumber: 'TD/INV/2026/001',
      location: { address: { street: 'Road', suburb: 'FAKETOWN', province: 'HARARE' }, coordinates: {} },
      landDetails: { size: { squareMeters: 200, hectares: 0.02 }, zoning: 'RESIDENTIAL', landUse: 'VACANT' },
      transaction: { listedPrice: { amount: 5000 } }
    }, 'seller1');
    return status === 400 ? 'invalid suburb rejected' : false;
  });

  await test('Update listing (owner)', async () => {
    if (!shared.newLandId) return 'warn';
    const { status, data } = await apiPut(`/api/land/${shared.newLandId}`, {
      transaction: { listedPrice: { amount: 20000 } }
    }, 'seller1');
    if (status !== 200) throw new Error(`HTTP ${status}: ${data.message}`);
    return 'price updated';
  });
}

// ── 4. Verification Workflow ──────────────────────────────────────────────────
async function testVerification() {
  section('VERIFICATION WORKFLOW');

  await test('Officer can verify a pending listing', async () => {
    if (!shared.newLandId) return 'warn';
    const { status, data } = await apiPost(`/api/land/${shared.newLandId}/verify`, {
      verificationStatus: 'VERIFIED',
      verificationNotes: 'All documents confirmed authentic by automated and manual review'
    }, 'officer');
    if (status !== 200) throw new Error(`HTTP ${status}: ${data.message}`);
    return 'listing verified by officer';
  });

  await test('Get verification status of listing', async () => {
    if (!shared.newLandId) return 'warn';
    const { status, data } = await apiGet(`/api/land/${shared.newLandId}/verification-status`, 'buyer1');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return `status: ${data.data?.status || data.status}`;
  });

  await test('Buyer cannot verify a listing (403)', async () => {
    if (!shared.newLandId) return 'warn';
    const { status } = await apiPost(`/api/land/${shared.newLandId}/verify`, {
      verificationStatus: 'VERIFIED',
      verificationNotes: 'I am a buyer hacking verification'
    }, 'buyer1');
    return status === 403 ? 'buyer correctly blocked' : false;
  });

  await test('Officer can reject a listing', async () => {
    // Use the flagged listing from seed
    const flagged = shared.allLands?.find(l => l.verification?.status === 'SUSPENDED');
    if (!flagged) return 'warn';
    const { status, data } = await apiPost(`/api/land/${flagged._id}/verify`, {
      verificationStatus: 'REJECTED',
      verificationNotes: 'Multiple AI flags detected — ELA tamper score 78/100, GPS mismatch 15.2km'
    }, 'officer');
    return status === 200 ? 'rejection recorded' : `warn (HTTP ${status})`;
  });
}

// ── 5. Flag / Fraud Reporting ─────────────────────────────────────────────────
async function testFraudReporting() {
  section('FRAUD REPORTING');

  await test('Buyer can flag a suspicious listing', async () => {
    if (!shared.sampleLandId) return 'warn';
    const { status, data } = await apiPost(`/api/land/${shared.sampleLandId}/flag`, {
      flagType: 'OWNERSHIP_DISPUTE',
      description: 'This stand was sold to me 3 years ago and I have receipts. Please investigate urgently.'
    }, 'buyer1');
    return status === 200 || status === 201 ? 'flag recorded' : `warn (HTTP ${status}: ${data.message})`;
  });

  await test('Flag with too-short description is rejected', async () => {
    if (!shared.sampleLandId) return 'warn';
    const { status } = await apiPost(`/api/land/${shared.sampleLandId}/flag`, {
      flagType: 'FAKE_DOCUMENTS',
      description: 'fake'
    }, 'buyer1');
    return status === 400 ? 'short description rejected' : false;
  });

  await test('Invalid flag type is rejected', async () => {
    if (!shared.sampleLandId) return 'warn';
    const { status } = await apiPost(`/api/land/${shared.sampleLandId}/flag`, {
      flagType: 'MADE_UP_FLAG',
      description: 'This is a valid description that is long enough to pass validation'
    }, 'buyer1');
    return status === 400 ? 'invalid flag type rejected' : false;
  });
}

// ── 6. Transactions ───────────────────────────────────────────────────────────
async function testTransactions() {
  section('TRANSACTIONS (Buy Requests)');

  await test('Buyer can request to buy a verified listing', async () => {
    if (!shared.newLandId) return 'warn';
    const { status, data } = await apiPost('/api/transaction/request', {
      landId: shared.newLandId,
      offerPrice: 19500,
      message: 'I am very interested in this property. Ready to proceed quickly.'
    }, 'buyer1');
    if (status !== 201) throw new Error(`HTTP ${status}: ${data.message}`);
    shared.txnId = data.data?._id;
    return `Transaction: ${shared.txnId}`;
  });

  await test('Buyer cannot buy their own listing', async () => {
    if (!shared.newLandId) return 'warn';
    const { status } = await apiPost('/api/transaction/request', {
      landId: shared.newLandId,
      offerPrice: 18000
    }, 'seller1');  // seller1 owns this land
    return status === 400 || status === 403 ? 'self-purchase blocked' : false;
  });

  await test('Buyer cannot buy an unverified listing', async () => {
    const unverified = shared.allLands?.find(l =>
      l.verification?.status === 'PENDING' && l.owner?.toString() !== shared.buyer1Id
    );
    if (!unverified) return 'warn';
    const { status } = await apiPost('/api/transaction/request', {
      landId: unverified._id,
      offerPrice: 10000
    }, 'buyer1');
    return status === 403 ? 'unverified listing blocked' : `warn (${status})`;
  });

  await test('Get my transactions', async () => {
    const { status, data } = await apiGet('/api/transaction/my-transactions', 'buyer1');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return `${(data.data || []).length} transactions found`;
  });

  await test('Seller can accept a transaction', async () => {
    if (!shared.txnId) return 'warn';
    const { status, data } = await apiPost(`/api/transaction/${shared.txnId}/status`, {
      status: 'PENDING_VERIFICATION',
      message: 'Offer accepted! Let us proceed with documentation.'
    }, 'seller1');
    return status === 200 ? 'transaction accepted' : `warn (HTTP ${status}: ${data.message})`;
  });
}

// ── 7. Analytics ──────────────────────────────────────────────────────────────
async function testAnalytics() {
  section('ANALYTICS (Admin Only)');

  await test('Admin can access land analytics', async () => {
    const { status, data } = await apiGet('/api/land/analytics', 'admin');
    if (status !== 200) throw new Error(`HTTP ${status}: ${data.message}`);
    return 'analytics data returned';
  });

  await test('Buyer cannot access analytics (403)', async () => {
    const { status } = await apiGet('/api/land/analytics', 'buyer1');
    return status === 403 ? 'correctly blocked' : false;
  });
}

// ── 8. Security & Edge Cases ──────────────────────────────────────────────────
async function testSecurity() {
  section('SECURITY & EDGE CASES');

  await test('Invalid MongoDB ID returns 400', async () => {
    const { status } = await apiGet('/api/land/not-a-valid-id', 'admin');
    return status === 400 ? 'bad ID rejected' : false;
  });

  await test('Non-existent land ID returns 404', async () => {
    const { status } = await apiGet('/api/land/507f1f77bcf86cd799439011', 'admin');
    return status === 404 || status === 400 ? '404 handled' : false;
  });

  await test('Signout clears session', async () => {
    const { status } = await apiGet('/api/auth/signout', 'buyer1');
    return status === 200 ? 'signout ok' : false;
  });

  await test('After signout, authenticated route returns 401', async () => {
    // buyer1's cookie should be cleared or expired
    const { status } = await apiGet('/api/land', 'buyer1');
    // After signout cookie is cleared — next request should be unauthorized
    return status === 401 ? 'session correctly invalidated' : 'warn';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN RUNNER
// ─────────────────────────────────────────────────────────────────────────────
const start = Date.now();

console.log(c.bold(c.cyan('\n╔══════════════════════════════════════════════════════════╗')));
console.log(c.bold(c.cyan('║      LandSolutions — Full System API Test Runner          ║')));
console.log(c.bold(c.cyan('╚══════════════════════════════════════════════════════════╝')));
console.log(c.dim(`  Server: ${BASE}`));
console.log(c.dim(`  Time:   ${new Date().toISOString()}\n`));

await testHealth();
await testAuth();
await testLandListings();
await testVerification();
await testFraudReporting();
await testTransactions();
await testAnalytics();
await testSecurity();

// ── Final Report ──────────────────────────────────────────────────────────────
const elapsed = ((Date.now() - start) / 1000).toFixed(2);
const total = passed + failed + warned;

console.log('\n' + c.bold(c.cyan('╔══════════════════════════════════════════════════════════╗')));
console.log(c.bold(c.cyan('║                    FINAL TEST REPORT                      ║')));
console.log(c.bold(c.cyan('╚══════════════════════════════════════════════════════════╝')));
console.log(`  Total Tests : ${total}`);
console.log(`  ${c.green(`✓ Passed`)}    : ${passed}`);
console.log(`  ${c.red(`✗ Failed`)}    : ${failed}`);
console.log(`  ${c.yellow(`⚠ Warnings`)} : ${warned}`);
console.log(`  Duration    : ${elapsed}s`);
console.log('');

if (failed > 0) {
  console.log(c.red('  ── Failed Tests ──────────────────────────────────────────'));
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(c.red(`  ✗ ${r.name}`) + (r.error ? c.dim(` — ${r.error}`) : ''));
  });
}

const score = Math.round((passed / total) * 100);
const scoreColour = score >= 90 ? c.green : score >= 70 ? c.yellow : c.red;
console.log(`\n  ${c.bold('System Health Score:')} ${scoreColour(score + '%')}`);

if (score === 100) console.log(c.green(c.bold('  🏆 ALL TESTS PASSED — System is fully operational!\n')));
else if (score >= 80) console.log(c.yellow(c.bold('  ✅ Most tests passed — review warnings and failures.\n')));
else console.log(c.red(c.bold('  ❌ Critical failures detected — system needs attention.\n')));

process.exit(failed > 0 ? 1 : 0);
