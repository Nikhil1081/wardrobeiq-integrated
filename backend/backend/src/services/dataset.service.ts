import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProductsCollection, getWardrobesCollection, getCustomersCollection, getUsersCollection } from '../db/collections.js';
import { computeImageHash } from '../utils/imageHasher.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', '..', 'data');

export interface DatasetAuditReport {
  totalProducts: number;
  totalWardrobeItems: number;
  totalUsers: number;
  uniqueProductImages: number;
  uniqueWardrobeImages: number;
  duplicateProductImageGroups: number;
  duplicateWardrobeImageGroups: number;
  imageQualityScore: number; // 0 - 100%
  categoryCounts: Record<string, number>;
  traditionalItemsCount: number;
  status: 'OPTIMAL' | 'REPAIR_NEEDED' | 'REPAIRED';
  timestamp: string;
}

export async function auditDataset(): Promise<DatasetAuditReport> {
  const productsCol = getProductsCollection();
  const wardrobesCol = getWardrobesCollection();
  const usersCol = getUsersCollection();

  const products = await productsCol.find({}).toArray();
  const wardrobes = await wardrobesCol.find({}).toArray();
  const usersCount = await usersCol.countDocuments();

  const productHashes = new Map<string, number>();
  const categoryCounts: Record<string, number> = {};
  let traditionalCount = 0;

  for (const p of products) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    if (p.isTraditional || p.category === 'traditional') traditionalCount++;
    if (p.imageUrl) {
      const hash = p.imageHash || computeImageHash(p.imageUrl);
      productHashes.set(hash, (productHashes.get(hash) || 0) + 1);
    }
  }

  const wardrobeHashes = new Map<string, number>();
  for (const w of wardrobes) {
    if (w.isTraditional || w.category === 'traditional') traditionalCount++;
    if (w.imageUrl) {
      const hash = w.imageHash || computeImageHash(w.imageUrl);
      wardrobeHashes.set(hash, (wardrobeHashes.get(hash) || 0) + 1);
    }
  }

  const dupProductGroups = Array.from(productHashes.values()).filter((c) => c > 1).length;
  const dupWardrobeGroups = Array.from(wardrobeHashes.values()).filter((c) => c > 1).length;

  const uniqueProductRatio = products.length > 0 ? productHashes.size / products.length : 1;
  const qualityScore = Math.min(100, Math.round(uniqueProductRatio * 100));

  return {
    totalProducts: products.length,
    totalWardrobeItems: wardrobes.length,
    totalUsers: usersCount,
    uniqueProductImages: productHashes.size,
    uniqueWardrobeImages: wardrobeHashes.size,
    duplicateProductImageGroups: dupProductGroups,
    duplicateWardrobeImageGroups: dupWardrobeGroups,
    imageQualityScore: qualityScore,
    categoryCounts,
    traditionalItemsCount: traditionalCount,
    status: qualityScore >= 95 ? 'OPTIMAL' : 'REPAIR_NEEDED',
    timestamp: new Date().toISOString(),
  };
}

export async function validateImageUrl(url: string): Promise<{
  valid: boolean;
  format?: string;
  reason?: string;
}> {
  if (!url || !url.startsWith('http')) {
    return { valid: false, reason: 'URL must start with http:// or https://' };
  }

  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) {
      return { valid: false, reason: `HTTP status ${res.status}: ${res.statusText}` };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      return { valid: false, reason: `Expected image content-type, got: ${contentType}` };
    }
    return { valid: true, format: contentType };
  } catch (err: any) {
    return { valid: false, reason: err?.message || 'Network unreachable' };
  }
}

export async function repairDataset(): Promise<DatasetAuditReport> {
  const productsCol = getProductsCollection();
  const wardrobesCol = getWardrobesCollection();
  const customersCol = getCustomersCollection();
  const usersCol = getUsersCollection();

  logger.info('Executing dataset repair and re-synchronization...');

  const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
  const wardrobes = JSON.parse(fs.readFileSync(path.join(dataDir, 'wardrobes.json'), 'utf8'));
  const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf8'));
  const users = fs.existsSync(path.join(dataDir, 'users.json'))
    ? JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'))
    : [];

  for (const p of products) {
    await productsCol.updateOne(
      { productId: p.productId },
      { $set: p },
      { upsert: true }
    );
  }

  for (const w of wardrobes) {
    await wardrobesCol.updateOne(
      { itemId: w.itemId },
      { $set: w },
      { upsert: true }
    );
  }

  for (const c of customers) {
    await customersCol.updateOne(
      { customerId: c.customerId },
      { $set: c },
      { upsert: true }
    );
  }

  for (const u of users) {
    await usersCol.updateOne(
      { email: u.email },
      { $set: u },
      { upsert: true }
    );
  }

  logger.info('Dataset repair successfully synced to database.');
  const report = await auditDataset();
  report.status = 'REPAIRED';
  return report;
}
