import React, { useEffect, useState } from 'react';
import { WardrobeHealthDTO } from '../../types/dto';
import { Sparkles, Layers, Palette, Calendar, Sun } from 'lucide-react';

interface WardrobeHealthRingProps {
  health: WardrobeHealthDTO;
  compact?: boolean;
}

export const WardrobeHealthRing: React.FC<WardrobeHealthRingProps> = ({ health, compact = false }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const target = health.overallScore || 0;
    const duration = 1000;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;

    const interval = setInterval(() => {
      start += increment;
      if (start >= target) {
        setAnimatedScore(target);
        clearInterval(interval);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [health.overallScore]);

  const radius = compact ? 42 : 58;
  const strokeWidth = compact ? 7 : 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={`flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl glass-panel`}>
      {/* Radial Indicator */}
      <div className="flex items-center gap-5">
        <div className="relative flex items-center justify-center">
          <svg className="transform -rotate-90" width={radius * 2 + 20} height={radius * 2 + 20}>
            {/* Background circle */}
            <circle
              cx={radius + 10}
              cy={radius + 10}
              r={radius}
              className="text-white/5"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx={radius + 10}
              cy={radius + 10}
              r={radius}
              stroke="url(#healthGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F2B5D4" />
                <stop offset="60%" stopColor="#D8829D" />
                <stop offset="100%" stopColor="#C5B9E8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-luxury-cream tracking-tight">
              {animatedScore}%
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
              Score
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-luxury-blush text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wardrobe Health</span>
          </div>
          <h3 className="text-xl font-editorial font-bold text-luxury-cream">
            {health.overallScore >= 80 ? 'Highly Versatile & Balanced' : health.overallScore >= 60 ? 'Well Balanced Foundation' : 'Growing Wardrobe Potential'}
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Calculated across your owned categories, palettes, and seasonal flexibility.
          </p>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
        <div className="glass-pill px-4 py-3 rounded-xl flex flex-col min-w-[110px]">
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
            <Layers className="w-3 h-3 text-luxury-rose" />
            <span>Versatility</span>
          </div>
          <span className="text-lg font-bold text-luxury-cream">{health.versatility}%</span>
        </div>

        <div className="glass-pill px-4 py-3 rounded-xl flex flex-col min-w-[110px]">
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
            <Palette className="w-3 h-3 text-luxury-lavender" />
            <span>Color Balance</span>
          </div>
          <span className="text-lg font-bold text-luxury-cream">{health.colorBalance}%</span>
        </div>

        <div className="glass-pill px-4 py-3 rounded-xl flex flex-col min-w-[110px]">
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
            <Calendar className="w-3 h-3 text-luxury-peach" />
            <span>Occasions</span>
          </div>
          <span className="text-lg font-bold text-luxury-cream">{health.occasionCoverage}%</span>
        </div>

        <div className="glass-pill px-4 py-3 rounded-xl flex flex-col min-w-[110px]">
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
            <Sun className="w-3 h-3 text-luxury-sage" />
            <span>Seasonal</span>
          </div>
          <span className="text-lg font-bold text-luxury-cream">{health.seasonalCoverage}%</span>
        </div>
      </div>
    </div>
  );
};
