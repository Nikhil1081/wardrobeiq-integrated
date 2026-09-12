import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: 'rose' | 'lavender' | 'peach' | 'sage' | 'none';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glowColor = 'none',
  onClick,
}) => {
  const glowClasses = {
    rose: 'hover:shadow-glow-rose hover:border-luxury-rose/40',
    lavender: 'hover:shadow-glow-lavender hover:border-luxury-lavender/40',
    peach: 'hover:shadow-glow-peach hover:border-luxury-peach/40',
    sage: 'hover:shadow-glow-sage hover:border-luxury-sage/40',
    none: 'hover:border-white/20',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border transition-all duration-300
        glass-panel
        ${hoverEffect ? 'hover:-translate-y-1 cursor-pointer ' + glowClasses[glowColor] : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
