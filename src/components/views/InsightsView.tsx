import React from 'react';
import {
  Sparkles,
  FileText,
  Zap,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { VERIFIED_COMPETITOR_DATABASE } from '../../services/intelligenceContext.ts';

interface InsightsViewProps {
  onAskQuestion: (query: string) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onAskQuestion }) => {
  // Map verified records into simplified insights
  const insights = [
    {
      id: 'insight-1',
      competitor: 'CloudScale Inc.',
      url: 'https://cloudscale.example.com/pricing',
      detectedAt: 'Yesterday (2026-09-26)',
      whatChanged: 'Dropped Pro tier headline price from $99/mo to $69/mo while stripping out dedicated SLA support and multi-region backups into a paid $149 add-on.',
      before: '$99/seat/month (Annual commitment, includes dedicated SLA & backup)',
      after: '$69/seat/month (Base tier, dedicated SLA and multi-region backups moved to $149 Add-on)',
      whyItMatters:
        'CloudScale is using a low sticker price ($69) to lure mid-market prospects, but enterprise buyers will quickly discover hidden costs for mandatory SLA guarantees.',
      whatSalesCanDo:
        'Acknowledge the $69 sticker price immediately to prove transparency, then ask the prospect if SLA guarantees are included in their quote. Highlight our all-inclusive enterprise tier where total cost of ownership is 22% lower.',
    },
    {
      id: 'insight-2',
      competitor: 'MetricPulse',
      url: 'https://metricpulse.example.com/features',
      detectedAt: '3 days ago (2026-09-25)',
      whatChanged: 'Added automated SOC-2 compliance badge to self-serve Pro tier ($49/mo), but fine print limits audit exports to 1 per quarter.',
      before: 'SOC-2 Type II: "Available on Custom Enterprise Tier only"',
      after: 'SOC-2 Type II: "Self-serve automated audit export included in Pro ($49/mo) — max 1 export/quarter"',
      whyItMatters:
        'Buyers seeking continuous auditor compliance may be misled by the badge. Quarterly static PDFs do not satisfy enterprise security audit requirements.',
      whatSalesCanDo:
        'Ask prospects whether their security audit team requires continuous live auditor portal access or only periodic static exports. Emphasize our real-time 365-day continuous auditor integration.',
    },
    {
      id: 'insight-3',
      competitor: 'NexusData',
      url: 'https://nexusdata.example.com/platform',
      detectedAt: '4 days ago (2026-09-24)',
      whatChanged: 'Marketed "Unlimited API Volume", but quiet Terms of Service revision throttles throughput at 25 requests/second.',
      before: 'API Throughput: "Custom throughput limits configured per enterprise contract"',
      after: 'API Throughput: "Fair-use ceiling enforced at 25 requests/second peak burst"',
      whyItMatters:
        'High-scale data ingestion workloads will hit rate-limiting bottlenecks, creating severe production issues for growing teams.',
      whatSalesCanDo:
        'Ask prospective architects what peak burst volume they require per second. Demonstrate our guaranteed 250+ req/sec burst throughput with no surprise throttling.',
    },
  ];

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header */}
        <div className="nexora-view-header">
          <div>
            <h1 className="nexora-view-title">Insights</h1>
            <p className="nexora-view-subtitle">
              Verified changes detected on competitor websites, pricing pages, and terms of service.
            </p>
          </div>
        </div>

        {/* Insights Feed */}
        <div className="nexora-insights-feed">
          {insights.map((item) => (
            <article key={item.id} className="nexora-insight-card">
              {/* Card Header */}
              <div className="nexora-insight-top-bar">
                <div className="nexora-insight-meta">
                  <span className="nexora-insight-alert-label">Important change detected</span>
                  <span className="nexora-insight-dot">·</span>
                  <span className="nexora-insight-comp">{item.competitor}</span>
                  <span className="nexora-insight-dot">·</span>
                  <span className="nexora-insight-time">
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {item.detectedAt}
                  </span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nexora-insight-source-link"
                >
                  <span>Source page</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* What Changed */}
              <div className="nexora-insight-block">
                <h3 className="nexora-insight-section-label">What changed</h3>
                <p className="nexora-insight-what-changed">{item.whatChanged}</p>
              </div>

              {/* Before vs After */}
              <div className="nexora-diff-comparison-grid">
                <div className="nexora-diff-box before">
                  <div className="nexora-diff-label">Before</div>
                  <div className="nexora-diff-content">{item.before}</div>
                </div>

                <div className="nexora-diff-box after">
                  <div className="nexora-diff-label">After</div>
                  <div className="nexora-diff-content">{item.after}</div>
                </div>
              </div>

              {/* Why it matters */}
              <div className="nexora-insight-block">
                <h3 className="nexora-insight-section-label">Why it matters</h3>
                <p className="nexora-insight-text">{item.whyItMatters}</p>
              </div>

              {/* What sales team can do */}
              <div className="nexora-insight-block highlight">
                <h3 className="nexora-insight-section-label">What the sales team can do</h3>
                <p className="nexora-insight-action-text">{item.whatSalesCanDo}</p>
              </div>

              {/* Primary Actions: Understand This, Create Battlecard, Ask Nexora */}
              <div className="nexora-insight-footer-actions">
                <button
                  onClick={() =>
                    onAskQuestion(
                      `Help me understand why ${item.competitor} made this change: "${item.whatChanged}" and what it means strategically for our business.`
                    )
                  }
                  className="nexora-insight-btn primary"
                  type="button"
                >
                  <Sparkles size={14} />
                  <span>Understand This</span>
                </button>

                <button
                  onClick={() =>
                    onAskQuestion(
                      `Create a sales battlecard for ${item.competitor} based on their recent shift: "${item.whatChanged}". Include objection scripts and talking points.`
                    )
                  }
                  className="nexora-insight-btn"
                  type="button"
                >
                  <FileText size={14} />
                  <span>Create Battlecard</span>
                </button>

                <button
                  onClick={() =>
                    onAskQuestion(
                      `How should our sales team respond when a prospect brings up ${item.competitor}'s latest updates?`
                    )
                  }
                  className="nexora-insight-btn"
                  type="button"
                >
                  <Zap size={14} />
                  <span>Ask Nexora</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
