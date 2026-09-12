import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Occasion, Season, Category } from '../../types/domain';
import { OutfitDTO, OutfitItemDTO } from '../../types/dto';
import { apiClient } from '../../api/client';
import { SourceBadge } from '../common/Badge';
import {
  Sparkles,
  Shuffle,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Bookmark,
  DollarSign,
  Layers,
  X,
  Check,
} from 'lucide-react';

export const OutfitBuilderPage: React.FC = () => {
  const { currentCustomerId, saveOutfitToDB, addClosetItem, showToast, dashboard } = useWardrobe();

  const [occasion, setOccasion] = useState<Occasion>('workwear');
  const [season, setSeason] = useState<Season>('summer');
  const [style, setStyle] = useState<string>('smart-casual');
  const [budget, setBudget] = useState<number>(6000);

  const [currentOutfit, setCurrentOutfit] = useState<OutfitDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [shuffling, setShuffling] = useState<boolean>(false);

  // Generate outfit on initial load or occasion change
  const handleGenerate = async () => {
    if (!currentCustomerId) return;
    setLoading(true);
    try {
      const outfit = await apiClient.generateOutfit(currentCustomerId, occasion, season, style, budget);
      setCurrentOutfit(outfit);
    } catch (err: any) {
      console.warn('Error generating outfit:', err);
      // Fallback to recommended outfit from dashboard if exists
      if (dashboard?.recommendedOutfits?.[0]) {
        setCurrentOutfit(dashboard.recommendedOutfits[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [currentCustomerId, occasion, season]);

  // Lock / Unlock slot item
  const toggleLockSlot = (slot: Category) => {
    if (!currentOutfit) return;
    setCurrentOutfit({
      ...currentOutfit,
      items: currentOutfit.items.map((item) =>
        item.slot === slot ? { ...item, locked: !item.locked } : item
      ),
    });
  };

  // Replace item in slot using backend
  const handleReplaceSlot = async (slot: Category) => {
    if (!currentOutfit || !currentCustomerId) return;
    try {
      const updated = await apiClient.replaceOutfitSlot(currentCustomerId, currentOutfit, slot);
      setCurrentOutfit(updated);
      showToast(`Replaced ${slot} piece ✦`, 'Next best compatible item selected from MongoDB', 'info');
    } catch (err: any) {
      showToast('Could not replace item', err?.message, 'info');
    }
  };

  // Shuffle unlocked items using backend
  const handleShuffle = async () => {
    if (!currentOutfit || !currentCustomerId) return;
    setShuffling(true);
    try {
      const updated = await apiClient.shuffleOutfit(currentCustomerId, currentOutfit);
      setCurrentOutfit(updated);
      showToast('Outfit reconfigured ✦', 'Unlocked slots randomized with backend scoring', 'rose');
    } catch (err: any) {
      showToast('Shuffle error', err?.message, 'info');
    } finally {
      setShuffling(false);
    }
  };

  // Add all AI recommended pieces from outfit to closet
  const handleAddMissingPieces = async () => {
    if (!currentOutfit) return;
    const aiItems = currentOutfit.items.filter((i) => i.source === 'recommendation');
    if (aiItems.length === 0) {
      showToast('All pieces are already in your closet!', '', 'info');
      return;
    }

    for (const item of aiItems) {
      await addClosetItem({
        name: item.name,
        category: item.category,
        subcategory: item.category,
        color: 'Neutral',
        styleTags: [style],
        occasion: [occasion],
        season: [season],
        price: item.price,
        imageUrl: item.imageUrl,
        isCustom: false,
      });
    }
    showToast('Missing pieces added to closet ✦', `Added ${aiItems.length} items to your wardrobe`, 'rose');
  };

  const occasions: Array<{ id: Occasion; label: string }> = [
    { id: 'casual', label: 'Casual' },
    { id: 'college', label: 'College' },
    { id: 'workwear', label: 'Workwear' },
    { id: 'party', label: 'Party' },
    { id: 'dateNight', label: 'Date Night' },
    { id: 'weekend', label: 'Weekend' },
  ];

  const seasons: Array<{ id: Season; label: string }> = [
    { id: 'summer', label: 'Summer' },
    { id: 'monsoon', label: 'Monsoon' },
    { id: 'winter', label: 'Winter' },
    { id: 'all-season', label: 'All Season' },
  ];

  const styles = ['Minimal', 'Casual', 'Classic', 'Street', 'Smart-Casual', 'Formal'];

  const closetPiecesCount = currentOutfit?.items.filter((i) => i.source === 'wardrobe').length || 0;
  const aiPiecesCount = currentOutfit?.items.filter((i) => i.source === 'recommendation').length || 0;

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-lavender/15 text-luxury-lavender border border-luxury-lavender/30 shadow-glow-lavender mb-3">
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Outfit Composition</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
          Build Your Look
        </h1>
        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
          Let AI combine what you own with pieces worth adding. Lock pieces you love, replace individual slots, or shuffle for new combinations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Filter Panel */}
        <div className="lg:col-span-4 space-y-6 p-6 rounded-3xl glass-panel border border-white/5 h-fit">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-luxury-peach mb-2.5">
              Occasion
            </label>
            <div className="grid grid-cols-2 gap-2">
              {occasions.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => setOccasion(occ.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                    occasion === occ.id
                      ? 'glass-pill-active text-luxury-cream'
                      : 'glass-pill text-gray-400 hover:text-white'
                  }`}
                >
                  {occ.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-luxury-lavender mb-2.5">
              Season
            </label>
            <div className="grid grid-cols-2 gap-2">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeason(s.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                    season === s.id
                      ? 'glass-pill-active text-luxury-cream'
                      : 'glass-pill text-gray-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-luxury-blush mb-2.5">
              Style Mood
            </label>
            <div className="flex flex-wrap gap-1.5">
              {styles.map((st) => (
                <button
                  key={st}
                  onClick={() => setStyle(st.toLowerCase())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    style.toLowerCase() === st.toLowerCase()
                      ? 'bg-luxury-rose/25 text-luxury-blush border border-luxury-rose/40'
                      : 'glass-pill text-gray-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold uppercase tracking-wider text-gray-300">Max Budget</span>
              <span className="font-bold text-luxury-cream font-mono">₹{budget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="15000"
              step="500"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-luxury-rose"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate New Look</span>
          </button>
        </div>

        {/* Right Large Outfit Composition */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="py-32 text-center space-y-3 rounded-3xl glass-panel animate-pulse">
              <Sparkles className="w-8 h-8 text-luxury-blush mx-auto animate-spin" />
              <div className="text-sm font-semibold text-luxury-cream">
                Assembling harmonious outfit from your wardrobe &amp; catalog...
              </div>
            </div>
          ) : currentOutfit ? (
            <div className="rounded-3xl glass-panel border border-white/10 p-6 md:p-8 space-y-6">
              {/* Header inside outfit */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-blush">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentOutfit.occasion} Ensemble</span>
                  </div>
                  <h3 className="font-editorial text-2xl md:text-3xl font-bold text-luxury-cream mt-1">
                    {currentOutfit.caption || `${currentOutfit.occasion} Look`}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 font-mono">
                    <span>{closetPiecesCount} from your closet</span>
                    <span>•</span>
                    <span className="text-luxury-blush">{aiPiecesCount} AI recommended</span>
                    <span>•</span>
                    <span className="text-luxury-cream font-bold">
                      ₹{currentOutfit.totalCost.toLocaleString()} to complete
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-luxury-rose/20 text-luxury-blush border border-luxury-rose/30">
                    {currentOutfit.compatibilityScore}% Compatibility
                  </span>
                </div>
              </div>

              {/* Slot Items Composition Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                {currentOutfit.items.map((item) => (
                  <div
                    key={item.slot}
                    className={`rounded-2xl overflow-hidden glass-panel border transition-all duration-300 flex flex-col justify-between relative group ${
                      item.locked ? 'border-luxury-rose/50 shadow-glow-rose' : 'border-white/5'
                    }`}
                  >
                    {/* Image & Badges */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2">
                        <SourceBadge source={item.source} />
                      </div>

                      {/* Lock Button */}
                      <button
                        type="button"
                        onClick={() => toggleLockSlot(item.slot)}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                          item.locked
                            ? 'bg-luxury-rose text-dark-950 font-bold'
                            : 'bg-dark-950/70 text-gray-300 hover:text-white'
                        }`}
                        title={item.locked ? 'Unlock item' : 'Lock item'}
                      >
                        {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-1.5">
                      <div className="text-[10px] uppercase font-mono tracking-widest text-luxury-peach font-bold">
                        {item.slot}
                      </div>
                      <div className="text-xs font-bold text-luxury-cream truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {item.price > 0 ? `₹${item.price.toLocaleString()}` : 'Owned'}
                      </div>

                      {/* Replace Button */}
                      {!item.locked && (
                        <button
                          type="button"
                          onClick={() => handleReplaceSlot(item.slot)}
                          className="w-full mt-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider glass-pill hover:border-luxury-lavender/40 text-luxury-lavender transition-colors flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Replace</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShuffle}
                    disabled={shuffling}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider glass-pill hover:border-white/30 text-luxury-cream transition-all cursor-pointer"
                  >
                    <Shuffle className={`w-4 h-4 ${shuffling ? 'animate-spin' : ''}`} />
                    <span>Shuffle Look</span>
                  </button>

                  <button
                    onClick={() => saveOutfitToDB(currentOutfit)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider glass-pill hover:border-luxury-rose/40 text-luxury-blush transition-all cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Save Outfit</span>
                  </button>
                </div>

                {aiPiecesCount > 0 && (
                  <button
                    onClick={handleAddMissingPieces}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Missing Pieces to Closet</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
