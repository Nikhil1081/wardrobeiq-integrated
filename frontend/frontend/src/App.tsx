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

// Modals & Drawers
import { AddItemModal } from './components/modals/AddItemModal';
import { EditItemModal } from './components/modals/EditItemModal';
import { GapDetailDrawer } from './components/modals/GapDetailDrawer';
import { WhyThisDrawer } from './components/modals/WhyThisDrawer';
import { ProductDetailDrawer } from './components/modals/ProductDetailDrawer';
import { OfferModal } from './components/modals/OfferModal';
import { AuthModal } from './components/modals/AuthModal';

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
      default:
        return <HomePage />;
    }
  };

  return (
    <AppShell>
      {renderActiveTab()}

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
