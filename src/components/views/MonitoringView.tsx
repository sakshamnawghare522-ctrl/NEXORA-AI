import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  RefreshCw,
  CheckCircle,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ExternalLink,
  Plus,
  Zap,
} from 'lucide-react';
import { CompetitorsStore, MonitoredCompetitor } from '../../services/competitorsStore.ts';

interface MonitoringViewProps {
  onNavigateToCompetitors: () => void;
  onAskQuestion: (query: string) => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  onNavigateToCompetitors,
  onAskQuestion,
}) => {
  const [competitors, setCompetitors] = useState<MonitoredCompetitor[]>(
    CompetitorsStore.getCompetitors()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  // Advanced settings state (progressive disclosure)
  const [checkFrequency, setCheckFrequency] = useState('24 hours');
  const [alertChannels, setAlertChannels] = useState({
    priceDrops: true,
    newOffers: true,
    newFeatures: true,
  });

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshToast(true);
      setTimeout(() => setRefreshToast(false), 3000);
    }, 900);
  };

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header */}
        <div className="nexora-view-header">
          <div>
            <h1 className="nexora-view-title">Competitor Website Monitoring</h1>
            <p className="nexora-view-subtitle">
              Nexora automatically checks your competitors&apos; public websites every day and notifies you when they change their prices, offers, or products.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="nexora-secondary-btn"
              type="button"
            >
              <RefreshCw size={14} className={isRefreshing ? 'nexora-spinner' : ''} />
              <span>{isRefreshing ? 'Checking websites...' : 'Check All Now'}</span>
            </button>

            <button
              onClick={onNavigateToCompetitors}
              className="nexora-primary-btn"
              type="button"
            >
              <Plus size={14} />
              <span>Add Another Competitor</span>
            </button>
          </div>
        </div>

        {/* Refresh Toast Banner */}
        <AnimatePresence>
          {refreshToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                padding: '12px 18px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <CheckCircle size={16} color="#059669" />
              <span>All competitor websites checked successfully. No unexpected changes detected right now.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Competitor Monitoring List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {competitors.map((comp) => (
            <div
              key={comp.id}
              style={{
                background: 'var(--radar-white)',
                border: '1px solid var(--border-medium)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Competitor Identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'var(--radar-gray-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'var(--radar-black)',
                    }}
                  >
                    {comp.name.charAt(0)}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--radar-black)', margin: 0 }}>
                      {comp.name}
                    </h3>
                    <a
                      href={comp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nexora-comp-url"
                    >
                      <span>{comp.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span className="nexora-comp-status-badge">
                    <span className="nexora-status-dot-active" />
                    <span>Monitoring Active</span>
                  </span>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    {comp.changesCount || 3} changes found
                  </span>
                </div>
              </div>

              {/* Status details line */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  color: 'var(--radar-gray-600)',
                }}
              >
                <div>
                  <strong>Last checked:</strong> {comp.lastScannedAt || 'Today, 2:30 PM'} ·{' '}
                  <strong>Next check:</strong> {comp.nextCheckAt || 'Tonight, 11:30 PM'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>
                    Watching: <strong>{comp.watchedSections?.join(', ') || 'Pricing, Products, Offers'}</strong>
                  </span>
                  <button
                    onClick={() =>
                      onAskQuestion(`What are the latest website changes found for ${comp.name}?`)
                    }
                    className="nexora-text-link-btn"
                    style={{ fontSize: '12px' }}
                    type="button"
                  >
                    <span>View in AI Chat</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progressive Disclosure: Advanced Settings */}
        <div
          style={{
            background: 'var(--radar-gray-50)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--radar-black)" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--radar-black)' }}>
                Advanced Monitoring Settings
              </span>
            </div>
            <button
              type="button"
              className="nexora-text-link-btn"
              style={{ fontSize: '13px' }}
            >
              <span>{showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', paddingTop: '16px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  {/* Frequency */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      How often should Nexora check competitor websites?
                    </label>
                    <select
                      value={checkFrequency}
                      onChange={(e) => setCheckFrequency(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--radar-white)',
                        fontSize: '13px',
                      }}
                    >
                      <option value="6 hours">Every 6 hours (High activity)</option>
                      <option value="12 hours">Every 12 hours</option>
                      <option value="24 hours">Every 24 hours (Recommended daily check)</option>
                      <option value="48 hours">Every 2 days</option>
                    </select>
                  </div>

                  {/* Notification Alerts */}
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      Alert Notifications
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--radar-gray-700)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={alertChannels.priceDrops}
                          onChange={(e) =>
                            setAlertChannels((prev) => ({ ...prev, priceDrops: e.target.checked }))
                          }
                        />
                        <span>Notify me immediately when a competitor drops their price</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={alertChannels.newOffers}
                          onChange={(e) =>
                            setAlertChannels((prev) => ({ ...prev, newOffers: e.target.checked }))
                          }
                        />
                        <span>Notify me when a competitor launches a festive discount or offer</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={alertChannels.newFeatures}
                          onChange={(e) =>
                            setAlertChannels((prev) => ({ ...prev, newFeatures: e.target.checked }))
                          }
                        />
                        <span>Notify me when a new product or service is listed</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowAdvanced(false);
                      setRefreshToast(true);
                      setTimeout(() => setRefreshToast(false), 2500);
                    }}
                    className="nexora-primary-btn"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                    type="button"
                  >
                    <span>Save Settings</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
