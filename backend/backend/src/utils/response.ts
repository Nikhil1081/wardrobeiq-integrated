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
