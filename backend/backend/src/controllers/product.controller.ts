import { Request, Response, NextFunction } from 'express';
import { searchCatalogueProducts, getProductById, toProductCardDTO } from '../tools/catalogueTools.js';
import { getProductOffers } from '../tools/offerTools.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { products, total } = await searchCatalogueProducts(req.query as any);
    const dtos = products.map(toProductCardDTO);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    return sendSuccess(res, dtos, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = String(req.params.productId);
    const product = await getProductById(productId);
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product with ID ${productId} not found.`);
    }

    const dto = toProductCardDTO(product);
    const offers = await getProductOffers(productId);

    return sendSuccess(res, {
      ...dto,
      activeOffer: offers.length > 0 ? offers[0] : null,
    });
  } catch (err) {
    next(err);
  }
}
