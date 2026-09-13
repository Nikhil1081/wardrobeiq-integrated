import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', '..', 'data');

function matchesFilter(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      if (!val.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(val)) {
      if (!val.every((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }

    const docVal = doc[key];

    if (val !== null && typeof val === 'object' && !(val instanceof RegExp)) {
      const opVal = val as Record<string, any>;
      // Operators: $in, $nin, $gte, $lte, $gt, $lt, $ne, $regex, $exists
      if ('$in' in opVal && Array.isArray(opVal.$in)) {
        if (Array.isArray(docVal)) {
          if (!docVal.some((item) => opVal.$in.includes(item))) return false;
        } else if (!opVal.$in.includes(docVal)) {
          return false;
        }
        continue;
      }
      if ('$nin' in opVal && Array.isArray(opVal.$nin)) {
        if (opVal.$nin.includes(docVal)) return false;
        continue;
      }
      if ('$ne' in opVal) {
        if (docVal === opVal.$ne) return false;
        continue;
      }
      if ('$exists' in opVal) {
        const exists = docVal !== undefined;
        if (exists !== Boolean(opVal.$exists)) return false;
        continue;
      }
      if ('$gte' in opVal && !(docVal >= opVal.$gte)) return false;
      if ('$lte' in opVal && !(docVal <= opVal.$lte)) return false;
      if ('$gt' in opVal && !(docVal > opVal.$gt)) return false;
      if ('$lt' in opVal && !(docVal < opVal.$lt)) return false;
      if ('$regex' in opVal) {
        const regex = opVal.$regex instanceof RegExp ? opVal.$regex : new RegExp(String(opVal.$regex), 'i');
        if (!regex.test(String(docVal ?? ''))) return false;
        continue;
      }
      continue;
    }

    if (val instanceof RegExp) {
      if (!val.test(String(docVal ?? ''))) return false;
      continue;
    }

    // Direct scalar match or array contains scalar match (MongoDB behavior for array fields)
    if (Array.isArray(docVal)) {
      if (!docVal.includes(val)) return false;
    } else if (docVal !== val) {
      return false;
    }
  }

  return true;
}

export class InMemoryCursor<T = any> {
  private items: T[];
  private _limit?: number;
  private _skip: number = 0;
  private _sort?: Record<string, 1 | -1>;
  private _project?: Record<string, 0 | 1>;

  constructor(items: T[]) {
    this.items = items;
  }

  sort(sortSpec: Record<string, 1 | -1>): this {
    this._sort = sortSpec;
    return this;
  }

  skip(n: number): this {
    this._skip = Math.max(0, n);
    return this;
  }

  limit(n: number): this {
    this._limit = Math.max(0, n);
    return this;
  }

  project(projSpec: Record<string, 0 | 1>): this {
    this._project = projSpec;
    return this;
  }

  async toArray(): Promise<T[]> {
    let res = [...this.items];

    if (this._sort) {
      const entries = Object.entries(this._sort);
      res.sort((a: any, b: any) => {
        for (const [k, dir] of entries) {
          const valA = a[k];
          const valB = b[k];
          if (valA === valB) continue;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          return valA > valB ? dir : -dir;
        }
        return 0;
      });
    }

    if (this._skip > 0) {
      res = res.slice(this._skip);
    }

    if (this._limit !== undefined) {
      res = res.slice(0, this._limit);
    }

    if (this._project) {
      res = res.map((item: any) => {
        const copy = { ...item };
        for (const [k, v] of Object.entries(this._project!)) {
          if (v === 0) delete copy[k];
        }
        return copy;
      });
    }

    return res;
  }
}

export class InMemoryCollection<T extends Record<string, any> = any> {
  public readonly collectionName: string;
  private documents: T[] = [];

  constructor(collectionName: string, initialDocs: T[] = []) {
    this.collectionName = collectionName;
    this.documents = initialDocs.map((d) => ({ ...d }));
  }

  find(filter: any = {}): InMemoryCursor<T> {
    const matched = this.documents.filter((doc) => matchesFilter(doc, filter));
    return new InMemoryCursor<T>(matched);
  }

  async findOne(filter: any = {}): Promise<T | null> {
    const doc = this.documents.find((d) => matchesFilter(d, filter));
    return doc ? { ...doc } : null;
  }

  async countDocuments(filter: any = {}): Promise<number> {
    if (!filter || Object.keys(filter).length === 0) {
      return this.documents.length;
    }
    return this.documents.filter((d) => matchesFilter(d, filter)).length;
  }

  async insertOne(doc: T): Promise<{ acknowledged: boolean; insertedId: any }> {
    const toInsert = {
      _id: (doc as any)._id || (doc as any).userId || (doc as any).productId || (doc as any).itemId || `id_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...doc,
    };
    this.documents.push(toInsert as T);
    return { acknowledged: true, insertedId: toInsert._id };
  }

  async insertMany(docs: T[], options?: any): Promise<{ acknowledged: boolean; insertedCount: number }> {
    let count = 0;
    for (const d of docs) {
      const toInsert = {
        _id: (d as any)._id || (d as any).userId || (d as any).productId || (d as any).itemId || `id_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ...d,
      };
      this.documents.push(toInsert as T);
      count++;
    }
    return { acknowledged: true, insertedCount: count };
  }

  async updateOne(filter: any, update: any, options?: { upsert?: boolean }): Promise<{ acknowledged: boolean; modifiedCount: number; matchedCount: number; upsertedId?: any }> {
    const idx = this.documents.findIndex((d) => matchesFilter(d, filter));
    if (idx !== -1) {
      const target = this.documents[idx];
      if (update.$set) {
        Object.assign(target, update.$set);
      }
      if (update.$inc) {
        for (const [k, n] of Object.entries(update.$inc)) {
          (target as any)[k] = ((target as any)[k] || 0) + Number(n);
        }
      }
      if (update.$push) {
        for (const [k, item] of Object.entries(update.$push)) {
          if (!Array.isArray((target as any)[k])) (target as any)[k] = [];
          (target as any)[k].push(item);
        }
      }
      return { acknowledged: true, modifiedCount: 1, matchedCount: 1 };
    }

    if (options?.upsert) {
      const newDoc = {
        ...filter,
        ...(update.$set || {}),
        _id: `id_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      };
      this.documents.push(newDoc);
      return { acknowledged: true, modifiedCount: 0, matchedCount: 0, upsertedId: newDoc._id };
    }

    return { acknowledged: true, modifiedCount: 0, matchedCount: 0 };
  }

  async updateMany(filter: any, update: any): Promise<{ acknowledged: boolean; modifiedCount: number; matchedCount: number }> {
    let modified = 0;
    let matched = 0;
    for (const d of this.documents) {
      if (matchesFilter(d, filter)) {
        matched++;
        if (update.$set) {
          Object.assign(d, update.$set);
          modified++;
        }
      }
    }
    return { acknowledged: true, modifiedCount: modified, matchedCount: matched };
  }

  async deleteOne(filter: any): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const idx = this.documents.findIndex((d) => matchesFilter(d, filter));
    if (idx !== -1) {
      this.documents.splice(idx, 1);
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteMany(filter: any = {}): Promise<{ acknowledged: boolean; deletedCount: number }> {
    if (!filter || Object.keys(filter).length === 0) {
      const count = this.documents.length;
      this.documents = [];
      return { acknowledged: true, deletedCount: count };
    }
    const initial = this.documents.length;
    this.documents = this.documents.filter((d) => !matchesFilter(d, filter));
    return { acknowledged: true, deletedCount: initial - this.documents.length };
  }

  aggregate(pipeline: any[] = []): { toArray(): Promise<any[]> } {
    return {
      toArray: async () => {
        let results = [...this.documents];
        for (const stage of pipeline) {
          if (stage.$group) {
            const groupKey = stage.$group._id?.replace(/^\$/, '');
            const groups = new Map<any, number>();
            for (const doc of results) {
              const k = groupKey ? (doc as any)[groupKey] : 'all';
              groups.set(k, (groups.get(k) || 0) + 1);
            }
            results = Array.from(groups.entries()).map(([k, count]) => ({
              _id: k,
              count,
            })) as any;
          }
        }
        return results;
      },
    };
  }

  async createIndex(spec: any, options?: any): Promise<string> {
    return 'in_memory_index_ok';
  }
}

export class InMemoryDb {
  private collections = new Map<string, InMemoryCollection>();

  constructor() {
    this.initDefaultCollections();
  }

  private initDefaultCollections() {
    const loadJson = (filename: string): any[] => {
      const filePath = path.join(dataDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
          logger.warn(`Could not parse JSON for ${filename}`, { error: String(e) });
        }
      }
      return [];
    };

    logger.info('Initializing High-Performance In-Memory MongoDB Engine from JSON datasets...');
    this.collections.set('products', new InMemoryCollection('products', loadJson('products.json')));
    this.collections.set('customers', new InMemoryCollection('customers', loadJson('customers.json')));
    this.collections.set('wardrobes', new InMemoryCollection('wardrobes', loadJson('wardrobes.json')));
    this.collections.set('purchases', new InMemoryCollection('purchases', loadJson('purchases.json')));
    this.collections.set('browsing_history', new InMemoryCollection('browsing_history', loadJson('browsing_history.json')));
    this.collections.set('users', new InMemoryCollection('users', loadJson('users.json')));
    this.collections.set('offers', new InMemoryCollection('offers', loadJson('offers.json')));

    this.collections.set('saved_items', new InMemoryCollection('saved_items', []));
    this.collections.set('saved_outfits', new InMemoryCollection('saved_outfits', []));
    this.collections.set('feedback', new InMemoryCollection('feedback', []));
    this.collections.set('outfit_history', new InMemoryCollection('outfit_history', []));
    this.collections.set('ai_conversations', new InMemoryCollection('ai_conversations', []));

    logger.info('In-Memory MongoDB Engine successfully initialized with all datasets.');
  }

  collection<T extends Record<string, any> = any>(name: string): any {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection<T>(name, []));
    }
    return this.collections.get(name) as InMemoryCollection<T>;
  }

  async command(cmd: any): Promise<{ ok: number }> {
    return { ok: 1 };
  }
}

let inMemoryDbSingleton: InMemoryDb | null = null;

export function getInMemoryDb(): InMemoryDb {
  if (!inMemoryDbSingleton) {
    inMemoryDbSingleton = new InMemoryDb();
  }
  return inMemoryDbSingleton;
}
