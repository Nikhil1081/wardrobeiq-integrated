import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendError, ApiError } from '../utils/response.js';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err?.statusCode || (err instanceof ApiError || err instanceof AppError ? err.statusCode : 500);

  if (status >= 500) {
    logger.error(`Server error at ${req.method} ${req.originalUrl}: ${err?.message || err}`, {
      name: err?.name,
      code: err?.code,
      statusCode: status,
      stack: err?.stack,
    });
  } else {
    logger.warn(`Client notice [${status}] at ${req.method} ${req.originalUrl}: ${err?.message || err}`);
  }

  // Handle ApiError or AppError or any structured HTTP error
  if (err instanceof ApiError || err instanceof AppError || (err && typeof err.statusCode === 'number')) {
    return sendError(
      res,
      err.statusCode || 400,
      err.code || 'BAD_REQUEST',
      err.message || 'An error occurred while processing your request.',
      err.details
    );
  }

  // Handle common MongoDB duplicate key error (code 11000)
  if (err?.code === 11000) {
    return sendError(res, 409, 'CONFLICT', 'Resource already exists with the provided unique identifier');
  }

  // Fallback for unhandled server exceptions
  const message = err?.message || 'An unexpected error occurred. Please try again later.';
  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    message,
    process.env.NODE_ENV !== 'production' ? { stack: err?.stack } : undefined
  );
}

