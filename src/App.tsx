import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, NavDestination } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { InteractivePipelineSection } from './components/InteractivePipelineSection.tsx';
import { NexoraChatSection } from './components/chat/NexoraChatSection.tsx';
import { MenuDrawer } from './components/MenuDrawer.tsx';
import { LiveIntelligenceDrawer } from './components/LiveIntelligenceDrawer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';

function MainApp() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'pipeline' | 'chat'>('pipeline');
  const [activeNav, setActiveNav] = useState<NavDestination>('home');
  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiveStatusOpen, setIsLiveStatusOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const handleOpenAuth = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const handleNavSelection = useCallback(
    (destination: NavDestination) => {
      setActiveNav(destination);

      if (destination === 'chat') {
        setActiveView('chat');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setActiveView('pipeline');

      if (destination === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (destination === 'competitors') {
        setPipelineStep(1);
      } else if (destination === 'insights') {
        setPipelineStep(3);
      } else if (destination === 'battlecards') {
        setPipelineStep(4);
      }

      setTimeout(() => {
        const el = document.getElementById('see-how-it-works');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    },
    []
  );

  const handleStepChange = useCallback((step: number) => {
    setPipelineStep(step);
    if (step === 1) setActiveNav('competitors');
    else if (step === 2 || step === 3) setActiveNav('insights');
    else if (step === 4) setActiveNav('battlecards');
  }, []);

  const handleScrollToPipeline = useCallback(() => {
    setActiveView('pipeline');
    setActiveNav('competitors');
    setPipelineStep(1);
    setTimeout(() => {
      const el = document.getElementById('see-how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, []);

  const handleExploreClick = useCallback(() => {
    if (!user) {
      handleOpenAuth('signup');
    } else {
      setActiveView('chat');
      setActiveNav('chat');
    }
  }, [user, handleOpenAuth]);

  const handleSelectFeatureTag = useCallback((tag: string) => {
    handleScrollToPipeline();
    console.log(`[Nexora] Feature Tag Selected: ${tag}`);
  }, [handleScrollToPipeline]);

  const handleNavigateFromMenu = useCallback((sectionId: string) => {
    if (sectionId === 'chat-view') {
      setActiveView('chat');
      setActiveNav('chat');
      return;
    }

    if (sectionId === 'home') {
      setActiveView('pipeline');
      setActiveNav('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveView('pipeline');
    if (sectionId === 'competitors-section') {
      setActiveNav('competitors');
      setPipelineStep(1);
    } else if (sectionId === 'ai-analysis-section' || sectionId === 'diff-section') {
      setActiveNav('insights');
      setPipelineStep(3);
    } else if (sectionId === 'battlecards-section' || sectionId === 'simulator-section') {
      setActiveNav('battlecards');
      setPipelineStep(4);
    }

    setTimeout(() => {
      const el = document.getElementById('see-how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--radar-white)' }}>
      {/* Top Fixed Navbar */}
      <Navbar
        activeItem={activeView === 'chat' ? 'chat' : activeNav}
        onNavigate={handleNavSelection}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenLiveStatus={() => setIsLiveStatusOpen(true)}
        onOpenAuth={handleOpenAuth}
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          setActiveNav(view === 'chat' ? 'chat' : 'home');
        }}
        isMenuOpen={isMenuOpen}
      />

      {/* Main Content Area */}
      <main>
        {activeView === 'pipeline' ? (
          <>
            <HeroSection
              onExploreClick={handleExploreClick}
              onSeeHowItWorksClick={handleScrollToPipeline}
              onSelectFeatureTag={handleSelectFeatureTag}
            />

            {/* Core Interactive Pipeline & Counter-Pitch Simulator */}
            <InteractivePipelineSection
              activeStep={pipelineStep}
              onStepChange={handleStepChange}
            />
          </>
        ) : (
          <NexoraChatSection />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Slide-out Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigateFromMenu}
        onOpenAuth={handleOpenAuth}
        onOpenChat={() => {
          setActiveView('chat');
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
