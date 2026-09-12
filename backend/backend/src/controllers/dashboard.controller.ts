import { Request, Response, NextFunction } from 'express';
import { getHomeDashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const dashboard = await getHomeDashboardService(customerId);
    return sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}
