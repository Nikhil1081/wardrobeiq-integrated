import React, { useState } from 'react';
import { Sparkles, ImageOff } from 'lucide-react';

interface ClothingImageProps {
  src?: string;
  backupSrc?: string;
  alt: string;
  category?: string;
  color?: string;
  isTraditional?: boolean;
  culturalOrigin?: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'tall';
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  traditional: { bg: 'bg-gradient-to-tr from-amber-500/20 to-rose-500/20', text: 'text-amber-300', icon: '✨' },
  top: { bg: 'bg-gradient-to-tr from-rose-500/15 to-purple-500/15', text: 'text-rose-300', icon: '👕' },
  bottom: { bg: 'bg-gradient-to-tr from-blue-500/15 to-indigo-500/15', text: 'text-blue-300', icon: '👖' },
  outerwear: { bg: 'bg-gradient-to-tr from-emerald-500/15 to-teal-500/15', text: 'text-emerald-300', icon: '🧥' },
  shoes: { bg: 'bg-gradient-to-tr from-orange-500/15 to-amber-500/15', text: 'text-orange-300', icon: '👟' },
  dress: { bg: 'bg-gradient-to-tr from-fuchsia-500/15 to-pink-500/15', text: 'text-pink-300', icon: '👗' },
  accessory: { bg: 'bg-gradient-to-tr from-yellow-500/15 to-amber-500/15', text: 'text-yellow-300', icon: '👜' },
};

export const ClothingImage: React.FC<ClothingImageProps> = ({
  src,
  backupSrc,
  alt,
  category = 'top',
  color = 'charcoal',
  isTraditional = false,
  culturalOrigin,
  className = '',
  aspectRatio = 'square',
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [hasTriedBackup, setHasTriedBackup] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(!src);
  const [loaded, setLoaded] = useState<boolean>(false);

  const handleError = () => {
    if (!hasTriedBackup && backupSrc && backupSrc !== currentSrc) {
      setHasTriedBackup(true);
      setCurrentSrc(backupSrc);
    } else {
      setFailed(true);
    }
  };

  const catMeta = CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.top;

  const aspectClass =
    aspectRatio === 'tall'
      ? 'aspect-[3/4]'
      : aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : 'aspect-square';

  return (
    <div className={`relative overflow-hidden rounded-xl bg-dark-800/40 dark:bg-dark-800/40 light:bg-gray-100 ${aspectClass} ${className}`}>
      {/* Skeleton / Shimmer during loading */}
      {!loaded && !failed && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      )}

      {/* Primary / Backup Image */}
      {!failed && currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-cover object-center transition-all duration-500 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      ) : (
        /* Resilient Fallback SVG Placeholder */
        <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${catMeta.bg}`}>
          <div className="w-12 h-12 rounded-full bg-white/10 dark:bg-white/10 light:bg-black/5 backdrop-blur-md flex items-center justify-center text-2xl mb-2 shadow-inner">
            {catMeta.icon}
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-300 light:text-gray-600 line-clamp-1">
            {category} • {color}
          </p>
          <span className="text-[10px] text-gray-500 mt-1 line-clamp-1">{alt}</span>
        </div>
      )}

      {/* Cultural Heritage / Traditional Badge */}
      {isTraditional && (
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-amber-950 font-semibold text-[10px] tracking-wide shadow-lg backdrop-blur-md">
          <Sparkles className="w-2.5 h-2.5" />
          <span>{culturalOrigin || 'Traditional'}</span>
        </div>
      )}
    </div>
  );
};
