import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Shield,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

interface InsightsViewProps {
  onAskQuestion: (query: string) => void;
  onNavigateToCounterPitch: (competitor: string, objection: string) => void;
}

type InsightCategory = 'ALL' | 'IMPORTANT' | 'WATCH' | 'NEW' | 'OPPORTUNITY';

export const InsightsView: React.FC<InsightsViewProps> = ({
  onAskQuestion,
  onNavigateToCounterPitch,
}) => {
  const [activeCategory, setActiveCategory] = useState<InsightCategory>('ALL');
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  const INSIGHTS = [
    {
      id: 'insight-1',
      category: 'IMPORTANT' as const,
      tagText: '🔴 IMPORTANT',
      tagClass: 'important',
      competitor: 'CloudScale Inc.',
      headline: 'Competitor dropped monthly headline price, but stripped out support into paid add-ons.',
      time: 'Yesterday',
      url: 'https://cloudscale.example.com/pricing',
      before: '₹7,999/month (All-inclusive business plan with 24/7 dedicated support)',
      after: '₹5,499/month (Base tier only — 24/7 support moved to ₹11,900 add-on)',
      whyItMatters:
        'Customers comparing prices will see their ₹5,499 headline price first and ask why your price is higher. But they do not realize the competitor stripped out essential support.',
      whatYouCanDo:
        'Acknowledge the headline price directly. Then ask the customer if 24/7 phone support and SLA guarantees are included in their competitor quote. Show them your all-inclusive price actually saves 22% overall.',
      evidenceDetails: {
        source: 'Public Pricing Table Scrape',
        timestamp: '2026-09-26 14:22:08 UTC',
        hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      },
    },
    {
      id: 'insight-2',
      category: 'NEW' as const,
      tagText: '🟢 NEW OFFER',
      tagClass: 'new',
      competitor: 'Reliance Digital',
      headline: 'Launched festive 10% instant bank cashback on appliances and free delivery.',
      time: 'Today',
      url: 'https://reliancedigital.in/offers',
      before: 'Standard credit card terms with regular delivery charges below ₹2,500',
      after: '10% Instant Bank Discount on HDFC/ICICI cards + Free same-day delivery',
      whyItMatters:
        'Retail customers visiting your shop may mention getting a card discount and free shipping online.',
      whatYouCanDo:
        'Highlight that your store provides immediate in-person product unboxing, free setup, personal warranty assistance, and same-hour local collection without shipping delays.',
      evidenceDetails: {
        source: 'Promotional Banner & Store Header Diff',
        timestamp: '2026-09-28 11:15:20 UTC',
        hash: 'sha256:8b41ca738fe11b98a0129bc37f01a39d8820c788219ad377284a102948cbb102',
      },
    },
    {
      id: 'insight-3',
      category: 'WATCH' as const,
      tagText: '🟡 WATCH',
      tagClass: 'watch',
      competitor: 'MetricPulse',
      headline: 'Added free "Automated SOC-2 Compliance" to self-serve tier ($49/mo).',
      time: '3 days ago',
      url: 'https://metricpulse.example.com/features',
      before: 'SOC-2 Type II Audit: "Available on Custom Enterprise Tier only"',
      after: 'SOC-2 Type II Audit: "Automated export included in Pro ($49/mo) — Max 1 static PDF per quarter"',
      whyItMatters:
        'Buyers who need security compliance may mistakenly think this $49 plan satisfies their auditor. In reality, it only gives a static PDF 4 times a year, not continuous live auditor access.',
      whatYouCanDo:
        'Ask the prospective customer whether their security team requires live continuous auditor access or just a quarterly static PDF. Emphasize your real-time 365-day continuous portal.',
      evidenceDetails: {
        source: 'Security Comparison Matrix Change',
        timestamp: '2026-09-25 09:15:30 UTC',
        hash: 'sha256:3a91b4129fe0281b37bda014f77a834190bcfc239d1b6e41b9d107a21356e391',
      },
    },
    {
      id: 'insight-4',
      category: 'OPPORTUNITY' as const,
      tagText: '🔵 OPPORTUNITY',
      tagClass: 'opportunity',
      competitor: 'NexusData',
      headline: 'Promoted "Unlimited API Requests", but introduced 25 requests/second throttle ceiling.',
      time: '4 days ago',
      url: 'https://nexusdata.example.com/platform',
      before: 'API Rate Limits: Custom limits per enterprise agreement',
      after: 'API Rate Limits: "Unlimited API* (*Throttled at 25 req/sec fair use peak ceiling)"',
      whyItMatters:
        'Data-heavy business buyers will experience queuing and delays during high-traffic batch ingestion.',
      whatYouCanDo:
        'Ask prospective technical buyers what peak concurrent throughput they require during peak hours. Demonstrate our sustained 500+ req/sec capability with zero throttling.',
      evidenceDetails: {
        source: 'Developer Terms of Service Section 7.2',
        timestamp: '2026-09-24 18:04:12 UTC',
        hash: 'sha256:190efb41c098718a22de4f77c8e90a2139b817cd1e5a2b0019284fa9817e0812',
      },
    },
  ];

  const filtered = activeCategory === 'ALL'
    ? INSIGHTS
    : INSIGHTS.filter((item) => item.category === activeCategory);

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header */}
        <div className="nexora-view-header">
          <div>
            <h1 className="nexora-view-title">Insights</h1>
            <p className="nexora-view-subtitle">
              Verified changes detected on competitor websites, pricing pages, and promotional offers — translated into plain business English.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'IMPORTANT', 'WATCH', 'NEW', 'OPPORTUNITY'] as InsightCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="nexora-secondary-btn"
              style={{
                backgroundColor: activeCategory === cat ? 'var(--radar-black)' : 'var(--radar-white)',
                color: activeCategory === cat ? 'var(--radar-white)' : 'var(--radar-black)',
                borderColor: activeCategory === cat ? 'var(--radar-black)' : 'var(--border-medium)',
                fontSize: '12px',
                padding: '6px 14px',
              }}
              type="button"
            >
              <span>{cat === 'ALL' ? 'All Insights' : cat}</span>
            </button>
          ))}
        </div>

        {/* Insights Cards Feed */}
        <div className="nexora-insights-feed">
          {filtered.map((item) => {
            const isEvidenceOpen = expandedEvidenceId === item.id;
            return (
              <article key={item.id} className="nexora-insight-card">
                {/* Top Row: Tag, Competitor, Time & Source */}
                <div className="nexora-insight-top-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`nexora-insight-tag ${item.tagClass}`}>
                      {item.tagText}
                    </span>
                    <strong style={{ fontSize: '15px', color: 'var(--radar-black)' }}>
                      {item.competitor}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      {item.time}
                    </span>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nexora-text-link-btn"
                    style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}
                  >
                    <span>View competitor page</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Headline */}
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--radar-black)', margin: 0, lineHeight: '1.4' }}>
                  {item.headline}
                </h2>

                {/* Before / After Comparison */}
                <div className="nexora-insight-before-after">
                  <div>
                    <span className="nexora-insight-box-title before">Before (Old details)</span>
                    <p className="nexora-insight-text">{item.before}</p>
                  </div>
                  <div>
                    <span className="nexora-insight-box-title after">Now (New details)</span>
                    <p className="nexora-insight-text">{item.after}</p>
                  </div>
                </div>

                {/* Why it matters & What to do */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div style={{ background: '#fbfbfa', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #d97706' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', display: 'block', marginBottom: '4px' }}>
                      Why this matters:
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--radar-gray-800)', margin: 0, lineHeight: '1.5' }}>
                      {item.whyItMatters}
                    </p>
                  </div>

                  <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', borderLeft: '3px solid #059669' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#065f46', display: 'block', marginBottom: '4px' }}>
                      What you can do:
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--radar-gray-800)', margin: 0, lineHeight: '1.5' }}>
                      {item.whatYouCanDo}
                    </p>
                  </div>
                </div>

                {/* Card Actions & Evidence Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() =>
                        onAskQuestion(
                          `Explain what ${item.competitor}'s shift "${item.headline}" means for our sales strategy.`
                        )
                      }
                      className="nexora-primary-btn"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      type="button"
                    >
                      <Sparkles size={13} />
                      <span>Ask Nexora</span>
                    </button>

                    <button
                      onClick={() =>
                        onNavigateToCounterPitch(item.competitor, item.headline)
                      }
                      className="nexora-secondary-btn"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      type="button"
                    >
                      <Shield size={13} />
                      <span>Create Counter-Pitch</span>
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setExpandedEvidenceId(isEvidenceOpen ? null : item.id)
                    }
                    className="nexora-text-link-btn"
                    style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}
                    type="button"
                  >
                    <span>{isEvidenceOpen ? 'Hide Evidence' : 'View Evidence'}</span>
                    {isEvidenceOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Progressive Disclosure: Technical Evidence */}
                <AnimatePresence>
                  {isEvidenceOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: 'var(--radar-gray-50)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '12px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                      }}
                    >
                      <div>SOURCE: {item.evidenceDetails.source}</div>
                      <div>CAPTURED: {item.evidenceDetails.timestamp}</div>
                      <div>HASH: {item.evidenceDetails.hash}</div>
                      <div style={{ color: '#059669', marginTop: '2px' }}>
                        ✓ Deterministic verification confirmed.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
