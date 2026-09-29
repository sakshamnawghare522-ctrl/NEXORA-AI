import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Globe,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Trash2,
  CheckCircle,
  X,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CompetitorsStore, MonitoredCompetitor } from '../../services/competitorsStore.ts';

interface CompetitorsViewProps {
  onAskQuestion: (query: string) => void;
  onNavigateToInsights: () => void;
}

export const CompetitorsView: React.FC<CompetitorsViewProps> = ({
  onAskQuestion,
  onNavigateToInsights,
}) => {
  const [competitors, setCompetitors] = useState<MonitoredCompetitor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    setCompetitors(CompetitorsStore.getCompetitors());
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a competitor name.');
      return;
    }
    if (!website.trim()) {
      setError('Please provide a website URL.');
      return;
    }

    setError('');
    const newComp = CompetitorsStore.addCompetitor(name, website);
    setCompetitors(CompetitorsStore.getCompetitors());
    setName('');
    setWebsite('');
    setIsAddModalOpen(false);

    setSuccessMessage(`Monitoring active for ${newComp.name}`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDelete = (id: string) => {
    CompetitorsStore.deleteCompetitor(id);
    setCompetitors(CompetitorsStore.getCompetitors());
  };

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header */}
        <div className="nexora-view-header">
          <div>
            <h1 className="nexora-view-title">Competitors</h1>
            <p className="nexora-view-subtitle">
              Nexora automatically tracks their public websites, pricing tables, and feature pages.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="nexora-primary-btn"
            type="button"
          >
            <Plus size={16} />
            <span>Add Competitor</span>
          </button>
        </div>

        {/* Success Toast Banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="nexora-success-toast"
            >
              <CheckCircle size={16} color="var(--radar-green-pulse)" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Competitor Cards List */}
        <div className="nexora-competitors-grid">
          {competitors.map((comp) => (
            <div key={comp.id} className="nexora-competitor-card">
              <div className="nexora-comp-card-top">
                <div className="nexora-comp-info">
                  <h3 className="nexora-comp-name">{comp.name}</h3>
                  <a
                    href={comp.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nexora-comp-url"
                  >
                    <span>{comp.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="nexora-comp-status-badge">
                  <span className="nexora-status-dot active" />
                  <span>{comp.status}</span>
                </div>
              </div>

              <div className="nexora-comp-card-body">
                <div className="nexora-comp-metric-row">
                  <span className="nexora-metric-label">Last check:</span>
                  <span className="nexora-metric-val">{comp.lastScannedAt}</span>
                </div>
                <div className="nexora-comp-shift-preview">
                  <span className="nexora-metric-label">Recent activity:</span>
                  <p className="nexora-shift-text">{comp.keyShift}</p>
                </div>
              </div>

              <div className="nexora-comp-card-actions">
                <button
                  onClick={() =>
                    onAskQuestion(`Analyze ${comp.name} and summarize their latest changes and strategic positioning.`)
                  }
                  className="nexora-comp-action-btn primary"
                  type="button"
                >
                  <MessageSquare size={13} />
                  <span>Ask Nexora</span>
                </button>

                <button
                  onClick={onNavigateToInsights}
                  className="nexora-comp-action-btn"
                  type="button"
                >
                  <TrendingUp size={13} />
                  <span>View Insights</span>
                </button>

                {comp.isCustom && (
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="nexora-comp-delete-btn"
                    aria-label={`Remove ${comp.name}`}
                    type="button"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progressive Disclosure: Advanced Settings */}
        <div className="nexora-advanced-section-box">
          <button
            onClick={() => setShowAdvancedSettings((prev) => !prev)}
            className="nexora-advanced-settings-toggle"
            type="button"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={15} />
              <span>Advanced Monitoring Settings</span>
            </div>
            {showAdvancedSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showAdvancedSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="nexora-advanced-settings-content"
              >
                <div className="nexora-settings-grid">
                  <div className="nexora-setting-item">
                    <span className="nexora-setting-title">Crawl Frequency</span>
                    <span className="nexora-setting-desc">Headless Chromium DOM polling interval</span>
                    <span className="nexora-setting-val">Every 4 hours (Continuous)</span>
                  </div>
                  <div className="nexora-setting-item">
                    <span className="nexora-setting-title">Semantic Diff Threshold</span>
                    <span className="nexora-setting-desc">Filters out superficial CSS styling noise</span>
                    <span className="nexora-setting-val">High Precision (Pricing & Terms only)</span>
                  </div>
                  <div className="nexora-setting-item">
                    <span className="nexora-setting-title">Sales Alerts</span>
                    <span className="nexora-setting-desc">Notify sales reps when pricing drops &gt;10%</span>
                    <span className="nexora-setting-val">Enabled (In-App & Email)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal: Simple Add Competitor (Only 2 fields: Name & Website) */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="nexora-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="nexora-simple-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="nexora-modal-header">
                  <div>
                    <h2 className="nexora-modal-title">Add Competitor</h2>
                    <p className="nexora-modal-subtitle">
                      Nexora will begin monitoring their website automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="nexora-modal-close-btn"
                    aria-label="Close dialog"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddSubmit} className="nexora-simple-form">
                  {error && <div className="nexora-form-error">{error}</div>}

                  <div className="nexora-form-group">
                    <label htmlFor="comp-name" className="nexora-form-label">
                      Competitor name
                    </label>
                    <input
                      id="comp-name"
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="nexora-form-input"
                      autoFocus
                    />
                  </div>

                  <div className="nexora-form-group">
                    <label htmlFor="comp-url" className="nexora-form-label">
                      Competitor website
                    </label>
                    <input
                      id="comp-url"
                      type="text"
                      placeholder="e.g. acme.com or https://acme.com/pricing"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="nexora-form-input"
                    />
                  </div>

                  <div className="nexora-modal-footer">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="nexora-modal-cancel-btn"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="nexora-primary-btn">
                      Add Competitor
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
