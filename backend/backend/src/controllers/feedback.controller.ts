import { Request, Response, NextFunction } from 'express';
import { recordFeedbackService, getCustomerFeedbackService } from '../services/feedback.service.js';
import { sendSuccess } from '../utils/response.js';

export async function recordFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, productId, type } = req.body;
    const result = await recordFeedbackService(customerId, productId, type);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const result = await getCustomerFeedbackService(customerId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
