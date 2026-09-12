import { MongoClient, Db } from 'mongodb';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnecting = false;

export async function connectDB(customUri?: string, customDbName?: string): Promise<Db> {
  if (dbInstance && client) {
    return dbInstance;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (dbInstance) return dbInstance;
  }

  isConnecting = true;
  const uri = customUri || env.MONGODB_URI;
  const dbName = customDbName || env.MONGODB_DB_NAME;

  try {
    logger.info(`Connecting to MongoDB...`, { dbName });
    client = new MongoClient(uri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: customUri ? 10000 : 2500,
      connectTimeoutMS: customUri ? 10000 : 3000,
    });

    await client.connect();
    dbInstance = client.db(dbName);
    
    // Startup validation ping
    await dbInstance.command({ ping: 1 });
    logger.info(`MongoDB successfully connected to database: ${dbName}`);

    return dbInstance;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error, { uri, dbName });
    client = null;
    dbInstance = null;
    throw error;
  } finally {
    isConnecting = false;
  }
}

export function getDB(): Db {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return dbInstance;
}

export function getClient(): MongoClient | null {
  return client;
}

export async function disconnectDB(): Promise<void> {
  if (client) {
    try {
      await client.close();
      logger.info('MongoDB connection closed gracefully.');
    } catch (err) {
      logger.error('Error closing MongoDB connection', err);
    } finally {
      client = null;
      dbInstance = null;
    }
  }
}

// Graceful shutdown registration
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection...');
  await disconnectDB();
  process.exit(0);
});
