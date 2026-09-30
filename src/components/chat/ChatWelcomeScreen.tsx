import React from 'react';
import { motion } from 'motion/react';
import { Search, TrendingUp, FileText, Shield, Zap, ArrowRight } from 'lucide-react';
import { NexoraLogo } from '../NexoraLogo.tsx';

interface ChatWelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
  userName?: string;
  workspaceName?: string;
}

const QUICK_ACTIONS = [
  {
    id: 'analyze',
    label: 'Analyze Competitor',
    prompt: 'Analyze our competitor CloudScale Inc. and break down their recent changes, strengths, and weaknesses.',
    icon: Search,
    desc: 'Deep dive into any competitor',
  },
  {
    id: 'help-sell',
    label: 'Help Me Sell',
    prompt: 'Help me sell our business product against competitors. What are our key differentiators and proof points?',
    icon: TrendingUp,
    desc: 'Winning sales talking points',
  },
  {
    id: 'battlecard',
    label: 'Create Battlecard',
    prompt: 'Create a complete sales battlecard for CloudScale Inc. with strengths, weaknesses, and what to say.',
    icon: FileText,
    desc: 'Instant cheat sheet for reps',
  },
  {
    id: 'objection',
    label: 'Handle Objection',
    prompt: 'A customer told me "The competitor is cheaper than you." What exact words should I say to handle this objection?',
    icon: Shield,
    desc: 'Word-for-word counter-pitches',
  },
  {
    id: 'whats-changed',
    label: "What's Changed?",
    prompt: "What has changed recently across our competitors' pricing, offers, and websites?",
    icon: Zap,
    desc: 'Latest verified price & offer drops',
  },
];

export const ChatWelcomeScreen: React.FC<ChatWelcomeScreenProps> = ({
  onSelectPrompt,
}) => {
  return (
    <div className="nexora-chat-welcome-container">
      <motion.div
        className="nexora-welcome-hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="nexora-welcome-logo-badge" style={{ backgroundColor: '#f9f7f7' }}>
          <NexoraLogo
            size={36}
            showText={false}
            style={{ backgroundColor: '#060505' }}
            secondRectStyle={{ backgroundColor: '#000000' }}
          />
        </div>

        <span className="radar-hero-subtitle" style={{ marginBottom: '8px' }}>
          <span className="radar-subtitle-dot" aria-hidden="true" />
          <span>NEXORA</span>
        </span>

        <h1 className="nexora-welcome-title">
          How can I help your business today?
        </h1>

        <p className="nexora-welcome-subtitle">
          Ask anything about your competitors, customer objections, or sales pitches. Nexora gives you verified facts and winning talking points.
        </p>

        {/* Quick Actions Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => onSelectPrompt(action.prompt)}
              className="nexora-secondary-btn"
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'var(--radar-white)',
                borderColor: 'var(--border-medium)',
              }}
              type="button"
            >
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Action Cards Grid */}
      <motion.div
        className="nexora-starter-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {QUICK_ACTIONS.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              className="nexora-starter-card"
              onClick={() => onSelectPrompt(item.prompt)}
              type="button"
            >
              <div className="nexora-starter-top">
                <div className="nexora-starter-icon-wrap">
                  <IconComponent size={16} />
                </div>
                <span className="nexora-starter-cat">{item.label}</span>
              </div>
              <div className="nexora-starter-title">{item.desc}</div>
              <div className="nexora-starter-desc">&quot;{item.prompt}&quot;</div>
              <div className="nexora-starter-action">
                <span>Ask Nexora</span>
                <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
