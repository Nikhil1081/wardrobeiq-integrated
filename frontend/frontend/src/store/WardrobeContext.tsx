import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  DashboardDTO,
  CustomerDTO,
  WardrobeItemDTO,
  GapDTO,
  RecommendationDTO,
  OutfitDTO,
  OfferDTO,
  ProductCardDTO,
} from '../types/dto';
import { Category, Occasion, Season, FeedbackType } from '../types/domain';
import { apiClient } from '../api/client';
import { fallbackCustomers } from '../api/clientFallback';
import { useAuth } from './AuthContext';

export const ADMIN_VIRTUAL_CUSTOMER: CustomerDTO = {
  customerId: 'admin_root',
  name: 'WardrobeIQ Administrator',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  country: 'Global',
  city: 'San Francisco',
  preferredStyles: ['smart-casual', 'minimalist'],
  budget: 50000,
  preferredColors: ['black', 'white', 'navy', 'gray'],
  avoidedColors: [],
  climate: 'temperate',
  currentSeason: 'all-season',
  preferredOccasions: ['workwear', 'casual', 'formal'],
};

export type NavigationTab =
  | 'home'
  | 'today'
  | 'closet'
  | 'gaps'
  | 'recommendations'
  | 'outfits'
  | 'stylist'
  | 'explore'
  | 'saved'
  | 'profile'
  | 'settings'
  | 'admin'
  | 'auth';

export interface ToastItem {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'success' | 'info' | 'rose';
}

interface WardrobeContextType {
  // Navigation & Viewport
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  viewportMode: 'desktop' | 'tablet' | 'mobile';
  setViewportMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;

  // Customers (all 12 dynamically from backend)
  customers: CustomerDTO[];
  currentCustomer: CustomerDTO | null;
  currentCustomerId: string;
  setCurrentCustomerId: (id: string) => void;

  // Real Backend Data
  dashboard: DashboardDTO | null;
  closetItems: WardrobeItemDTO[];
  gaps: GapDTO[];
  recommendations: RecommendationDTO[];
  savedProducts: RecommendationDTO[];
  savedOutfits: OutfitDTO[];
  
  // Status
  loading: boolean;
  backendConnected: boolean;
  checkConnection: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Toasts
  toasts: ToastItem[];
  showToast: (title: string, subtitle?: string, type?: 'success' | 'info' | 'rose') => void;
  removeToast: (id: string) => void;

  // Modals & Drawers
  activeModal: {
    addItem: boolean;
    editItem: WardrobeItemDTO | null;
    gapDetail: GapDTO | null;
    whyThis: RecommendationDTO | null;
    productDetail: RecommendationDTO | ProductCardDTO | null;
    offerDetail: OfferDTO | null;
  };
  openModal: (key: 'addItem') => void;
  openEditItem: (item: WardrobeItemDTO) => void;
  openGapDetail: (gap: GapDTO) => void;
  openWhyThis: (rec: RecommendationDTO) => void;
  openProductDetail: (product: RecommendationDTO | ProductCardDTO) => void;
  openOfferDetail: (offer: OfferDTO) => void;
  closeModals: () => void;

