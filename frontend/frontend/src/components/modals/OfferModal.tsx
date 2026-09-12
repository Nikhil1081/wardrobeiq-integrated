import React from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { X, Tag, CheckCircle, Calendar, ShieldCheck } from 'lucide-react';

export const OfferModal: React.FC = () => {
  const { activeModal, closeModals } = useWardrobe();
  const offer = activeModal.offerDetail;

  if (!offer) return null;

  const validDate = new Date(offer.validUntil).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl glass-panel-elevated border border-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-blush">
            <Tag className="w-4 h-4" />
            <span>Verified Promotion</span>
          </div>
          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 text-center space-y-2">
          <div className="inline-block px-4 py-1 rounded-full text-xl font-extrabold bg-luxury-rose/25 text-luxury-blush border border-luxury-rose/40 font-mono">
            {offer.discountPercentage}% OFF
          </div>
          <h3 className="font-editorial text-xl font-bold text-luxury-cream mt-2">
            {offer.label}
          </h3>
        </div>

        <div className="mt-5 space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
          <div className="flex items-start gap-2 text-gray-300">
            <CheckCircle className="w-4 h-4 text-luxury-sage shrink-0 mt-0.5" />
            <span>
              <strong>Condition:</strong>{' '}
              {offer.conditionType === 'minimum_purchase'
                ? `Valid on cart orders above ₹${offer.minimumPurchase?.toLocaleString()}`
                : offer.conditionType === 'category_pair'
                ? `Bundle discount with any compatible ${offer.conditionCategory || 'top'}`
                : 'Direct store discount applied automatically.'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4 text-luxury-peach shrink-0" />
            <span>Valid through: <strong className="text-luxury-cream">{validDate}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-luxury-sage">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Offer verified active in backend catalogue</span>
          </div>
        </div>

        <button
          type="button"
          onClick={closeModals}
          className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-luxury-cream transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
