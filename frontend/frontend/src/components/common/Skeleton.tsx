import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-white/5 bg-dark-850 p-4 space-y-3 animate-pulse">
      <div className="w-full aspect-[3/4] bg-white/5 rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-4 bg-white/5 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
};

export const GapCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-white/5 bg-dark-850 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-white/10 rounded w-28" />
        <div className="h-5 bg-white/10 rounded-full w-20" />
      </div>
      <div className="h-6 bg-white/10 rounded w-3/4" />
      <div className="h-4 bg-white/5 rounded w-full" />
      <div className="flex gap-2 pt-2">
        <div className="w-14 h-14 bg-white/5 rounded-lg" />
        <div className="w-14 h-14 bg-white/5 rounded-lg" />
        <div className="w-14 h-14 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
};
