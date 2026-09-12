import { getProductsCollection } from '../db/collections.js';
import { toProductCardDTO } from '../tools/catalogueTools.js';
import { ProductCardDTO } from '../types/dto.js';

export async function getExploreCollectionsService(): Promise<Record<string, ProductCardDTO[]>> {
  const collection = getProductsCollection();

  const [
    trending,
    seasonal,
    college,
    minimal,
    weekend,
    dateNight,
    workwear,
    monsoon,
  ] = await Promise.all([
    collection.find({ available: true, styleTags: 'trending' }).limit(8).toArray(),
    collection.find({ available: true, season: 'summer' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'college' }).limit(8).toArray(),
    collection.find({ available: true, styleTags: 'minimalist' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'weekend' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'dateNight' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'workwear' }).limit(8).toArray(),
    collection.find({ available: true, season: 'monsoon' }).limit(8).toArray(),
  ]);

  return {
    trending: trending.map(toProductCardDTO),
    seasonal: seasonal.map(toProductCardDTO),
    college: college.map(toProductCardDTO),
    minimal: minimal.map(toProductCardDTO),
    weekend: weekend.map(toProductCardDTO),
    dateNight: dateNight.map(toProductCardDTO),
    workwear: workwear.map(toProductCardDTO),
    monsoon: monsoon.map(toProductCardDTO),
  };
}
