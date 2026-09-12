import { Request, Response, NextFunction } from 'express';
import {
  getOffersForProductService,
  getOffersForCustomerService,
  validateOfferService,
} from '../services/offer.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getProductOffersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = String(req.params.productId);
    const offers = await getOffersForProductService(productId);
    return sendSuccess(res, offers);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerOffersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const offers = await getOffersForCustomerService(customerId);
    return sendSuccess(res, offers);
  } catch (err) {
    next(err);
  }
}

export async function validateOfferHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, productId, offerId } = req.body;
    const validated = await validateOfferService(customerId, productId, offerId);
    return sendSuccess(res, validated);
  } catch (err) {
    next(err);
  }
}
