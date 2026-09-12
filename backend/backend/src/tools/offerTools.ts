import { getOffersCollection } from '../db/collections.js';
import { OfferDocument, WardrobeDocument, ProductDocument, Category } from '../types/domain.js';
import { OfferDTO } from '../types/dto.js';

export async function getProductOffers(productId: string): Promise<OfferDocument[]> {
  const collection = getOffersCollection();
  const now = new Date().toISOString();

  // Exclude expired offers and inactive offers
  return await collection
    .find({
      productId,
      active: true,
      validUntil: { $gte: now },
    })
    .toArray();
}

export async function getAllActiveOffers(): Promise<OfferDocument[]> {
  const collection = getOffersCollection();
  const now = new Date().toISOString();

  return await collection
    .find({
      active: true,
      validUntil: { $gte: now },
    })
    .toArray();
}

export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
  const discount = (originalPrice * discountPercentage) / 100;
  return Math.max(0, Math.round(originalPrice - discount));
}

export function validateOfferConditions(
  offer: OfferDocument,
  product: ProductDocument,
  customerWardrobe: WardrobeDocument[],
  cartTotal?: number
): { isEligible: boolean; reason: string; label: string } {
  const now = new Date().toISOString();

  // 1. Expiry Check
  if (!offer.active || offer.validUntil < now) {
    return {
      isEligible: false,
      reason: 'Offer has expired or is no longer active.',
      label: 'Expired Offer',
    };
  }

  // 2. Product ID Match
  if (offer.productId !== product.productId) {
    return {
      isEligible: false,
      reason: `Offer is intended for product ${offer.productId}, not ${product.productId}.`,
      label: 'Product Ineligible',
    };
  }

  // 3. Category Pair condition (e.g. customer must already own a bottom)
  if (offer.conditionType === 'category_pair' && offer.conditionCategory) {
    const requiredCategory = offer.conditionCategory;
    const ownsConditionCategory = customerWardrobe.some((w) => w.category === requiredCategory);

    if (!ownsConditionCategory) {
      return {
        isEligible: false,
        reason: `Requires owning at least one ${requiredCategory} in your wardrobe to unlock this bundle.`,
        label: `Bundle with ${requiredCategory}`,
      };
    }
    return {
      isEligible: true,
      reason: `Eligible! Unlocked because you own matching ${requiredCategory}s.`,
      label: `${offer.discountPercentage}% Off Bundle`,
    };
  }

  // 4. Minimum Purchase Condition
  if (offer.conditionType === 'minimum_purchase' && offer.minimumPurchase) {
    const total = cartTotal || product.price;
    if (total < offer.minimumPurchase) {
      return {
        isEligible: false,
        reason: `Requires a minimum purchase of ₹${offer.minimumPurchase} (current: ₹${total}).`,
        label: `Min ₹${offer.minimumPurchase}`,
      };
    }
    return {
      isEligible: true,
      reason: `Eligible! Order value meets the ₹${offer.minimumPurchase} threshold.`,
      label: `${offer.discountPercentage}% Off Special`,
    };
  }

  // Generic active offer
  return {
    isEligible: true,
    reason: `${offer.discountPercentage}% discount applies directly.`,
    label: `${offer.discountPercentage}% OFF`,
  };
}

export function toOfferDTO(
  offer: OfferDocument,
  product: ProductDocument,
  isEligible = true,
  eligibilityMessage?: string,
  label = `${offer.discountPercentage}% OFF`
): OfferDTO {
  return {
    offerId: offer.offerId,
    productId: offer.productId,
    offerType: offer.offerType,
    discountPercentage: offer.discountPercentage,
    discountedPrice: calculateDiscountedPrice(product.price, offer.discountPercentage),
    conditionType: offer.conditionType,
    conditionCategory: offer.conditionCategory,
    minimumPurchase: offer.minimumPurchase,
    validUntil: offer.validUntil,
    active: offer.active,
    label,
    eligibilityMessage,
  };
}
