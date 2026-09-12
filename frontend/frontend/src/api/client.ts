import {
  DashboardDTO,
  CustomerDTO,
  WardrobeItemDTO,
  GapDTO,
  RecommendationDTO,
  WhyThisDTO,
  OutfitDTO,
  OfferDTO,
  ProductCardDTO,
  AIStylistResponseDTO,
} from '../types/dto';
import { Category, Occasion, Season, FeedbackType, BrowsingEventType } from '../types/domain';

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';
const BASE_URL = RAW_BASE.replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api/v1`;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.error?.message) errorMsg = errJson.error.message;
      else if (errJson.message) errorMsg = errJson.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const json = await res.json();
  // Unwrap standard { data: ... } response wrapper if present
  return json.data !== undefined ? json.data : json;
}

export const apiClient = {
  // Health
  checkHealth: async (): Promise<{ status: string }> => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return res.json();
    } catch {}
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Customers & Profile
  getCustomers: async (): Promise<CustomerDTO[]> => {
    return fetchJson<CustomerDTO[]>(`${API_BASE}/customers`);
  },

  getCustomerProfile: async (customerId: string): Promise<CustomerDTO> => {
    return fetchJson<CustomerDTO>(`${API_BASE}/profile/${customerId}`);
  },

  updateCustomerProfile: async (
    customerId: string,
    updates: Partial<CustomerDTO>
  ): Promise<CustomerDTO> => {
    return fetchJson<CustomerDTO>(`${API_BASE}/profile/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Home Dashboard BFF
  getHomeDashboard: async (customerId: string): Promise<DashboardDTO> => {
    return fetchJson<DashboardDTO>(`${API_BASE}/home/${customerId}`);
  },

  // Closet CRUD
  getCloset: async (
    customerId: string,
    params?: { category?: string; occasion?: string; season?: string; search?: string }
  ): Promise<{ items: WardrobeItemDTO[]; totalCount: number; categoryBreakdown: Record<Category, number> }> => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.occasion && params.occasion !== 'all') query.set('occasion', params.occasion);
    if (params?.season && params.season !== 'all') query.set('season', params.season);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    const raw = await fetchJson<any>(
      `${API_BASE}/closet/${customerId}${qs ? `?${qs}` : ''}`
    );

    const items: WardrobeItemDTO[] = Array.isArray(raw) ? raw : (raw.items || []);
    const categoryBreakdown: Record<Category, number> = {
      top: 0,
      bottom: 0,
      dress: 0,
      outerwear: 0,
      shoes: 0,
      accessory: 0,
    };
    for (const item of items) {
      if (item.category && categoryBreakdown[item.category] !== undefined) {
        categoryBreakdown[item.category]++;
      }
    }

    return {
      items,
      totalCount: raw.total ?? items.length,
      categoryBreakdown: raw.categoryBreakdown || categoryBreakdown,
    };
  },

  addClosetItem: async (
    customerId: string,
    item: {
      name: string;
      category: Category;
      subcategory: string;
      color: string;
      styleTags: string[];
      occasion: Occasion[];
      season: Season[];
      price: number;
      store?: string;
      imageUrl: string;
      isCustom?: boolean;
    }
  ): Promise<{ item: WardrobeItemDTO; updatedHealth: any; updatedGaps: any[] }> => {
    return fetchJson<{ item: WardrobeItemDTO; updatedHealth: any; updatedGaps: any[] }>(`${API_BASE}/closet/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  updateClosetItem: async (
    customerId: string,
    itemId: string,
    updates: Partial<WardrobeItemDTO>
  ): Promise<{ item: WardrobeItemDTO; updatedHealth: any }> => {
    return fetchJson<{ item: WardrobeItemDTO; updatedHealth: any }>(`${API_BASE}/closet/${customerId}/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteClosetItem: async (customerId: string, itemId: string): Promise<{ success: boolean; deletedItemId: string; updatedHealth: any; updatedGaps: any[] }> => {
    return fetchJson<{ success: boolean; deletedItemId: string; updatedHealth: any; updatedGaps: any[] }>(`${API_BASE}/closet/${customerId}/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Gaps
  getGaps: async (customerId: string): Promise<GapDTO[]> => {
    return fetchJson<GapDTO[]>(`${API_BASE}/gaps/${customerId}`);
  },

  getGapDetail: async (
    customerId: string,
    gapId: string
  ): Promise<{
    gap: GapDTO;
    compatibleOwnedItems: WardrobeItemDTO[];
    suggestedProducts: RecommendationDTO[];
    potentialOutfitsCount: number;
  }> => {
    return fetchJson<{
      gap: GapDTO;
      compatibleOwnedItems: WardrobeItemDTO[];
      suggestedProducts: RecommendationDTO[];
      potentialOutfitsCount: number;
    }>(`${API_BASE}/gaps/${customerId}/${gapId}`);
  },

  // Recommendations & Why This
  getRecommendations: async (
    customerId: string,
    options?: { category?: Category; limit?: number; browsingBoost?: boolean }
  ): Promise<{ recommendations: RecommendationDTO[]; activeOffers: OfferDTO[]; outfits: OutfitDTO[] }> => {
    const body: Record<string, any> = {
      customerId,
      limit: options?.limit ?? 16,
      browsingBoost: options?.browsingBoost ?? true,
    };
    if (options?.category && options.category !== ('all' as any)) {
      body.category = options.category;
      body.filters = { category: options.category };
    }
    const raw = await fetchJson<any>(
      `${API_BASE}/recommendations`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    return {
      recommendations: raw.recommendations || [],
      activeOffers: raw.activeOffers || [],
      outfits: raw.outfits || [],
    };
  },

  getWhyThis: async (customerId: string, productId: string): Promise<WhyThisDTO> => {
    return fetchJson<WhyThisDTO>(`${API_BASE}/recommendations/${customerId}/${productId}/explanation`);
  },

  // Saved Products & Outfits
  getSavedItems: async (
    customerId: string
  ): Promise<{ savedProducts: RecommendationDTO[]; savedOutfits: OutfitDTO[] }> => {
    return fetchJson<{ savedProducts: RecommendationDTO[]; savedOutfits: OutfitDTO[] }>(
      `${API_BASE}/saved/${customerId}`
    );
  },

  saveProduct: async (customerId: string, productId: string): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>(`${API_BASE}/saved/${customerId}/${productId}`, {
      method: 'POST',
    });
  },

  removeSavedProduct: async (customerId: string, productId: string): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>(`${API_BASE}/saved/${customerId}/${productId}`, {
      method: 'DELETE',
    });
  },

  saveOutfit: async (
    customerId: string,
    outfit: { outfitId: string; items: any[]; occasion: Occasion; caption: string }
  ): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>(`${API_BASE}/outfits/saved/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(outfit),
    });
  },

  deleteSavedOutfit: async (customerId: string, outfitId: string): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>(`${API_BASE}/outfits/saved/${customerId}/${outfitId}`, {
      method: 'DELETE',
    });
  },

  // Outfit Builder
  generateOutfit: async (
    customerId: string,
    occasion?: Occasion,
    season?: Season,
    style?: string,
    maxBudget?: number
  ): Promise<OutfitDTO> => {
    return fetchJson<OutfitDTO>(`${API_BASE}/outfits/generate`, {
      method: 'POST',
      body: JSON.stringify({ customerId, occasion, season, style, maxBudget }),
    });
  },

  replaceOutfitSlot: async (
    customerId: string,
    currentOutfit: OutfitDTO,
    slotToReplace: Category
  ): Promise<OutfitDTO> => {
    const raw = await fetchJson<any>(`${API_BASE}/outfits/replace`, {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        outfit: currentOutfit,
        currentOutfit,
        slot: slotToReplace,
        slotToReplace,
      }),
    });
    return raw.updatedOutfit || raw;
  },

  shuffleOutfit: async (customerId: string, currentOutfit: OutfitDTO): Promise<OutfitDTO> => {
    const raw = await fetchJson<any>(`${API_BASE}/outfits/shuffle`, {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        currentOutfit,
        outfit: currentOutfit,
        occasion: currentOutfit.occasion,
        season: currentOutfit.season,
        budget: currentOutfit.totalCost,
        lockedItems: currentOutfit.items?.filter((i) => i.locked) || [],
      }),
    });
    return raw;
  },

  // Explore Themed Collections
  getExploreCollections: async (): Promise<
    Array<{
      collectionId: string;
      title: string;
      subtitle: string;
      heroImage: string;
      tags: string[];
      products: ProductCardDTO[];
    }>
  > => {
    const raw = await fetchJson<Record<string, ProductCardDTO[]>>(`${API_BASE}/explore`);
    const metadata: Record<string, { title: string; subtitle: string; heroImage: string; tag: string }> = {
      trending: {
        title: 'Trending Now',
        subtitle: 'Pieces capturing current season buzz and customer styling interest.',
        heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
        tag: 'Trending',
      },
      seasonal: {
        title: 'Seasonal Edit',
        subtitle: 'Breathable, sun-drenched palettes and lightweight linen cuts.',
        heroImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
        tag: 'Summer',
      },
      college: {
        title: 'College Style',
        subtitle: 'Effortless relaxed shirts, denim, and sneakers for campus life.',
        heroImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
        tag: 'Campus',
      },
      minimal: {
        title: 'Minimal Edit',
        subtitle: 'Understated neutrals, sharp lines, and quiet luxury tailoring.',
        heroImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        tag: 'Minimalist',
      },
      weekend: {
        title: 'Weekend Looks',
        subtitle: 'Off-duty elegance for Saturday brunches and travel ease.',
        heroImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        tag: 'Weekend',
      },
      dateNight: {
        title: 'Date Night',
        subtitle: 'Evening glamour, elevated monochrome tones, and refined silks.',
        heroImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80',
        tag: 'Evening',
      },
      workwear: {
        title: 'Workwear',
        subtitle: 'Structured blazers, pleated trousers, and crisp tailored shirts.',
        heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        tag: 'Professional',
      },
      monsoon: {
        title: 'Monsoon Edit',
        subtitle: 'Durable, dark palettes and humidity-conscious silhouettes.',
        heroImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
        tag: 'Monsoon',
      },
    };

    return Object.entries(raw).map(([key, prods]) => {
      const meta = metadata[key] || {
        title: key.toUpperCase(),
        subtitle: 'Curated fashion pieces.',
        heroImage: prods[0]?.imageUrl || '',
        tag: key,
      };
      return {
        collectionId: key,
        title: meta.title,
        subtitle: meta.subtitle,
        heroImage: meta.heroImage,
        tags: [meta.tag],
        products: prods,
      };
    });
  },

  // Feedback & Browsing
  recordFeedback: async (
    customerId: string,
    productId: string,
    type: FeedbackType
  ): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>(`${API_BASE}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ customerId, productId, type }),
    });
  },

  recordBrowsingEvent: async (
    customerId: string,
    productId: string,
    eventType: BrowsingEventType
  ): Promise<{ success: boolean }> => {
    const res = await fetchJson<any>(`${API_BASE}/browsing/events`, {
      method: 'POST',
      body: JSON.stringify({ customerId, productId, eventType }),
    });
    return { success: true, ...res };
  },

  // Offers
  getProductOffers: async (productId: string): Promise<OfferDTO[]> => {
    return fetchJson<OfferDTO[]>(`${API_BASE}/offers/product/${productId}`);
  },

  validateOffer: async (
    offerId: string,
    customerId: string,
    cartTotal?: number,
    productId?: string
  ): Promise<{ valid: boolean; reason?: string; discountPercentage?: number }> => {
    return fetchJson<{ valid: boolean; reason?: string; discountPercentage?: number }>(
      `${API_BASE}/offers/validate`,
      {
        method: 'POST',
        body: JSON.stringify({ offerId, customerId, cartTotal, productId }),
      }
    );
  },

  // AI Stylist: Standard Call
  askAIStylist: async (
    customerId: string,
    message: string,
    conversationId?: string
  ): Promise<AIStylistResponseDTO> => {
    return fetchJson<AIStylistResponseDTO>(`${API_BASE}/ai/stylist`, {
      method: 'POST',
      body: JSON.stringify({ customerId, message, conversationId }),
    });
  },

  // AI Stylist: Streaming Call (SSE)
  streamAIStylist: async (
    customerId: string,
    message: string,
    conversationId: string | undefined,
    onStep: (stepName: string) => void,
    onResult: (result: AIStylistResponseDTO) => void,
    onError: (err: Error) => void
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/ai/stylist/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, message, conversationId }),
      });

      if (!response.ok) {
        throw new Error(`SSE streaming error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const blockLines = block.split('\n');
          let currentEvent = 'message';
          let currentData = '';

          for (const line of blockLines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              currentData = line.substring(6).trim();
            }
          }

          if (currentData) {
            try {
              const parsed = JSON.parse(currentData);
              if (currentEvent === 'step' && parsed.step) {
                onStep(parsed.step);
              } else if (currentEvent === 'result') {
                onResult(parsed);
              }
            } catch (err) {
              console.warn('Error parsing SSE block:', err, currentData);
            }
          }
        }
      }
    } catch (err: any) {
      onError(err);
    }
  },
};
