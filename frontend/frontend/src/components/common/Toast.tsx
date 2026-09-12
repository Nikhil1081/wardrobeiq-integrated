import React from 'react';
import { useWardrobe, ToastItem } from '../../store/WardrobeContext';
import { CheckCircle, Info, Sparkles, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWardrobe();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const iconMap = {
    rose: <Sparkles className="w-5 h-5 text-luxury-blush shrink-0 animate-pulse" />,
    success: <CheckCircle className="w-5 h-5 text-luxury-sage shrink-0" />,
    info: <Info className="w-5 h-5 text-luxury-lavender shrink-0" />,
  };

  const borderMap = {
    rose: 'border-luxury-rose/40 shadow-glow-rose',
    success: 'border-luxury-sage/40 shadow-glow-sage',
    info: 'border-luxury-lavender/40 shadow-glow-lavender',
  };

  const type = toast.type || 'success';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl glass-panel-elevated border transition-all duration-300 animate-slide-in ${borderMap[type]}`}
    >
      {iconMap[type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-luxury-cream">{toast.title}</h4>
        {toast.subtitle && (
          <p className="text-xs text-gray-300 mt-0.5 line-clamp-2 leading-relaxed">{toast.subtitle}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white transition-colors p-1 rounded-md"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
