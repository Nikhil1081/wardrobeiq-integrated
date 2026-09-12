import React, { useEffect, useState } from 'react';

interface ScoreBarProps {
  label: string;
  value: number;
  maxValue: number;
  percentage?: number;
  delayMs?: number;
  color?: 'rose' | 'lavender' | 'peach' | 'sage';
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  label,
  value,
  maxValue,
  delayMs = 0,
  color = 'rose',
}) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const calculatedPct = Math.min(100, Math.max(0, (value / maxValue) * 100));
      setWidth(calculatedPct);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, maxValue, delayMs]);

  const colorStyles = {
    rose: 'bg-gradient-to-r from-luxury-rose to-luxury-blush',
    lavender: 'bg-gradient-to-r from-luxury-lavender to-luxury-blush',
    peach: 'bg-gradient-to-r from-luxury-peach to-luxury-champagne',
    sage: 'bg-gradient-to-r from-luxury-sage to-luxury-champagne',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-300 font-medium tracking-wide">{label}</span>
        <span className="text-luxury-cream font-semibold font-mono">
          {value} <span className="text-gray-500 font-normal">/ {maxValue}</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorStyles[color]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};
