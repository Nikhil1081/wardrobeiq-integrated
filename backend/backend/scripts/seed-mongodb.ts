import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from '../src/db/mongo.js';
import { createIndexes } from '../src/db/indexes.js';
import {
  getProductsCollection,
  getCustomersCollection,
  getWardrobesCollection,
  getBrowsingHistoryCollection,
  getOffersCollection,
  getUsersCollection,
} from '../src/db/collections.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

async function seedMongoDB() {
  const isClean = process.argv.includes('--clean');
  logger.info(`Starting MongoDB Seeder (cleanMode: ${isClean})...`);

  try {
    await connectDB();
    await createIndexes();

    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
    const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf-8'));
    const wardrobes = JSON.parse(fs.readFileSync(path.join(dataDir, 'wardrobes.json'), 'utf-8'));
    const browsing = JSON.parse(fs.readFileSync(path.join(dataDir, 'browsing_history.json'), 'utf-8'));
    const offers = JSON.parse(fs.readFileSync(path.join(dataDir, 'offers.json'), 'utf-8'));
    const users = fs.existsSync(path.join(dataDir, 'users.json'))
      ? JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'))
      : [];

    // Collections
    const productsCol = getProductsCollection();
    const customersCol = getCustomersCollection();
    const wardrobesCol = getWardrobesCollection();
    const browsingCol = getBrowsingHistoryCollection();
    const offersCol = getOffersCollection();
    const usersCol = getUsersCollection();

    if (isClean) {
      logger.info('Wiping existing data for clean seed...');
      await Promise.all([
        productsCol.deleteMany({}),
        customersCol.deleteMany({}),
        wardrobesCol.deleteMany({}),
        browsingCol.deleteMany({}),
        offersCol.deleteMany({}),
        usersCol.deleteMany({}),
      ]);
    }

    // Upsert Products
    logger.info(`Seeding ${products.length} products...`);
    for (const p of products) {
      await productsCol.updateOne({ productId: p.productId }, { $set: p }, { upsert: true });
    }

    // Upsert Customers
    logger.info(`Seeding ${customers.length} customers...`);
    for (const c of customers) {
      await customersCol.updateOne({ customerId: c.customerId }, { $set: c }, { upsert: true });
    }

    // Upsert Wardrobes
    logger.info(`Seeding ${wardrobes.length} wardrobe records...`);
    for (const w of wardrobes) {
      await wardrobesCol.updateOne({ itemId: w.itemId }, { $set: w }, { upsert: true });
    }

    // Upsert Browsing Telemetry
    logger.info(`Seeding ${browsing.length} browsing telemetry records...`);
    for (const b of browsing) {
      await browsingCol.updateOne(
        { customerId: b.customerId, productId: b.productId, eventType: b.eventType },
        { $set: b },
        { upsert: true }
      );
    }

    // Upsert Offers
    logger.info(`Seeding ${offers.length} promotional offers...`);
    for (const o of offers) {
      await offersCol.updateOne({ offerId: o.offerId }, { $set: o }, { upsert: true });
    }

    // Upsert Demo Users
    if (users.length > 0) {
      logger.info(`Seeding ${users.length} authenticated users...`);
      for (const u of users) {
        await usersCol.updateOne({ email: u.email }, { $set: u }, { upsert: true });
      }
    }

    logger.info('=============================================');
    logger.info('MONGODB ATLAS SEED COMPLETED SUCCESSFULLY!');
    logger.info(`- Products in DB: ${await productsCol.countDocuments()}`);
    logger.info(`- Customers in DB: ${await customersCol.countDocuments()}`);
    logger.info(`- Wardrobe items in DB: ${await wardrobesCol.countDocuments()}`);
    logger.info(`- Users in DB: ${await usersCol.countDocuments()}`);
    logger.info(`- Browsing events in DB: ${await browsingCol.countDocuments()}`);
    logger.info(`- Offers in DB: ${await offersCol.countDocuments()}`);
    logger.info('=============================================');
  } catch (err) {
    logger.error('Error seeding MongoDB Atlas', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seedMongoDB();
