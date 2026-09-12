import React, { useEffect, useState } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { PriorityBadge } from '../common/Badge';
import { apiClient } from '../../api/client';
import { RecommendationDTO, WardrobeItemDTO } from '../../types/dto';
import { X, Sparkles, Unlock, CheckCircle, ChevronRight, Plus } from 'lucide-react';

export const GapDetailDrawer: React.FC = () => {
  const {
    activeModal,
    closeModals,
    currentCustomerId,
    openWhyThis,
    addClosetItem,
    showToast,
  } = useWardrobe();

  const gap = activeModal.gapDetail;

  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    compatibleOwnedItems: WardrobeItemDTO[];
    suggestedProducts: RecommendationDTO[];
    potentialOutfitsCount: number;
  } | null>(null);

  useEffect(() => {
    if (gap && currentCustomerId) {
      setLoading(true);
      apiClient
        .getGapDetail(currentCustomerId, gap.gapId)
        .then((res) => {
          setDetailData({
            compatibleOwnedItems: res.compatibleOwnedItems || [],
            suggestedProducts: res.suggestedProducts || [],
            potentialOutfitsCount: res.potentialOutfitsCount || gap.outfitsUnlocked || 4,
          });
        })
        .catch((err) => {
          console.warn('Error fetching gap detail:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [gap, currentCustomerId]);

  if (!gap) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl rounded-l-3xl glass-panel-elevated border-l border-white/10 shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-mono text-gray-400">Wardrobe Gap Intelligence</span>
                <PriorityBadge priority={gap.priority} />
              </div>
              <button
                onClick={closeModals}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5">
              <h2 className="font-editorial text-3xl font-bold text-luxury-cream capitalize">
                {gap.label}
              </h2>
              <p className="text-xs text-luxury-peach mt-1.5 font-medium">
                Category: <span className="uppercase tracking-wider font-semibold text-luxury-cream">{gap.category}</span>
              </p>
            </div>

            {/* Why It Matters */}
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-blush">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Why This Gap Matters</span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {gap.reason}
              </p>
              {gap.supportingSignal && (
                <p className="text-xs text-gray-400 italic">
                  Evidence: {gap.supportingSignal}
                </p>
              )}
            </div>

            {/* Unlocked Outfits Metric */}
            <div className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-luxury-rose/10 border border-luxury-rose/20">
              <Unlock className="w-5 h-5 text-luxury-blush shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-luxury-cream text-sm mr-1">
                  +{detailData?.potentialOutfitsCount ?? gap.outfitsUnlocked} Outfits
                </span>
                <span className="text-gray-300">
                  would be unlocked across your existing wardrobe by fulfilling this piece.
                </span>
              </div>
            </div>

            {/* Compatible Owned Items */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                Works With Pieces You Already Own ({detailData?.compatibleOwnedItems?.length ?? gap.compatibleOwnedItems?.length ?? 0})
              </h4>
              <div className="grid grid-cols-4 gap-2.5">
                {(detailData?.compatibleOwnedItems?.length
                  ? detailData.compatibleOwnedItems
                  : gap.compatibleOwnedItems || []
                ).map((item, idx) => (
                  <div key={idx} className="group relative rounded-xl overflow-hidden glass-panel border border-white/5">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-1.5 text-[10px] text-gray-300 truncate text-center">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Products To Complete Gap */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-blush mb-3 flex items-center justify-between">
                <span>Recommended to Complete This Gap</span>
                <span className="text-[10px] text-gray-400 font-normal">Backend Multi-Factor Match</span>
              </h4>

              {loading ? (
                <div className="py-6 text-center text-xs text-gray-400 animate-pulse">
                  Querying MongoDB recommendation scoring engine...
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {detailData?.suggestedProducts && detailData.suggestedProducts.length > 0 ? (
                    detailData.suggestedProducts.map((prod) => (
                      <div
                        key={prod.productId}
                        className="flex items-center justify-between p-2.5 rounded-xl glass-panel hover:border-luxury-rose/30 transition-all gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-12 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-luxury-cream truncate">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              ₹{prod.price.toLocaleString()} • {prod.store}
                            </div>
                            <div className="text-[10px] text-luxury-blush font-semibold mt-0.5">
                              {prod.score}% Match Score
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openWhyThis(prod)}
                            className="px-2 py-1 rounded-lg text-[10px] font-semibold glass-pill hover:border-luxury-lavender/40 text-luxury-lavender"
                          >
                            Why This?
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await addClosetItem({
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
                              });
                              showToast('Gap Completed! ✦', `Added ${prod.name} to closet`, 'rose');
                              closeModals();
                            }}
                            className="p-1.5 rounded-lg bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/35 transition-colors"
                            title="Add directly to closet"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 py-3 text-center">
                      Explore our recommendations tab to find matching pieces.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={closeModals}
              className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose"
            >
              Done Reviewing Gap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
