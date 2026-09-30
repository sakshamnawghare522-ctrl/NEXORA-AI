import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  Zap,
  FileText,
  Shield,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Clock,
  ExternalLink,
  Store,
  Compass,
} from 'lucide-react';
import { HeroSection } from '../HeroSection.tsx';
import { InteractivePipelineSection } from '../InteractivePipelineSection.tsx';
import { NavDestination } from '../Navbar.tsx';

interface HomeViewProps {
  onAskQuestion: (query: string) => void;
  onNavigate: (view: NavDestination) => void;
  onExploreClick?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onAskQuestion,
  onNavigate,
  onExploreClick,
}) => {
  const [homeInput, setHomeInput] = useState('');
  const [showTechnicalEngine, setShowTechnicalEngine] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeInput.trim()) {
      onAskQuestion(homeInput.trim());
    }
  };

  // The Action Cards
  const ACTION_CARDS = [
    {
      id: 'discover',
      title: 'Find My Competitors',
      desc: 'Tell Nexora your idea and discover who competes with you.',
      icon: Compass,
      action: () => onNavigate('discover'),
      arrowText: 'Discover competitors',
    },
    {
      id: 'analyze',
      title: 'Analyze a Competitor',
      desc: 'See how any competitor compares to your business.',
      icon: Search,
      action: () => onNavigate('competitors'),
      arrowText: 'View competitors',
    },
    {
      id: 'changes',
      title: 'See What Changed',
      desc: 'Check recent price drops, new offers, and shifts.',
      icon: Zap,
      action: () => onNavigate('insights'),
      arrowText: 'View insights',
    },
    {
      id: 'battlecard',
      title: 'Create a Battlecard',
      desc: 'Get cheat sheets on competitor strengths & weaknesses.',
      icon: FileText,
      action: () => onNavigate('battlecards'),
      arrowText: 'Make battlecard',
    },
    {
      id: 'counter-pitch',
      title: 'Handle Customer Objection',
      desc: 'Get the exact words to say when a customer asks for a discount.',
      icon: Shield,
      action: () => onNavigate('counter-pitch'),
      arrowText: 'Create counter-pitch',
    },
    {
      id: 'ask',
      title: 'Ask Nexora',
      desc: 'Ask any question in plain English or Hinglish.',
      icon: Sparkles,
      action: () => onNavigate('chat'),
      arrowText: 'Open AI chat',
    },
  ];

  // Recent Activity Feed in plain, familiar language with Indian context
  const RECENT_ACTIVITY = [
    {
      id: 'act-1',
      competitor: 'CloudScale Inc.',
      tag: '🔴 Important',
      tagClass: 'important',
      headline: 'Reduced price from ₹7,999 to ₹5,499/mo, but customer support moved to ₹11,900 add-on.',
      time: 'Yesterday',
      actionPrompt: 'How should I explain CloudScale unbundling to a price-conscious customer?',
    },
    {
      id: 'act-2',
      competitor: 'Reliance Digital',
      tag: '🟢 New Offer',
      tagClass: 'new',
      headline: 'Launched festive 10% instant bank discount on electronics and free delivery.',
      time: 'Today',
      actionPrompt: 'How do I compete against Reliance Digital festive 10% discount?',
    },
    {
      id: 'act-3',
      competitor: 'MetricPulse',
      tag: '🟡 Update',
      tagClass: 'watch',
      headline: 'Added free SOC-2 compliance badge, but limited to 1 static PDF per quarter.',
      time: '3 days ago',
      actionPrompt: 'What questions should I ask a prospect comparing MetricPulse free compliance?',
    },
  ];

  return (
    <div>
      {/* 1. Preserved Hand-Designed Hero Section */}
      <HeroSection
        onExploreClick={() => onNavigate('chat')}
        onSeeHowItWorksClick={() => {
          setShowTechnicalEngine(true);
          setTimeout(() => {
            const el = document.getElementById('see-how-it-works');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onSelectFeatureTag={(tag) => onAskQuestion(`Tell me about ${tag} in Nexora`)}
      />

      {/* 2. Simple Main Experience Container */}
      <div className="nexora-view-page" style={{ paddingTop: '40px' }}>
        <div className="nexora-view-container">
          {/* Welcome & Ask Box */}
          <div className="nexora-home-hero-card">
            <div className="nexora-home-eyebrow">
              <span className="radar-subtitle-dot" />
              <span>Simple Competitive Intelligence For Your Business</span>
            </div>

            <h2 className="nexora-home-main-heading">What do you want to do today?</h2>
            <p className="nexora-home-main-desc">
              Nexora monitors your competitors&apos; public websites and gives you the exact words to win deals when customers compare prices.
            </p>

            {/* Simple Chat Input */}
            <form onSubmit={handleSubmit} className="nexora-home-search-form">
              <input
                type="text"
                value={homeInput}
                onChange={(e) => setHomeInput(e.target.value)}
                placeholder="Ask anything... (e.g. A customer says our competitor is cheaper. What should I say?)"
                className="nexora-home-search-input"
                aria-label="Ask Nexora anything"
              />
              <button
                type="submit"
                disabled={!homeInput.trim()}
                className="nexora-home-search-submit"
              >
                <span>Ask Nexora</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          {/* 3. The 5 Simple Action Cards (One Feature = One Page) */}
          <div className="nexora-home-actions-section">
            <div className="nexora-home-actions-title">Jump directly to a tool:</div>

            <div className="nexora-home-action-cards-grid">
              {ACTION_CARDS.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={card.id}
                    onClick={card.action}
                    className="nexora-home-action-card"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && card.action()}
                  >
                    <div className="nexora-home-card-icon-wrap">
                      <IconComponent size={20} />
                    </div>
                    <div className="nexora-home-card-title">{card.title}</div>
                    <div className="nexora-home-card-desc">{card.desc}</div>
                    <div className="nexora-home-card-arrow">
                      <span>{card.arrowText}</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Recent Activity Feed */}
          <div className="nexora-home-recent-section">
            <div className="nexora-home-recent-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 2px 0' }}>
                  Recent Competitor Activity
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                  Latest verified shifts found on competitor websites
                </span>
              </div>

              <button
                onClick={() => onNavigate('insights')}
                className="nexora-text-link-btn"
                type="button"
              >
                <span>View all insights</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="nexora-home-recent-list">
              {RECENT_ACTIVITY.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onAskQuestion(item.actionPrompt)}
                  className="nexora-home-recent-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`nexora-insight-tag ${item.tagClass}`}>
                      {item.tag}
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--radar-black)' }}>
                      {item.competitor}:
                    </strong>
                    <span style={{ fontSize: '13px', color: 'var(--radar-gray-700)' }}>
                      {item.headline}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                      <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {item.time}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--radar-black)' }}>
                      Handle this →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Progressive Disclosure: Technical Diff & Monitoring Engine */}
          <div
            style={{
              marginTop: '12px',
              background: 'var(--radar-gray-50)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowTechnicalEngine((prev) => !prev)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="var(--radar-black)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--radar-black)' }}>
                  Technical Architecture: Scraper, Deterministic DOM Diff &amp; Risk Pipeline
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                  {showTechnicalEngine ? 'Hide technical pipeline' : 'View advanced engine'}
                </span>
                {showTechnicalEngine ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            <AnimatePresence>
              {showTechnicalEngine && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', marginTop: '16px' }}
                >
                  <InteractivePipelineSection />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
