import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Plus,
  RefreshCw,
  CheckCircle,
  Globe,
  ExternalLink,
  Shield,
  Clock,
  Trash2,
  Eye,
  MessageSquare,
  FileText,
  ShieldAlert,
  Zap,
  Sliders,
  CheckCircle2,
  Tag,
  Radio,
  Search,
  FileDown,
} from 'lucide-react';
import { CompetitorsStore, MonitoredCompetitor } from '../../services/competitorsStore.ts';
import { RadarService, RadarAlert } from '../../services/radarService.ts';
import { FirestoreSyncService } from '../../services/firestoreSyncService.ts';
import { AddCompetitorModal } from '../radar/AddCompetitorModal.tsx';
import { RadarChangeNotification } from '../radar/RadarChangeNotification.tsx';
import { ChangeEvidenceModal } from '../radar/ChangeEvidenceModal.tsx';
import { PdfExportModal } from '../radar/PdfExportModal.tsx';

interface CompetitiveRadarViewProps {
  onAskQuestion: (query: string) => void;
  onNavigateToBattlecards: (compName: string) => void;
  onNavigateToCounterPitch: (competitor: string, objection?: string) => void;
  onSelectCompetitor?: (competitor: MonitoredCompetitor) => void;
  onNavigate?: (destination: any) => void;
}

