import React from 'react';
import { useWardrobe, NavigationTab } from '../../store/WardrobeContext';
import { Home, Shirt, Sparkles, Bookmark, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, dashboard } = useWardrobe();

  const navButtons: Array<{ id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'closet', label: 'Closet', icon: <Shirt className="w-5 h-5" />, badge: dashboard?.wardrobeStatistics?.totalItems },
    { id: 'recommendations', label: 'Style', icon: <Sparkles className="w-5 h-5 text-luxury-blush" /> },
    { id: 'saved', label: 'Saved', icon: <Bookmark className="w-5 h-5" />, badge: dashboard?.savedCount },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-950/90 backdrop-blur-2xl border-t border-white/10 px-4 py-2 flex items-center justify-around sm:hidden">
      {navButtons.map((btn) => {
        const isActive = activeTab === btn.id;
        return (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id)}
            className={`flex flex-col items-center gap-1 p-1.5 transition-all relative ${
              isActive ? 'text-luxury-blush scale-105' : 'text-gray-400 hover:text-white'
            }`}
          >
            {btn.icon}
            <span className="text-[10px] font-medium tracking-tight">{btn.label}</span>
            {btn.badge !== undefined && btn.badge > 0 && (
              <span className="absolute -top-1 right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-luxury-rose/80 text-white">
                {btn.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
