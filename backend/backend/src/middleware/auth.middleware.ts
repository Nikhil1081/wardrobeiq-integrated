import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/response.js';

const JWT_SECRET = env.JWT_SECRET || 'wardrobeiq-secret-jwt-key-2026-production';

export interface AuthPayload {
  userId: string;
  customerId?: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
  }

  const token = authHeader.split(' ')[1];

  // Support demo token fallback for direct offline/demo switching
  if (token.startsWith('demo_token_')) {
    const custId = token.replace('demo_token_', '');
    req.user = {
      userId: custId,
      customerId: custId,
      email: `${custId.toLowerCase()}@wardrobeiq.demo`,
      role: custId === 'admin_root' || custId === 'admin' ? 'admin' : 'demo',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired authentication token.');
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token.startsWith('demo_token_')) {
      const custId = token.replace('demo_token_', '');
      req.user = {
        userId: custId,
        customerId: custId,
        email: `${custId.toLowerCase()}@wardrobeiq.demo`,
        role: custId === 'admin_root' || custId === 'admin' ? 'admin' : 'demo',
      };
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      req.user = decoded;
    } catch {
      // Ignore token error for optional auth
    }
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    throw ApiError.forbidden('Admin privileges required to perform this action.');
  }
  next();
}

export function requireOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required.');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const targetId = req.params.customerId || req.params.userId || req.body?.customerId;
  const userCustomerId = req.user.customerId || req.user.userId;

  if (targetId && userCustomerId && targetId !== userCustomerId && targetId !== req.user.userId) {
    throw ApiError.forbidden('Access denied. You cannot access or modify another user\'s wardrobe or data.');
  }

  next();
}

