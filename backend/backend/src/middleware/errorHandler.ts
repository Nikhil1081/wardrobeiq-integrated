import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

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
  logger.error(`Unhandled request error at ${req.method} ${req.originalUrl}`, err);

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Handle common MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    return sendError(res, 409, 'CONFLICT', 'Resource already exists with the provided unique identifier');
  }

  // Standard safe 500 without stack trace exposure
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred. Please try again later.');
}
