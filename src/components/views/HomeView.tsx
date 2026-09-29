import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  Shield,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { NexoraLogo } from '../NexoraLogo.tsx';
import { InteractivePipelineSection } from '../InteractivePipelineSection.tsx';

interface HomeViewProps {
  onAskQuestion: (query: string) => void;
  onNavigate: (view: 'home' | 'chat' | 'competitors' | 'insights' | 'battlecards') => void;
  onOpenLiveStatus?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onAskQuestion,
  onNavigate,
  onOpenLiveStatus,
}) => {
  const [homeInput, setHomeInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeInput.trim()) {
      onAskQuestion(homeInput.trim());
    }
  };

  const QUICK_ACTIONS = [
    {
      id: 'analyze',
      label: 'Analyze Competitor',
      icon: Search,
      prompt: 'Analyze CloudScale Inc. and break down their latest strategic shifts.',
    },
    {
      id: 'changes',
      label: "What's Changed?",
      icon: Zap,
      prompt: 'What are the latest competitor changes detected across our landscape?',
    },
    {
      id: 'battlecard',
      label: 'Create Battlecard',
      icon: FileText,
      prompt: 'Create a competitive battlecard for CloudScale Inc. based on their recent pricing update.',
    },
    {
      id: 'objection',
      label: 'Handle Objection',
      icon: Shield,
      prompt: 'How should I respond if a prospect says CloudScale is 30% cheaper?',
    },
  ];

  return (
    <div className="nexora-simplified-home">
      {/* 1. Primary Hero: Minimal, fast, clear within 5 seconds */}
      <section className="nexora-home-hero">
        <div className="nexora-home-hero-container">
          <div className="nexora-home-brand-badge">
            <span className="nexora-home-badge-pill">NEXORA</span>
            <span className="nexora-home-badge-subtitle">AI Competitive Intelligence</span>
          </div>

          <h1 className="nexora-home-title">What do you want to know?</h1>
          <p className="nexora-home-description">
            Ask any question about your competitors. Nexora monitors their websites, detects pricing and positioning changes, and writes battlecards for your sales team.
          </p>

          {/* Large Chat Input */}
          <form onSubmit={handleSubmit} className="nexora-home-input-card">
            <div className="nexora-home-input-inner">
              <input
                type="text"
                value={homeInput}
                onChange={(e) => setHomeInput(e.target.value)}
                placeholder="Ask Nexora anything... (e.g. How does CloudScale compare to us?)"
                className="nexora-home-main-input"
                autoFocus
                aria-label="Ask Nexora anything"
              />
              <button
                type="submit"
                disabled={!homeInput.trim()}
                className="nexora-home-submit-btn"
                aria-label="Send question to Nexora"
              >
                <span>Ask Nexora</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Quick Actions */}
          <div className="nexora-home-quick-actions">
            <span className="nexora-home-quick-label">Or jump into:</span>
            <div className="nexora-home-quick-grid">
              {QUICK_ACTIONS.map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => onAskQuestion(action.prompt)}
                    className="nexora-home-quick-btn"
                    type="button"
                  >
                    <IconComponent size={15} className="nexora-home-quick-icon" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Important Change Detected Preview */}
      <section className="nexora-home-highlights-section">
        <div className="nexora-home-highlights-container">
          <div className="nexora-home-section-header">
            <div>
              <div className="nexora-section-tag">Latest Intelligence</div>
              <h2 className="nexora-section-heading">Important change detected</h2>
            </div>
            <button
              onClick={() => onNavigate('insights')}
              className="nexora-text-link-btn"
              type="button"
            >
              <span>View all insights</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="nexora-highlight-card">
            <div className="nexora-highlight-badge-row">
              <span className="nexora-highlight-comp-name">CloudScale Inc.</span>
              <span className="nexora-highlight-time">Detected yesterday</span>
              <span className="nexora-highlight-verified">
                <CheckCircle size={13} color="var(--radar-green-pulse)" />
                <span>Verified change</span>
              </span>
            </div>

            <h3 className="nexora-highlight-title">
              Dropped Enterprise baseline price from $99/mo to $69/mo by unbundling 24/7 SLA into a paid add-on.
            </h3>

            <p className="nexora-highlight-explanation">
              CloudScale's sticker price appears 30% cheaper to prospects, but true production costs remain higher when essential SLA guarantees are added back.
            </p>

            <div className="nexora-highlight-actions">
              <button
                onClick={() =>
                  onAskQuestion(
                    'Help me understand why CloudScale Inc. changed their pricing and what it means strategically for our sales pipeline.'
                  )
                }
                className="nexora-action-pill-btn primary"
                type="button"
              >
                <Sparkles size={14} />
                <span>Understand This</span>
              </button>

              <button
                onClick={() =>
                  onAskQuestion(
                    'Create a sales battlecard for CloudScale Inc. countering their $69/mo pricing shift.'
                  )
                }
                className="nexora-action-pill-btn"
                type="button"
              >
                <FileText size={14} />
                <span>Create Battlecard</span>
              </button>

              <button
                onClick={() =>
                  onAskQuestion(
                    'What should our sales team say when a prospect brings up CloudScale Inc.?'
                  )
                }
                className="nexora-action-pill-btn"
                type="button"
              >
                <Zap size={14} />
                <span>Ask Nexora</span>
              </button>
            </div>
          </div>

          {/* 3. Monitored Competitors Snapshot */}
          <div className="nexora-home-competitors-bar">
            <div className="nexora-home-comp-bar-left">
              <span className="nexora-home-comp-bar-title">Monitored Competitors</span>
              <div className="nexora-home-comp-chips">
                <div className="nexora-home-chip">
                  <span className="nexora-status-dot active" />
                  <span className="nexora-chip-name">CloudScale Inc.</span>
                  <span className="nexora-chip-sub">Monitoring active</span>
                </div>
                <div className="nexora-home-chip">
                  <span className="nexora-status-dot active" />
                  <span className="nexora-chip-name">MetricPulse</span>
                  <span className="nexora-chip-sub">Monitoring active</span>
                </div>
                <div className="nexora-home-chip">
                  <span className="nexora-status-dot active" />
                  <span className="nexora-chip-name">NexusData</span>
                  <span className="nexora-chip-sub">Monitoring active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('competitors')}
              className="nexora-secondary-btn"
              type="button"
            >
              <span>+ Add Competitor</span>
            </button>
          </div>

          {/* 4. Progressive Disclosure: Advanced Technical Engine & Pipelines */}
          <div className="nexora-advanced-disclosure-wrapper">
            <button
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="nexora-advanced-toggle-btn"
              aria-expanded={showAdvanced}
              type="button"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={15} />
                <span>Technical Change Detection Pipeline & DOM Diff Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="nexora-advanced-subtext">
                  {showAdvanced ? 'Hide technical pipeline' : 'View advanced engine'}
                </span>
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden', marginTop: '16px' }}
                >
                  <InteractivePipelineSection />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
};