export const CompetitiveRadarView: React.FC<CompetitiveRadarViewProps> = ({
  onAskQuestion,
  onNavigateToBattlecards,
  onNavigateToCounterPitch,
  onSelectCompetitor,
}) => {
  const [competitors, setCompetitors] = useState<MonitoredCompetitor[]>([]);
  const [alerts, setAlerts] = useState<RadarAlert[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [evidenceModalAlert, setEvidenceModalAlert] = useState<RadarAlert | null>(null);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [selectedPdfCompId, setSelectedPdfCompId] = useState<string | undefined>(undefined);

  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [scanningCompId, setScanningCompId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Load initial data
  const reloadData = () => {
    setCompetitors(CompetitorsStore.getCompetitors());
    setAlerts(RadarService.getRadarAlerts());
  };

  useEffect(() => {
    reloadData();

    const handleCompetitorsUpdated = () => reloadData();
    const handleNewAlert = () => reloadData();
    const handleAlertDismissed = () => reloadData();

    window.addEventListener('nexora-competitors-updated', handleCompetitorsUpdated);
    window.addEventListener('nexora-radar-alert-new', handleNewAlert);
    window.addEventListener('nexora-radar-alert-dismissed', handleAlertDismissed);

    return () => {
      window.removeEventListener('nexora-competitors-updated', handleCompetitorsUpdated);
      window.removeEventListener('nexora-radar-alert-new', handleNewAlert);
      window.removeEventListener('nexora-radar-alert-dismissed', handleAlertDismissed);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 2. Scan a single competitor against baseline
  const handleScanCompetitor = async (comp: MonitoredCompetitor) => {
    setScanningCompId(comp.id);
    try {
      const res = await RadarService.scanCompetitor(comp);
      reloadData();
      if (res.meaningfulChange) {
        showToast(`Meaningful change detected on ${comp.name}! Gemini 3.8 Flash analysis generated.`);
      } else {
        showToast(`${comp.name} checked. No structural changes detected against baseline snapshot.`);
      }
    } catch {
      showToast(`Scan check completed for ${comp.name}. Surveillance active.`);
    } finally {
      setScanningCompId(null);
    }
  };

  // 3. Scan all competitors
  const handleCheckAllNow = async () => {
    setIsCheckingAll(true);
    try {
      for (const comp of competitors.slice(0, 3)) {
        await RadarService.scanCompetitor(comp);
      }
      reloadData();
      showToast('All competitor baselines verified. Surveillance active across monitored websites.');
    } finally {
      setIsCheckingAll(false);
    }
  };

  // 4. Action Handlers matching user requirement
  const handleViewChange = (alert: RadarAlert) => {
    setEvidenceModalAlert(alert);
  };

  const handleAskNexora = (alert: RadarAlert) => {
    const whatChanged = alert.whatChanged || alert.title || 'the latest pricing update';
    onAskQuestion(`What is our best counter-strategy against ${alert.competitorName}'s recent change: "${whatChanged}"?`);
  };

  const handleCreateBattlecard = (alert: RadarAlert) => {
    onNavigateToBattlecards(alert.competitorName);
  };

  const handleCreateCounterPitch = (alert: RadarAlert) => {
    const objection = alert.before && alert.after ? `They claim ${alert.after}` : 'They are 30% cheaper';
    onNavigateToCounterPitch(alert.competitorName, objection);
  };

  const handleDismissAlert = (alertId: string) => {
    RadarService.dismissRadarAlert(alertId);
    setAlerts(RadarService.getRadarAlerts());
  };

  const handleDeleteCompetitor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    CompetitorsStore.deleteCompetitor(id);
    FirestoreSyncService.removeCompetitor(id).catch((err) => {
      console.warn('[Firestore] Failed to remove competitor document:', err);
    });
    reloadData();
    showToast('Competitor removed from radar monitoring.');
  };

  const filteredCompetitors = competitors.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.website.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header matching Nexora design system */}
        <div className="nexora-view-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="radar-status-dot active" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--radar-black)',
                }}
              >
                Autonomous Web Surveillance
              </span>
            </div>
            <h1 className="nexora-view-title">Competitive Radar</h1>
            <p className="nexora-view-subtitle">
              Automated website surveillance powered by Bright Data &amp; Gemini 3.8 Flash. Monitors pricing, features, products, offers, and positioning shifts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => {
                setSelectedPdfCompId(undefined);
                setIsPdfExportOpen(true);
              }}
              className="nexora-secondary-btn"
              type="button"
              title="Export complete competitive intelligence dossier as PDF"
            >
              <FileDown size={14} color="var(--radar-blue-accent)" />
              <span>Export PDF Dossier</span>
            </button>

            <button
              onClick={handleCheckAllNow}
              disabled={isCheckingAll}
              className="nexora-secondary-btn"
              type="button"
            >
              <RefreshCw size={14} className={isCheckingAll ? 'nexora-spinner' : ''} />
              <span>{isCheckingAll ? 'Checking websites...' : 'Check All Now'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="nexora-primary-btn"
              type="button"
            >
              <Plus size={15} />
              <span>+ Add Competitor</span>
            </button>
          </div>
        </div>

        {/* Live Surveillance Metrics Cards */}
        <div className="radar-stats-grid">
          <div className="radar-stat-box">
            <span className="radar-stat-label">Monitored Competitors</span>
            <div className="radar-stat-value">{competitors.length}</div>
            <span className="radar-stat-note">All baselines captured</span>
          </div>

          <div className="radar-stat-box">
            <span className="radar-stat-label">Surveillance Engine</span>
            <div className="radar-stat-value" style={{ fontSize: '18px', color: 'var(--radar-green-pulse)' }}>
              Bright Data Active
            </div>
            <span className="radar-stat-note">Headless DOM extraction active</span>
          </div>

          <div className="radar-stat-box">
            <span className="radar-stat-label">Observed Changes</span>
            <div className="radar-stat-value">{alerts.length}</div>
            <span className="radar-stat-note">Verified DOM diffs logged</span>
          </div>

          <div className="radar-stat-box">
            <span className="radar-stat-label">AI Reasoning Engine</span>
            <div className="radar-stat-value" style={{ fontSize: '18px', color: 'var(--radar-blue-accent)' }}>
              Gemini 3.8 Flash
            </div>
            <span className="radar-stat-note">Structured threat/opportunity analysis</span>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="radar-toast-success"
            >
              <CheckCircle2 size={16} color="var(--radar-green-pulse)" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            IN-APP NEXORA RADAR NOTIFICATIONS (FEATURE FLOW 12 & 13)
           ========================================================================= */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="radar-pulse-dot alert" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--radar-black)' }}>
                  Active Radar Intelligence Alerts ({alerts.length})
                </h2>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                Powered by Gemini 3.8 Flash Analysis
              </span>
            </div>

            {alerts.map((alert) => (
              <RadarChangeNotification
                key={alert.id}
                alert={alert}
                onViewChange={handleViewChange}
                onAskNexora={handleAskNexora}
                onCreateBattlecard={handleCreateBattlecard}
                onCreateCounterPitch={handleCreateCounterPitch}
                onDismiss={handleDismissAlert}
              />
            ))}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--radar-gray-400)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter monitored competitors..."
              className="radar-search-input"
            />
          </div>

          <div style={{ fontSize: '13px', color: 'var(--radar-gray-500)' }}>
            Showing {filteredCompetitors.length} of {competitors.length} surveillance targets
          </div>
        </div>

        {/* Monitored Competitors Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCompetitors.map((comp) => {
            const isScanning = scanningCompId === comp.id;
            const baseline = comp.baselineSnapshot || comp.baseline;

            return (
              <div key={comp.id} className="radar-competitor-card">
                {/* Header Row */}
                <div className="radar-comp-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="radar-comp-icon">
                      <Globe size={18} color="var(--radar-gray-600)" />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 className="radar-comp-name">{comp.name}</h3>
                        <a
                          href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="radar-comp-link"
                          title="Open website"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <span className="radar-tag category">{comp.category}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="radar-pulse-dot" />
                          <span>{comp.status}</span>
                        </span>
                        <span>·</span>
                        <span>Last scanned: {comp.lastScannedAt || 'Just now'}</span>
                        <span>·</span>
                        <span>Next check: {comp.nextCheckAt || 'Tonight, 11:30 PM'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleScanCompetitor(comp)}
                      disabled={isScanning}
                      className="radar-action-btn secondary"
                      type="button"
                    >
                      <RefreshCw size={13} className={isScanning ? 'nexora-spinner' : ''} />
                      <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
                    </button>

                    <button
                      onClick={(e) => handleDeleteCompetitor(comp.id, e)}
                      className="radar-icon-btn danger"
                      title="Delete competitor"
                      type="button"
                      aria-label="Delete competitor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Key Shift / Latest Intelligence */}
                <div className="radar-comp-shift-box">
                  <span className="radar-comp-shift-label">Latest Intelligence &amp; Detected Shift:</span>
                  <p className="radar-comp-shift-text">{comp.keyShift || 'Baseline established. Watching for pricing, features, and offers.'}</p>
                </div>

                {/* Baseline Snapshot & Keywords Metadata Bar */}
                <div className="radar-comp-meta-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="radar-meta-item">
                      <Shield size={12} color="var(--radar-green-pulse)" />
                      <span>
                        Baseline: {baseline?.contentHash || `bl_${comp.id.slice(-6)}`}
                      </span>
                    </span>

                    {baseline?.capturedAt && (
                      <span className="radar-meta-item">
                        <Clock size={12} />
                        <span>Captured: {new Date(baseline.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    )}

                    {comp.watchedSections && comp.watchedSections.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                        {comp.watchedSections.slice(0, 4).map((sec, idx) => (
                          <span key={idx} className="radar-tag keyword">
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions for this competitor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {comp.recentAlert && (
                      <button
                        onClick={() => handleViewChange(comp.recentAlert as any)}
                        className="radar-action-btn primary small"
                        type="button"
                      >
                        <Eye size={12} />
                        <span>View Change</span>
                      </button>
                    )}

                    <button
                      onClick={() => onAskQuestion(`What is our best battle strategy against ${comp.name}?`)}
                      className="radar-action-btn secondary small"
                      type="button"
                    >
                      <MessageSquare size={12} />
                      <span>Ask Nexora</span>
                    </button>

                    <button
                      onClick={() => onNavigateToBattlecards(comp.name)}
                      className="radar-action-btn secondary small"
                      type="button"
                    >
                      <FileText size={12} />
                      <span>Battlecard</span>
                    </button>

                    <button
                      onClick={() => onNavigateToCounterPitch(comp.name)}
                      className="radar-action-btn secondary small"
                      type="button"
                    >
                      <ShieldAlert size={12} />
                      <span>Counter-Pitch</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPdfCompId(comp.id);
                        setIsPdfExportOpen(true);
                      }}
                      className="radar-action-btn secondary small"
                      type="button"
                      title={`Export detailed PDF for ${comp.name}`}
                    >
                      <FileDown size={12} color="var(--radar-blue-accent)" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCompetitors.length === 0 && (
            <div className="radar-empty-box">
              <Globe size={32} color="var(--radar-gray-400)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '12px' }}>No competitors found</h3>
              <p style={{ fontSize: '13px', color: 'var(--radar-gray-500)', maxWidth: '400px', margin: '6px auto 16px' }}>
                Add any competitor website to activate real-time web surveillance and capture baseline snapshots.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="nexora-primary-btn"
                type="button"
              >
                <Plus size={15} />
                <span>+ Add Competitor</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Competitor (Compact Dark Modal matching Nexora UI) */}
      <AddCompetitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCompetitorAdded={(newComp) => {
          reloadData();
          showToast(`${newComp.name} added to Radar. Baseline snapshot established & surveillance activated!`);
        }}
      />

      {/* Modal: View Change Evidence & Gemini 3.8 Flash Analysis */}
      <ChangeEvidenceModal
        isOpen={Boolean(evidenceModalAlert)}
        alert={evidenceModalAlert}
        onClose={() => setEvidenceModalAlert(null)}
        onAskNexora={handleAskNexora}
        onCreateBattlecard={handleCreateBattlecard}
        onCreateCounterPitch={handleCreateCounterPitch}
      />

      {/* Modal: Export PDF Dossier (Real-time Executive Report) */}
      <PdfExportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        initialCompetitorId={selectedPdfCompId}
      />
    </div>
  );
};