  // Real Backend CRUD Actions
  addClosetItem: (item: {
    productId?: string;
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
  }) => Promise<void>;
  updateClosetItem: (itemId: string, updates: Partial<WardrobeItemDTO>) => Promise<void>;
  deleteClosetItem: (itemId: string) => Promise<void>;
  toggleSaveProduct: (product: RecommendationDTO | ProductCardDTO) => Promise<void>;
  saveOutfitToDB: (outfit: OutfitDTO) => Promise<void>;
  deleteSavedOutfitFromDB: (outfitId: string) => Promise<void>;
  recordFeedbackAction: (productId: string, type: FeedbackType) => Promise<void>;
  updateCustomerPreferences: (updates: Partial<CustomerDTO>) => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export const WardrobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Customers - initialized immediately with all 105 global personas
  const [customers, setCustomers] = useState<CustomerDTO[]>(fallbackCustomers);
  const [currentCustomerId, setCurrentCustomerIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('wardrobeiq_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.customerId || parsed.userId) return parsed.customerId || parsed.userId;
        } catch {}
      }
      const stored = localStorage.getItem('wardrobeiq_customer_id');
      if (stored) return stored;
    }
    return 'C001';
  });
  const [currentCustomer, setCurrentCustomer] = useState<CustomerDTO | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('wardrobeiq_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'admin' || parsed.userId === 'admin_root') return ADMIN_VIRTUAL_CUSTOMER;
          const found = fallbackCustomers.find((c) => c.customerId === (parsed.customerId || parsed.userId));
          if (found) return found;
        } catch {}
      }
    }
    return fallbackCustomers[0];
  });

  // Synchronize active customer state when authenticated user changes
  useEffect(() => {
    if (user?.role === 'admin' || user?.userId === 'admin_root') {
      if (currentCustomerId !== 'admin_root') {
        setCurrentCustomerIdState('admin_root');
      }
      setCurrentCustomer(ADMIN_VIRTUAL_CUSTOMER);
    } else if (user?.customerId && user.customerId !== currentCustomerId) {
      setCurrentCustomerIdState(user.customerId);
      const found =
        customers.find((c) => c.customerId === user.customerId) ||
        fallbackCustomers.find((c) => c.customerId === user.customerId);
      if (found) setCurrentCustomer(found);
    }
  }, [user]);

  // Backend state
  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [closetItems, setClosetItems] = useState<WardrobeItemDTO[]>([]);
  const [gaps, setGaps] = useState<GapDTO[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationDTO[]>([]);
  const [savedProducts, setSavedProducts] = useState<RecommendationDTO[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<OutfitDTO[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((title: string, subtitle?: string, type: 'success' | 'info' | 'rose' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, subtitle, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modals
  const [activeModal, setActiveModal] = useState<{
    addItem: boolean;
    editItem: WardrobeItemDTO | null;
    gapDetail: GapDTO | null;
    whyThis: RecommendationDTO | null;
    productDetail: RecommendationDTO | ProductCardDTO | null;
    offerDetail: OfferDTO | null;
  }>({
    addItem: false,
    editItem: null,
    gapDetail: null,
    whyThis: null,
    productDetail: null,
    offerDetail: null,
  });

  const openModal = (key: 'addItem') => setActiveModal((prev) => ({ ...prev, [key]: true }));
  const openEditItem = (item: WardrobeItemDTO) => setActiveModal((prev) => ({ ...prev, editItem: item }));
  const openGapDetail = (gap: GapDTO) => setActiveModal((prev) => ({ ...prev, gapDetail: gap }));
  const openWhyThis = (rec: RecommendationDTO) => setActiveModal((prev) => ({ ...prev, whyThis: rec }));
  const openProductDetail = (product: RecommendationDTO | ProductCardDTO) => {
    setActiveModal((prev) => ({ ...prev, productDetail: product }));
    if (currentCustomerId && product.productId) {
      apiClient.recordBrowsingEvent(currentCustomerId, product.productId, 'viewed').catch(() => {});
    }
  };
  const openOfferDetail = (offer: OfferDTO) => setActiveModal((prev) => ({ ...prev, offerDetail: offer }));
  const closeModals = () =>
    setActiveModal({
      addItem: false,
      editItem: null,
      gapDetail: null,
      whyThis: null,
      productDetail: null,
      offerDetail: null,
    });

  // Health check
  const checkConnection = useCallback(async () => {
    try {
      const res = await apiClient.checkHealth();
      if (res.status === 'healthy') {
        setBackendConnected(true);
      }
    } catch {
      setBackendConnected(false);
    }
  }, []);

  // Load customers on initial mount (allowed for admin only)
  useEffect(() => {
    async function loadCustomers() {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('wardrobeiq_user');
        let isAdmin = false;
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.role === 'admin' || parsed.userId === 'admin_root') isAdmin = true;
          } catch {}
        }
        if (!isAdmin) return;
      }
      try {
        const custList = await apiClient.getCustomers();
        if (Array.isArray(custList) && custList.length > 0) {
          setCustomers(custList);
        }
      } catch (err) {
        // Expected 403 for non-admin users
      }
    }
    loadCustomers();
  }, []);

  // Load all data for active customer
  const loadCustomerData = useCallback(async (customerId: string) => {
    if (!customerId) return;
    setLoading(true);
    try {
      // 1. Home Dashboard BFF (contains health, stats, top gaps, top recs, outfits)
      try {
        const dash = await apiClient.getHomeDashboard(customerId);
        setDashboard(dash);
        if (dash?.customer) setCurrentCustomer(dash.customer);
      } catch (err) {
        console.warn('Could not load home dashboard:', err);
      }

      // 2. Full Closet
      try {
        const closetData = await apiClient.getCloset(customerId);
        setClosetItems(closetData.items || []);
      } catch (err) {
        console.warn('Could not load closet items:', err);
      }

      // 3. All Wardrobe Gaps
      try {
        const gapsData = await apiClient.getGaps(customerId);
        setGaps(gapsData || []);
      } catch (err) {
        console.warn('Could not load gaps:', err);
      }

      // 4. Personalized Recommendations
      try {
        const recData = await apiClient.getRecommendations(customerId, { limit: 20 });
        setRecommendations(recData.recommendations || []);
      } catch (err) {
        console.warn('Could not load recommendations:', err);
      }

      // 5. Saved Products & Outfits
      try {
        const savedData = await apiClient.getSavedItems(customerId);
        setSavedProducts(savedData.savedProducts || []);
        setSavedOutfits(savedData.savedOutfits || []);
      } catch (err) {
        console.warn('Could not load saved items:', err);
      }

      setBackendConnected(true);
    } catch (err) {
      console.error(`Error loading data for customer ${customerId}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentCustomerId) {
      loadCustomerData(currentCustomerId);
    }
  }, [currentCustomerId, loadCustomerData]);

  const setCurrentCustomerId = (id: string) => {
    setCurrentCustomerIdState(id);
    const isAdm = id === 'admin_root' || id === 'admin';
    const found = isAdm
      ? ADMIN_VIRTUAL_CUSTOMER
      : (customers.find((c) => c.customerId === id) || fallbackCustomers.find((c) => c.customerId === id));
    if (found) setCurrentCustomer(found);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wardrobeiq_customer_id', id);
      const currentToken = localStorage.getItem('wardrobeiq_token');
      if (!currentToken || currentToken.startsWith('demo_token_') || currentToken.startsWith('client_token_')) {
        const isAdm = id === 'admin_root' || id === 'admin';
        localStorage.setItem('wardrobeiq_token', isAdm ? 'demo_token_admin_root' : `demo_token_${id}`);
        const updatedUser = {
          userId: id,
          customerId: id,
          email: isAdm ? 'admin@wardrobeiq.com' : `${id.toLowerCase()}@wardrobeiq.demo`,
          name: found?.name || id,
          avatar: found?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          role: isAdm ? 'admin' : 'user',
          country: found?.country || 'India',
          preferredStyles: found?.preferredStyles || ['smart-casual'],
        };
        localStorage.setItem('wardrobeiq_user', JSON.stringify(updatedUser));
      }
    }
    showToast(`Switched persona to ${found?.name || id} ✦`, 'Wardrobe, gaps & recommendations reloaded from MongoDB', 'info');
  };

  const refreshAll = useCallback(async () => {
    await loadCustomerData(currentCustomerId);
  }, [currentCustomerId, loadCustomerData]);

  // Actions
  const addClosetItem = async (item: {
    productId?: string;
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
  }) => {
    try {
      const added = await apiClient.addClosetItem(currentCustomerId, item);
      if (item.productId) {
        apiClient.recordBrowsingEvent(currentCustomerId, item.productId, 'added_to_cart').catch(() => {});
      }
      showToast('Added to your closet ✦', `"${added.item?.name || item.name}" has been stored in MongoDB`, 'rose');
      closeModals();
      await refreshAll();
    } catch (err: any) {
      showToast('Failed to add item', err?.message || 'Server error', 'info');
    }
  };

  const updateClosetItem = async (itemId: string, updates: Partial<WardrobeItemDTO>) => {
    try {
      const updated = await apiClient.updateClosetItem(currentCustomerId, itemId, updates);
      showToast('Closet item updated', `"${updated.item?.name || 'Item'}" has been modified in MongoDB`, 'success');
      closeModals();
      await refreshAll();
    } catch (err: any) {
      showToast('Failed to update item', err?.message || 'Server error', 'info');
    }
  };

  const deleteClosetItem = async (itemId: string) => {
    try {
      await apiClient.deleteClosetItem(currentCustomerId, itemId);
      showToast('Item removed from closet', 'Wardrobe health & gaps recalculating in MongoDB...', 'info');
      closeModals();
      await refreshAll();
    } catch (err: any) {
      showToast('Failed to delete item', err?.message || 'Server error', 'info');
    }
  };

  const toggleSaveProduct = async (product: RecommendationDTO | ProductCardDTO) => {
    const isAlreadySaved = savedProducts.some((p) => p.productId === product.productId);
    try {
      if (isAlreadySaved) {
        await apiClient.removeSavedProduct(currentCustomerId, product.productId);
        setSavedProducts((prev) => prev.filter((p) => p.productId !== product.productId));
        showToast('Removed from saved items', product.name, 'info');
      } else {
        await apiClient.saveProduct(currentCustomerId, product.productId);
        apiClient.recordBrowsingEvent(currentCustomerId, product.productId, 'saved').catch(() => {});
        const savedData = await apiClient.getSavedItems(currentCustomerId);
        setSavedProducts(savedData.savedProducts);
        showToast('Saved to your collection ✦', product.name, 'rose');
      }
    } catch (err: any) {
      showToast('Error updating saved state', err?.message, 'info');
    }
  };

  const saveOutfitToDB = async (outfit: OutfitDTO) => {
    try {
      await apiClient.saveOutfit(currentCustomerId, {
        outfitId: outfit.outfitId,
        items: outfit.items,
        occasion: outfit.occasion,
        caption: outfit.caption || `${outfit.occasion} Look`,
      });
      const savedData = await apiClient.getSavedItems(currentCustomerId);
      setSavedOutfits(savedData.savedOutfits);
      showToast('Outfit saved ✦', `Added to your saved looks for ${outfit.occasion}`, 'rose');
    } catch (err: any) {
      showToast('Failed to save outfit', err?.message, 'info');
    }
  };

  const deleteSavedOutfitFromDB = async (outfitId: string) => {
    try {
      await apiClient.deleteSavedOutfit(currentCustomerId, outfitId);
      setSavedOutfits((prev) => prev.filter((o) => o.outfitId !== outfitId));
      showToast('Outfit removed', 'Look deleted from saved collection', 'info');
    } catch (err: any) {
      showToast('Failed to remove outfit', err?.message, 'info');
    }
  };

  const recordFeedbackAction = async (productId: string, type: FeedbackType) => {
    try {
      await apiClient.recordFeedback(currentCustomerId, productId, type);
      if (type === 'love') {
        showToast('Got it — I’ll refine your style ✦', 'Positive feedback recorded in MongoDB', 'rose');
      } else {
        showToast('Style preference updated', 'We will avoid recommending similar pieces', 'info');
      }
    } catch (err: any) {
      console.warn('Failed to record feedback:', err);
    }
  };

  const updateCustomerPreferences = async (updates: Partial<CustomerDTO>) => {
    try {
      const updated = await apiClient.updateCustomerProfile(currentCustomerId, updates);
      setCurrentCustomer(updated);
      showToast('Style profile updated', 'Recommendations refreshed from backend scoring', 'success');
      await refreshAll();
    } catch (err: any) {
      showToast('Failed to update profile', err?.message, 'info');
    }
  };

  return (
    <WardrobeContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewportMode,
        setViewportMode,
        customers,
        currentCustomer,
        currentCustomerId,
        setCurrentCustomerId,
        dashboard,
        closetItems,
        gaps,
        recommendations,
        savedProducts,
        savedOutfits,
        loading,
        backendConnected,
        checkConnection,
        refreshAll,
        toasts,
        showToast,
        removeToast,
        activeModal,
        openModal,
        openEditItem,
        openGapDetail,
        openWhyThis,
        openProductDetail,
        openOfferDetail,
        closeModals,
        addClosetItem,
        updateClosetItem,
        deleteClosetItem,
        toggleSaveProduct,
        saveOutfitToDB,
        deleteSavedOutfitFromDB,
        recordFeedbackAction,
        updateCustomerPreferences,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = (): WardrobeContextType => {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
};
