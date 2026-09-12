import { Request, Response, NextFunction } from 'express';
import { recordBrowsingEventService, getCustomerBrowsingService } from '../services/browsing.service.js';
import { sendSuccess } from '../utils/response.js';

export async function recordBrowsingEventHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, productId, eventType, timestamp } = req.body;
    const doc = await recordBrowsingEventService(customerId, productId, eventType, timestamp);
    return sendSuccess(res, doc, 201);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerBrowsingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const data = await getCustomerBrowsingService(customerId);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
