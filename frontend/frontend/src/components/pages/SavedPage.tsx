import React, { useState } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Bookmark, Trash2, Plus, Layers, ArrowRight, Heart, Sparkles } from 'lucide-react';

export const SavedPage: React.FC = () => {
  const {
    savedProducts,
    savedOutfits,
    toggleSaveProduct,
    deleteSavedOutfitFromDB,
    addClosetItem,
    openWhyThis,
    openProductDetail,
    setActiveTab,
  } = useWardrobe();

  const [activeSubTab, setActiveSubTab] = useState<'products' | 'outfits'>('products');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-rose/15 text-luxury-blush border border-luxury-rose/30 mb-3">
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved Collection</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
          Saved Pieces &amp; Looks
        </h1>
        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
          Keep the pieces and looks you want to come back to. All items are synchronized with your MongoDB profile.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'products'
              ? 'glass-pill-active text-luxury-cream'
              : 'glass-pill text-gray-400 hover:text-white'
          }`}
        >
          <span>Saved Products</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">
            {savedProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('outfits')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'outfits'
              ? 'glass-pill-active text-luxury-cream'
              : 'glass-pill text-gray-400 hover:text-white'
          }`}
        >
          <span>Saved Outfits</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">
            {savedOutfits.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'products' ? (
        savedProducts.length === 0 ? (
          <div className="py-24 text-center space-y-3 rounded-3xl glass-panel p-8">
            <Bookmark className="w-10 h-10 text-gray-500 mx-auto" />
            <h3 className="font-editorial text-2xl font-bold text-luxury-cream">Nothing saved yet.</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Keep the pieces and looks you want to come back to. Click the heart icon on any recommendation.
            </p>
            <button
              onClick={() => setActiveTab('recommendations')}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-luxury-rose/25 text-luxury-blush border border-luxury-rose/40 hover:bg-luxury-rose/35 transition-colors"
            >
              Browse Recommendations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {savedProducts.map((prod) => (
              <div
                key={prod.productId}
                className="group rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-luxury-rose/30 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    onClick={() => openProductDetail(prod)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  />
                  <button
                    onClick={() => toggleSaveProduct(prod)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-dark-950/60 backdrop-blur-md text-luxury-blush hover:text-white transition-colors"
                    title="Remove from saved"
                  >
                    <Heart className="w-4 h-4 fill-luxury-blush" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-luxury-peach font-semibold truncate">
                    {prod.store}
                  </div>
                  <h4
                    onClick={() => openProductDetail(prod)}
                    className="text-xs font-bold text-luxury-cream truncate cursor-pointer hover:text-luxury-blush transition-colors"
                  >
                    {prod.name}
                  </h4>
                  <div className="text-xs font-bold text-luxury-cream font-mono">
                    ₹{prod.price.toLocaleString()}
                  </div>

                  <div className="pt-2 flex items-center gap-2 border-t border-white/5">
                    <button
                      onClick={() => openWhyThis(prod)}
                      className="flex-1 py-1 rounded-lg text-[10px] font-bold uppercase glass-pill text-luxury-lavender hover:border-luxury-lavender/40"
                    >
                      Why This
                    </button>
                    <button
                      onClick={() =>
                        addClosetItem({
                          name: prod.name,
                          category: prod.category,
                          subcategory: prod.subcategory,
                          color: prod.color,
                          styleTags: prod.styleTags,
                          occasion: prod.occasion,
                          season: prod.season,
                          price: prod.price,
                          store: prod.store,
                          imageUrl: prod.imageUrl,
                          isCustom: false,
                        })
                      }
                      className="p-1.5 rounded-lg bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/35 transition-colors"
                      title="Move to closet"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : savedOutfits.length === 0 ? (
        <div className="py-24 text-center space-y-3 rounded-3xl glass-panel p-8">
          <Layers className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="font-editorial text-2xl font-bold text-luxury-cream">
            No saved outfits yet.
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Design your looks in the Outfit Builder and save them to build your personal capsule lookbook.
          </p>
          <button
            onClick={() => setActiveTab('outfits')}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-luxury-rose/25 text-luxury-blush border border-luxury-rose/40 hover:bg-luxury-rose/35 transition-colors"
          >
            Go to Outfit Builder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedOutfits.map((outfit) => (
            <div
              key={outfit.outfitId}
              className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-luxury-peach font-bold">
                    {outfit.occasion} Look
                  </span>
                  <h4 className="font-editorial text-xl font-bold text-luxury-cream">
                    {outfit.caption}
                  </h4>
                </div>
                <button
                  onClick={() => deleteSavedOutfitFromDB(outfit.outfitId)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  title="Delete outfit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Outfit Pieces Grid */}
              <div className="grid grid-cols-5 gap-2">
                {outfit.items.map((item, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden glass-panel border border-white/5">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="p-1 text-[9px] text-gray-400 truncate text-center capitalize">
                      {item.slot}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {outfit.items.length} Pieces • Saved in MongoDB
                </span>
                <button
                  onClick={() => setActiveTab('outfits')}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-luxury-blush hover:text-white transition-colors"
                >
                  <span>Re-style Look</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
