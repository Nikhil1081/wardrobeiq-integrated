import {
  getProductsCollection,
  getWardrobesCollection,
  getPurchasesCollection,
  getBrowsingHistoryCollection,
  getCustomersCollection,
  getUsersCollection,
} from '../db/collections.js';
import { Category } from '../types/domain.js';

export async function getAdminDashboardService() {
  const productsCol = getProductsCollection();
  const wardrobesCol = getWardrobesCollection();
  const purchasesCol = getPurchasesCollection();
  const browsingCol = getBrowsingHistoryCollection();
  const customersCol = getCustomersCollection();
  const usersCol = getUsersCollection();

  const [
    totalProducts,
    totalWardrobes,
    totalPurchases,
    totalBrowsing,
    totalCustomers,
    totalUsers,
    purchasesSample,
    productsByCategory,
    wardrobesByCategory,
  ] = await Promise.all([
    productsCol.countDocuments(),
    wardrobesCol.countDocuments(),
    purchasesCol.countDocuments(),
    browsingCol.countDocuments(),
    customersCol.countDocuments(),
    usersCol.countDocuments(),
    purchasesCol.find({ status: 'completed' }).project({ pricePaid: 1 }).toArray(),
    productsCol.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]).toArray(),
    wardrobesCol.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]).toArray(),
  ]);

  const totalGMV = purchasesSample.reduce((acc, p: any) => acc + (p.pricePaid || 0), 0);
  const avgOrderValue = purchasesSample.length > 0 ? Math.round(totalGMV / purchasesSample.length) : 0;

  const productCounts: Record<string, number> = {};
  productsByCategory.forEach((b: any) => {
    productCounts[b._id] = b.count;
  });

  const wardrobeCounts: Record<string, number> = {};
  wardrobesByCategory.forEach((b: any) => {
    wardrobeCounts[b._id] = b.count;
  });

  return {
    metrics: {
      totalProducts,
      totalWardrobes,
      totalPurchases,
      totalBrowsing,
      totalPersonas: totalCustomers,
      totalUsers,
      totalGMV,
      avgOrderValue,
    },
    categoryBreakdown: {
      products: productCounts,
      wardrobes: wardrobeCounts,
    },
  };
}

export async function getAdminClothingService(query: {
  page?: number;
  limit?: number;
  customerId?: string;
  category?: Category;
  subcategory?: string;
  color?: string;
  search?: string;
}) {
  const wardrobesCol = getWardrobesCollection();
  const filter: any = {};

  if (query.customerId) {
    filter.customerId = query.customerId;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.subcategory) {
    filter.subcategory = query.subcategory;
  }
  if (query.color) {
    filter.color = { $regex: new RegExp(query.color, 'i') };
  }
  if (query.search) {
    const term = query.search.trim();
    filter.$or = [
      { name: { $regex: new RegExp(term, 'i') } },
      { itemId: { $regex: new RegExp(term, 'i') } },
      { customerId: { $regex: new RegExp(term, 'i') } },
      { store: { $regex: new RegExp(term, 'i') } },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    wardrobesCol.countDocuments(filter),
    wardrobesCol.find(filter).skip(skip).limit(limit).toArray(),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getAdminPurchasesService(query: {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: string;
  search?: string;
}) {
  const purchasesCol = getPurchasesCollection();
  const filter: any = {};

  if (query.customerId) {
    filter.customerId = query.customerId;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.search) {
    const term = query.search.trim();
    filter.$or = [
      { productName: { $regex: new RegExp(term, 'i') } },
      { purchaseId: { $regex: new RegExp(term, 'i') } },
      { customerId: { $regex: new RegExp(term, 'i') } },
      { store: { $regex: new RegExp(term, 'i') } },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    purchasesCol.countDocuments(filter),
    purchasesCol.find(filter).sort({ purchaseDate: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getAdminBrowsingService(query: {
  page?: number;
  limit?: number;
  customerId?: string;
  eventType?: string;
  search?: string;
}) {
  const browsingCol = getBrowsingHistoryCollection();
  const filter: any = {};

  if (query.customerId) {
    filter.customerId = query.customerId;
  }
  if (query.eventType) {
    filter.eventType = query.eventType;
  }
  if (query.search) {
    const term = query.search.trim();
    filter.$or = [
      { interactionId: { $regex: new RegExp(term, 'i') } },
      { customerId: { $regex: new RegExp(term, 'i') } },
      { searchQuery: { $regex: new RegExp(term, 'i') } },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    browsingCol.countDocuments(filter),
    browsingCol.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getAdminPersonasService(query: { search?: string; country?: string }) {
  const customersCol = getCustomersCollection();
  const filter: any = {};

  if (query.country) {
    filter.country = { $regex: new RegExp(`^${query.country}$`, 'i') };
  }
  if (query.search) {
    const term = query.search.trim();
    filter.$or = [
      { name: { $regex: new RegExp(term, 'i') } },
      { customerId: { $regex: new RegExp(term, 'i') } },
      { city: { $regex: new RegExp(term, 'i') } },
    ];
  }

  const personas = await customersCol.find(filter).toArray();
  return personas;
}

export async function getAdminUsersService() {
  const usersCol = getUsersCollection();
  const users = await usersCol.find({}).project({ passwordHash: 0 }).toArray();
  return users;
}
