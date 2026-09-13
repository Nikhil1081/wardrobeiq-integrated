import React, { useState, useRef, useEffect } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import {
  Search,
  Sparkles,
  Bell,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Zap,
  Sun,
  Moon,
  CloudSun,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkle,
} from 'lucide-react';

export const TopCommandBar: React.FC = () => {
  const {
    currentCustomer,
    currentCustomerId,
    dashboard,
    setActiveTab,
    viewportMode,
    setViewportMode,
  } = useWardrobe();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { text: 'Complete my wardrobe', action: () => setActiveTab('gaps') },
    { text: 'College outfit under ₹1500', action: () => setActiveTab('stylist') },
    { text: 'Show me my wardrobe gaps', action: () => setActiveTab('gaps') },
    { text: 'Create a date-night outfit', action: () => setActiveTab('outfits') },
    { text: 'Find something for monsoon', action: () => setActiveTab('recommendations') },
    { text: 'Explore full catalogue', action: () => setActiveTab('explore') },
  ];

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setActiveTab('stylist');
      setSearchFocused(false);
    }
  };

  const displayName = user?.name || currentCustomer?.name || 'Stylist';
  const firstName = displayName.split(' ')[0];

  const isDemoUser = (user?.customerId && user.customerId.startsWith('C')) || (!user && currentCustomerId.startsWith('C'));
  const country = user?.country || currentCustomer?.country || 'Global';

  const getRoleBadge = () => {
    if (isAdmin || user?.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <ShieldCheck className="w-2.5 h-2.5" />
          Admin
        </span>
      );
    }
    if (isDemoUser) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-luxury-rose/20 text-luxury-blush border border-luxury-rose/30">
          <Sparkle className="w-2.5 h-2.5" />
          Demo Persona ({country})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <User className="w-2.5 h-2.5" />
        User
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-white/5 bg-dark-950/70 backdrop-blur-xl px-6 flex items-center justify-between gap-4">
      {/* Left Greeting & Role Badge */}
      <div className="hidden lg:flex items-center gap-3 min-w-[200px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-luxury-cream">
            <span>Hi, {firstName}</span>
            <Sparkles className="w-3.5 h-3.5 text-luxury-blush animate-pulse" />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            {getRoleBadge()}
          </div>
        </div>
      </div>

      {/* Center AI Command Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit}>
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300 ${
              searchFocused
                ? 'bg-dark-850/95 border border-luxury-rose/50 shadow-glow-rose scale-[1.01]'
                : 'glass-panel hover:border-white/20'
            }`}
          >
            <Sparkles className={`w-4 h-4 transition-colors ${searchFocused ? 'text-luxury-blush' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="What are you looking for today? (e.g. style what I already own...)"
              className="w-full bg-transparent text-sm text-luxury-cream placeholder-gray-400 focus:outline-none"
            />
            {searchFocused && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-400 border border-white/10 shrink-0">
                ↵ Enter
              </span>
            )}
          </div>
        </form>

        {/* Suggested Prompts Dropdown */}
        {searchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
            <div className="text-[11px] font-semibold text-luxury-peach uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>Suggested AI Queries</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchValue(prompt.text);
                    prompt.action();
                    setSearchFocused(false);
                  }}
                  className="text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-between group"
                >
                  <span>{prompt.text}</span>
                  <span className="text-luxury-rose opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions: Wear Today, Theme, Viewport, Notifications, Account */}
      <div className="flex items-center gap-3">
        {/* Wear Today Quick Action */}
        <button
          onClick={() => setActiveTab('today')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-luxury-rose/15 text-luxury-rose border border-luxury-rose/30 text-xs font-semibold hover:bg-luxury-rose/25 transition-all"
          title="What Should I Wear Today? Weather-aware outfit engine"
        >
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>Wear Today</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl glass-panel text-gray-400 hover:text-white transition-colors"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Device Viewport Switcher */}
        <div className="hidden sm:flex items-center p-1 rounded-xl glass-panel border border-white/5 gap-1">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportMode === 'desktop' ? 'bg-luxury-rose/25 text-luxury-blush' : 'text-gray-400 hover:text-white'
            }`}
            title="Desktop Mode (1440px)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportMode === 'tablet' ? 'bg-luxury-rose/25 text-luxury-blush' : 'text-gray-400 hover:text-white'
            }`}
            title="Tablet Mode (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewportMode === 'mobile' ? 'bg-luxury-rose/25 text-luxury-blush' : 'text-gray-400 hover:text-white'
            }`}
            title="Mobile Mode (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2.5 rounded-xl glass-panel text-gray-300 hover:text-white hover:border-white/20 transition-colors relative"
            title="Recent Activity & Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-luxury-blush animate-pulse"></span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-luxury-cream">
                  Wardrobe Activity
                </span>
                <span className="text-[10px] text-luxury-blush">Live MongoDB Feed</span>
              </div>
              <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
                  dashboard.recentActivity.map((act) => (
                    <div key={act.id} className="p-2 rounded-lg bg-white/[0.03] text-xs">
                      <div className="font-medium text-luxury-cream">{act.title}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 py-4 text-center">No recent activity</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Button & Popover */}
        <div ref={accountRef} className="relative">
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl glass-panel hover:border-luxury-rose/30 transition-all group cursor-pointer"
          >
            <img
              src={user?.avatar || currentCustomer?.avatar || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80'}
              alt={displayName}
              className="w-8 h-8 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-luxury-cream leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {user?.customerId || currentCustomerId}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          {accountOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b border-white/5 mb-2">
                <div className="text-xs font-bold text-luxury-cream">{displayName}</div>
                <div className="text-[11px] text-gray-400 truncate">{user?.email || `${(user?.customerId || currentCustomerId).toLowerCase()}@wardrobeiq.demo`}</div>
                <div className="mt-1.5">{getRoleBadge()}</div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setActiveTab('auth');
                    setAccountOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="w-3.5 h-3.5 text-luxury-rose" />
                    Account / Switch User
                  </span>
                  <span className="text-gray-500">→</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setAccountOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/10 transition-all flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      Admin Control Center
                    </span>
                    <span className="text-purple-400">→</span>
                  </button>
                )}

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      logout();
                      setAccountOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
