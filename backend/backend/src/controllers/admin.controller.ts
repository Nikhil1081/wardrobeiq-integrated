import { Request, Response, NextFunction } from 'express';
import { auditDataset, repairDataset, validateImageUrl } from '../services/dataset.service.js';
import {
  getAdminDashboardService,
  getAdminClothingService,
  getAdminPurchasesService,
  getAdminBrowsingService,
  getAdminPersonasService,
  getAdminUsersService,
} from '../services/admin.service.js';
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

export async function getAdminDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getAdminDashboardService();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getAdminClothingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getAdminClothingService(req.query as any);
    return sendSuccess(res, result.items, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminPurchasesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getAdminPurchasesService(req.query as any);
    return sendSuccess(res, result.items, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminBrowsingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getAdminBrowsingService(req.query as any);
    return sendSuccess(res, result.items, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminPersonasHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const personas = await getAdminPersonasService(req.query as any);
    return sendSuccess(res, personas);
  } catch (err) {
    next(err);
  }
}

export async function getAdminUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await getAdminUsersService();
    return sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}
