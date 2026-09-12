import {
  getProductOffers,
  getAllActiveOffers,
  validateOfferConditions,
  toOfferDTO,
} from '../tools/offerTools.js';
import { getProductById } from '../tools/catalogueTools.js';
import { getWardrobeItems } from '../tools/wardrobeTools.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { OfferDTO } from '../types/dto.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getOffersForProductService(productId: string): Promise<OfferDTO[]> {
  const product = await getProductById(productId);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product with ID ${productId} not found.`);
  }

  const offers = await getProductOffers(productId);
  return offers.map((o) => toOfferDTO(o, product, true, 'Active catalog offer'));
}

export async function getOffersForCustomerService(customerId: string): Promise<OfferDTO[]> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const allActive = await getAllActiveOffers();
  const matchedOffers: OfferDTO[] = [];

  for (const offer of allActive) {
    const product = await getProductById(offer.productId);
    if (product) {
      const validation = validateOfferConditions(offer, product, wardrobe);
      if (validation.isEligible) {
        matchedOffers.push(toOfferDTO(offer, product, true, validation.reason, validation.label));
      }
    }
  }

  return matchedOffers;
}

export async function validateOfferService(
  customerId: string,
  productId: string,
  offerId?: string
): Promise<OfferDTO> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const product = await getProductById(productId);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product with ID ${productId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const productOffers = await getProductOffers(productId);

  const targetOffer = offerId
    ? productOffers.find((o) => o.offerId === offerId)
    : productOffers[0];

  if (!targetOffer) {
    throw new AppError(404, 'OFFER_NOT_FOUND', `No active offer found for product ${productId}.`);
  }

  const validation = validateOfferConditions(targetOffer, product, wardrobe);
  if (!validation.isEligible) {
    throw new AppError(400, 'OFFER_CONDITIONS_NOT_MET', validation.reason);
  }

  return toOfferDTO(targetOffer, product, true, validation.reason, validation.label);
}
