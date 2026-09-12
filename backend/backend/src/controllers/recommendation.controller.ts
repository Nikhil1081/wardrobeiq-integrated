import { Request, Response, NextFunction } from 'express';
import {
  getPersonalizedRecommendationsService,
  getWhyThisExplanationService,
} from '../services/recommendation.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getRecommendationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      customerId,
      query,
      filters,
      category,
      occasion,
      season,
      budget,
      maxBudget,
      color,
      style,
    } = req.body;

    const mergedFilters = {
      ...filters,
      category: filters?.category || category,
      occasion: filters?.occasion || occasion,
      season: filters?.season || season,
      maxBudget: filters?.maxBudget || maxBudget || budget,
      color: filters?.color || color,
      style: filters?.style || style,
    };

    const result = await getPersonalizedRecommendationsService(customerId, query, mergedFilters);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getWhyThisHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const productId = String(req.params.productId);
    const explanation = await getWhyThisExplanationService(customerId, productId);
    return sendSuccess(res, explanation);
  } catch (err) {
    next(err);
  }
}
