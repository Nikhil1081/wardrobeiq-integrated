import {
  getCustomerProfile,
  getAllCustomers,
  updateCustomerProfile,
  toCustomerDTO,
} from '../tools/customerTools.js';
import { CustomerDTO } from '../types/dto.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getCustomersSummary(): Promise<
  Array<Pick<CustomerDTO, 'customerId' | 'name' | 'avatar' | 'preferredStyles'>>
> {
  const customers = await getAllCustomers();
  return customers.map((c) => ({
    customerId: c.customerId,
    name: c.name,
    avatar: c.avatar,
    preferredStyles: c.preferredStyles,
  }));
}

export async function getCustomerProfileService(customerId: string): Promise<CustomerDTO> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }
  return toCustomerDTO(customer);
}

export async function updateCustomerProfileService(
  customerId: string,
  update: Partial<Omit<CustomerDTO, 'customerId' | 'createdAt' | 'updatedAt'>>
): Promise<CustomerDTO> {
  const updated = await updateCustomerProfile(customerId, update as any);
  if (!updated) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }
  return toCustomerDTO(updated);
}
