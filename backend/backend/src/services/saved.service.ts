import { getSavedItemsCollection, getProductsCollection } from '../db/collections.js';
import { getProductById, toProductCardDTO } from '../tools/catalogueTools.js';
import { getSavedOutfitsService } from './outfit.service.js';
import { ProductCardDTO, OutfitDTO } from '../types/dto.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getSavedItemsService(customerId: string): Promise<{
  savedProducts: ProductCardDTO[];
  savedOutfits: OutfitDTO[];
}> {
  const collection = getSavedItemsCollection();
  const savedDocs = await collection.find({ customerId }).sort({ createdAt: -1 }).toArray();

  const productIds = savedDocs.map((s) => s.productId);
  const productsCol = getProductsCollection();
  const products = await productsCol.find({ productId: { $in: productIds } }).toArray();

  const productMap = new Map(products.map((p) => [p.productId, toProductCardDTO(p)]));
  const savedProducts: ProductCardDTO[] = [];

  for (const id of productIds) {
    const p = productMap.get(id);
    if (p) savedProducts.push(p);
  }

  const savedOutfits = await getSavedOutfitsService(customerId);

  return {
    savedProducts,
    savedOutfits,
  };
}

export async function saveProductService(customerId: string, productId: string): Promise<{ success: boolean; productId: string }> {
  const product = await getProductById(productId);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product with ID ${productId} not found.`);
  }

  const collection = getSavedItemsCollection();
  await collection.updateOne(
    { customerId, productId },
    { $setOnInsert: { customerId, productId, createdAt: new Date().toISOString() } },
    { upsert: true }
  );

  return { success: true, productId };
}

export async function removeSavedProductService(customerId: string, productId: string): Promise<{ success: boolean; productId: string }> {
  const collection = getSavedItemsCollection();
  const res = await collection.deleteOne({ customerId, productId });
  return { success: res.deletedCount > 0, productId };
}
