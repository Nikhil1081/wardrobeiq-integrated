import React from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Category } from '../../types/domain';
import { GlassCard } from '../common/GlassCard';
import { WardrobeHealthRing } from '../common/WardrobeHealthRing';
import { PriorityBadge, MatchScoreBadge, DiscountBadge } from '../common/Badge';
import {
  Sparkles,
  ArrowRight,
  Shirt,
  Split,
  Layers,
  CheckCircle,
  TrendingUp,
  Heart,
  Plus,
  Compass,
  CloudSun,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const {
    dashboard,
    setActiveTab,
    openGapDetail,
    openWhyThis,
    openProductDetail,
    toggleSaveProduct,
    addClosetItem,
    savedProducts,
    loading,
  } = useWardrobe();

  if (loading && !dashboard) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-96 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-28 rounded-2xl bg-white/5" />
          <div className="h-28 rounded-2xl bg-white/5" />
          <div className="h-28 rounded-2xl bg-white/5" />
          <div className="h-28 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  const stats = dashboard?.wardrobeStatistics;
  const health = dashboard?.wardrobeHealth;
  const topGaps = dashboard?.topWardrobeGaps || [];
  const recs = dashboard?.recommendedProducts || [];
  const outfits = dashboard?.recommendedOutfits || [];

  const categoryCards: Array<{
    category: Category;
    label: string;
    count: number;
    image: string;
  }> = [
    {
      category: 'top',
      label: 'TOPS',
      count: stats?.categoryCounts?.top || 0,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    },
    {
      category: 'bottom',
      label: 'BOTTOMS',
      count: stats?.categoryCounts?.bottom || 0,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
    },
    {
      category: 'dress',
      label: 'DRESSES',
      count: stats?.categoryCounts?.dress || 0,
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    },
    {
      category: 'outerwear',
      label: 'OUTERWEAR',
      count: stats?.categoryCounts?.outerwear || 0,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
    },
    {
      category: 'shoes',
      label: 'SHOES',
      count: stats?.categoryCounts?.shoes || 0,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    },
    {
      category: 'accessory',
      label: 'ACCESSORIES',
      count: stats?.categoryCounts?.accessory || 0,
      image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=600&q=80',
    },
    {
      category: 'traditional',
      label: 'TRADITIONAL',
      count: stats?.categoryCounts?.traditional || 0,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="space-y-12">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 min-h-[460px] flex items-center shadow-glass">
        {/* Editorial Background Image with overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85"
            alt="Editorial Campaign"
            className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 p-8 md:p-14 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-blush/15 text-luxury-blush border border-luxury-blush/30 shadow-glow-rose">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Curated Around What You Already Own</span>
          </div>

          <h1 className="font-editorial text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-luxury-cream leading-[1.05]">
            Dress the life <br />
            <span className="italic text-gradient-luxury">you love.</span>
          </h1>

          <p className="text-sm md:text-base text-gray-300 font-normal leading-relaxed max-w-lg">
            Your wardrobe already has the pieces. Let AI show you what comes next. Intelligently identifying gaps, pairing outfits, and recommending only what completes your closet.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('stylist')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-all shadow-glow-rose cursor-pointer group"
            >
              <span>Get Styled</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('closet')}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider glass-pill hover:border-white/30 text-luxury-cream transition-all cursor-pointer"
            >
              Explore My Closet
            </button>

            <button
              onClick={() => setActiveTab('today')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400/25 transition-all cursor-pointer shadow-sm"
              title="What Should I Wear Today? Weather-aware wardrobe engine"
            >
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span>Wear Today (Weather)</span>
            </button>
          </div>
        </div>

        {/* Floating Insight Cards (Subtle animated badge pills) */}
        <div className="hidden lg:flex flex-col gap-3 absolute right-12 top-1/2 -translate-y-1/2 z-10">
          <div
            onClick={() => setActiveTab('today')}
            className="glass-panel-elevated p-4 rounded-2xl border border-amber-400/30 shadow-xl animate-float cursor-pointer hover:border-amber-400/60 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber-400 font-bold">
              <CloudSun className="w-3.5 h-3.5" />
              <span>Weather Stylist</span>
            </div>
            <div className="text-xl font-bold text-luxury-cream font-mono">
              Live Forecast
            </div>
            <div className="text-xs text-gray-400">Click for instant outfit &amp; gaps &rarr;</div>
          </div>

          <div className="glass-panel-elevated p-4 rounded-2xl border border-white/10 shadow-xl animate-float" style={{ animationDelay: '1.5s' }}>
            <div className="text-[10px] uppercase tracking-widest text-luxury-peach font-bold">
              Detected In MongoDB
            </div>
            <div className="text-xl font-bold text-luxury-cream font-mono">
              {topGaps.length} Wardrobe Gaps
            </div>
            <div className="text-xs text-gray-400">layering &amp; occasion opportunities</div>
          </div>

          <div
            className="glass-panel-elevated p-4 rounded-2xl border border-white/10 shadow-xl animate-float"
            style={{ animationDelay: '3s' }}
          >
            <div className="text-[10px] uppercase tracking-widest text-luxury-lavender font-bold">
              Outfits Generated
            </div>
            <div className="text-xl font-bold text-luxury-cream font-mono">
              {outfits.length > 0 ? `${outfits.length} Ready Outfits` : '8 Outfits Ready'}
            </div>
            <div className="text-xs text-gray-400">combined with owned pieces</div>
          </div>

          <div
            className="glass-panel-elevated p-4 rounded-2xl border border-white/10 shadow-xl animate-float"
            style={{ animationDelay: '4s' }}
          >
            <div className="text-[10px] uppercase tracking-widest text-luxury-blush font-bold">
              Health Metric
            </div>
            <div className="text-xl font-bold text-luxury-cream font-mono">
              {health?.overallScore || 87}% Wardrobe Health
            </div>
            <div className="text-xs text-gray-400">versatility &amp; color harmony</div>
          </div>
        </div>
      </section>

      {/* 2. QUICK INSIGHTS (4 Premium Cards) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard hoverEffect onClick={() => setActiveTab('closet')} className="p-5">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Items in Closet</span>
            <Shirt className="w-4 h-4 text-luxury-rose" />
          </div>
          <div className="text-3xl font-extrabold text-luxury-cream font-mono">
            {stats?.totalItems ?? 42}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <span className="text-luxury-blush font-medium">+3 this month</span>
            <span>in your closet</span>
          </div>
        </GlassCard>

        <GlassCard hoverEffect onClick={() => setActiveTab('gaps')} className="p-5">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Wardrobe Gaps</span>
            <Split className="w-4 h-4 text-luxury-peach" />
          </div>
          <div className="text-3xl font-extrabold text-luxury-cream font-mono">
            {topGaps.length}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            High &amp; medium priority gaps
          </div>
        </GlassCard>

        <GlassCard hoverEffect onClick={() => setActiveTab('outfits')} className="p-5">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Outfits Ready</span>
            <Layers className="w-4 h-4 text-luxury-lavender" />
          </div>
          <div className="text-3xl font-extrabold text-luxury-cream font-mono">
            {outfits.length || 8}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Personalized combinations
          </div>
        </GlassCard>

        <GlassCard hoverEffect onClick={() => setActiveTab('home')} className="p-5">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold">Wardrobe Health</span>
            <TrendingUp className="w-4 h-4 text-luxury-sage" />
          </div>
          <div className="text-3xl font-extrabold text-luxury-cream font-mono">
            {health?.overallScore || 87}%
          </div>
          <div className="text-xs text-luxury-sage mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Versatile &amp; balanced</span>
          </div>
        </GlassCard>
      </section>

      {/* 3. WARDROBE AT A GLANCE (6 Categories) */}
      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-editorial text-3xl font-bold text-luxury-cream">
              Your Wardrobe at a Glance
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Everything you own, beautifully organized into 6 core wardrobe pillars.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('closet')}
            className="text-xs font-semibold text-luxury-blush hover:text-white transition-colors flex items-center gap-1 group"
          >
            <span>View All Pieces</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {categoryCards.map((cat) => (
            <div
              key={cat.category}
              onClick={() => setActiveTab('closet')}
              className="group relative rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-luxury-rose/30 transition-all duration-300 cursor-pointer flex flex-col aspect-[3/4]"
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3.5">
                <span className="text-xs font-bold tracking-widest text-luxury-cream">
                  {cat.label}
                </span>
                <p className="text-[11px] text-luxury-peach font-medium">
                  {cat.count} {cat.count === 1 ? 'piece' : 'pieces'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WARDROBE HEALTH COMPONENT */}
      {health && (
        <section className="space-y-4">
          <WardrobeHealthRing health={health} />
        </section>
      )}

      {/* 5. WARDROBE GAPS PREVIEW */}
      {topGaps.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-blush">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Core Intelligence</span>
              </div>
              <h2 className="font-editorial text-3xl font-bold text-luxury-cream mt-1">
                Your Wardrobe Knows What It&apos;s Missing
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('gaps')}
              className="text-xs font-semibold text-luxury-blush hover:text-white transition-colors flex items-center gap-1 group"
            >
              <span>Explore All Gaps</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topGaps.map((gap) => (
              <GlassCard
                key={gap.gapId}
                hoverEffect
                glowColor={gap.priority === 'very_high' || gap.priority === 'high' ? 'rose' : 'peach'}
                onClick={() => openGapDetail(gap)}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase font-mono tracking-wider text-gray-400">
                      {gap.category}
                    </span>
                    <PriorityBadge priority={gap.priority} />
                  </div>

                  <h3 className="font-editorial text-2xl font-bold text-luxury-cream">
                    {gap.label}
                  </h3>

                  <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                    {gap.reason}
                  </p>

                  <div className="flex items-center gap-2 mt-4 text-xs text-luxury-peach">
                    <span className="font-bold">+{gap.outfitsUnlocked} Outfits Unlocked</span>
                    <span>• {gap.compatibleOwnedItems.length} pieces compatible</span>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-luxury-blush">
                    Complete This Gap →
                  </span>
                  <ArrowRight className="w-4 h-4 text-luxury-blush" />
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* 6. RECOMMENDED FOR YOU PREVIEW */}
      {recs.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-editorial text-3xl font-bold text-luxury-cream">
                Picked for Your Wardrobe
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Not just clothes you might like. Pieces that complete what you already own.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('recommendations')}
              className="text-xs font-semibold text-luxury-blush hover:text-white transition-colors flex items-center gap-1 group"
            >
              <span>View All Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recs.slice(0, 4).map((rec) => {
              const isSaved = savedProducts.some((p) => p.productId === rec.productId);
              return (
                <div
                  key={rec.productId}
                  className="group rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-luxury-rose/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      onClick={() => openProductDetail(rec)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSaveProduct(rec)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-dark-950/60 backdrop-blur-md text-white hover:text-luxury-blush transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${isSaved ? 'fill-luxury-blush text-luxury-blush' : ''}`}
                      />
                    </button>
                    <div className="absolute bottom-2.5 left-2.5">
                      <MatchScoreBadge score={rec.score} onClick={() => openWhyThis(rec)} />
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-luxury-peach font-semibold truncate">
                      {rec.store}
                    </div>
                    <h4
                      onClick={() => openProductDetail(rec)}
                      className="text-xs font-bold text-luxury-cream truncate cursor-pointer hover:text-luxury-blush transition-colors"
                    >
                      {rec.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-luxury-cream font-mono">
                        ₹{rec.price.toLocaleString()}
                      </span>
                      {rec.originalPrice > rec.price && (
                        <span className="text-xs text-gray-500 line-through">
                          ₹{rec.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2">
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
                        className="p-1.5 rounded-lg bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/35 transition-colors"
                        title="Add to closet"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. EDITORIAL FOOTER / BRAND MOMENT */}
      <section className="p-8 md:p-12 rounded-3xl glass-panel text-center space-y-4 border border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="w-10 h-10 rounded-full bg-luxury-rose/10 text-luxury-blush mx-auto flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="font-editorial text-3xl md:text-4xl font-bold text-luxury-cream">
          &ldquo;Complete your wardrobe, not your shopping cart.&rdquo;
        </h3>
        <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
          WardrobeIQ analyzes what you already own to unlock versatile outfit combinations, identify meaningful gaps, and ensure every purchase makes your entire closet work better together.
        </p>
      </section>
    </div>
  );
};
