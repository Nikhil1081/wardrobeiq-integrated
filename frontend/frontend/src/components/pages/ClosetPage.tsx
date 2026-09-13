import React, { useState, useMemo, useEffect } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Category, Occasion, Season } from '../../types/domain';
import { WardrobeItemDTO } from '../../types/dto';
import {
  Search,
  Plus,
  Filter,
  Grid as GridIcon,
  List,
  Edit2,
  Trash2,
  Sparkles,
  Shirt,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { ClothingImage } from '../common/ClothingImage';

export const ClosetPage: React.FC = () => {
  const { closetItems, openModal, openEditItem, loading, setActiveTab } = useWardrobe();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'category'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 24;

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Pieces' },
    { id: 'top', label: 'Tops' },
    { id: 'bottom', label: 'Bottoms' },
    { id: 'traditional', label: 'Traditional & Ethnic' },
    { id: 'dress', label: 'Dresses' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'accessory', label: 'Accessories' },
  ];

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedOccasion, selectedSeason, searchTerm, sortBy]);

  const filteredItems = useMemo(() => {
    return closetItems
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (selectedOccasion !== 'all' && !item.occasion?.includes(selectedOccasion as Occasion))
          return false;
        if (selectedSeason !== 'all' && !item.season?.includes(selectedSeason as Season))
          return false;
        if (
          searchTerm &&
          !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.color.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return b.price - a.price;
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return new Date(b.dateAcquired).getTime() - new Date(a.dateAcquired).getTime();
      });
  }, [closetItems, selectedCategory, selectedOccasion, selectedSeason, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, page, itemsPerPage]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
            My Closet
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Everything you own. One intelligent wardrobe. ({closetItems.length} items registered in MongoDB)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('explore')}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-luxury-cream border border-white/10 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-luxury-peach" />
            <span>Explore Catalogue</span>
          </button>
          <button
            onClick={() => openModal('addItem')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Piece</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const count =
            cat.id === 'all'
              ? closetItems.length
              : closetItems.filter((i) => i.category === cat.id).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'glass-pill-active text-luxury-cream'
                  : 'glass-pill text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-luxury-blush/30 text-white' : 'bg-white/5 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Search, Occasion, Sort, View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-panel">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 ml-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, color, subcategory..."
            className="w-full bg-transparent text-xs text-luxury-cream placeholder-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Occasion Filter */}
          <select
            value={selectedOccasion}
            onChange={(e) => setSelectedOccasion(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-dark-850 border border-white/10 text-xs text-gray-300 focus:outline-none"
          >
            <option value="all">All Occasions</option>
            <option value="workwear">Workwear</option>
            <option value="casual">Casual</option>
            <option value="college">College</option>
            <option value="dateNight">Date Night</option>
            <option value="weekend">Weekend</option>
            <option value="party">Party</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-dark-850 border border-white/10 text-xs text-gray-300 focus:outline-none"
          >
            <option value="recent">Recently Added</option>
            <option value="price">Highest Price</option>
            <option value="category">Category</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/5 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-luxury-rose/25 text-luxury-blush' : 'text-gray-400 hover:text-white'
              }`}
            >
              <GridIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'compact' ? 'bg-luxury-rose/25 text-luxury-blush' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Compact View */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-3xl glass-panel border border-white/5 p-8">
          <div className="w-14 h-14 rounded-2xl bg-luxury-rose/10 text-luxury-blush mx-auto flex items-center justify-center">
            <Shirt className="w-7 h-7" />
          </div>
          <h3 className="font-editorial text-3xl font-bold text-luxury-cream">
            {closetItems.length === 0 ? 'Your wardrobe is waiting.' : 'No items match your filters.'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {closetItems.length === 0
              ? 'You have 0 items in your closet. Start building your wardrobe by browsing our 812-piece fashion catalogue!'
              : 'Try clearing your search term or selecting "All Categories".'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openModal('addItem')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              Add Custom Item
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Catalogue</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Showing <strong className="text-luxury-cream">{paginatedItems.length}</strong> of{' '}
              <strong className="text-luxury-cream">{filteredItems.length}</strong> items
            </span>
            <span>Page {page} of {totalPages}</span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {paginatedItems.map((item) => (
                <div
                  key={item.itemId}
                  className="group rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-luxury-rose/30 transition-all duration-300 flex flex-col justify-between relative"
                >
                  {/* Product Image */}
                  <div className="relative overflow-hidden aspect-[3/4] bg-dark-900">
                    <ClothingImage
                      src={item.imageUrl}
                      backupSrc={item.backupImageUrl}
                      alt={item.name}
                      category={item.category}
                      color={item.color}
                      isTraditional={item.isTraditional}
                      culturalOrigin={item.culturalOrigin}
                      aspectRatio="tall"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 z-20">
                      <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest truncate">
                        {item.subcategory}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditItem(item)}
                          className="p-1.5 rounded-lg bg-dark-950/80 text-luxury-cream hover:text-luxury-blush transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-luxury-peach font-semibold">
                      <span>{item.category}</span>
                      <span className="font-mono text-gray-400">{item.color}</span>
                    </div>
                    <h4 className="text-xs font-bold text-luxury-cream truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-gray-400 font-mono">
                        ₹{item.price ? item.price.toLocaleString() : 'N/A'}
                      </span>
                      <span className="text-[10px] text-gray-500 capitalize">
                        {item.occasion?.[0] || 'Casual'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Compact List View */
            <div className="space-y-2">
              {paginatedItems.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between p-3 rounded-2xl glass-panel hover:border-white/20 transition-all gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ClothingImage
                      src={item.imageUrl}
                      backupSrc={item.backupImageUrl}
                      alt={item.name}
                      category={item.category}
                      color={item.color}
                      isTraditional={item.isTraditional}
                      culturalOrigin={item.culturalOrigin}
                      className="w-12 h-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-luxury-cream truncate">{item.name}</h4>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5 capitalize">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.color}</span>
                        <span>•</span>
                        <span>{item.store}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-bold text-luxury-cream font-mono">
                      ₹{item.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => openEditItem(item)}
                      className="p-2 rounded-xl glass-pill hover:border-white/30 text-gray-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/5 text-xs text-gray-400">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-gray-300 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span>
                Showing {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, filteredItems.length)} of {filteredItems.length} items (Page {page} of {totalPages})
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-gray-300 hover:text-white transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
