import { Request, Response, NextFunction } from 'express';
import { getExploreCollectionsService } from '../services/explore.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getExploreHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await getExploreCollectionsService();
    return sendSuccess(res, collections);
  } catch (err) {
    next(err);
  }
}
