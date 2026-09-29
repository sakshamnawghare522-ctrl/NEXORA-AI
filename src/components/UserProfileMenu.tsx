import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, ChevronDown, ShieldCheck, Zap, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const UserProfileMenu: React.FC = () => {
  const { user, isDemoMode, isSupabaseActive, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="radar-user-menu-container" ref={menuRef} style={{ position: 'relative' }}>
      <button
        className="radar-user-profile-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="User account menu"
        aria-expanded={isOpen}
        type="button"
      >
        <div className="radar-user-avatar-circle" aria-hidden="true">
          {initials}
        </div>
        <div className="radar-user-meta-desktop">
          <span className="radar-user-name">{user.name}</span>
          <span className="radar-user-role-badge">{user.role}</span>
        </div>
        <ChevronDown size={14} className="radar-user-chevron" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="radar-user-dropdown-panel"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
          >
            {/* Header info */}
            <div className="radar-dropdown-header">
              <div className="radar-dropdown-avatar">{initials}</div>
              <div style={{ overflow: 'hidden' }}>
                <div className="radar-dropdown-fullname">{user.name}</div>
                <div className="radar-dropdown-email">{user.email}</div>
              </div>
            </div>

            {/* Workspace & Mode Tag */}
            <div className="radar-dropdown-meta-box">
              <div className="radar-dropdown-meta-row">
                <Briefcase size={12} color="var(--radar-gray-500)" />
                <span>{user.company || 'Primary Workspace'}</span>
              </div>
              <div className="radar-dropdown-meta-row" style={{ marginTop: '4px' }}>
                {isDemoMode ? (
                  <>
                    <Zap size={12} color="#f59e0b" />
                    <span style={{ color: '#b45309', fontWeight: 600 }}>Demo Mode Active</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={12} color="var(--radar-green-pulse)" />
                    <span style={{ color: 'var(--radar-green-pulse)', fontWeight: 600 }}>
                      Supabase Authenticated
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="radar-dropdown-items">
              <button
                className="radar-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  const el = document.getElementById('see-how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                type="button"
              >
                <User size={14} />
                <span>Account Profile</span>
              </button>

              <button
                className="radar-dropdown-item danger"
                onClick={async () => {
                  setIsOpen(false);
                  await signOut();
                }}
                type="button"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
