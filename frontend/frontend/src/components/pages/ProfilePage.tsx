import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { User, Sparkles, Check, DollarSign, Palette, Shield } from 'lucide-react';
import { Season, Occasion } from '../../types/domain';

export const ProfilePage: React.FC = () => {
  const {
    currentCustomer,
    customers,
    currentCustomerId,
    setCurrentCustomerId,
    updateCustomerPreferences,
  } = useWardrobe();

  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>([]);
  const [budget, setBudget] = useState<number>(5000);
  const [currentSeason, setCurrentSeason] = useState<Season>('summer');
  const [preferredOccasions, setPreferredOccasions] = useState<Occasion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentCustomer) {
      setPreferredStyles(currentCustomer.preferredStyles || []);
      setPreferredColors(currentCustomer.preferredColors || []);
      setAvoidedColors(currentCustomer.avoidedColors || []);
      setBudget(currentCustomer.budget || 5000);
      setCurrentSeason(currentCustomer.currentSeason || 'summer');
      setPreferredOccasions(currentCustomer.preferredOccasions || ['workwear']);
    }
  }, [currentCustomer]);

  const styleOptions = [
    'minimalist',
    'casual',
    'smart-casual',
    'streetwear',
    'formal',
    'classic',
    'ethnic',
  ];
  const colorOptions = [
    'black',
    'white',
    'beige',
    'grey',
    'champagne',
    'navy',
    'olive',
    'cream',
    'brown',
    'red',
    'pink',
    'neon',
  ];
  const occasionOptions: Occasion[] = ['workwear', 'casual', 'college', 'dateNight', 'weekend', 'party'];
  const seasonOptions: Season[] = ['summer', 'monsoon', 'winter', 'all-season'];

  const toggleArrayItem = <T extends string>(list: T[], item: T): T[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCustomerPreferences({
        preferredStyles,
        preferredColors,
        avoidedColors,
        budget,
        currentSeason,
        preferredOccasions,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-lavender/15 text-luxury-lavender border border-luxury-lavender/30 mb-3">
          <User className="w-3.5 h-3.5" />
          <span>Customer Profile</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-luxury-cream">
          Style Preferences &amp; Persona
        </h1>
        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
          Configure your style persona, budget boundary, and color palette. All 12 profiles are synchronized with the backend MongoDB database.
        </p>
      </div>

      {/* Customer Switcher Strip */}
      <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-luxury-peach">
            Active Persona: {currentCustomer?.name} ({currentCustomerId})
          </span>
          <span className="text-[10px] text-gray-400 font-mono">12 Profiles in MongoDB</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {customers.map((c) => {
            const isSelected = c.customerId === currentCustomerId;
            return (
              <button
                key={c.customerId}
                onClick={() => setCurrentCustomerId(c.customerId)}
                className={`p-2.5 rounded-2xl flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'bg-luxury-rose/25 border border-luxury-rose/50 shadow-glow-rose scale-105'
                    : 'glass-panel hover:border-white/20 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-11 h-11 rounded-xl object-cover border border-white/10 mb-2"
                />
                <span className="text-xs font-bold text-luxury-cream truncate w-full">
                  {c.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-gray-400 font-mono">{c.customerId}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferences Form */}
      <div className="p-6 md:p-8 rounded-3xl glass-panel border border-white/5 space-y-7">
        {/* Preferred Styles */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-luxury-cream mb-2.5">
            Preferred Styles (Used in Recommendation Scoring 20%)
          </label>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((st) => {
              const active = preferredStyles.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPreferredStyles(toggleArrayItem(preferredStyles, st))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    active
                      ? 'bg-luxury-rose/25 text-luxury-blush border border-luxury-rose/40'
                      : 'glass-pill text-gray-400 hover:text-white'
                  }`}
                >
                  {active && <Check className="w-3 h-3 inline mr-1" />}
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Colors */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-luxury-cream mb-2.5">
            Preferred Colors (Color Harmony 15%)
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((col) => {
              const active = preferredColors.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setPreferredColors(toggleArrayItem(preferredColors, col))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    active
                      ? 'bg-luxury-lavender/25 text-luxury-lavender border border-luxury-lavender/40'
                      : 'glass-pill text-gray-400 hover:text-white'
                  }`}
                >
                  {active && <Check className="w-3 h-3 inline mr-1" />}
                  {col}
                </button>
              );
            })}
          </div>
        </div>

        {/* Avoided Colors */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-red-400 mb-2.5">
            Avoided Colors (Penalized in AI Match)
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((col) => {
              const active = avoidedColors.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAvoidedColors(toggleArrayItem(avoidedColors, col))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    active
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'glass-pill text-gray-400 hover:text-white'
                  }`}
                >
                  {active && <span className="mr-1">✕</span>}
                  {col}
                </button>
              );
            })}
          </div>
        </div>

        {/* Occasions & Season */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-luxury-cream mb-2.5">
              Preferred Occasions (15%)
            </label>
            <div className="flex flex-wrap gap-2">
              {occasionOptions.map((occ) => {
                const active = preferredOccasions.includes(occ);
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setPreferredOccasions(toggleArrayItem(preferredOccasions, occ))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      active
                        ? 'bg-luxury-peach/25 text-luxury-peach border border-luxury-peach/40'
                        : 'glass-pill text-gray-400 hover:text-white'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 inline mr-1" />}
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-luxury-cream mb-2.5">
              Current Season (10%)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {seasonOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCurrentSeason(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize text-center transition-all ${
                    currentSeason === s
                      ? 'glass-pill-active text-luxury-cream'
                      : 'glass-pill text-gray-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-luxury-cream">
              Budget Ceiling (10% Budget Compatibility)
            </span>
            <span className="text-base font-bold text-luxury-blush font-mono">
              ₹{budget.toLocaleString()}
            </span>
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

        {/* Save Button */}
        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-opacity shadow-glow-rose cursor-pointer"
          >
            {saving ? 'Updating in MongoDB...' : 'Save Style Preferences ✦'}
          </button>
        </div>
      </div>
    </div>
  );
};
