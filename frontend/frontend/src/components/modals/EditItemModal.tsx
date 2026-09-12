import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Category } from '../../types/domain';
import { X, Trash2, Edit3, AlertTriangle } from 'lucide-react';

export const EditItemModal: React.FC = () => {
  const { activeModal, closeModals, updateClosetItem, deleteClosetItem } = useWardrobe();
  const item = activeModal.editItem;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('top');
  const [subcategory, setSubcategory] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState(0);
  const [store, setStore] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'top');
      setSubcategory(item.subcategory || '');
      setColor(item.color || '');
      setPrice(item.price || 0);
      setStore(item.store || '');
      setImageUrl(item.imageUrl || '');
      setConfirmDelete(false);
    }
  }, [item]);

  if (!item) return null;

  const categories: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateClosetItem(item.itemId, {
        name,
        category,
        subcategory,
        color,
        price,
        store,
        imageUrl,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteClosetItem(item.itemId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated border border-white/10 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-luxury-lavender/20 text-luxury-lavender">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-luxury-cream">Edit Closet Piece</h3>
              <p className="text-xs text-gray-400">Update metadata or remove from MongoDB</p>
            </div>
          </div>
          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmDelete ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-luxury-cream">Delete &ldquo;{item.name}&rdquo;?</h4>
            <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
              This will remove this item from your MongoDB collection. Your wardrobe health and gap analysis will automatically recalculate.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white glass-panel"
              >
                Keep Item
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Item Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream text-sm focus:outline-none focus:border-luxury-rose/50"
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
                  className="w-full px-3 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-luxury-cream text-sm capitalize focus:outline-none focus:border-luxury-rose/50"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
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
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream text-sm focus:outline-none focus:border-luxury-rose/50"
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
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream text-sm focus:outline-none focus:border-luxury-rose/50"
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
                Store
              </label>
              <input
                type="text"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream text-sm focus:outline-none focus:border-luxury-rose/50"
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
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-luxury-cream text-sm focus:outline-none focus:border-luxury-rose/50"
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

            <div className="pt-4 flex items-center justify-between border-t border-white/5">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-90 transition-all shadow-glow-rose"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
