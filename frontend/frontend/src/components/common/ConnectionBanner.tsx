import React from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ConnectionBanner: React.FC = () => {
  const { backendConnected, checkConnection, refreshAll } = useWardrobe();

  if (backendConnected) return null;

  return (
    <div className="bg-luxury-rose/10 border-b border-luxury-rose/30 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-luxury-cream">
          <AlertCircle className="w-4 h-4 text-luxury-blush shrink-0" />
          <span>
            <strong className="font-semibold text-luxury-blush">Backend Connection Notice:</strong>{' '}
            Express service at <code className="text-[11px] bg-black/40 px-1.5 py-0.5 rounded font-mono">http://localhost:3000/api/v1</code> is currently unreachable.
          </span>
        </div>
        <button
          onClick={async () => {
            await checkConnection();
            await refreshAll();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-luxury-rose/20 text-luxury-blush border border-luxury-rose/40 hover:bg-luxury-rose/30 transition-all shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
};
