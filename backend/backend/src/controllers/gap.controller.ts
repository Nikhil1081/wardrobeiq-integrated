import { Request, Response, NextFunction } from 'express';
import { getCustomerGapsService, getGapDetailService } from '../services/gap.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getGapsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const gaps = await getCustomerGapsService(customerId);
    return sendSuccess(res, gaps);
  } catch (err) {
    next(err);
  }
}

export async function getGapDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const gapId = String(req.params.gapId);
    const detail = await getGapDetailService(customerId, gapId);
    return sendSuccess(res, detail);
  } catch (err) {
    next(err);
  }
}
