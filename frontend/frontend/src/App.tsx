import React from 'react';
import { WardrobeProvider, useWardrobe } from './store/WardrobeContext';
import { ThemeProvider } from './store/ThemeContext';
import { AuthProvider } from './store/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './components/pages/HomePage';
import { TodayOutfitPage } from './components/pages/TodayOutfitPage';
import { ClosetPage } from './components/pages/ClosetPage';
import { GapsPage } from './components/pages/GapsPage';
import { RecommendationsPage } from './components/pages/RecommendationsPage';
import { OutfitBuilderPage } from './components/pages/OutfitBuilderPage';
import { AIStylistPage } from './components/pages/AIStylistPage';
import { ExplorePage } from './components/pages/ExplorePage';
import { SavedPage } from './components/pages/SavedPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { SettingsPage } from './components/pages/SettingsPage';
import { AdminQualityPage } from './components/pages/AdminQualityPage';
import { AuthPage } from './components/pages/AuthPage';

// Modals & Drawers
import { AddItemModal } from './components/modals/AddItemModal';
import { EditItemModal } from './components/modals/EditItemModal';
import { GapDetailDrawer } from './components/modals/GapDetailDrawer';
import { WhyThisDrawer } from './components/modals/WhyThisDrawer';
import { ProductDetailDrawer } from './components/modals/ProductDetailDrawer';
import { OfferModal } from './components/modals/OfferModal';
import { AuthModal } from './components/modals/AuthModal';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled runtime error in view:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl glass-panel-elevated border border-luxury-rose/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-luxury-rose/20 text-luxury-blush flex items-center justify-center mx-auto text-xl font-bold">
              ✦
            </div>
            <h3 className="text-xl font-editorial font-bold text-luxury-cream">View Temporarily Unavailable</h3>
            <p className="text-xs text-gray-400">
              {this.state.error?.message || 'A transient rendering notice occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-luxury-rose/20 border border-luxury-rose/40 text-luxury-blush hover:bg-luxury-rose/30 text-xs font-semibold transition-all cursor-pointer"
            >
              Reload View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { activeTab } = useWardrobe();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'today':
        return <TodayOutfitPage />;
      case 'closet':
        return <ClosetPage />;
      case 'gaps':
        return <GapsPage />;
      case 'recommendations':
        return <RecommendationsPage />;
      case 'outfits':
        return <OutfitBuilderPage />;
      case 'stylist':
        return <AIStylistPage />;
      case 'explore':
        return <ExplorePage />;
      case 'saved':
        return <SavedPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'admin':
        return <AdminQualityPage />;
      case 'auth':
        return <AuthPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <AppShell>
      <ErrorBoundary>
        {renderActiveTab()}
      </ErrorBoundary>

      {/* Global Modals & Drawers */}
      <AddItemModal />
      <EditItemModal />
      <GapDetailDrawer />
      <WhyThisDrawer />
      <ProductDetailDrawer />
      <OfferModal />
      <AuthModal />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WardrobeProvider>
          <AppContent />
        </WardrobeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
