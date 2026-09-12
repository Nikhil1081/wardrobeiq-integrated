import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { ProductCardDTO } from '../../types/dto';
import { useWardrobe } from '../../store/WardrobeContext';
import { Compass, Sparkles, ArrowRight, Heart, Plus } from 'lucide-react';

interface ExploreCollection {
  collectionId: string;
  title: string;
  subtitle: string;
  heroImage: string;
  tags: string[];
  products: ProductCardDTO[];
}

export const ExplorePage: React.FC = () => {
  const { openProductDetail, openWhyThis, toggleSaveProduct, addClosetItem, savedProducts } =
    useWardrobe();

  const [collections, setCollections] = useState<ExploreCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getExploreCollections()
      .then((cols) => setCollections(cols))
      .catch((err) => console.warn('Failed to load explore collections:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-champagne/15 text-luxury-champagne border border-luxury-champagne/30 mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>Editorial Discovery</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
          Fashion Edit &amp; Curations
        </h1>
        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
          Themed edits curated for college, formal workwear, minimal aesthetics, monsoon resilience, and evening statements.
        </p>
      </div>

      {loading ? (
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
                          onClick={() => openProductDetail(prod)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSaveProduct(prod)}
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
                          onClick={() => openProductDetail(prod)}
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
                            onClick={() => openProductDetail(prod)}
                            className="flex-1 py-1 rounded text-[10px] font-bold uppercase glass-pill hover:border-luxury-lavender/40 text-luxury-lavender"
                          >
                            Details
                          </button>
                          <button
                            type="button"
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
                            className="p-1.5 rounded bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/35 transition-colors"
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
  );
};
