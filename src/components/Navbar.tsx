import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Menu, X } from 'lucide-react';
import { NexoraLogo } from './NexoraLogo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { UserProfileMenu } from './UserProfileMenu.tsx';

export type NavDestination = 'home' | 'chat' | 'competitors' | 'insights' | 'battlecards';

export interface NavbarProps {
  activeItem?: NavDestination;
  onNavigate?: (destination: NavDestination) => void;
  onOpenMenu?: () => void;
  onOpenLiveStatus?: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  activeView?: 'pipeline' | 'chat';
  onChangeView?: (view: 'pipeline' | 'chat') => void;
  isMenuOpen?: boolean;
}

const NAV_ITEMS: { id: NavDestination; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'chat', label: 'Chat' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'insights', label: 'Insights' },
  { id: 'battlecards', label: 'Battlecards' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeItem,
  onNavigate,
  onOpenAuth,
  activeView = 'pipeline',
  onChangeView,
}) => {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Determine which nav item is active
  const currentActive: NavDestination =
    activeItem || (activeView === 'chat' ? 'chat' : 'home');

  const handleItemClick = (destination: NavDestination) => {
    setIsMobileOpen(false);

    if (onNavigate) {
      onNavigate(destination);
      return;
    }

    // Default fallback handling if onNavigate is not passed
    if (destination === 'chat') {
      onChangeView?.('chat');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (destination === 'home') {
      onChangeView?.('pipeline');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onChangeView?.('pipeline');
      setTimeout(() => {
        const el = document.getElementById('see-how-it-works');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <motion.header
      className="radar-navbar"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      role="banner"
    >
      {/* Left: Brand Logo */}
      <div className="radar-nav-left radar-nav-interactive">
        <button
          onClick={() => handleItemClick('home')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Nexora Home"
          type="button"
        >
          <NexoraLogo />
        </button>
      </div>

      {/* Center: Main Navigation Links ('Home', 'Chat', 'Competitors', 'Insights', 'Battlecards') */}
      <nav className="radar-nav-center radar-nav-interactive" aria-label="Primary Navigation">
        <div className="radar-nav-pill-group" role="tablist">
          {NAV_ITEMS.map((item) => {
            const isActive = currentActive === item.id;
            return (
              <button
                key={item.id}
                className={`radar-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
                role="tab"
                aria-selected={isActive}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right: Auth / Profile Area & Mobile Toggle */}
      <div className="radar-nav-right radar-nav-interactive">
        {user ? (
          <UserProfileMenu />
        ) : (
          <button
            className="radar-nav-auth-btn"
            onClick={() => onOpenAuth('signin')}
            type="button"
            aria-label="Sign In or Access Demo"
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
        )}

        {/* Mobile Navigation Toggle */}
        <button
          className="radar-mobile-menu-btn"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={isMobileOpen ? 'Close Menu' : 'Open Navigation Menu'}
          aria-expanded={isMobileOpen}
          type="button"
        >
          {isMobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="radar-mobile-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  className={`radar-mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                  type="button"
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--radar-white)',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

