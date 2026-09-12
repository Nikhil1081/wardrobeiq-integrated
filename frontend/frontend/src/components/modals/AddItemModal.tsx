import React, { useState } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Category, Occasion, Season } from '../../types/domain';
import { X, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';

export const AddItemModal: React.FC = () => {
  const { activeModal, closeModals, addClosetItem } = useWardrobe();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('outerwear');
  const [subcategory, setSubcategory] = useState('blazer');
  const [color, setColor] = useState('black');
  const [styleTags, setStyleTags] = useState<string[]>(['smart-casual', 'minimalist']);
  const [occasion, setOccasion] = useState<Occasion[]>(['workwear', 'dateNight']);
  const [season, setSeason] = useState<Season[]>(['winter', 'all-season']);
  const [price, setPrice] = useState(3499);
  const [store, setStore] = useState('Zara');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80'
  );
  const [submitting, setSubmitting] = useState(false);

  if (!activeModal.addItem) return null;

  const categories: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'traditional'];

  const samplePresets = [
    {
      label: 'FabIndia Chanderi Silk Kurta',
      category: 'traditional' as Category,
      subcategory: 'kurta',
      color: 'maroon',
      price: 3499,
      store: 'FabIndia',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Kanjeevaram Silk Saree',
      category: 'traditional' as Category,
      subcategory: 'saree',
      color: 'red',
      price: 12999,
      store: 'Heritage Guild',
      image: 'https://images.unsplash.com/photo-1610030469668-93510cb2866c?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Kyoto Silk Kimono & Haori',
      category: 'traditional' as Category,
      subcategory: 'kimono',
      color: 'indigo',
      price: 9800,
      store: 'Kyoto Silks',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Neutral Wool Blazer',
      category: 'outerwear' as Category,
      subcategory: 'blazer',
      color: 'beige',
      price: 3999,
      store: 'Zara',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
    },
    {
      label: 'Wide Leg Trousers',
      category: 'bottom' as Category,
      subcategory: 'trousers',
      color: 'cream',
      price: 2499,
      store: 'Mango',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addClosetItem({
        name,
        category,
        subcategory,
        color,
        styleTags,
        occasion,
        season,
        price,
        store,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
        isCustom: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated border border-white/10 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-luxury-rose/20 text-luxury-blush">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-luxury-cream">Add to My Closet</h3>
              <p className="text-xs text-gray-400">Persists directly to MongoDB &amp; recalculates gaps</p>
            </div>
          </div>
          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-luxury-peach uppercase tracking-wider">
            Quick Fill Presets:
          </span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setName(preset.label);
                  setCategory(preset.category);
                  setSubcategory(preset.subcategory);
                  setColor(preset.color);
                  setPrice(preset.price);
                  setStore(preset.store);
                  setImageUrl(preset.image);
                }}
                className="text-xs px-2.5 py-1 rounded-lg glass-pill hover:border-luxury-rose/40 text-gray-300 hover:text-white transition-all"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Oversized Trench Coat"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream placeholder-gray-500 focus:outline-none focus:border-luxury-rose/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-luxury-cream text-sm focus:outline-none focus:border-luxury-rose/50 capitalize"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-dark-850">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Subcategory
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="blazer, shirt, boots..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream placeholder-gray-500 text-sm focus:outline-none focus:border-luxury-rose/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. beige, black, navy"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream placeholder-gray-500 text-sm focus:outline-none focus:border-luxury-rose/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Price Paid (₹)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream text-sm focus:outline-none focus:border-luxury-rose/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Store / Brand
            </label>
            <input
              type="text"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="e.g. Zara, H&M, FabIndia"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream placeholder-gray-500 text-sm focus:outline-none focus:border-luxury-rose/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream placeholder-gray-500 text-sm focus:outline-none focus:border-luxury-rose/50"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
              )}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={closeModals}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow-rose cursor-pointer"
            >
              {submitting ? 'Saving to MongoDB...' : 'Save to Closet ✦'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
