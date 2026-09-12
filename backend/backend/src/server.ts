import { createApp } from './app.js';
import { connectDB } from './db/mongo.js';
import { createIndexes } from './db/indexes.js';
import { seedDatabase } from './db/seed.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function startServer() {
  try {
    logger.info('Starting WardrobeIQ Backend Service...');
    
    // Connect to MongoDB Atlas or fallback to embedded engine
    try {
      await connectDB();
    } catch (connErr: any) {
      logger.warn(`Could not connect to external MongoDB at ${env.MONGODB_URI} (${connErr?.message}). Initializing embedded MongoDB server...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await connectDB(memUri, env.MONGODB_DB_NAME);
    }
    
    // Initialize indexes
    await createIndexes();

    // Auto-seed if database is empty
    await seedDatabase();

    const app = createApp();
    const port = env.PORT || 3000;

    app.listen(port, () => {
      logger.info(`WardrobeIQ backend successfully listening on port ${port}`);
      logger.info(`Health check: http://localhost:${port}/health`);
      logger.info(`V1 API Root: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
