import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, ArrowRight, Eye, MessageSquare, FileText, ShieldAlert, X } from 'lucide-react';
import { RadarAlert } from '../../services/radarService.ts';

interface RadarChangeNotificationProps {
  alert: RadarAlert;
  onViewChange: (alert: RadarAlert) => void;
  onAskNexora: (alert: RadarAlert) => void;
  onCreateBattlecard: (alert: RadarAlert) => void;
  onCreateCounterPitch: (alert: RadarAlert) => void;
  onDismiss?: (alertId: string) => void;
}

export const RadarChangeNotification: React.FC<RadarChangeNotificationProps> = ({
  alert,
  onViewChange,
  onAskNexora,
  onCreateBattlecard,
  onCreateCounterPitch,
  onDismiss,
}) => {
  const isThreat = alert.threatOrOpportunity === 'threat';
  const impact = alert.impactLevel || alert.severity || 'IMPORTANT';

  return (
    <motion.div
      className="radar-notification-card"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
      role="region"
      aria-label="Competitor change detected"
    >
      {/* Top Banner Row */}
      <div className="radar-notification-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`radar-notification-pulse-dot ${isThreat ? 'threat' : 'opportunity'}`} />
          <h2 className="radar-notification-banner-title">Competitor change detected</h2>
          <span className="radar-notification-divider" aria-hidden="true">·</span>
          <span className="radar-notification-comp-name">{alert.competitorName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`radar-notification-badge ${isThreat ? 'threat' : 'opportunity'}`}>
            {isThreat ? (
              <>
                <AlertTriangle size={12} />
                <span>Threat ({impact})</span>
              </>
            ) : (
              <>
                <TrendingUp size={12} />
                <span>Opportunity ({impact})</span>
              </>
            )}
          </span>

          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="radar-notification-dismiss-btn"
              title="Dismiss notification"
              type="button"
              aria-label="Dismiss alert"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Structured Sections matching user requirement */}
      <div className="radar-notification-body">
        {/* Section 1: What changed */}
        <div className="radar-notification-item">
          <span className="radar-notification-label">What changed:</span>
          <p className="radar-notification-text">
            {alert.whatChanged || alert.title || 'Competitor modified key pricing tiers and product commitments.'}
          </p>
        </div>

        {/* Section 2: Why it matters */}
        <div className="radar-notification-item">
          <span className="radar-notification-label">Why it matters:</span>
          <p className="radar-notification-text">
            {alert.whyItMatters || 'The competitor is unbundling core features to appear cheaper on initial inspection.'}
          </p>
        </div>

        {/* Section 3: Nexora recommends */}
        <div className="radar-notification-item recommend">
          <span className="radar-notification-label">Nexora recommends:</span>
          <p className="radar-notification-text">
            {alert.recommendedAction || 'Demonstrate total cost of ownership and emphasize all-inclusive production guarantees.'}
          </p>
        </div>
      </div>

      {/* Action Buttons matching user requirement: [View Change] [Ask Nexora] [Create Battlecard] [Create Counter-Pitch] */}
      <div className="radar-notification-actions">
        <button
          onClick={() => onViewChange(alert)}
          className="radar-action-btn primary"
          type="button"
        >
          <Eye size={14} />
          <span>View Change</span>
        </button>

        <button
          onClick={() => onAskNexora(alert)}
          className="radar-action-btn secondary"
          type="button"
        >
          <MessageSquare size={14} />
          <span>Ask Nexora</span>
        </button>

        <button
          onClick={() => onCreateBattlecard(alert)}
          className="radar-action-btn secondary"
          type="button"
        >
          <FileText size={14} />
          <span>Create Battlecard</span>
        </button>

        <button
          onClick={() => onCreateCounterPitch(alert)}
          className="radar-action-btn secondary"
          type="button"
        >
          <ShieldAlert size={14} />
          <span>Create Counter-Pitch</span>
        </button>
      </div>
    </motion.div>
  );
};
