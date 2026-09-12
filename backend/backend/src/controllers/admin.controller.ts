import { Request, Response, NextFunction } from 'express';
import { auditDataset, repairDataset, validateImageUrl } from '../services/dataset.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getDatasetAuditHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await auditDataset();
    return sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

export async function postDatasetRepairHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await repairDataset();
    return sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

export async function postValidateImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = req.body;
    const result = await validateImageUrl(url);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
