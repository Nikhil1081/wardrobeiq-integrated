import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../src/db/mongo.js';
import { createIndexes } from '../src/db/indexes.js';
import {
  getProductsCollection,
  getCustomersCollection,
  getWardrobesCollection,
  getBrowsingHistoryCollection,
  getOffersCollection,
} from '../src/db/collections.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

let mongoServer: MongoMemoryServer;

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri, 'wardrobe_agent_test');
  await createIndexes();

  // Seed baseline test data
  const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
  const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf-8'));
  const wardrobes = JSON.parse(fs.readFileSync(path.join(dataDir, 'wardrobes.json'), 'utf-8'));
  const browsing = JSON.parse(fs.readFileSync(path.join(dataDir, 'browsing_history.json'), 'utf-8'));
  const offers = JSON.parse(fs.readFileSync(path.join(dataDir, 'offers.json'), 'utf-8'));

  await getProductsCollection().insertMany(products);
  await getCustomersCollection().insertMany(customers);
  await getWardrobesCollection().insertMany(wardrobes);
  await getBrowsingHistoryCollection().insertMany(browsing);
  await getOffersCollection().insertMany(offers);
}

export async function teardownTestDB() {
  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
