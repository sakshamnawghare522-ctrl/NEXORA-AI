import React, { useState } from 'react';
import {
  FileText,
  MessageSquare,
  ShieldAlert,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { VERIFIED_COMPETITOR_DATABASE } from '../../services/intelligenceContext.ts';

interface BattlecardsViewProps {
  onAskQuestion: (query: string) => void;
}

export const BattlecardsView: React.FC<BattlecardsViewProps> = ({ onAskQuestion }) => {
  const [selectedCompIndex, setSelectedCompIndex] = useState(0);
  const [copiedScript, setCopiedScript] = useState(false);

  const activeRecord = VERIFIED_COMPETITOR_DATABASE[selectedCompIndex] || VERIFIED_COMPETITOR_DATABASE[0];
  const card = activeRecord.battlecard;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(card.immediateCounterPitch);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header */}
        <div className="nexora-view-header">
          <div>
            <h1 className="nexora-view-title">Battlecards</h1>
            <p className="nexora-view-subtitle">
              Verified scripts, strategic counter-pitches, and killer questions built directly from competitive intelligence.
            </p>
          </div>
        </div>

        {/* Competitor Selector Tabs */}
        <div className="nexora-battlecard-tabs" role="tablist">
          {VERIFIED_COMPETITOR_DATABASE.map((record, index) => {
            const isSelected = index === selectedCompIndex;
            return (
              <button
                key={record.competitor}
                onClick={() => setSelectedCompIndex(index)}
                className={`nexora-battlecard-tab ${isSelected ? 'active' : ''}`}
                role="tab"
                aria-selected={isSelected}
                type="button"
              >
                <span className="nexora-tab-comp-name">{record.competitor}</span>
                <span className="nexora-tab-comp-tag">{record.category.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Active Battlecard Card */}
        <div className="nexora-battlecard-main-card">
          {/* Header */}
          <div className="nexora-battlecard-card-header">
            <div>
              <div className="nexora-battlecard-pre-title">Competitive Battlecard</div>
              <h2 className="nexora-battlecard-target-name">{activeRecord.competitor}</h2>
              <p className="nexora-battlecard-motive">{card.strategicMotive}</p>
            </div>

            <div className="nexora-battlecard-actions-top">
              <button
                onClick={() =>
                  onAskQuestion(
                    `Let's practice a mock sales roleplay against ${activeRecord.competitor}. You act as a tough prospect, and I will pitch against you.`
                  )
                }
                className="nexora-primary-btn"
                type="button"
              >
                <Sparkles size={14} />
                <span>Practice in AI Chat</span>
              </button>
            </div>
          </div>

          {/* Section 1: Immediate Counter-Pitch Script */}
          <div className="nexora-battlecard-section">
            <div className="nexora-battlecard-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="nexora-battlecard-num">01</span>
                <h3 className="nexora-battlecard-section-title">What to say (Immediate Counter-Pitch)</h3>
              </div>
              <button
                onClick={handleCopyScript}
                className="nexora-copy-script-btn"
                type="button"
                aria-label="Copy pitch script"
              >
                {copiedScript ? <Check size={13} color="var(--radar-green-pulse)" /> : <Copy size={13} />}
                <span>{copiedScript ? 'Copied script' : 'Copy script'}</span>
              </button>
            </div>

            <blockquote className="nexora-battlecard-quote">
              <p className="nexora-battlecard-script-text">"{card.immediateCounterPitch}"</p>
            </blockquote>
          </div>

          {/* Section 2: Key Talking Points */}
          <div className="nexora-battlecard-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="nexora-battlecard-num">02</span>
              <h3 className="nexora-battlecard-section-title">Key Talking Points</h3>
            </div>
            <ul className="nexora-battlecard-list">
              {card.keyTalkingPoints.map((point, i) => (
                <li key={i} className="nexora-battlecard-list-item">
                  <span className="nexora-bullet-dot" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 & 4: Follow-up question & Claims to Avoid */}
          <div className="nexora-battlecard-two-col">
            <div className="nexora-battlecard-subbox question">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <HelpCircle size={15} color="var(--radar-black)" />
                <h4 className="nexora-subbox-title">Killer Follow-Up Question</h4>
              </div>
              <p className="nexora-subbox-text">"{card.killerFollowUpQuestion}"</p>
            </div>

            <div className="nexora-battlecard-subbox warning">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertTriangle size={15} color="#ef4444" />
                <h4 className="nexora-subbox-title">Claims to Avoid</h4>
              </div>
              <ul className="nexora-subbox-avoid-list">
                {card.claimsToAvoid.map((avoid, i) => (
                  <li key={i}>{avoid}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="nexora-battlecard-footer">
            <span className="nexora-battlecard-evidence-hint">
              Evidence: {card.evidenceNote}
            </span>

            <button
              onClick={() =>
                onAskQuestion(
                  `Give me 3 more specific sales objection scenarios against ${activeRecord.competitor} with suggested counter-pitches.`
                )
              }
              className="nexora-secondary-btn"
              type="button"
            >
              <MessageSquare size={14} />
              <span>Ask Nexora for More Scenarios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
