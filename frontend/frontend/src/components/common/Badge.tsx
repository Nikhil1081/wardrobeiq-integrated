import React from 'react';
import { Priority } from '../../types/domain';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  if (priority === 'very_high' || priority === 'high') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider uppercase
        bg-luxury-rose/15 text-luxury-blush border border-luxury-rose/40 shadow-glow-rose ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-luxury-blush animate-pulse"></span>
        High Priority
      </span>
    );
  }

  if (priority === 'medium') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider uppercase
        bg-luxury-peach/15 text-luxury-peach border border-luxury-peach/30 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-luxury-peach"></span>
        Medium Priority
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider uppercase
      bg-luxury-sage/15 text-luxury-sage border border-luxury-sage/30 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-luxury-sage"></span>
      Low Priority
    </span>
  );
};

export const SourceBadge: React.FC<{ source: 'wardrobe' | 'recommendation' }> = ({ source }) => {
  if (source === 'wardrobe') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/10 text-luxury-cream border border-white/15 backdrop-blur-md">
        FROM YOUR CLOSET
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-luxury-lavender/20 text-luxury-lavender border border-luxury-lavender/40 backdrop-blur-md">
      AI PICK ✦
    </span>
  );
};

export const DiscountBadge: React.FC<{ discount: number; onClick?: (e: React.MouseEvent) => void }> = ({
  discount,
  onClick,
}) => {
  if (!discount || discount <= 0) return null;
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-luxury-rose/25 text-luxury-blush border border-luxury-rose/40 hover:bg-luxury-rose/35 transition-colors"
    >
      {discount}% OFF
    </button>
  );
};

export const MatchScoreBadge: React.FC<{ score: number; onClick?: () => void }> = ({ score, onClick }) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-luxury-lavender/15 text-luxury-lavender border border-luxury-lavender/30 hover:border-luxury-lavender/60 transition-all cursor-pointer shadow-sm"
    >
      <span className="text-luxury-blush font-extrabold">{score}%</span>
      <span className="text-[10px] text-gray-300">AI MATCH</span>
    </button>
  );
};
