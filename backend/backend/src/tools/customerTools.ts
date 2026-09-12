import { getCustomersCollection } from '../db/collections.js';
import { CustomerDocument } from '../types/domain.js';
import { CustomerDTO } from '../types/dto.js';

export async function getCustomerProfile(customerId: string): Promise<CustomerDocument | null> {
  const collection = getCustomersCollection();
  return await collection.findOne({ customerId });
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
