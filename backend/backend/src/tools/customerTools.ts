import { getCustomersCollection } from '../db/collections.js';
import { CustomerDocument } from '../types/domain.js';
import { CustomerDTO } from '../types/dto.js';

export async function getCustomerProfile(customerId: string): Promise<CustomerDocument | null> {
  const collection = getCustomersCollection();
  const found = await collection.findOne({ customerId });
  if (found) return found;

  // Support admin_root virtual customer profile for styling & recommendations
  if (customerId === 'admin_root' || customerId === 'admin') {
    return {
      customerId: 'admin_root',
      name: 'WardrobeIQ Administrator',
      email: 'admin@wardrobeiq.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      country: 'Global',
      city: 'San Francisco',
      gender: 'unisex',
      age: 32,
      occupation: 'Administrator & Fashion Curator',
      bodyType: 'regular',
      skinTone: 'neutral',
      preferredStyles: ['smart-casual', 'minimalist', 'classic'],
      preferredColors: ['navy', 'white', 'charcoal', 'olive'],
      avoidedColors: ['neon'],
      preferredOccasions: ['workwear', 'smart-casual', 'casual'],
      currentSeason: 'all-season',
      budget: 15000,
      budgetTier: 'mid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as CustomerDocument;
  }

  // Fallback to C001 for any unmatched persona ID
  return await collection.findOne({ customerId: 'C001' });
}

export async function getAllCustomers(): Promise<CustomerDocument[]> {
  const collection = getCustomersCollection();
  return await collection.find({}).toArray();
}

export async function updateCustomerProfile(
  customerId: string,
  update: Partial<Omit<CustomerDocument, 'customerId' | '_id' | 'createdAt'>>
): Promise<CustomerDocument | null> {
  const collection = getCustomersCollection();
  const now = new Date().toISOString();

  const result = await collection.findOneAndUpdate(
    { customerId },
    {
      $set: {
        ...update,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

export function toCustomerDTO(customer: CustomerDocument): CustomerDTO {
  return {
    customerId: customer.customerId,
    name: customer.name,
    avatar: customer.avatar,
    preferredStyles: customer.preferredStyles,
    preferredColors: customer.preferredColors,
    avoidedColors: customer.avoidedColors,
    budget: customer.budget,
    preferredOccasions: customer.preferredOccasions,
    currentSeason: customer.currentSeason,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
