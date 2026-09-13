import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { ProductCardDTO } from '../../types/dto';
import { useWardrobe } from '../../store/WardrobeContext';
import {
  Compass,
  Sparkles,
  Search,
  Heart,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';

interface ExploreCollection {
  collectionId: string;
  title: string;
  subtitle: string;
  heroImage: string;
  tags: string[];
  products: ProductCardDTO[];
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'top', label: 'Tops & Shirts' },
  { id: 'bottom', label: 'Bottoms & Pants' },
  { id: 'dress', label: 'Dresses & Jumpsuits' },
  { id: 'outerwear', label: 'Jackets & Blazers' },
  { id: 'shoes', label: 'Footwear & Shoes' },
  { id: 'accessory', label: 'Bags & Accessories' },
  { id: 'traditional', label: 'Ethnic & Traditional' },
];

const STYLES = [
  'all',
  'casual',
  'formal',
  'streetwear',
  'minimalist',
  'boho',
  'athleisure',
  'ethnic',
  'smart-casual',
  'party',
];

const OCCASIONS = [
  'all',
  'everyday',
  'work',
  'party',
  'formal',
  'wedding',
  'travel',
  'lounge',
];

export const ExplorePage: React.FC = () => {
  const {
    openProductDetail,
    toggleSaveProduct,
    savedProducts,
    currentCustomerId,
    showToast,
    refreshAll,
  } = useWardrobe();

  // Active view: 'catalogue' (812 products) vs 'curations' (themed edits)
  const [activeView, setActiveView] = useState<'catalogue' | 'curations'>('catalogue');

  // Catalogue State
  const [products, setProducts] = useState<ProductCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 24;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  // Editorial collections
  const [collections, setCollections] = useState<ExploreCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Fetch paginated catalogue products
  const fetchProducts = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.explore.getProducts({
        page: targetPage,
        limit,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        style: selectedStyle !== 'all' ? selectedStyle : undefined,
        occasion: selectedOccasion !== 'all' ? selectedOccasion : undefined,
        search: searchQuery.trim() || undefined,
        sort: sortBy,
      });

      setProducts(res.items || []);
      setTotalProducts(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.warn('Failed to load explore products:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStyle, selectedOccasion, searchQuery, sortBy]);

  // Load products on filter change
  useEffect(() => {
    if (activeView === 'catalogue') {
      fetchProducts(1);
    }
  }, [fetchProducts, activeView]);

  // Load collections when user switches to curations view
  useEffect(() => {
    if (activeView === 'curations' && collections.length === 0) {
      setLoadingCollections(true);
      apiClient
        .getExploreCollections()
        .then((cols) => setCollections(cols))
        .catch((err) => console.warn('Failed to load explore collections:', err))
        .finally(() => setLoadingCollections(false));
    }
  }, [activeView, collections.length]);

  // Search submission & telemetry
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
    if (searchQuery.trim()) {
      apiClient.explore.interact({
        eventType: 'SEARCH',
        searchQuery: searchQuery.trim(),
      }).catch(() => {});
    }
  };

  // Add product to wardrobe via explore endpoint
  const handleAddToWardrobe = async (prod: ProductCardDTO) => {
    setAddingIds((prev) => new Set(prev).add(prod.productId));
    try {
      await apiClient.explore.addToWardrobe(prod.productId, currentCustomerId);
      apiClient.explore.interact({
        eventType: 'ADD_TO_WARDROBE',
        productId: prod.productId,
        productName: prod.name,
        category: prod.category,
      }).catch(() => {});

      showToast(
        'Added to your Wardrobe ✦',
        `"${prod.name}" is now part of your personal closet.`,
        'rose'
      );
      await refreshAll();
    } catch (err: any) {
      showToast('Error adding item', err?.message || 'Please try again', 'info');
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(prod.productId);
        return next;
      });
    }
  };

  // Product interaction click
  const handleProductClick = (prod: ProductCardDTO) => {
    apiClient.explore.interact({
      eventType: 'CLICK',
      productId: prod.productId,
      productName: prod.name,
      category: prod.category,
    }).catch(() => {});
    openProductDetail(prod);
  };

  const handleSaveToggle = (prod: ProductCardDTO) => {
    const isCurrentlySaved = savedProducts.some((p) => p.productId === prod.productId);
    toggleSaveProduct(prod);
    apiClient.explore.interact({
      eventType: isCurrentlySaved ? 'REMOVE_FROM_WISHLIST' : 'SAVE',
      productId: prod.productId,
      productName: prod.name,
      category: prod.category,
    }).catch(() => {});
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedStyle('all');
    setSelectedOccasion('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-champagne/15 text-luxury-champagne border border-luxury-champagne/30 mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Catalogue &amp; Discovery</span>
          </div>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
            Explore Fashion
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
            Browse our master catalogue of 812 verified garments with zero image duplicates, or inspect curated seasonal drops.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-2xl glass-panel border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setActiveView('catalogue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'catalogue'
                ? 'bg-luxury-rose text-luxury-cream shadow-glow-rose'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Products ({totalProducts || 812})</span>
          </button>
          <button
            onClick={() => setActiveView('curations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'curations'
                ? 'bg-luxury-rose text-luxury-cream shadow-glow-rose'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Themed Curations</span>
          </button>
        </div>
      </div>

      {/* CATALOGUE VIEW */}
      {activeView === 'catalogue' && (
        <div className="space-y-6">
          {/* Controls Bar: Search + Filters */}
          <div className="p-4 rounded-3xl glass-panel border border-white/5 space-y-4">
            {/* Search Input & Sort */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by title, store, or tag (e.g. Linen Blazer, Zara, Casual)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 focus:outline-none focus:border-luxury-rose/50 text-sm text-luxury-cream placeholder-gray-500"
                />
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-luxury-cream focus:outline-none focus:border-luxury-rose/50"
                >
                  <option value="newest" className="bg-dark-900 text-white">Newest First</option>
                  <option value="price_asc" className="bg-dark-900 text-white">Price: Low to High</option>
                  <option value="price_desc" className="bg-dark-900 text-white">Price: High to Low</option>
                </select>

                {(selectedCategory !== 'all' || selectedStyle !== 'all' || selectedOccasion !== 'all' || searchQuery) && (
                  <button
                    onClick={resetFilters}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs shrink-0"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-luxury-rose/25 text-luxury-cream border border-luxury-rose/50 shadow-sm'
                        : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Secondary Filters: Style & Occasion */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">Style:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedStyle(s);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                        selectedStyle === s
                          ? 'bg-luxury-peach/20 text-luxury-peach font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-gray-400 font-medium">Occasion:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ}
                      onClick={() => {
                        setSelectedOccasion(occ);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                        selectedOccasion === occ
                          ? 'bg-luxury-lavender/20 text-luxury-lavender font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary & Pagination Header */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Showing <strong className="text-luxury-cream">{products.length}</strong> of{' '}
              <strong className="text-luxury-cream">{totalProducts}</strong> products
            </span>
            <span>Page {page} of {totalPages}</span>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-24 text-center text-xs text-gray-400 animate-pulse flex flex-col items-center gap-3">
              <Compass className="w-6 h-6 text-luxury-blush animate-spin" />
              <span>Querying catalogue from MongoDB...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass-panel border border-white/5 p-8">
              <ShoppingBag className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-luxury-cream">No garments found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Try adjusting your search terms, style tags, or category filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-luxury-rose/20 text-luxury-cream hover:bg-luxury-rose/30 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {products.map((prod) => {
                const isSaved = savedProducts.some((p) => p.productId === prod.productId);
                const isAdding = addingIds.has(prod.productId);

                return (
                  <div
                    key={prod.productId}
                    className="group rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-luxury-rose/40 hover:shadow-glow-rose/20 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-dark-900">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        onClick={() => handleProductClick(prod)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        loading="lazy"
                      />

                      {/* Store pill */}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-dark-950/80 backdrop-blur-md text-luxury-peach border border-white/10 truncate max-w-[120px]">
                        {prod.store}
                      </span>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveToggle(prod)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-dark-950/60 backdrop-blur-md text-white hover:text-luxury-blush transition-colors"
                        title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isSaved ? 'fill-luxury-blush text-luxury-blush' : ''
                          }`}
                        />
                      </button>

                      {/* Traditional origin badge if applicable */}
                      {prod.isTraditional && prod.culturalOrigin && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-semibold bg-luxury-rose/90 text-white shadow-sm">
                          {prod.culturalOrigin}
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 capitalize mb-1">
                          <span>{prod.category}</span>
                          <span>•</span>
                          <span className="truncate">{prod.subcategory}</span>
                        </div>
                        <h4
                          onClick={() => handleProductClick(prod)}
                          className="text-xs font-bold text-luxury-cream line-clamp-1 cursor-pointer hover:text-luxury-blush transition-colors"
                          title={prod.name}
                        >
                          {prod.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-xs font-bold text-luxury-cream font-mono">
                            ₹{prod.price.toLocaleString()}
                          </span>
                          {prod.discountPercentage > 0 && (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              {prod.discountPercentage}% off
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-1.5 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleProductClick(prod)}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase glass-panel hover:bg-white/10 text-gray-300 hover:text-white transition-all text-center flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          disabled={isAdding}
                          onClick={() => handleAddToWardrobe(prod)}
                          className="py-1.5 px-2.5 rounded-xl bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/40 active:scale-95 transition-all text-[10px] font-bold flex items-center gap-1"
                          title="Add to personal wardrobe"
                        >
                          {isAdding ? (
                            <span className="animate-spin text-xs">✦</span>
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden xs:inline">Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/5">
              <button
                disabled={page <= 1}
                onClick={() => fetchProducts(page - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-gray-300 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>Page</span>
                <span className="font-bold text-luxury-cream">{page}</span>
                <span>of</span>
                <span className="font-bold text-luxury-cream">{totalPages}</span>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => fetchProducts(page + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-gray-300 hover:text-white transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* CURATIONS VIEW */}
      {activeView === 'curations' && (
        <div className="space-y-12">
          {loadingCollections ? (
            <div className="py-20 text-center text-xs text-gray-400 animate-pulse">
              Loading curated collections from backend catalogue...
            </div>
          ) : (
            <div className="space-y-12">
              {collections.map((col) => (
                <section key={col.collectionId} className="space-y-4">
                  <div className="flex items-end justify-between border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-editorial text-2xl md:text-3xl font-bold text-luxury-cream">
                          {col.title}
                        </h2>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-luxury-blush">
                          {col.tags?.[0] || 'Curated'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{col.subtitle}</p>
                    </div>
                  </div>

                  {/* Horizontal Scroll Carousel */}
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                    {col.products?.map((prod) => {
                      const isSaved = savedProducts.some((p) => p.productId === prod.productId);
                      return (
                        <div
                          key={prod.productId}
                          className="group min-w-[220px] max-w-[220px] rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-luxury-rose/30 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              onClick={() => handleProductClick(prod)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveToggle(prod)}
                              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-dark-950/60 backdrop-blur-md text-white hover:text-luxury-blush transition-colors"
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  isSaved ? 'fill-luxury-blush text-luxury-blush' : ''
                                }`}
                              />
                            </button>
                          </div>

                          <div className="p-3.5 space-y-1.5">
                            <div className="text-[10px] uppercase tracking-widest text-luxury-peach font-semibold truncate">
                              {prod.store}
                            </div>
                            <h4
                              onClick={() => handleProductClick(prod)}
                              className="text-xs font-bold text-luxury-cream truncate cursor-pointer hover:text-luxury-blush transition-colors"
                            >
                              {prod.name}
                            </h4>
                            <div className="text-xs font-bold text-luxury-cream font-mono">
                              ₹{prod.price.toLocaleString()}
                            </div>

                            <div className="pt-2 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleProductClick(prod)}
                                className="flex-1 py-1 rounded text-[10px] font-bold uppercase glass-pill hover:border-luxury-lavender/40 text-luxury-lavender"
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddToWardrobe(prod)}
                                className="p-1.5 rounded bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/35 transition-colors"
                                title="Add to personal wardrobe"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
