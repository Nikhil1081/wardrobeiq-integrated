import React, { useEffect, useState } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { apiClient } from '../../api/client';
import { WhyThisDTO } from '../../types/dto';
import { ScoreBar } from '../common/ScoreBar';
import { X, Sparkles, Check, Heart, Plus, ShieldCheck } from 'lucide-react';

export const WhyThisDrawer: React.FC = () => {
  const {
    activeModal,
    closeModals,
    currentCustomerId,
    toggleSaveProduct,
    addClosetItem,
    savedProducts,
    showToast,
  } = useWardrobe();

  const rec = activeModal.whyThis;
  const [whyData, setWhyData] = useState<WhyThisDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rec && currentCustomerId) {
      setLoading(true);
      apiClient
        .getWhyThis(currentCustomerId, rec.productId)
        .then((res) => setWhyData(res))
        .catch((err) => {
          console.warn('Error loading whyThis explanation:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [rec, currentCustomerId]);

  if (!rec) return null;

  const isSaved = savedProducts.some((p) => p.productId === rec.productId);
  const breakdown = whyData?.scoreBreakdown || rec.scoreBreakdown;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl rounded-l-3xl glass-panel-elevated border-l border-white/10 shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-luxury-blush text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Recommendation Intelligence</span>
              </div>
              <button
                onClick={closeModals}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Card */}
            <div className="mt-5 flex items-center gap-4 p-4 rounded-2xl glass-panel border border-white/5">
              <img
                src={rec.imageUrl}
                alt={rec.name}
                className="w-16 h-20 rounded-xl object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                  {rec.store}
                </div>
                <h3 className="font-editorial text-xl font-bold text-luxury-cream truncate">
                  {rec.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-luxury-cream font-mono">
                    ₹{rec.price.toLocaleString()}
                  </span>
                  {rec.originalPrice > rec.price && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{rec.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-luxury-rose/20 text-luxury-blush border border-luxury-rose/30">
                    {rec.score}% Match
                  </span>
                </div>
              </div>
            </div>

            {/* Title Statement */}
            <div className="mt-6">
              <h2 className="font-editorial text-2xl font-bold text-luxury-cream">
                Why we think this belongs in your wardrobe
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Curated around what you already own, your current season, and your style palette.
              </p>
            </div>

            {/* Evidence Checklist */}
            <div className="mt-5 space-y-2.5">
              {rec.filledGap && (
                <div className="flex items-start gap-2.5 text-xs text-luxury-blush bg-luxury-rose/10 p-3 rounded-xl border border-luxury-rose/20">
                  <Check className="w-4 h-4 shrink-0 text-luxury-blush mt-0.5" />
                  <span>
                    <strong>Completes your wardrobe gap:</strong> Directly addresses shortage in{' '}
                    <span className="capitalize">{rec.filledGap.label}</span>.
                  </span>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-xs text-gray-200 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                <Check className="w-4 h-4 shrink-0 text-luxury-sage mt-0.5" />
                <span>
                  {whyData?.styleReason ||
                    `Matches your preferred ${rec.styleTags.slice(0, 2).join(' & ')} aesthetic.`}
                </span>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-gray-200 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                <Check className="w-4 h-4 shrink-0 text-luxury-lavender mt-0.5" />
                <span>
                  {whyData?.colorReason ||
                    `Complements your core palette in ${rec.color}.`}
                </span>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-gray-200 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                <Check className="w-4 h-4 shrink-0 text-luxury-peach mt-0.5" />
                <span>
                  {whyData?.budgetReason ||
                    `Comfortably aligns with your budget threshold.`}
                </span>
              </div>

              {rec.browsingSignal && rec.browsingSignal.viewCount > 0 && (
                <div className="flex items-start gap-2.5 text-xs text-luxury-champagne bg-luxury-champagne/10 p-3 rounded-xl border border-luxury-champagne/20">
                  <Check className="w-4 h-4 shrink-0 text-luxury-champagne mt-0.5" />
                  <span>
                    You viewed similar styles {rec.browsingSignal.viewCount} times recently.
                  </span>
                </div>
              )}
            </div>

            {/* Score Breakdown Bars (Authoritative Backend Values) */}
            {breakdown && (
              <div className="mt-6 p-5 rounded-2xl glass-panel border border-white/5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-luxury-cream">
                    AI Match Breakdown
                  </span>
                  <span className="text-sm font-extrabold text-luxury-blush font-mono">
                    {breakdown.finalScore} / 100
                  </span>
                </div>

                <ScoreBar label="Gap Relevance" value={breakdown.gapRelevance ?? breakdown.gapScore ?? 0} maxValue={30} color="rose" delayMs={50} />
                <ScoreBar label="Style Compatibility" value={breakdown.styleCompatibility ?? breakdown.styleScore ?? 0} maxValue={20} color="lavender" delayMs={100} />
                <ScoreBar label="Color Harmony" value={breakdown.colorCompatibility ?? 0} maxValue={15} color="peach" delayMs={150} />
                <ScoreBar label="Occasion Alignment" value={breakdown.occasionCompatibility ?? breakdown.profileScore ?? 0} maxValue={15} color="sage" delayMs={200} />
                <ScoreBar label="Budget Fit" value={breakdown.budgetCompatibility ?? breakdown.purchaseScore ?? 0} maxValue={10} color="peach" delayMs={250} />
                <ScoreBar label="Season Coverage" value={breakdown.seasonCompatibility ?? breakdown.seasonalScore ?? 0} maxValue={10} color="lavender" delayMs={300} />

                {(breakdown.browsingBoost ?? breakdown.browsingScore ?? 0) > 0 && (
                  <div className="flex justify-between text-xs text-luxury-blush pt-1">
                    <span>Browsing Telemetry Boost</span>
                    <span className="font-mono">+{(breakdown.browsingBoost ?? breakdown.browsingScore ?? 0)}</span>
                  </div>
                )}

                {breakdown.duplicatePenalty < 0 && (
                  <div className="flex justify-between text-xs text-red-400 pt-1">
                    <span>Similarity / Duplicate Penalty</span>
                    <span className="font-mono">{breakdown.duplicatePenalty}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pairs With Actual Wardrobe Items */}
            {rec.compatibleWardrobeItems && rec.compatibleWardrobeItems.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                  Pairs Beautifully With What You Own
                </h4>
                <div className="grid grid-cols-4 gap-2.5">
                  {rec.compatibleWardrobeItems.map((item, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden glass-panel border border-white/5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="p-1.5 text-[10px] text-gray-300 truncate text-center">
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-6 border-t border-white/5 mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleSaveProduct(rec)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                isSaved
                  ? 'bg-luxury-rose/20 text-luxury-blush border-luxury-rose/40 shadow-glow-rose'
                  : 'glass-panel text-gray-300 hover:text-white hover:border-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-luxury-blush text-luxury-blush' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Item'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await addClosetItem({
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
                });
                showToast('Added to your closet ✦', `"${rec.name}" stored in MongoDB`, 'rose');
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
