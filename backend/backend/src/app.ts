import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import v1Router from './routes/v1/index.js';
import legacyRouter from './routes/legacyCompat.routes.js';
import { sanitizeMongoInput } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // allow flexible development asset loading
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.endsWith('.onrender.com')
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsing & Sanitization
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(sanitizeMongoInput);

  // Request Logging
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // Health check endpoints
  const healthCheckHandler = (req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  };
  app.get('/health', healthCheckHandler);
  app.get('/api/v1/health', healthCheckHandler);

  // API Routes
  app.use('/api/v1', v1Router);
  app.use('/api', legacyRouter);

  // Serve frontend static build if available (single-service production hosting)
  const possibleDistPaths = [
    path.resolve(__dirname, '..', '..', '..', 'frontend', 'frontend', 'dist'),
    path.resolve(process.cwd(), '..', '..', 'frontend', 'frontend', 'dist'),
    path.resolve(__dirname, '..', 'public'),
    path.resolve(process.cwd(), 'public'),
  ];
  const frontendDistPath = possibleDistPaths.find((p) => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

  if (frontendDistPath) {
    logger.info(`Serving static frontend build from: ${frontendDistPath}`);
    app.use(express.static(frontendDistPath));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  // 404 Catch-all
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
