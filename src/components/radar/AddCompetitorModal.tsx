import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Shield, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { RadarService } from '../../services/radarService.ts';
import { MonitoredCompetitor } from '../../services/competitorsStore.ts';

interface AddCompetitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompetitorAdded: (competitor: MonitoredCompetitor) => void;
}

export const AddCompetitorModal: React.FC<AddCompetitorModalProps> = ({
  isOpen,
  onClose,
  onCompetitorAdded,
}) => {
  const [website, setWebsite] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('B2B SaaS / Infrastructure');
  const [keywords, setKeywords] = useState('pricing, enterprise, features, offers, sla');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusStep, setStatusStep] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const websiteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
      setStatusStep('');
      setTimeout(() => websiteInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = website.trim();
    if (!trimmedUrl) {
      setError('Please provide a website URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusStep('Connecting to website & Bright Data surveillance...');

      setTimeout(() => {
        setStatusStep('Extracting HTML, prices & establishing baseline hash...');
      }, 700);

      const res = await RadarService.addCompetitor({
        website: trimmedUrl,
        displayName: displayName.trim() || undefined,
        category: category.trim() || 'B2B SaaS / Infrastructure',
        keywords: keywords.trim() || undefined,
      });

      if (res.success && res.competitor) {
        onCompetitorAdded(res.competitor);
        // Reset form
        setWebsite('');
        setDisplayName('');
        setCategory('B2B SaaS / Infrastructure');
        setKeywords('pricing, enterprise, features, offers, sla');
        onClose();
      } else {
        throw new Error(res.error || 'Failed to capture baseline.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to capture baseline. Please check the website address.');
    } finally {
      setIsSubmitting(false);
      setStatusStep('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="radar-drawer-overlay"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: 'rgba(5, 7, 12, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
          }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className="radar-dark-modal"
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="radar-modal-title"
          >
            {/* Modal Header */}
            <div className="radar-dark-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: 'var(--radar-green-pulse)',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--radar-green-pulse)',
                    }}
                  >
                    Competitive Radar Surveillance
                  </span>
                </div>
                <h2 id="radar-modal-title" className="radar-dark-modal-title">
                  Add Competitor to Radar
                </h2>
                <p className="radar-dark-modal-desc">
                  Establish continuous surveillance for pricing, features, products, offers, and positioning shifts.
                </p>
              </div>

              <button
                className="radar-dark-modal-close"
                onClick={onClose}
                aria-label="Close dialog"
                type="button"
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="radar-dark-alert error">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Live Progress Banner */}
            {isSubmitting && (
              <div className="radar-dark-alert active">
                <Loader2 size={16} className="nexora-spinner" style={{ flexShrink: 0 }} color="var(--radar-green-pulse)" />
                <div>
                  <span style={{ fontWeight: 600, display: 'block', fontSize: '12px' }}>
                    Capturing Baseline Snapshot...
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>{statusStep || 'Surveillance engine active'}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="radar-dark-form">
              {/* Field 1: Website * */}
              <div className="radar-dark-field">
                <label htmlFor="comp-website" className="radar-dark-label">
                  <span>Website</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="radar-dark-input-wrapper">
                  <Globe size={15} className="radar-dark-input-icon" />
                  <input
                    id="comp-website"
                    ref={websiteInputRef}
                    type="text"
                    required
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. cloudscale.io or stripe.com"
                    className="radar-dark-input"
                    disabled={isSubmitting}
                  />
                </div>
                <span className="radar-dark-hint">
                  Public root domain or pricing page URL (http/https added automatically)
                </span>
              </div>

              {/* Field 2: Display Name */}
              <div className="radar-dark-field">
                <label htmlFor="comp-name" className="radar-dark-label">
                  <span>Display Name</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="radar-dark-input-wrapper">
                  <Shield size={15} className="radar-dark-input-icon" />
                  <input
                    id="comp-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. CloudScale Inc. (auto-derived if left blank)"
                    className="radar-dark-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Field 3: Category */}
              <div className="radar-dark-field">
                <label htmlFor="comp-category" className="radar-dark-label">
                  <span>Category</span>
                </label>
                <select
                  id="comp-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="radar-dark-select"
                  disabled={isSubmitting}
                >
                  <option value="B2B SaaS / Infrastructure">B2B SaaS / Infrastructure</option>
                  <option value="Enterprise Cloud & DevTools">Enterprise Cloud & DevTools</option>
                  <option value="Sales Intelligence / CRM">Sales Intelligence / CRM</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  <option value="LegalTech & Compliance">LegalTech & Compliance</option>
                  <option value="Fintech & Payments">Fintech & Payments</option>
                  <option value="Consumer Tech & Super-Apps">Consumer Tech & Super-Apps</option>
                  <option value="Direct Industry Competitor">Direct Industry Competitor</option>
                </select>
              </div>

              {/* Field 4: Keywords */}
              <div className="radar-dark-field">
                <label htmlFor="comp-keywords" className="radar-dark-label">
                  <span>Keywords</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>(comma-separated)</span>
                </label>
                <div className="radar-dark-input-wrapper">
                  <Tag size={15} className="radar-dark-input-icon" />
                  <input
                    id="comp-keywords"
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="pricing, enterprise, sla, unbundling, pro plan"
                    className="radar-dark-input"
                    disabled={isSubmitting}
                  />
                </div>
                <span className="radar-dark-hint">
                  Target sections: pricing, features, products, offers, positioning.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="radar-dark-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="radar-dark-btn-cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="radar-dark-btn-submit"
                  disabled={isSubmitting || !website.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="nexora-spinner" />
                      <span>Capturing Baseline...</span>
                    </>
                  ) : (
                    <span>Add &amp; Capture Baseline</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
