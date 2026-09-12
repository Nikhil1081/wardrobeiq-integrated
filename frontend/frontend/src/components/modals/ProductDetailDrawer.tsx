import React from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { RecommendationDTO, ProductCardDTO } from '../../types/dto';
import { DiscountBadge, MatchScoreBadge } from '../common/Badge';
import { X, Heart, Plus, Sparkles, Layers, Tag, ExternalLink } from 'lucide-react';

export const ProductDetailDrawer: React.FC = () => {
  const {
    activeModal,
    closeModals,
    toggleSaveProduct,
    addClosetItem,
    savedProducts,
    openWhyThis,
    showToast,
  } = useWardrobe();

  const product = activeModal.productDetail;
  if (!product) return null;

  const isSaved = savedProducts.some((p) => p.productId === product.productId);
  const isRec = 'score' in product;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg rounded-l-3xl glass-panel-elevated border-l border-white/10 shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">
                Product Intelligence
              </span>
              <button
                onClick={closeModals}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Image */}
            <div className="mt-5 relative rounded-2xl overflow-hidden glass-panel border border-white/10">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <DiscountBadge discount={product.discountPercentage} />
                {isRec && <MatchScoreBadge score={(product as RecommendationDTO).score} />}
              </div>
            </div>

            {/* Info */}
            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-luxury-peach font-semibold">
                {product.store}
              </div>
              <h2 className="font-editorial text-2xl font-bold text-luxury-cream mt-1">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-2xl font-bold text-luxury-cream font-mono">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-gray-500 line-through font-mono">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.discountPercentage > 0 && (
                  <span className="text-xs font-bold text-luxury-rose">
                    Save {product.discountPercentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-gray-300 border border-white/5 capitalize">
                {product.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-gray-300 border border-white/5 capitalize">
                {product.color}
              </span>
              {product.styleTags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs bg-luxury-lavender/10 text-luxury-lavender border border-luxury-lavender/20 capitalize"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Why This Button if recommendation */}
            {isRec && (
              <button
                type="button"
                onClick={() => openWhyThis(product as RecommendationDTO)}
                className="mt-6 w-full p-3.5 rounded-xl glass-pill hover:border-luxury-rose/40 text-xs font-bold uppercase tracking-wider text-luxury-blush flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>View Full &ldquo;Why This?&rdquo; Score Breakdown</span>
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-white/5 mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleSaveProduct(product)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                isSaved
                  ? 'bg-luxury-rose/20 text-luxury-blush border-luxury-rose/40 shadow-glow-rose'
                  : 'glass-panel text-gray-300 hover:text-white hover:border-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-luxury-blush text-luxury-blush' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await addClosetItem({
                  name: product.name,
                  category: product.category,
                  subcategory: product.subcategory,
                  color: product.color,
                  styleTags: product.styleTags,
                  occasion: product.occasion,
                  season: product.season,
                  price: product.price,
                  store: product.store,
                  imageUrl: product.imageUrl,
                  isCustom: false,
                });
                showToast('Added to your closet ✦', `"${product.name}" stored in MongoDB`, 'rose');
                closeModals();
              }}
              className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Closet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
