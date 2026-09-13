import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

interface ProductItem {
  productId: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface WardrobeItem {
  itemId: string;
  customerId: string;
  productId?: string;
  name: string;
  category: string;
  isCustom?: boolean;
  style?: string;
  styleTags?: string[];
  occasion?: string[];
  season?: string[];
  dateAcquired?: string;
  occasions?: string[];
  seasons?: string[];
  lastWorn?: string;
}

interface CustomerItem {
  customerId: string;
  name: string;
}

interface PurchaseItem {
  purchaseId: string;
  customerId: string;
  productId: string;
  pricePaid: number;
  category: string;
}

interface BrowsingItem {
  interactionId: string;
  customerId: string;
  eventType: string;
}

async function runAudit() {
  console.log('====================================================');
  console.log('  WardrobeIQ Comprehensive Audit & Verification     ');
  console.log('====================================================\n');

  let passed = true;
  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
    } else {
      console.error(`  [FAIL] ${msg}`);
      passed = false;
    }
  };

  // 1. Audit Customers
  console.log('1. Auditing Personas (customers.json)...');
  const customersPath = path.join(DATA_DIR, 'customers.json');
  const customers: CustomerItem[] = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
  assert(customers.length === 105, `Expected exactly 105 personas, found ${customers.length}`);

  const customerIds = new Set(customers.map((c) => c.customerId));
  assert(customerIds.size === 105, 'All 105 customer IDs are unique');
  assert(customerIds.has('C001') && customerIds.has('C105'), 'Customer ID range includes C001 through C105');

  // 2. Audit Catalogue Products
  console.log('\n2. Auditing Catalogue Products (products.json)...');
  const productsPath = path.join(DATA_DIR, 'products.json');
  const products: ProductItem[] = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  assert(products.length === 812, `Expected 812 catalogue products, found ${products.length}`);

  const productIds = new Set(products.map((p) => p.productId));
  assert(productIds.size === 812, 'All 812 product IDs are unique (zero duplicates)');

  const imageUrls = new Set(products.map((p) => p.imageUrl));
  assert(imageUrls.size === 812, 'All 812 product images are unique (zero image duplicates across products)');

  const productCatCounts: Record<string, number> = {};
  for (const p of products) {
    productCatCounts[p.category] = (productCatCounts[p.category] || 0) + 1;
  }
  const categories = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'traditional'];
  for (const cat of categories) {
    assert(productCatCounts[cat] === 116, `Category '${cat}' has exactly 116 products (${productCatCounts[cat]})`);
  }

  // 3. Audit Wardrobe Records
  console.log('\n3. Auditing Wardrobe Records (wardrobes.json)...');
  const wardrobesPath = path.join(DATA_DIR, 'wardrobes.json');
  const wardrobes: WardrobeItem[] = JSON.parse(fs.readFileSync(wardrobesPath, 'utf8'));
  assert(wardrobes.length === 73500, `Expected exactly 73,500 wardrobe records, found ${wardrobes.length}`);

  const wardrobeIds = new Set(wardrobes.map((w) => w.itemId));
  assert(wardrobeIds.size === 73500, 'All 73,500 wardrobe item IDs are unique');

  // Verify per-persona breakdown (700 items per persona, 100 per category)
  const personaItemCounts: Record<string, Record<string, number>> = {};
  let legacyCount = 0;
  let customCount = 0;

  for (const w of wardrobes) {
    if (!personaItemCounts[w.customerId]) {
      personaItemCounts[w.customerId] = {};
    }
    personaItemCounts[w.customerId][w.category] = (personaItemCounts[w.customerId][w.category] || 0) + 1;

    // Check legacy fields (plural occasions/seasons or lastWorn or missing standard arrays)
    if (
      w.occasions !== undefined ||
      w.seasons !== undefined ||
      w.lastWorn !== undefined ||
      !Array.isArray(w.styleTags) ||
      !Array.isArray(w.occasion) ||
      !Array.isArray(w.season) ||
      !w.dateAcquired
    ) {
      legacyCount++;
    }
    if (w.isCustom) {
      customCount++;
    }
  }

  assert(Object.keys(personaItemCounts).length === 105, 'Wardrobe records span all 105 personas');

  let allPersonasBalanced = true;
  for (let i = 1; i <= 105; i++) {
    const cid = `C${String(i).padStart(3, '0')}`;
    const counts = personaItemCounts[cid];
    if (!counts) {
      allPersonasBalanced = false;
      break;
    }
    for (const cat of categories) {
      if (counts[cat] !== 100) {
        allPersonasBalanced = false;
        break;
      }
    }
  }
  assert(allPersonasBalanced, 'All 105 personas have exactly 700 items (exactly 100 per category)');
  assert(legacyCount === 0, 'Zero legacy schema records found (all 73,500 normalized into standard schema)');
  assert(customCount >= 50, `Custom garments preserved (${customCount} custom items with isCustom: true)`);

  // 4. Audit Purchase History
  console.log('\n4. Auditing Purchase History (purchases.json)...');
  const purchasesPath = path.join(DATA_DIR, 'purchases.json');
  const purchases: PurchaseItem[] = JSON.parse(fs.readFileSync(purchasesPath, 'utf8'));
  assert(purchases.length === 4095, `Expected 4,095 purchase records, found ${purchases.length}`);

  const purchaseCustomerMap = new Map<string, number>();
  for (const p of purchases) {
    purchaseCustomerMap.set(p.customerId, (purchaseCustomerMap.get(p.customerId) || 0) + 1);
  }
  assert(purchaseCustomerMap.size === 105, 'Purchase records cover all 105 demo personas');

  let purchasesInRange = true;
  for (let i = 1; i <= 105; i++) {
    const cid = `C${String(i).padStart(3, '0')}`;
    const count = purchaseCustomerMap.get(cid) || 0;
    if (count < 20 || count > 60) {
      purchasesInRange = false;
      break;
    }
  }
  assert(purchasesInRange, 'Every demo persona has 20–60 realistic purchase records');

  // 5. Audit Browsing Telemetry
  console.log('\n5. Auditing Browsing Telemetry (browsing_history.json)...');
  const browsingPath = path.join(DATA_DIR, 'browsing_history.json');
  const browsing: BrowsingItem[] = JSON.parse(fs.readFileSync(browsingPath, 'utf8'));
  assert(browsing.length === 5195, `Expected 5,195 browsing telemetry records, found ${browsing.length}`);

  const browsingCustomerMap = new Map<string, number>();
  const eventTypeCounts: Record<string, number> = {};
  for (const b of browsing) {
    browsingCustomerMap.set(b.customerId, (browsingCustomerMap.get(b.customerId) || 0) + 1);
    eventTypeCounts[b.eventType] = (eventTypeCounts[b.eventType] || 0) + 1;
  }
  assert(browsingCustomerMap.size === 105, 'Browsing records cover all 105 demo personas');

  const requiredEvents = ['VIEW', 'CLICK', 'SEARCH', 'SAVE', 'WISHLIST', 'ADD_TO_WARDROBE', 'REMOVE_FROM_WISHLIST'];
  let allEventsPresent = true;
  for (const evt of requiredEvents) {
    if (!eventTypeCounts[evt] || eventTypeCounts[evt] <= 0) {
      allEventsPresent = false;
    }
  }
  assert(allEventsPresent, `All 7 required event types present (${Object.keys(eventTypeCounts).join(', ')})`);

  // 6. Test In-Memory MongoDB Seeding and Chunked Insertion
  console.log('\n6. Testing Database Seeding & In-Memory MongoDB Validation...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('wardrobe_agent_test');

  const productsColl = db.collection('products');
  const wardrobesColl = db.collection('wardrobes');
  const purchasesColl = db.collection('purchases');
  const browsingColl = db.collection('browsing_history');
  const customersColl = db.collection('customers');

  // Insert products
  await productsColl.insertMany(products);
  const dbProdCount = await productsColl.countDocuments();
  assert(dbProdCount === 812, 'MongoDB products collection holds 812 documents');

  // Insert wardrobes in chunks of 5000
  const CHUNK_SIZE = 5000;
  for (let i = 0; i < wardrobes.length; i += CHUNK_SIZE) {
    const chunk = wardrobes.slice(i, i + CHUNK_SIZE);
    await wardrobesColl.insertMany(chunk);
  }
  const dbWardrobeCount = await wardrobesColl.countDocuments();
  assert(dbWardrobeCount === 73500, 'MongoDB wardrobes collection holds 73,500 documents');

  // Insert purchases and browsing
  for (let i = 0; i < purchases.length; i += CHUNK_SIZE) {
    await purchasesColl.insertMany(purchases.slice(i, i + CHUNK_SIZE));
  }
  const dbPurchaseCount = await purchasesColl.countDocuments();
  assert(dbPurchaseCount === 4095, 'MongoDB purchases collection holds 4,095 documents');

  for (let i = 0; i < browsing.length; i += CHUNK_SIZE) {
    await browsingColl.insertMany(browsing.slice(i, i + CHUNK_SIZE));
  }
  const dbBrowsingCount = await browsingColl.countDocuments();
  assert(dbBrowsingCount === 5195, 'MongoDB browsing_history collection holds 5,195 documents');

  await customersColl.insertMany(customers);
  const dbCustCount = await customersColl.countDocuments();
  assert(dbCustCount === 105, 'MongoDB customers collection holds 105 documents');

  await client.close();
  await mongod.stop();

  // 7. Test Recommendation 6-Signal Scoring Engine and Duplicate Prevention
  console.log('\n7. Testing 6-Signal Weighted Formula & Duplicate Prevention...');
  const { scoreProductCandidate } = await import('../src/tools/scoringTools.js');

  const dummyProduct: any = {
    productId: 'P_TEST',
    name: 'Test Shirt',
    category: 'top',
    subcategory: 'shirt',
    color: 'blue',
    styleTags: ['casual', 'minimalist'],
    occasion: ['workwear'],
    season: ['summer'],
    price: 2000,
    originalPrice: 2000,
    store: 'Zara',
    imageUrl: 'https://example.com/test.jpg',
    available: true,
  };

  const dummyCustomer: any = {
    customerId: 'C001',
    name: 'Test Customer',
    avatar: 'https://example.com/avatar.jpg',
    preferredColors: ['blue'],
    preferredOccasions: ['workwear'],
    preferredStyles: ['casual', 'minimalist'],
    budget: 3000,
    currentSeason: 'summer',
  };

  const dummyGaps: any[] = [
    { category: 'top', priorityScore: 90 },
  ];

  const scored = scoreProductCandidate(
    dummyProduct,
    dummyCustomer,
    dummyGaps,
    [],
    0.8,
    { preferredStores: ['Zara'], averagePrice: 2000 },
    { recentViewedSubcategories: ['shirt'] }
  );

  assert(scored.score > 0, `Candidate scored successfully: score = ${scored.score}`);
  assert(scored.scoreBreakdown.gapScore !== undefined, `gapScore present in score breakdown (${scored.scoreBreakdown.gapScore})`);
  assert(scored.scoreBreakdown.profileScore !== undefined, `profileScore present in score breakdown (${scored.scoreBreakdown.profileScore})`);
  assert(scored.scoreBreakdown.purchaseScore !== undefined, `purchaseScore present in score breakdown (${scored.scoreBreakdown.purchaseScore})`);
  assert(scored.scoreBreakdown.browsingScore !== undefined, `browsingScore present in score breakdown (${scored.scoreBreakdown.browsingScore})`);
  assert(scored.scoreBreakdown.seasonalScore !== undefined, `seasonalScore present in score breakdown (${scored.scoreBreakdown.seasonalScore})`);
  assert(scored.scoreBreakdown.styleScore !== undefined, `styleScore present in score breakdown (${scored.scoreBreakdown.styleScore})`);

  // Test duplicate detection penalty
  const duplicateScored = scoreProductCandidate(
    dummyProduct,
    dummyCustomer,
    dummyGaps,
    [{ category: 'top', subcategory: 'shirt', color: 'blue' } as any]
  );
  assert(
    duplicateScored.scoreBreakdown.duplicatePenalty < 0,
    `Duplicate product received duplicate penalty (${duplicateScored.scoreBreakdown.duplicatePenalty})`
  );

  // 8. Test Security Isolation Logic
  console.log('\n8. Testing User Security Isolation Middleware Logic...');
  const { requireOwnerOrAdmin } = await import('../src/middleware/auth.middleware.js');
  let blocked = false;
  const mockReqA: any = {
    user: { userId: 'usr_A', customerId: 'C002', role: 'user' },
    params: { customerId: 'C001' },
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 403) blocked = true;
      },
    }),
  };
  const mockNext = () => {};

  try {
    requireOwnerOrAdmin(mockReqA, mockRes, mockNext);
  } catch (err: any) {
    if (err?.statusCode === 403) {
      blocked = true;
    }
  }
  assert(blocked, 'Unauthorized cross-user access (C002 requesting C001) blocked with 403 Forbidden');

  let adminAllowed = false;
  const mockReqAdmin: any = {
    user: { userId: 'admin_root', customerId: 'admin_root', role: 'admin' },
    params: { customerId: 'C001' },
  };
  requireOwnerOrAdmin(mockReqAdmin, mockRes, () => {
    adminAllowed = true;
  });
  assert(adminAllowed, 'Admin authorized to access customer data across all users');

  console.log('\n====================================================');
  if (passed) {
    console.log('  ALL AUDIT CHECKS PASSED PERFECTLY! [100% SUCCESS]');
  } else {
    console.error('  SOME AUDIT CHECKS FAILED. PLEASE REVIEW LOGS.');
    process.exit(1);
  }
  console.log('====================================================\n');
}

runAudit().catch((err) => {
  console.error('Audit crashed with error:', err);
  process.exit(1);
});
