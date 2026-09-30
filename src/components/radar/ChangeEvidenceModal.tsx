import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Globe, Clock, CheckCircle2, TrendingUp, AlertTriangle, ArrowRight, MessageSquare, FileText, ShieldAlert, Zap } from 'lucide-react';
import { RadarAlert } from '../../services/radarService.ts';

interface ChangeEvidenceModalProps {
  isOpen: boolean;
  alert: RadarAlert | null;
  onClose: () => void;
  onAskNexora: (alert: RadarAlert) => void;
  onCreateBattlecard: (alert: RadarAlert) => void;
  onCreateCounterPitch: (alert: RadarAlert) => void;
}

export const ChangeEvidenceModal: React.FC<ChangeEvidenceModalProps> = ({
  isOpen,
  alert,
  onClose,
  onAskNexora,
  onCreateBattlecard,
  onCreateCounterPitch,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!alert) return null;

  const isThreat = alert.threatOrOpportunity === 'threat';
  const impact = alert.impactLevel || alert.severity || 'IMPORTANT';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="radar-drawer-overlay"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: 'rgba(5, 7, 12, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
          }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className="radar-evidence-modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidence-modal-title"
          >
            {/* Header */}
            <div className="radar-evidence-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: 'var(--radar-green-pulse)',
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
                    Verified Surveillance Evidence
                  </span>
                </div>
                <h2 id="evidence-modal-title" className="radar-evidence-title">
                  {alert.competitorName} — Detected Shift
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'var(--radar-gray-400)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    <span>Captured: {alert.detectedAt}</span>
                  </span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={13} color="var(--radar-green-pulse)" />
                    <span>Bright Data Headless Extraction</span>
                  </span>
                </div>
              </div>

              <button
                className="radar-dark-modal-close"
                onClick={onClose}
                aria-label="Close evidence modal"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Badges Bar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px 24px', background: '#111520', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span className={`radar-notification-badge ${isThreat ? 'threat' : 'opportunity'}`}>
                {isThreat ? <AlertTriangle size={12} /> : <TrendingUp size={12} />}
                <span>Classification: {isThreat ? 'Threat' : 'Opportunity'}</span>
              </span>
              <span className="radar-tag" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}>
                Impact Level: {impact}
              </span>
              <span className="radar-tag" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}>
                Monitored Domain: {alert.competitorName}
              </span>
            </div>

            {/* Modal Body */}
            <div className="radar-evidence-body">
              {/* Snapshot Diff Section (Before vs After) */}
              {(alert.before || alert.after) && (
                <div className="radar-diff-comparison-box">
                  <div className="radar-diff-column before">
                    <span className="radar-diff-column-label">PREVIOUS BASELINE SNAPSHOT</span>
                    <div className="radar-diff-content">
                      {alert.before || 'Previous standard baseline tier with bundled capabilities.'}
                    </div>
                  </div>

                  <div className="radar-diff-column after">
                    <span className="radar-diff-column-label">CURRENT DETECTED SNAPSHOT</span>
                    <div className="radar-diff-content">
                      {alert.after || 'Current observed pricing tier with unbundled add-ons.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Gemini 3.8 Flash Analysis Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {/* 1. What Changed */}
                <div className="radar-evidence-card">
                  <div className="radar-evidence-card-label">What changed:</div>
                  <div className="radar-evidence-card-text">
                    {alert.whatChanged || alert.title || 'Competitor modified key pricing tiers and product commitments.'}
                  </div>
                </div>

                {/* 2. Why It Matters */}
                <div className="radar-evidence-card">
                  <div className="radar-evidence-card-label">Why it matters:</div>
                  <div className="radar-evidence-card-text">
                    {alert.whyItMatters}
                  </div>
                </div>

                {/* 3. Recommended Action */}
                <div className="radar-evidence-card highlight">
                  <div className="radar-evidence-card-label" style={{ color: 'var(--radar-green-pulse)' }}>
                    Nexora recommends:
                  </div>
                  <div className="radar-evidence-card-text" style={{ color: '#ffffff' }}>
                    {alert.recommendedAction}
                  </div>
                </div>

                {/* 4. Improved Solution */}
                {alert.improvedSolution && (
                  <div className="radar-evidence-card">
                    <div className="radar-evidence-card-label" style={{ color: '#60a5fa' }}>
                      Improved Solution / Value Proposition:
                    </div>
                    <div className="radar-evidence-card-text">
                      {alert.improvedSolution}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="radar-evidence-footer">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    onClose();
                    onAskNexora(alert);
                  }}
                  className="radar-dark-btn-submit"
                  type="button"
                >
                  <MessageSquare size={14} />
                  <span>Ask Nexora</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onCreateBattlecard(alert);
                  }}
                  className="radar-dark-btn-cancel"
                  type="button"
                >
                  <FileText size={14} />
                  <span>Create Battlecard</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onCreateCounterPitch(alert);
                  }}
                  className="radar-dark-btn-cancel"
                  type="button"
                >
                  <ShieldAlert size={14} />
                  <span>Create Counter-Pitch</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="radar-dark-btn-cancel"
                type="button"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
