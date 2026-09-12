import React, { useState, ReactNode } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { Sidebar } from './Sidebar';
import { TopCommandBar } from './TopCommandBar';
import { BottomNav } from './BottomNav';
import { ConnectionBanner } from '../common/ConnectionBanner';
import { ToastContainer } from '../common/Toast';

export const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { viewportMode } = useWardrobe();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // If reviewer selected simulated Tablet or Mobile mode:
  if (viewportMode === 'mobile') {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-2 sm:p-6">
        <div className="w-full max-w-[400px] h-[880px] rounded-[40px] border-4 border-white/20 bg-dark-900 shadow-2xl overflow-hidden flex flex-col relative">
          <ConnectionBanner />
          <TopCommandBar />
          <main className="flex-1 overflow-y-auto pb-20 p-4">{children}</main>
          <BottomNav />
          <ToastContainer />
        </div>
      </div>
    );
  }

  if (viewportMode === 'tablet') {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-2 sm:p-6">
        <div className="w-full max-w-[820px] h-[920px] rounded-[32px] border-4 border-white/20 bg-dark-900 shadow-2xl overflow-hidden flex relative">
          <Sidebar collapsed={true} onToggleCollapse={() => {}} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ConnectionBanner />
            <TopCommandBar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
          <ToastContainer />
        </div>
      </div>
    );
  }

  // Full Desktop Mode
  return (
    <div className="min-h-screen flex bg-dark-900 text-luxury-cream">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ConnectionBanner />
        <TopCommandBar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </div>
      <ToastContainer />
    </div>
  );
};
