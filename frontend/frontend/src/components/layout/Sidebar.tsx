import React from 'react';
import { useWardrobe, NavigationTab } from '../../store/WardrobeContext';
import {
  Home,
  Grid,
  Sparkles,
  Compass,
  Bookmark,
  User,
  Settings,
  Scissors,
  Split,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shirt,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { activeTab, setActiveTab, dashboard } = useWardrobe();

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'closet', label: 'My Closet', icon: <Shirt className="w-4 h-4" />, badge: dashboard?.wardrobeStatistics?.totalItems },
    { id: 'gaps', label: 'Wardrobe Gaps', icon: <Split className="w-4 h-4" />, badge: dashboard?.topWardrobeGaps?.length },
    { id: 'recommendations', label: 'Recommendations', icon: <Sparkles className="w-4 h-4 text-luxury-blush" /> },
    { id: 'outfits', label: 'Outfit Builder', icon: <Layers className="w-4 h-4" /> },
    { id: 'stylist', label: 'AI Stylist', icon: <Scissors className="w-4 h-4 text-luxury-lavender" /> },
    { id: 'explore', label: 'Explore', icon: <Compass className="w-4 h-4" /> },
    { id: 'saved', label: 'Saved', icon: <Bookmark className="w-4 h-4" />, badge: dashboard?.savedCount },
  ];

  const bottomNavItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode }> = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between border-r border-white/5 bg-dark-950/80 backdrop-blur-2xl transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Logo: Hanger combined with AI Sparkle */}
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-luxury-rose/30 to-luxury-lavender/20 border border-luxury-rose/40 flex items-center justify-center shadow-glow-rose group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-luxury-blush"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a2 2 0 0 1 2 2c0 1.1-.9 2-2 2a2 2 0 0 1-2-2c0-1.1.9-2 2-2z" />
                <path d="m2 16 10-9 10 9-3 3H5l-3-3z" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxury-lavender opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-luxury-blush"></span>
              </span>
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-editorial text-xl font-bold tracking-wider text-luxury-cream leading-none">
                  WARDROBE<span className="text-luxury-blush">IQ</span>
                </span>
                <span className="text-[10px] tracking-widest text-gray-400 uppercase mt-1">
                  Your Personal AI Stylist
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'glass-pill-active text-luxury-cream font-semibold'
                  : 'text-gray-400 hover:text-luxury-cream hover:bg-white/[0.04] hover:translate-x-1'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-luxury-blush/30 text-white'
                      : 'bg-white/5 text-gray-400 group-hover:bg-white/10'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="my-3 border-t border-white/5 px-2" />

        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'glass-pill-active text-luxury-cream font-semibold'
                  : 'text-gray-400 hover:text-luxury-cream hover:bg-white/[0.04] hover:translate-x-1'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Editorial Quote */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <p className="font-editorial italic text-xs text-luxury-peach/80 leading-relaxed text-center">
            &ldquo;Your style begins with what you already have.&rdquo;
          </p>
          <p className="text-[9px] uppercase tracking-widest text-center text-gray-400 mt-1">
            Wardrobe Intelligence
          </p>
        </div>
      )}
    </aside>
  );
};
