import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, NavDestination } from './components/Navbar.tsx';
import { NexoraChatSection } from './components/chat/NexoraChatSection.tsx';
import { HomeView } from './components/views/HomeView.tsx';
import { CompetitorsView } from './components/views/CompetitorsView.tsx';
import { CompetitorDetailView } from './components/views/CompetitorDetailView.tsx';
import { InsightsView } from './components/views/InsightsView.tsx';
import { BattlecardsView } from './components/views/BattlecardsView.tsx';
import { CounterPitchView } from './components/views/CounterPitchView.tsx';
import { MonitoringView } from './components/views/MonitoringView.tsx';
import { CompetitiveRadarView } from './components/views/CompetitiveRadarView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { DiscoverView } from './components/views/DiscoverView.tsx';
import { MenuDrawer } from './components/MenuDrawer.tsx';
import { LiveIntelligenceDrawer } from './components/LiveIntelligenceDrawer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';
import { MonitoredCompetitor, CompetitorsStore } from './services/competitorsStore.ts';
import {
  Home,
  MessageSquare,
  Search,
  Zap,
  MoreHorizontal,
  Shield,
  FileText,
  Activity,
  Sliders,
} from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState<NavDestination>('home');
  const [selectedCompetitor, setSelectedCompetitor] = useState<MonitoredCompetitor | null>(null);
  const [initialChatQuery, setInitialChatQuery] = useState<string>('');
  const [counterPitchCompetitor, setCounterPitchCompetitor] = useState<string>('');
  const [counterPitchObjection, setCounterPitchObjection] = useState<string>('');
  const [battlecardCompetitor, setBattlecardCompetitor] = useState<string>('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiveStatusOpen, setIsLiveStatusOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const handleOpenAuth = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const handleNavSelection = useCallback((destination: NavDestination) => {
    setActiveNav(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // When user asks a question from any page (Home, Competitor, Insights, etc.)
  const handleAskQuestion = useCallback((query: string) => {
    setInitialChatQuery(query);
    setActiveNav('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // When user clicks [View Competitor]
  const handleSelectCompetitor = useCallback((competitor: MonitoredCompetitor) => {
    setSelectedCompetitor(competitor);
    setActiveNav('competitor-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // When user clicks [Create Battlecard] from competitor detail
  const handleNavigateToBattlecards = useCallback((compName: string) => {
    setBattlecardCompetitor(compName);
    setActiveNav('battlecards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // When user clicks [Create Counter-Pitch]
  const handleNavigateToCounterPitch = useCallback(
    (competitor: string, objection?: string) => {
      setCounterPitchCompetitor(competitor);
      if (objection) setCounterPitchObjection(objection);
      setActiveNav('counter-pitch');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleNavigateFromMenu = useCallback((sectionId: string) => {
    if (sectionId === 'discover-section' || sectionId === 'find-competitors') {
      setActiveNav('discover');
    } else if (sectionId === 'chat-view') {
      setActiveNav('chat');
    } else if (sectionId === 'competitors-section') {
      setActiveNav('competitors');
    } else if (sectionId === 'ai-analysis-section' || sectionId === 'diff-section') {
      setActiveNav('insights');
    } else if (sectionId === 'battlecards-section') {
      setActiveNav('battlecards');
    } else if (sectionId === 'simulator-section') {
      setActiveNav('counter-pitch');
    } else if (sectionId === 'monitoring-section' || sectionId === 'radar-section') {
      setActiveNav('radar');
    } else if (sectionId === 'settings-section') {
      setActiveNav('settings');
    } else {
      setActiveNav('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--radar-white)' }}>
      {/* Top Fixed Navbar */}
      <Navbar
        activeItem={activeNav}
        onNavigate={handleNavSelection}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenLiveStatus={() => setIsLiveStatusOpen(true)}
        onOpenAuth={handleOpenAuth}
        isMenuOpen={isMenuOpen}
      />

      {/* Main Content Area (ONE FEATURE = ONE SIMPLE PAGE) */}
      <main style={{ minHeight: 'calc(100vh - 72px)', paddingBottom: '60px' }}>
        {activeNav === 'home' && (
          <HomeView
            onAskQuestion={handleAskQuestion}
            onNavigate={handleNavSelection}
          />
        )}

        {activeNav === 'discover' && (
          <DiscoverView
            onAskQuestion={handleAskQuestion}
            onNavigateToBattlecards={handleNavigateToBattlecards}
            onNavigateToCounterPitch={handleNavigateToCounterPitch}
            onNavigateToMonitoring={() => setActiveNav('monitoring')}
            onNavigate={handleNavSelection}
          />
        )}

        {activeNav === 'chat' && (
          <NexoraChatSection
            initialQuery={initialChatQuery}
            onClearInitialQuery={() => setInitialChatQuery('')}
          />
        )}

        {activeNav === 'competitors' && (
          <CompetitorsView
            onAskQuestion={handleAskQuestion}
            onSelectCompetitor={handleSelectCompetitor}
            onNavigateToBattlecards={handleNavigateToBattlecards}
            onNavigateToDiscover={() => setActiveNav('discover')}
          />
        )}

        {activeNav === 'competitor-detail' && selectedCompetitor && (
          <CompetitorDetailView
            competitor={selectedCompetitor}
            onBack={() => setActiveNav('competitors')}
            onAskQuestion={handleAskQuestion}
            onNavigateToBattlecards={handleNavigateToBattlecards}
            onNavigateToCounterPitch={handleNavigateToCounterPitch}
          />
        )}

        {activeNav === 'insights' && (
          <InsightsView
            onAskQuestion={handleAskQuestion}
            onNavigateToCounterPitch={handleNavigateToCounterPitch}
          />
        )}

        {activeNav === 'battlecards' && (
          <BattlecardsView
            onAskQuestion={handleAskQuestion}
            initialCompetitor={battlecardCompetitor}
          />
        )}

        {activeNav === 'counter-pitch' && (
          <CounterPitchView
            onAskQuestion={handleAskQuestion}
            initialCompetitor={counterPitchCompetitor}
            initialObjection={counterPitchObjection}
          />
        )}

        {(activeNav === 'radar' || activeNav === 'monitoring') && (
          <CompetitiveRadarView
            onAskQuestion={handleAskQuestion}
            onNavigateToBattlecards={handleNavigateToBattlecards}
            onNavigateToCounterPitch={handleNavigateToCounterPitch}
            onSelectCompetitor={handleSelectCompetitor}
            onNavigate={handleNavSelection}
          />
        )}

        {activeNav === 'settings' && (
          <SettingsView
            onOpenAuthModal={() => handleOpenAuth('signin')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Easy 1-thumb touch navigation) */}
      <nav className="nexora-mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          className={`nexora-bottom-nav-item ${activeNav === 'home' ? 'active' : ''}`}
          onClick={() => handleNavSelection('home')}
          type="button"
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          className={`nexora-bottom-nav-item ${activeNav === 'chat' ? 'active' : ''}`}
          onClick={() => handleNavSelection('chat')}
          type="button"
        >
          <MessageSquare size={18} />
          <span>Chat</span>
        </button>

        <button
          className={`nexora-bottom-nav-item ${
            activeNav === 'competitors' || activeNav === 'competitor-detail' ? 'active' : ''
          }`}
          onClick={() => handleNavSelection('competitors')}
          type="button"
        >
          <Search size={18} />
          <span>Competitors</span>
        </button>

        <button
          className={`nexora-bottom-nav-item ${activeNav === 'insights' ? 'active' : ''}`}
          onClick={() => handleNavSelection('insights')}
          type="button"
        >
          <Zap size={18} />
          <span>Insights</span>
        </button>

        <button
          className={`nexora-bottom-nav-item ${
            activeNav === 'counter-pitch' || activeNav === 'monitoring' || activeNav === 'settings'
              ? 'active'
              : ''
          }`}
          onClick={() => setIsMenuOpen(true)}
          type="button"
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>

      {/* Footer */}
      <Footer />

      {/* Slide-out Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigateFromMenu}
        onOpenAuth={handleOpenAuth}
        onOpenChat={() => {
          setActiveNav('chat');
        }}
      />

      {/* Slide-out Live Intelligence Status Drawer */}
      <LiveIntelligenceDrawer
        isOpen={isLiveStatusOpen}
        onClose={() => setIsLiveStatusOpen(false)}
      />

      {/* Authentication Dialog Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
