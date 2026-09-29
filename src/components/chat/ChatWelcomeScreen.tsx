import React from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldAlert, TrendingUp, FileText, Crosshair, ArrowRight } from 'lucide-react';
import { NexoraLogo } from '../NexoraLogo.tsx';
import { StarterPrompt } from '../../types/chat.ts';

interface ChatWelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
  userName?: string;
  workspaceName?: string;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'changes-analysis',
    title: 'Analyze competitor changes',
    prompt: 'Analyze our latest competitor changes and break down what actually shifted.',
    iconName: 'zap',
    category: 'Competitive Diff',
  },
  {
    id: 'battlecard-gen',
    title: 'Create a competitor battlecard',
    prompt: 'Create a battlecard for CloudScale Inc. based on their recent pricing and feature updates.',
    iconName: 'file-text',
    category: 'Battlecard',
  },
  {
    id: 'cheaper-objection',
    title: 'Respond to "they are cheaper"',
    prompt: 'How should I respond if a prospect says CloudScale is 30% cheaper?',
    iconName: 'shield',
    category: 'Objection Handling',
  },
  {
    id: 'intel-summary',
    title: 'Summarize recent intelligence',
    prompt: 'Summarize our recent competitive intelligence across CloudScale, MetricPulse, and NexusData.',
    iconName: 'trending-up',
    category: 'Executive Brief',
  },
  {
    id: 'weakness-audit',
    title: 'Find positioning weaknesses',
    prompt: "Find weaknesses in MetricPulse and NexusData's current positioning and SLA fine print.",
    iconName: 'crosshair',
    category: 'Tactical',
  },
];

export const ChatWelcomeScreen: React.FC<ChatWelcomeScreenProps> = ({
  onSelectPrompt,
  userName = 'Sales Representative',
  workspaceName = 'Primary Workspace',
}) => {
  const getIcon = (name: StarterPrompt['iconName']) => {
    switch (name) {
      case 'zap':
        return <Zap size={16} color="var(--radar-black)" />;
      case 'file-text':
        return <FileText size={16} color="#7c3aed" />;
      case 'shield':
        return <ShieldAlert size={16} color="#d97706" />;
      case 'trending-up':
        return <TrendingUp size={16} color="var(--radar-blue-accent)" />;
      case 'crosshair':
        return <Crosshair size={16} color="#059669" />;
      default:
        return <Zap size={16} />;
    }
  };

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
          <span>NEXORA STRATEGIC CHAT</span>
        </span>

        <h1 className="nexora-welcome-title">
          How can Nexora empower your sales strategy today, {userName.split(' ')[0]}?
        </h1>

        <p className="nexora-welcome-subtitle">
          Grounded in live DOM changes, verified pricing adjustments, and competitive evidence for {workspaceName}.
        </p>

        {/* Live capability pills */}
        <div className="nexora-welcome-capabilities">
          <span className="nexora-capability-pill">✦ Headless Web Scrapes</span>
          <span className="nexora-capability-pill">✦ Zero-Hallucination Diffs</span>
          <span className="nexora-capability-pill">✦ Evidence-Grounded Pitches</span>
          <span className="nexora-capability-pill">✦ Instant Sales Battlecards</span>
        </div>
      </motion.div>

      {/* Starter Prompts Grid */}
      <motion.div
        className="nexora-starter-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {STARTER_PROMPTS.map((item) => (
          <button
            key={item.id}
            className="nexora-starter-card"
            onClick={() => onSelectPrompt(item.prompt)}
            type="button"
          >
            <div className="nexora-starter-top">
              <div className="nexora-starter-icon-wrap">{getIcon(item.iconName)}</div>
              <span className="nexora-starter-cat">{item.category}</span>
            </div>
            <div className="nexora-starter-title">{item.title}</div>
            <div className="nexora-starter-desc">&quot;{item.prompt}&quot;</div>
            <div className="nexora-starter-action">
              <span>Ask Nexora</span>
              <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </motion.div>
    </div>
  );
};
