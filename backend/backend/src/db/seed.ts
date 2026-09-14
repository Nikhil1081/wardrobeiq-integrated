import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getProductsCollection,
  getCustomersCollection,
  getWardrobesCollection,
  getBrowsingHistoryCollection,
  getOffersCollection,
  getUsersCollection,
  getPurchasesCollection,
} from './collections.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', '..', 'data');

export async function seedDatabase(isClean = false): Promise<void> {
  logger.info(`Checking / seeding MongoDB collections (cleanMode: ${isClean})...`);

  const productsCol = getProductsCollection();
  const customersCol = getCustomersCollection();
  const wardrobesCol = getWardrobesCollection();
  const browsingCol = getBrowsingHistoryCollection();
  const offersCol = getOffersCollection();
  const usersCol = getUsersCollection();
  const purchasesCol = getPurchasesCollection();

  const count = await productsCol.countDocuments();
  const wardrobeCount = await wardrobesCol.countDocuments();
  const userCount = await usersCol.countDocuments();
  const purchaseCount = await purchasesCol.countDocuments();

  const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
  const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf-8'));
  const wardrobes = JSON.parse(fs.readFileSync(path.join(dataDir, 'wardrobes.json'), 'utf-8'));
  const browsing = JSON.parse(fs.readFileSync(path.join(dataDir, 'browsing_history.json'), 'utf-8'));
  const offers = JSON.parse(fs.readFileSync(path.join(dataDir, 'offers.json'), 'utf-8'));
  const purchases = fs.existsSync(path.join(dataDir, 'purchases.json'))
    ? JSON.parse(fs.readFileSync(path.join(dataDir, 'purchases.json'), 'utf-8'))
    : [];
  const users = fs.existsSync(path.join(dataDir, 'users.json'))
    ? JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'))
    : [];

  if (count >= 800 && wardrobeCount === wardrobes.length && userCount >= 106 && purchaseCount > 0 && !isClean) {
    logger.info(`Database already fully populated (${count} products, ${wardrobeCount} wardrobes, ${userCount} users, ${purchaseCount} purchases). Skipping seed.`);
    return;
  }

  const shouldWipe = isClean || wardrobeCount !== wardrobes.length || count < 800;

  if (shouldWipe) {
    logger.info('Wiping collections for complete synchronized seed...');
    await Promise.all([
      productsCol.deleteMany({}),
      customersCol.deleteMany({}),
      wardrobesCol.deleteMany({}),
      browsingCol.deleteMany({}),
      offersCol.deleteMany({}),
      usersCol.deleteMany({}),
      purchasesCol.deleteMany({}),
    ]);
  }

  const currentCount = await productsCol.countDocuments();
  if (currentCount === 0) {
    logger.info(`Seeding ${products.length} products...`);
    await productsCol.insertMany(products, { ordered: false }).catch(() => {});

    logger.info(`Seeding ${customers.length} customers...`);
    await customersCol.insertMany(customers, { ordered: false }).catch(() => {});

    logger.info(`Seeding ${wardrobes.length} wardrobe records in chunks...`);
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < wardrobes.length; i += CHUNK_SIZE) {
      const chunk = wardrobes.slice(i, i + CHUNK_SIZE);
      await wardrobesCol.insertMany(chunk, { ordered: false }).catch(() => {});
    }

    logger.info(`Seeding ${browsing.length} browsing telemetry records in chunks...`);
    for (let i = 0; i < browsing.length; i += CHUNK_SIZE) {
      const chunk = browsing.slice(i, i + CHUNK_SIZE);
      await browsingCol.insertMany(chunk, { ordered: false }).catch(() => {});
    }

    logger.info(`Seeding ${offers.length} promotional offers...`);
    await offersCol.insertMany(offers, { ordered: false }).catch(() => {});

    if (purchases.length > 0) {
      logger.info(`Seeding ${purchases.length} purchases in chunks...`);
      for (let i = 0; i < purchases.length; i += CHUNK_SIZE) {
        const chunk = purchases.slice(i, i + CHUNK_SIZE);
        await purchasesCol.insertMany(chunk, { ordered: false }).catch(() => {});
      }
    }
  }

  const currentUserCount = await usersCol.countDocuments();
  if (users.length > 0 && currentUserCount === 0) {
    logger.info(`Seeding ${users.length} authenticated demo users...`);
    await usersCol.insertMany(users, { ordered: false }).catch(() => {});
  }

  logger.info('MongoDB seed completed successfully!');
}
