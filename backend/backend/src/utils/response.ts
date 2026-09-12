import { Response } from 'express';

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, any>): Response {
  const payload: ApiSuccessResponse<T> = { data };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

export function sendError(res: Response, statusCode: number, code: string, message: string, details?: any): Response {
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}

export class ApiError extends Error {
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

  static badRequest(message: string, details?: any) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string, details?: any) {
    return new ApiError(401, 'UNAUTHORIZED', message, details);
  }

  static forbidden(message: string, details?: any) {
    return new ApiError(403, 'FORBIDDEN', message, details);
  }

  static notFound(message: string, details?: any) {
    return new ApiError(404, 'NOT_FOUND', message, details);
  }

  static conflict(message: string, details?: any) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static internal(message: string, details?: any) {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message, details);
  }
}

export const successResponse = sendSuccess;
