import { Request, Response, NextFunction } from 'express';
import {
  getSavedItemsService,
  saveProductService,
  removeSavedProductService,
} from '../services/saved.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getSavedItemsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const data = await getSavedItemsService(customerId);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function saveProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId || req.body?.customerId);
    const productId = String(req.params.productId || req.body?.productId);
    const result = await saveProductService(customerId, productId);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function removeSavedProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId || req.body?.customerId || req.query?.customerId);
    const productId = String(req.params.productId || req.body?.productId || req.query?.productId);
    const result = await removeSavedProductService(customerId, productId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
