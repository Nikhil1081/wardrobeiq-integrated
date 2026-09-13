import { Request, Response, NextFunction } from 'express';
import {
  getExploreCollectionsService,
  getExploreProductsService,
  addProductToWardrobeService,
  recordExploreInteractionService,
} from '../services/explore.service.js';
import { sendSuccess, ApiError } from '../utils/response.js';

export async function getExploreHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await getExploreCollectionsService();
    return sendSuccess(res, collections);
  } catch (err) {
    next(err);
  }
}

export async function getExploreProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getExploreProductsService(req.query as any);
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

export async function postAddToWardrobeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.customerId || req.user?.userId || req.body?.customerId;
    if (!customerId) {
      throw ApiError.unauthorized('Authentication required to add items to your wardrobe.');
    }
    const { productId } = req.body;
    if (!productId) {
      throw ApiError.badRequest('Product ID is required.');
    }
    const item = await addProductToWardrobeService(customerId, productId);
    return sendSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function postExploreInteractHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.customerId || req.user?.userId || req.body?.customerId || 'guest';
    const result = await recordExploreInteractionService(customerId, req.body);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
