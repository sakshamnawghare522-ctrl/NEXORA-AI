import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, User, Briefcase, Eye, EyeOff, ShieldCheck, Zap, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserProfile } from '../services/authDemoService.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp, signInQuickDemo, isSupabaseActive } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Account Executive');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync mode with prop when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setTimeout(() => firstInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialMode]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Password strength calculation
  const getPasswordStrength = (pass: string): { label: string; score: number; color: string } => {
    if (!pass) return { label: 'Empty', score: 0, color: 'var(--radar-gray-300)' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak (min 8 chars)', score: 25, color: '#ef4444' };
    if (score === 2) return { label: 'Fair (add capital/digit)', score: 50, color: '#f59e0b' };
    if (score === 3) return { label: 'Good', score: 75, color: '#3b82f6' };
    return { label: 'Strong', score: 100, color: 'var(--radar-green-pulse)' };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic client validations
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must contain at least 8 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!company.trim()) {
        setErrorMessage('Please enter your company or workspace name.');
        return;
      }
      if (!acceptedTerms) {
        setErrorMessage('Please accept the Terms of Service to continue.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        setSuccessMessage('Signed in successfully.');
      } else {
        await signUp({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          company: company.trim(),
        });
        setSuccessMessage('Account created and workspace initialized.');
      }
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected authentication error occurred.');
      }
    }
  };

  const handleQuickDemo = async (userKey: 'alex' | 'sarah' | 'david') => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInQuickDemo(userKey);
      setSuccessMessage('Signed in with Demo workspace credentials.');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 400);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Demo login failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="radar-drawer-overlay"
          style={{ justifyContent: 'center', alignItems: 'center', padding: '16px' }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className="radar-auth-modal"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Modal Header */}
            <div className="radar-auth-header">
              <div>
                <span className="radar-hero-subtitle" style={{ fontSize: '11px', marginBottom: '4px' }}>
                  <span className="radar-subtitle-dot" aria-hidden="true" />
                  <span>Nexora Access</span>
                </span>
                <h2 id="auth-modal-title" className="radar-auth-title">
                  {mode === 'signin' ? 'Sign In to Workspace' : 'Create Nexora Account'}
                </h2>
              </div>
              <button
                className="radar-drawer-close"
                onClick={onClose}
                aria-label="Close dialog"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Indicator Banner */}
            <div className={`radar-auth-banner ${isSupabaseActive ? 'supabase' : 'demo'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSupabaseActive ? (
                  <>
                    <ShieldCheck size={16} color="var(--radar-green-pulse)" />
                    <div>
                      <span className="radar-banner-title">Supabase Live Auth Active</span>
                      <span className="radar-banner-desc">Connected to project PostgreSQL schema</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Zap size={16} color="#d97706" />
                    <div>
                      <span className="radar-banner-title">Hackathon Demo Mode</span>
                      <span className="radar-banner-desc">Instant 1-click test credentials or create demo account</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Demo Login Shortcut Buttons */}
            {!isSupabaseActive && (
              <div className="radar-quick-demo-box">
                <span className="radar-quick-demo-label">Instant Demo Evaluation Access:</span>
                <div className="radar-quick-demo-buttons">
                  <button
                    className="radar-quick-btn"
                    onClick={() => handleQuickDemo('alex')}
                    disabled={isSubmitting}
                    type="button"
                  >
                    <span>⚡ Alex Morgan</span>
                    <small>Senior AE</small>
                  </button>
                  <button
                    className="radar-quick-btn"
                    onClick={() => handleQuickDemo('sarah')}
                    disabled={isSubmitting}
                    type="button"
                  >
                    <span>⚡ Sarah Chen</span>
                    <small>VP Marketing</small>
                  </button>
                  <button
                    className="radar-quick-btn"
                    onClick={() => handleQuickDemo('david')}
                    disabled={isSubmitting}
                    type="button"
                  >
                    <span>⚡ David Kim</span>
                    <small>Founder</small>
                  </button>
                </div>
              </div>
            )}

            {/* Tabs: Sign In vs Sign Up */}
            <div className="radar-auth-tabs">
              <button
                className={`radar-auth-tab ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`radar-auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                type="button"
              >
                Create Account
              </button>
            </div>

            {/* Alert messages */}
            {errorMessage && (
              <div className="radar-auth-alert error">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="radar-auth-alert success">
                <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="radar-auth-form">
              {mode === 'signup' && (
                <>
                  {/* Full Name */}
                  <div className="radar-input-group">
                    <label htmlFor="auth-name" className="radar-input-label">
                      Full Name
                    </label>
                    <div className="radar-input-wrapper">
                      <User size={15} className="radar-input-icon" />
                      <input
                        id="auth-name"
                        ref={firstInputRef}
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="radar-text-input"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Company / Workspace */}
                  <div className="radar-input-group">
                    <label htmlFor="auth-company" className="radar-input-label">
                      Company / Organization
                    </label>
                    <div className="radar-input-wrapper">
                      <Briefcase size={15} className="radar-input-icon" />
                      <input
                        id="auth-company"
                        type="text"
                        placeholder="e.g. Acme Cloud Corp"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="radar-text-input"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Primary Role */}
                  <div className="radar-input-group">
                    <label htmlFor="auth-role" className="radar-input-label">
                      Sales &amp; Strategy Role
                    </label>
                    <select
                      id="auth-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                      className="radar-select-input"
                      disabled={isSubmitting}
                    >
                      <option value="Account Executive">Account Executive (AE)</option>
                      <option value="Product Marketing Manager">Product Marketing Manager (PMM)</option>
                      <option value="Sales Leader">Sales Leader / VP Sales</option>
                      <option value="Founder">Founder / Executive</option>
                    </select>
                  </div>
                </>
              )}

              {/* Work Email */}
              <div className="radar-input-group">
                <label htmlFor="auth-email" className="radar-input-label">
                  Work Email
                </label>
                <div className="radar-input-wrapper">
                  <Mail size={15} className="radar-input-icon" />
                  <input
                    id="auth-email"
                    ref={mode === 'signin' ? firstInputRef : undefined}
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="radar-text-input"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="radar-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="auth-password" className="radar-input-label">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="radar-link-btn"
                      onClick={() => setErrorMessage('Demo Mode: Default passwords are listed in Demo Mode accounts or use quick login.')}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="radar-input-wrapper">
                  <Lock size={15} className="radar-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="radar-text-input"
                    required
                    minLength={8}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="radar-eye-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password strength indicator on sign up */}
                {mode === 'signup' && password.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--radar-gray-500)', marginBottom: '3px' }}>
                      <span>Password strength:</span>
                      <span style={{ color: pwdStrength.color, fontWeight: 500 }}>{pwdStrength.label}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--radar-gray-200)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pwdStrength.score}%`,
                          height: '100%',
                          background: pwdStrength.color,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Checkbox on Signup */}
              {mode === 'signup' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                  <input
                    id="terms-checkbox"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    style={{ marginTop: '3px' }}
                    required
                  />
                  <label htmlFor="terms-checkbox" style={{ fontSize: '12px', color: 'var(--radar-gray-600)', lineHeight: '1.4' }}>
                    I agree to the Nexora Workspace Security Policy and Competitive Intelligence Monitoring terms.
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                className="radar-btn-primary"
                style={{ width: '100%', marginTop: '12px', padding: '12px' }}
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Nexora' : 'Create Workspace Account'}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
