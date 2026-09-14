import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

async function runVerification() {
  console.log('================================================================');
  console.log(' WardrobeIQ — Comprehensive Persona Access & Closet Audit Test');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log('[PASS] ' + testName);
      passedTests++;
    } else {
      console.error('[FAIL] ' + testName + (detail ? ' - ' + detail : ''));
      failedTests++;
    }
  }

  // --------------------------------------------------------------------------
  // PART 1: DATASET & PERSONA POPULATION VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Persona Population & Structure Audit ---');
  const usersPath = path.join(dataDir, 'users.json');
  const customersPath = path.join(dataDir, 'customers.json');
  const wardrobesPath = path.join(dataDir, 'wardrobes.json');

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
  const wardrobes = JSON.parse(fs.readFileSync(wardrobesPath, 'utf8'));

  const adminUsers = users.filter((u: any) => u.role === 'admin');
  const normalUsers = users.filter((u: any) => u.role === 'user');

  assert(users.length === 106, 'Total accounts in users.json is exactly 106', 'Got ' + users.length);
  assert(adminUsers.length === 1, 'Exactly 1 Admin account exists in users.json', 'Got ' + adminUsers.length);
  assert(normalUsers.length === 105, 'Exactly 105 Normal Persona accounts exist in users.json', 'Got ' + normalUsers.length);
  assert(customers.length === 105, 'Exactly 105 Normal Personas exist in customers.json', 'Got ' + customers.length);
  assert(adminUsers[0].userId === 'admin_root', 'Admin account is admin_root and distinct from normal personas');

  // --------------------------------------------------------------------------
  // PART 2: CLOSET SIZE & CATEGORY BALANCE VALIDATION (SECTION 21)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Closet Size & 7-Category Balance Audit ---');
  const EXPECTED_CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'traditional'] as const;
  assert(wardrobes.length === 7350, 'Total wardrobe assignments in wardrobes.json is exactly 7,350', 'Got ' + wardrobes.length);

  let allPersonasExact70 = true;
  let allCategoriesExact10 = true;
  const invalidPersonas: string[] = [];

  for (let i = 1; i <= 105; i++) {
    const custId = 'C' + String(i).padStart(3, '0');
    const personaItems = wardrobes.filter((w: any) => w.customerId === custId);

    if (personaItems.length !== 70) {
      allPersonasExact70 = false;
      invalidPersonas.push(custId + ' (count: ' + personaItems.length + ')');
    }

    for (const cat of EXPECTED_CATEGORIES) {
      const catCount = personaItems.filter((w: any) => w.category === cat).length;
      if (catCount !== 10) {
        allCategoriesExact10 = false;
        invalidPersonas.push(custId + ' ' + cat + ' count: ' + catCount);
      }
    }
  }

  assert(allPersonasExact70, 'Every one of the 105 personas has exactly 70 items', invalidPersonas.slice(0, 5).join(', '));
  assert(allCategoriesExact10, 'Every persona has exactly 10 items in all 7 categories (top, bottom, dress, outerwear, shoes, accessory, traditional)');

  // --------------------------------------------------------------------------
  // PART 3: API AUTHORIZATION & USER ISOLATION TESTS (SECTIONS 19 & 20)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. API Authorization & User Isolation Tests ---');

  const { getInMemoryDb } = await import('../src/db/inMemoryDb.js');
  const v1Router = (await import('../src/routes/v1/index.js')).default;
  const { errorHandler } = await import('../src/middleware/errorHandler.js');

  // Initialize In-Memory MongoDB Engine
  getInMemoryDb();

  // Create Express App
  const app = express();
  app.use(express.json());
  app.use('/api/v1', v1Router);
  app.use(errorHandler);

  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = 'http://127.0.0.1:' + address.port;

  async function api(reqPath: string, options?: { method?: string; headers?: any; body?: any }) {
    const res = await fetch(baseUrl + reqPath, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    return { status: res.status, body: data };
  }

  const adminToken = 'demo_token_admin_root';
  const c001Token = 'demo_token_C001';

  try {
    // --- ADMIN TESTS (SECTION 19: Tests 1-5) ---
    console.log('\n[Admin Tests (Section 19)]');
    // Test 1: Admin logs in / authenticates
    const adminMeRes = await api('/api/v1/auth/me', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(adminMeRes.status === 200 && adminMeRes.body?.data?.role === 'admin', 'Test 1: Admin authenticates with role admin');

    // Test 2: Admin accesses personas list
    const adminPersonasRes = await api('/api/v1/auth/personas', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(
      adminPersonasRes.status === 200 && Array.isArray(adminPersonasRes.body?.data) && adminPersonasRes.body.data.length === 105,
      'Test 2: Admin can see all 105 normal personas via /auth/personas',
      'Got ' + (adminPersonasRes.body?.data?.length || 0) + ' personas'
    );

    // Test 3 & 4: Admin switches and accesses any persona closet
    const adminClosetC001 = await api('/api/v1/closet/C001', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    const adminClosetC050 = await api('/api/v1/closet/C050', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(
      adminClosetC001.status === 200 && adminClosetC050.status === 200,
      'Test 3 & 4: Admin can inspect any persona closet (C001 and C050)',
      'C001: ' + adminClosetC001.status + ', C050: ' + adminClosetC050.status
    );

    // Test 5: Admin accesses quality controls
    const adminAuditRes = await api('/api/v1/admin/dataset/audit', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    const adminDashboardRes = await api('/api/v1/admin/dashboard', {
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert(
      adminAuditRes.status === 200 && adminDashboardRes.status === 200,
      'Test 5: Admin can access dataset quality controls and dashboard'
    );

    // --- NORMAL USER TESTS (SECTION 20: Tests 6-12) ---
    console.log('\n[Normal User Isolation Tests (Section 20)]');

    // Test 6 & 7: Normal user logs in and loads own dashboard/closet
    const userMeRes = await api('/api/v1/auth/me', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    const userOwnHome = await api('/api/v1/home/C001', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    const userOwnCloset = await api('/api/v1/closet/C001', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });

    assert(
      userMeRes.status === 200 && userMeRes.body?.data?.role === 'user',
      'Test 6: Normal user (C001) authenticates with role user'
    );
    assert(
      userOwnHome.status === 200 && userOwnCloset.status === 200,
      'Test 7: Normal user loads own dashboard and closet successfully'
    );

    // Test 8: Normal user attempts to access persona list (old 20-persona / all personas)
    const userPersonasRes = await api('/api/v1/auth/personas', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    const userDemoPersonasRes = await api('/api/v1/auth/demo-personas', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    const userCustomersRes = await api('/api/v1/customers', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });

    assert(
      userPersonasRes.status === 403 && userDemoPersonasRes.status === 403 && userCustomersRes.status === 403,
      'Test 8: Normal user receives 403 Forbidden attempting to access persona list endpoints',
      'personas: ' + userPersonasRes.status + ', demo-personas: ' + userDemoPersonasRes.status + ', customers: ' + userCustomersRes.status
    );

    // Test 9: Normal user attempts to access another persona (C001 attempting C002)
    const crossHome = await api('/api/v1/home/C002', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    const crossCloset = await api('/api/v1/closet/C002', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    const crossGaps = await api('/api/v1/gaps/C002', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });

    assert(
      crossHome.status === 403 && crossCloset.status === 403 && crossGaps.status === 403,
      'Test 9: Normal user receives 403 Forbidden attempting to access another persona home, closet, or gaps',
      'home: ' + crossHome.status + ', closet: ' + crossCloset.status + ', gaps: ' + crossGaps.status
    );

    // Test 10: Normal user modifies persona ID in URL (profile/C002)
    const crossProfile = await api('/api/v1/profile/C002', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    assert(
      crossProfile.status === 403,
      'Test 10: Normal user receives 403 Forbidden attempting URL manipulation on /profile/C002',
      'Status: ' + crossProfile.status
    );

    // Test 11: Normal user directly calls recommendation API with another customerId
    const crossRecs = await api('/api/v1/recommendations', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + c001Token },
      body: { customerId: 'C002', occasion: 'casual' },
    });
    assert(
      crossRecs.status === 403,
      'Test 11: Normal user receives 403 Forbidden attempting to generate recommendations for another persona',
      'Status: ' + crossRecs.status
    );

    // Test 12: Normal user attempts quality management / admin APIs
    const userAdminAudit = await api('/api/v1/admin/dataset/audit', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });
    const userAdminDash = await api('/api/v1/admin/dashboard', {
      headers: { Authorization: 'Bearer ' + c001Token },
    });

    assert(
      userAdminAudit.status === 403 && userAdminDash.status === 403,
      'Test 12: Normal user receives 403 Forbidden attempting to access admin quality APIs and dashboard',
      'audit: ' + userAdminAudit.status + ', dashboard: ' + userAdminDash.status
    );

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(' RESULTS: ' + passedTests + ' passed, ' + failedTests + ' failed');
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
