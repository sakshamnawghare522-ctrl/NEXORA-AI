import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ShieldCheck, Sparkles, Activity, FileText, LogIn, LogOut, User, MessageSquare } from 'lucide-react';
import { NexoraLogo } from './NexoraLogo.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenChat?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAuth,
  onOpenChat,
}) => {
  const { user, isDemoMode, signOut } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard navigation & ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const navItems = [
    {
      label: 'Home',
      target: 'home',
      icon: Activity,
    },
    {
      label: 'Chat',
      target: 'chat-view',
      icon: MessageSquare,
      highlight: true,
    },
    {
      label: 'Competitors',
      target: 'competitors-section',
      icon: ShieldCheck,
    },
    {
      label: 'Insights',
      target: 'ai-analysis-section',
      icon: Sparkles,
    },
    {
      label: 'Battlecards',
      target: 'battlecards-section',
      icon: FileText,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="radar-drawer-overlay"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="radar-drawer-content"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-drawer-title"
          >
            <div>
              {/* Header */}
              <div className="radar-drawer-header">
                <NexoraLogo size={22} />
                <button
                  ref={closeButtonRef}
                  className="radar-drawer-close"
                  onClick={onClose}
                  aria-label="Close Navigation Menu"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sub-label */}
              <div style={{ marginTop: '24px' }}>
                <span
                  id="menu-drawer-title"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--radar-gray-400)',
                  }}
                >
                  Navigation & Architecture
                </span>
              </div>

              {/* Nav List */}
              <ul className="radar-drawer-nav-list">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx}>
                      <button
                        className="radar-drawer-link"
                        style={{ width: '100%', textAlign: 'left' }}
                        onClick={() => {
                          onNavigate(item.target);
                          onClose();
                        }}
                        type="button"
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Icon size={16} color="var(--radar-gray-500)" />
                          <span style={{ fontSize: '15px' }}>{item.label}</span>
                        </span>
                        <ArrowRight size={14} color="var(--radar-gray-400)" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Authentication Status / Access Block */}
              <div
                style={{
                  background: 'var(--radar-gray-50)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '16px',
                  marginBottom: '24px',
                }}
              >
                {user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="radar-user-avatar-circle" style={{ width: '32px', height: '32px' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--radar-black)' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                          {user.role} · {isDemoMode ? 'Demo' : 'Live'}
                        </div>
                      </div>
                    </div>
                    <button
                      className="radar-btn-secondary"
                      style={{ width: '100%', padding: '8px', fontSize: '12px', justifyContent: 'center' }}
                      onClick={async () => {
                        onClose();
                        await signOut();
                      }}
                      type="button"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--radar-black)' }}>
                      Workspace Access
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--radar-gray-500)', lineHeight: '1.4' }}>
                      Sign in to your team workspace or test instantly with Demo Mode.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        className="radar-btn-primary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px', justifyContent: 'center' }}
                        onClick={() => {
                          onClose();
                          onOpenAuth('signin');
                        }}
                        type="button"
                      >
                        <LogIn size={13} />
                        <span>Sign In</span>
                      </button>
                      <button
                        className="radar-btn-secondary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px', justifyContent: 'center' }}
                        onClick={() => {
                          onClose();
                          onOpenAuth('signup');
                        }}
                        type="button"
                      >
                        <User size={13} />
                        <span>Register</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Info */}
            <div
              style={{
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <span className="radar-live-status-dot" aria-hidden="true" />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--radar-gray-800)',
                  }}
                >
                  Nexora Engine Operational
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--radar-gray-500)',
                  lineHeight: '1.4',
                }}
              >
                Competitive surveillance powered by Bright Data &amp; NEXORA (Know what changed. Know what matters. Know what to say.).
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
