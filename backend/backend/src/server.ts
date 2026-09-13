import { createApp } from './app.js';
import { connectDB } from './db/mongo.js';
import { createIndexes } from './db/indexes.js';
import { seedDatabase } from './db/seed.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function startServer() {
  try {
    logger.info('Starting WardrobeIQ Backend Service...');
    
    // Connect to MongoDB Atlas or fallback to high-performance in-memory engine
    try {
      await connectDB();
      await createIndexes();
      await seedDatabase();
    } catch (dbErr: any) {
      logger.warn(`Database initialization note: ${dbErr?.message}`);
    }

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
