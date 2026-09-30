import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileDown,
  Printer,
  CheckSquare,
  Square,
  Shield,
  BarChart3,
  Award,
  Zap,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { PdfExportService, PdfExportOptions } from '../../services/pdfExportService.ts';
import { CompetitorsStore, MonitoredCompetitor } from '../../services/competitorsStore.ts';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompetitorId?: string;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  initialCompetitorId,
}) => {
  const [competitors, setCompetitors] = useState<MonitoredCompetitor[]>([]);
  const [selectedScope, setSelectedScope] = useState<string>(initialCompetitorId || 'all');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAdvantageSummary, setIncludeAdvantageSummary] = useState(true);
  const [includeStartupProfile, setIncludeStartupProfile] = useState(true);
  const [includeFeatureMatrix, setIncludeFeatureMatrix] = useState(true);
  const [includeBattlecards, setIncludeBattlecards] = useState(true);
  const [includeEvidenceDiffs, setIncludeEvidenceDiffs] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCompetitors(CompetitorsStore.getCompetitors());
      setSelectedScope(initialCompetitorId || 'all');
      setSuccessToast(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialCompetitorId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const options: PdfExportOptions = {
        competitorId: selectedScope === 'all' ? undefined : selectedScope,
        includeCharts,
        includeAdvantageSummary,
        includeStartupProfile,
        includeFeatureMatrix,
        includeBattlecards,
        includeEvidenceDiffs,
        includeRevenueRisk: true,
      };

      await PdfExportService.exportIntelligencePdf(options);
      setSuccessToast('PDF Dossier generated and downloaded successfully!');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.error('[PdfExportModal] Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedCompObj = competitors.find((c) => c.id === selectedScope);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="radar-drawer-overlay"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: 'rgba(5, 7, 12, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
          }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className="radar-pdf-export-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-export-title"
          >
            {/* Header */}
            <div className="radar-pdf-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: 'var(--radar-blue-accent)',
                      boxShadow: '0 0 8px rgba(37, 99, 235, 0.8)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#60a5fa',
                    }}
                  >
                    Executive Dossier &amp; Data Visualizations
                  </span>
                </div>
                <h2 id="pdf-export-title" className="radar-pdf-title">
                  Export Competitive Intelligence Report (PDF)
                </h2>
                <p className="radar-pdf-desc">
                  Download a vector-rendered PDF dossier with dynamic layout, data visualization charts, and competitive advantage summaries.
                </p>
              </div>

              <button
                className="radar-dark-modal-close"
                onClick={onClose}
                aria-label="Close PDF dialog"
                type="button"
                disabled={isExporting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Success Banner */}
            {successToast && (
              <div className="radar-dark-alert active" style={{ margin: '12px 24px 0' }}>
                <CheckCircle2 size={16} color="var(--radar-green-pulse)" />
                <span style={{ fontWeight: 600 }}>{successToast}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="radar-pdf-body">
              {/* Option 1: Scope */}
              <div className="radar-pdf-section">
                <label className="radar-dark-label" style={{ marginBottom: '8px' }}>
                  <span>Report Scope &amp; Target Coverage:</span>
                </label>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="radar-dark-select"
                  disabled={isExporting}
                >
                  <option value="all">
                    Complete Executive Dossier (All {competitors.length} Monitored Competitors)
                  </option>
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      Single Competitor Deep-Dive: {c.name} ({c.website})
                    </option>
                  ))}
                </select>
              </div>

              {/* Option 2: Sections & Charts Inclusion */}
              <div className="radar-pdf-section">
                <span className="radar-dark-label" style={{ marginBottom: '10px' }}>
                  Dynamic Layout &amp; Visualization Options:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIncludeCharts(!includeCharts)}
                    className={`radar-pdf-toggle-btn ${includeCharts ? 'active' : ''}`}
                  >
                    {includeCharts ? <CheckSquare size={16} color="var(--radar-green-pulse)" /> : <Square size={16} />}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BarChart3 size={14} color={includeCharts ? '#10b981' : '#64748b'} />
                      <span>Data Visualization Charts (TCO &amp; Benchmarks)</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeAdvantageSummary(!includeAdvantageSummary)}
                    className={`radar-pdf-toggle-btn ${includeAdvantageSummary ? 'active' : ''}`}
                  >
                    {includeAdvantageSummary ? <CheckSquare size={16} color="var(--radar-green-pulse)" /> : <Square size={16} />}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={14} color={includeAdvantageSummary ? '#10b981' : '#64748b'} />
                      <span>5-Point Competitive Advantages &amp; Moat</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeStartupProfile(!includeStartupProfile)}
                    className={`radar-pdf-toggle-btn ${includeStartupProfile ? 'active' : ''}`}
                  >
                    {includeStartupProfile ? <CheckSquare size={16} color="var(--radar-green-pulse)" /> : <Square size={16} />}
                    <span>Startup Capabilities &amp; 4 Pillars</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeFeatureMatrix(!includeFeatureMatrix)}
                    className={`radar-pdf-toggle-btn ${includeFeatureMatrix ? 'active' : ''}`}
                  >
                    {includeFeatureMatrix ? <CheckSquare size={16} color="var(--radar-green-pulse)" /> : <Square size={16} />}
                    <span>Startup vs Competitor Comparison Matrix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeBattlecards(!includeBattlecards)}
                    className={`radar-pdf-toggle-btn ${includeBattlecards ? 'active' : ''}`}
                  >
                    {includeBattlecards ? <CheckSquare size={16} color="var(--radar-green-pulse)" /> : <Square size={16} />}
                    <span>AI Battlecards &amp; Counter-Pitches</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeEvidenceDiffs(!includeEvidenceDiffs)}
                    className={`radar-pdf-toggle-btn ${includeEvidenceDiffs ? 'active' : ''}`}
                  >
                    {includeEvidenceDiffs ? <CheckSquare size={16} color="var(--radar-green-pulse)" /> : <Square size={16} />}
                    <span>Verified DOM Diffs &amp; Hashes</span>
                  </button>
                </div>
              </div>

              {/* Data Visualization Live Preview */}
              {includeCharts && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} color="var(--radar-green-pulse)" />
                      <span>Data Visualization Preview: Monthly TCO Benchmark Chart</span>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--radar-green-pulse)', fontWeight: 600 }}>67% Lower True TCO</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '3px' }}>
                        <span>Our Startup Platform (All-Inclusive)</span>
                        <strong style={{ color: 'var(--radar-green-pulse)' }}>$99/mo (Flat, Zero Surcharges)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '33%', height: '100%', background: 'var(--radar-green-pulse)', borderRadius: '4px' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '3px' }}>
                        <span>Competitor (Base $69 + SLA $149 + Backups $79)</span>
                        <strong style={{ color: '#ef4444' }}>$297/mo (Unbundled True Cost)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: '23%', height: '100%', background: '#ef4444' }} title="Base $69" />
                        <div style={{ width: '50%', height: '100%', background: '#f43f5e' }} title="SLA Add-on $149" />
                        <div style={{ width: '27%', height: '100%', background: '#fb7185' }} title="Backups $79" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Summary Box */}
              <div className="radar-pdf-preview-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={14} color="var(--radar-green-pulse)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                      Real-Time Generation Metadata:
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    A4 Vector Format · High-Res Print Ready
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Target Competitors:</span>
                    <strong style={{ color: '#ffffff' }}>
                      {selectedScope === 'all' ? `All ${competitors.length} Targets` : selectedCompObj?.name || '1 Target'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Surveillance Engine:</span>
                    <strong style={{ color: 'var(--radar-green-pulse)' }}>Bright Data + Gemini 3.8</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Estimated Pages:</span>
                    <strong style={{ color: '#ffffff' }}>{selectedScope === 'all' ? '3 to 5 Pages' : '2 Pages'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="radar-pdf-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="radar-dark-btn-cancel"
                  title="Open print dialog"
                >
                  <Printer size={14} />
                  <span>Print Document</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="radar-dark-btn-cancel"
                  disabled={isExporting}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="radar-dark-btn-submit"
                  style={{ background: 'var(--radar-blue-accent)', color: '#ffffff' }}
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={15} className="nexora-spinner" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={15} />
                      <span>Download PDF Dossier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
