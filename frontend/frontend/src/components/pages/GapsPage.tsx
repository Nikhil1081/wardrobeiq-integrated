import React from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { PriorityBadge } from '../common/Badge';
import { GlassCard } from '../common/GlassCard';
import { WardrobeHealthRing } from '../common/WardrobeHealthRing';
import { Sparkles, Split, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';

export const GapsPage: React.FC = () => {
  const { gaps, dashboard, openGapDetail } = useWardrobe();

  const health = dashboard?.wardrobeHealth;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-blush/15 text-luxury-blush border border-luxury-blush/30 shadow-glow-rose mb-3">
          <Split className="w-3.5 h-3.5" />
          <span>Intelligent Gap Detection</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
          Your Wardrobe Knows What It&apos;s Missing
        </h1>
        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
          Based on what you already own, we found opportunities to make your wardrobe significantly more versatile. Resolving these gaps creates more combinations without buying unnecessary duplicates.
        </p>
      </div>

      {/* Health Context */}
      {health && (
        <section>
          <WardrobeHealthRing health={health} compact />
        </section>
      )}

      {/* Prioritized Gaps Grid */}
      <section className="space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-luxury-cream">
          Prioritized Gaps ({gaps.length} Found in Closet)
        </h2>

        {gaps.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-3xl glass-panel p-8">
            <CheckCircle2 className="w-10 h-10 text-luxury-sage mx-auto" />
            <h3 className="font-editorial text-2xl font-bold text-luxury-cream">
              Your wardrobe is looking balanced ✦
            </h3>
            <p className="text-xs text-gray-400">
              No urgent gaps detected. Your current pieces provide balanced occasion and seasonal versatility.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gaps.map((gap) => {
              const isHigh = gap.priority === 'very_high' || gap.priority === 'high';
              const isMed = gap.priority === 'medium';

              return (
                <GlassCard
                  key={gap.gapId}
                  hoverEffect
                  glowColor={isHigh ? 'rose' : isMed ? 'peach' : 'sage'}
                  onClick={() => openGapDetail(gap)}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                      <span className="text-[11px] uppercase font-mono tracking-widest text-gray-400">
                        {gap.category}
                      </span>
                      <PriorityBadge priority={gap.priority} />
                    </div>

                    <h3 className="font-editorial text-2xl font-bold text-luxury-cream">
                      {gap.label}
                    </h3>

                    <p className="text-xs text-gray-300 mt-2.5 leading-relaxed line-clamp-3">
                      {gap.reason}
                    </p>

                    {/* Compatible Pieces Preview */}
                    {gap.compatibleOwnedItems && gap.compatibleOwnedItems.length > 0 && (
                      <div className="mt-5">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Compatible In Your Closet:
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          {gap.compatibleOwnedItems.slice(0, 4).map((item, idx) => (
                            <img
                              key={idx}
                              src={item.imageUrl}
                              alt={item.name}
                              title={item.name}
                              className="w-10 h-12 rounded-lg object-cover border border-white/10"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-xs text-luxury-peach font-semibold">
                      <Layers className="w-3.5 h-3.5" />
                      <span>+{gap.outfitsUnlocked} Outfits Unlocked</span>
                    </div>
                  </div>

                  <div className="pt-5 mt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-luxury-blush">
                      Complete This Gap →
                    </span>
                    <ArrowRight className="w-4 h-4 text-luxury-blush" />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
