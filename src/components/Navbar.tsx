import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  Menu,
  X,
  ChevronDown,
  Activity,
  Sliders,
  Shield,
  Zap,
  Home,
  MessageSquare,
  Search,
  FileText,
  Compass,
} from 'lucide-react';
import { NexoraLogo } from './NexoraLogo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { UserProfileMenu } from './UserProfileMenu.tsx';

export type NavDestination =
  | 'home'
  | 'radar'
  | 'discover'
  | 'chat'
  | 'competitors'
  | 'competitor-detail'
  | 'insights'
  | 'battlecards'
  | 'counter-pitch'
  | 'monitoring'
  | 'settings';

export interface NavbarProps {
  activeItem?: NavDestination;
  onNavigate?: (destination: NavDestination) => void;
  onOpenMenu?: () => void;
  onOpenLiveStatus?: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  isMenuOpen?: boolean;
}

export const ALL_NAV_ITEMS: { id: NavDestination; label: string; icon: React.FC<{ size: number }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'radar', label: 'Competitive Radar', icon: Activity },
  { id: 'discover', label: 'Find Competitors', icon: Compass },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'competitors', label: 'Competitors', icon: Search },
  { id: 'insights', label: 'Insights', icon: Zap },
  { id: 'battlecards', label: 'Battlecards', icon: FileText },
  { id: 'counter-pitch', label: 'Counter-Pitch', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeItem = 'home',
  onNavigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleItemClick = (destination: NavDestination) => {
    setIsMobileOpen(false);
    onNavigate?.(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Center: Desktop Navigation Links (ONE FEATURE = ONE SIMPLE PAGE) */}
      <nav className="radar-nav-center radar-nav-interactive" aria-label="Primary Navigation">
        <div className="radar-nav-pill-group" role="tablist">
          {ALL_NAV_ITEMS.map((item) => {
            const isActive =
              activeItem === item.id ||
              (item.id === 'competitors' && activeItem === 'competitor-detail') ||
              (item.id === 'radar' && activeItem === 'monitoring');
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

      {/* Right: Auth / Profile Area & Mobile Hamburger */}
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

        {/* Mobile Navigation Hamburger */}
        <button
          className="radar-mobile-menu-btn"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={isMobileOpen ? 'Close Menu' : 'Open Navigation Menu'}
          aria-expanded={isMobileOpen}
          type="button"
        >
          {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
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
            {ALL_NAV_ITEMS.map((item) => {
              const isActive =
                activeItem === item.id ||
                (item.id === 'competitors' && activeItem === 'competitor-detail');
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`radar-mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                  type="button"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconComponent size={16} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'currentColor',
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
