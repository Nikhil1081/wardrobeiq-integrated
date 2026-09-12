import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getProductsCollection,
  getCustomersCollection,
  getWardrobesCollection,
  getBrowsingHistoryCollection,
  getOffersCollection,
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

  const count = await productsCol.countDocuments();
  if (count > 0 && !isClean) {
    logger.info(`Database already populated (${count} products). Skipping seed.`);
    return;
  }

  const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
  const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf-8'));
  const wardrobes = JSON.parse(fs.readFileSync(path.join(dataDir, 'wardrobes.json'), 'utf-8'));
  const browsing = JSON.parse(fs.readFileSync(path.join(dataDir, 'browsing_history.json'), 'utf-8'));
  const offers = JSON.parse(fs.readFileSync(path.join(dataDir, 'offers.json'), 'utf-8'));

  if (isClean) {
    logger.info('Wiping existing data for clean seed...');
    await Promise.all([
      productsCol.deleteMany({}),
      customersCol.deleteMany({}),
      wardrobesCol.deleteMany({}),
      browsingCol.deleteMany({}),
      offersCol.deleteMany({}),
    ]);
  }

  logger.info(`Seeding ${products.length} products...`);
  await productsCol.insertMany(products, { ordered: false }).catch(() => {});

  logger.info(`Seeding ${customers.length} customers...`);
  await customersCol.insertMany(customers, { ordered: false }).catch(() => {});

  logger.info(`Seeding ${wardrobes.length} wardrobe records...`);
  await wardrobesCol.insertMany(wardrobes, { ordered: false }).catch(() => {});

  logger.info(`Seeding ${browsing.length} browsing telemetry records...`);
  await browsingCol.insertMany(browsing, { ordered: false }).catch(() => {});

  logger.info(`Seeding ${offers.length} promotional offers...`);
  await offersCol.insertMany(offers, { ordered: false }).catch(() => {});

  logger.info('MongoDB seed completed successfully!');
}
