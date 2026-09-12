import { Request, Response, NextFunction } from 'express';
import {
  getWardrobeService,
  addWardrobeItemService,
  updateWardrobeItemService,
  deleteWardrobeItemService,
} from '../services/wardrobe.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getWardrobeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const result = await getWardrobeService(customerId, req.query as any);
    return sendSuccess(res, result.items, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    next(err);
  }
}

export async function addWardrobeItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const result = await addWardrobeItemService(customerId, req.body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateWardrobeItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const itemId = String(req.params.itemId);
    const result = await updateWardrobeItemService(customerId, itemId, req.body);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function deleteWardrobeItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const itemId = String(req.params.itemId);
    const result = await deleteWardrobeItemService(customerId, itemId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
