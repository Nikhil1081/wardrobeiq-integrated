import {
  getWardrobeItems,
  addWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
  analyzeWardrobe,
  calculateWardrobeHealth,
  toWardrobeItemDTO,
} from '../tools/wardrobeTools.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import { WardrobeDocument, Category, Occasion } from '../types/domain.js';
import { WardrobeItemDTO, WardrobeHealthDTO, GapDTO } from '../types/dto.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getWardrobeService(
  customerId: string,
  criteria?: {
    search?: string;
    category?: Category;
    subcategory?: string;
    color?: string;
    style?: string;
    occasion?: Occasion;
    season?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ items: WardrobeItemDTO[]; total: number; page: number; limit: number }> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const items = await getWardrobeItems(customerId, criteria);
  const total = items.length;

  const page = criteria?.page || 1;
  const limit = criteria?.limit || 50;
  const startIndex = (page - 1) * limit;
  const paginated = items.slice(startIndex, startIndex + limit);

  return {
    items: paginated.map(toWardrobeItemDTO),
    total,
    page,
    limit,
  };
}

export async function addWardrobeItemService(
  customerId: string,
  data: Omit<WardrobeDocument, 'itemId' | 'customerId' | 'createdAt' | 'updatedAt'>
): Promise<{ item: WardrobeItemDTO; updatedHealth: WardrobeHealthDTO; updatedGaps: GapDTO[] }> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newItem: WardrobeDocument = {
    ...data,
    itemId,
    customerId,
    dateAcquired: data.dateAcquired || now.split('T')[0],
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
    createdAt: now,
    updatedAt: now,
  };

  await addWardrobeItem(newItem);

  // Recalculate wardrobe state
  const currentItems = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(currentItems, customer);
  const updatedHealth = calculateWardrobeHealth(analysis, customer);
  const browsingSignals = await getCustomerBrowsingSignals(customerId);
  const updatedGaps = detectGaps(analysis, customer, currentItems, browsingSignals.summary);

  return {
    item: toWardrobeItemDTO(newItem),
    updatedHealth,
    updatedGaps,
  };
}

export async function updateWardrobeItemService(
  customerId: string,
  itemId: string,
  updateData: Partial<WardrobeDocument>
): Promise<{ item: WardrobeItemDTO; updatedHealth: WardrobeHealthDTO }> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const updated = await updateWardrobeItem(customerId, itemId, updateData);
  if (!updated) {
    throw new AppError(404, 'ITEM_NOT_FOUND', `Wardrobe item with ID ${itemId} not found.`);
  }

  const currentItems = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(currentItems, customer);
  const updatedHealth = calculateWardrobeHealth(analysis, customer);

  return {
    item: toWardrobeItemDTO(updated),
    updatedHealth,
  };
}

export async function deleteWardrobeItemService(
  customerId: string,
  itemId: string
): Promise<{ success: boolean; deletedItemId: string; updatedHealth: WardrobeHealthDTO; updatedGaps: GapDTO[] }> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const deleted = await deleteWardrobeItem(customerId, itemId);
  if (!deleted) {
    throw new AppError(404, 'ITEM_NOT_FOUND', `Wardrobe item with ID ${itemId} not found.`);
  }

  // Recalculate wardrobe state
  const currentItems = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(currentItems, customer);
  const updatedHealth = calculateWardrobeHealth(analysis, customer);
  const browsingSignals = await getCustomerBrowsingSignals(customerId);
  const updatedGaps = detectGaps(analysis, customer, currentItems, browsingSignals.summary);

  return {
    success: true,
    deletedItemId: itemId,
    updatedHealth,
    updatedGaps,
  };
}
