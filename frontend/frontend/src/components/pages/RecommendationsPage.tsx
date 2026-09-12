import React, { useState, useMemo } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Category } from '../../types/domain';
import { DiscountBadge, MatchScoreBadge } from '../common/Badge';
import { ProductCardSkeleton } from '../common/Skeleton';
import {
  Heart,
  Plus,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Info,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { ClothingImage } from '../common/ClothingImage';

export const RecommendationsPage: React.FC = () => {
  const {
    recommendations,
    loading,
    openWhyThis,
    openProductDetail,
    openOfferDetail,
    toggleSaveProduct,
    addClosetItem,
    savedProducts,
    recordFeedbackAction,
  } = useWardrobe();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Picks' },
    { id: 'top', label: 'Tops' },
    { id: 'bottom', label: 'Bottoms' },
    { id: 'dress', label: 'Dresses' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'accessory', label: 'Accessories' },
  ];

  const filteredRecs = useMemo(() => {
    if (selectedCategory === 'all') return recommendations;
    return recommendations.filter((r) => r.category === selectedCategory);
  }, [recommendations, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-blush/15 text-luxury-blush border border-luxury-blush/30 shadow-glow-rose mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Intelligent Curation</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
          Picked for Your Wardrobe
        </h1>
        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
          Not just products you might like. Pieces that complete what you already own. Every score reflects gap relevance, palette harmony, style compatibility, and duplicate avoidance.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === 'all'
              ? recommendations.length
              : recommendations.filter((r) => r.category === cat.id).length;

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

      {/* Product Grid */}
      {loading && recommendations.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="py-20 text-center space-y-3 rounded-3xl glass-panel p-8">
          <Sparkles className="w-10 h-10 text-luxury-blush mx-auto" />
          <h3 className="font-editorial text-2xl font-bold text-luxury-cream">
            Your stylist is curating something special.
          </h3>
          <p className="text-xs text-gray-400">
            No active recommendations for this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredRecs.map((rec) => {
            const isSaved = savedProducts.some((p) => p.productId === rec.productId);
            const isDuplicatePenalized = rec.scoreBreakdown?.duplicatePenalty < 0;

            return (
              <div
                key={rec.productId}
                className="group rounded-3xl overflow-hidden glass-panel border border-white/5 hover:border-luxury-rose/30 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Product Image Area */}
                <div className="relative overflow-hidden cursor-pointer" onClick={() => openProductDetail(rec)}>
                  <ClothingImage
                    src={rec.imageUrl}
                    backupSrc={rec.backupImageUrl}
                    alt={rec.name}
                    category={rec.category}
                    color={rec.color}
                    isTraditional={rec.isTraditional}
                    culturalOrigin={rec.culturalOrigin}
                    aspectRatio="tall"
                    className="w-full group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Wishlist Heart */}
                  <button
                    type="button"
                    onClick={() => toggleSaveProduct(rec)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-dark-950/60 backdrop-blur-md text-white hover:text-luxury-blush transition-colors cursor-pointer"
                    title={isSaved ? 'Remove from saved' : 'Save item'}
                  >
                    <Heart
                      className={`w-4 h-4 ${isSaved ? 'fill-luxury-blush text-luxury-blush' : ''}`}
                    />
                  </button>

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    {rec.applicableOffer && (
                      <DiscountBadge
                        discount={rec.applicableOffer.discountPercentage}
                        onClick={(e) => {
                          e.stopPropagation();
                          openOfferDetail(rec.applicableOffer!);
                        }}
                      />
                    )}
                    {isDuplicatePenalized && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Similar In Closet
                      </span>
                    )}
                  </div>

                  {/* AI Match Score Badge */}
                  <div className="absolute bottom-3 left-3">
                    <MatchScoreBadge score={rec.score} onClick={() => openWhyThis(rec)} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-luxury-peach font-semibold truncate">
                      {rec.store}
                    </div>
                    <h3
                      onClick={() => openProductDetail(rec)}
                      className="text-xs font-bold text-luxury-cream truncate cursor-pointer hover:text-luxury-blush transition-colors"
                    >
                      {rec.name}
                    </h3>
                  </div>

                  {/* Price & Discount */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-luxury-cream font-mono">
                      ₹{rec.price.toLocaleString()}
                    </span>
                    {rec.originalPrice > rec.price && (
                      <span className="text-xs text-gray-500 line-through font-mono">
                        ₹{rec.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Browsing Signal / Tag */}
                  {rec.browsingSignal && rec.browsingSignal.viewCount > 0 && (
                    <div className="text-[10px] text-luxury-champagne flex items-center gap-1 font-medium">
                      <Tag className="w-3 h-3" />
                      <span>Viewed {rec.browsingSignal.viewCount} times recently</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {rec.styleTags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-gray-400 capitalize"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Actions & Feedback */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => openWhyThis(rec)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider glass-pill hover:border-luxury-lavender/40 text-luxury-lavender"
                    >
                      Why This?
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        addClosetItem({
                          name: rec.name,
                          category: rec.category,
                          subcategory: rec.subcategory,
                          color: rec.color,
                          styleTags: rec.styleTags,
                          occasion: rec.occasion,
                          season: rec.season,
                          price: rec.price,
                          store: rec.store,
                          imageUrl: rec.imageUrl,
                          isCustom: false,
                        })
                      }
                      className="p-2 rounded-lg bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/35 transition-colors"
                      title="Add to closet"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Feedback icons: Love it / Not for me */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => recordFeedbackAction(rec.productId, 'love')}
                        className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-luxury-blush transition-colors"
                        title="Love this piece"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => recordFeedbackAction(rec.productId, 'not_for_me')}
                        className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                        title="Not for me"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
