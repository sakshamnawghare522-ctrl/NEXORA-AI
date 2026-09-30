import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Copy,
  Check,
  Sparkles,
  Download,
  X,
  FileText,
  Shield,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import { VERIFIED_COMPETITOR_DATABASE } from '../../services/intelligenceContext.ts';
import { PdfExportModal } from '../radar/PdfExportModal.tsx';
import { CompetitorsStore } from '../../services/competitorsStore.ts';

interface BattlecardsViewProps {
  onAskQuestion: (query: string) => void;
  initialCompetitor?: string;
}

export const BattlecardsView: React.FC<BattlecardsViewProps> = ({
  onAskQuestion,
  initialCompetitor = '',
}) => {
  const [selectedCompIndex, setSelectedCompIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Simple creation modal state
  const [newCompetitor, setNewCompetitor] = useState(initialCompetitor || '');
  const [newProduct, setNewProduct] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCommonQuestion, setNewCommonQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeRecord =
    VERIFIED_COMPETITOR_DATABASE[selectedCompIndex] || VERIFIED_COMPETITOR_DATABASE[0];
  const card = activeRecord.battlecard;

  const handleCopy = async () => {
    try {
      const text = `BATTLECARD: ${activeRecord.competitor}
Category: ${activeRecord.category}

STRATEGIC MOTIVE:
${card.strategicMotive}

IMMEDIATE COUNTER-PITCH:
${card.immediateCounterPitch}

KEY TALKING POINTS:
${card.keyTalkingPoints.map((tp) => `- ${tp}`).join('\n')}

KILLER QUESTION:
${card.killerFollowUpQuestion}

AVOID:
${card.claimsToAvoid.map((ca) => `- ${ca}`).join('\n')}`;

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const text = `NEXORA COMPETITIVE BATTLECARD: ${activeRecord.competitor}
Target: ${activeRecord.category}

WHAT TO SAY:
"${card.immediateCounterPitch}"

TALKING POINTS:
${card.keyTalkingPoints.map((tp) => `• ${tp}`).join('\n')}

DISCOVERY QUESTION:
"${card.killerFollowUpQuestion}"

STRICTLY AVOID:
${card.claimsToAvoid.map((ca) => `• ${ca}`).join('\n')}`;

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Battlecard_${activeRecord.competitor.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitor.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsCreateModalOpen(false);
      onAskQuestion(
        `Create a complete sales battlecard for ${newCompetitor}. We sell ${newProduct || 'our business solutions'} to ${newTarget || 'our target customers'}. Common question from buyers: "${newCommonQuestion || 'Why are you better than them?'}"`
      );
    }, 700);
  };

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header */}
        <div className="nexora-view-header">
          <div>
            <h1 className="nexora-view-title">Battlecards</h1>
            <p className="nexora-view-subtitle">
              Cheat sheets with strengths, weaknesses, what to say, and winning discovery questions for every competitor.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="nexora-primary-btn"
            type="button"
          >
            <Plus size={16} />
            <span>+ Create Battlecard</span>
          </button>
        </div>

        {/* Competitor Selector Pills */}
        <div className="nexora-battlecard-pill-row" role="tablist">
          {VERIFIED_COMPETITOR_DATABASE.map((record, index) => {
            const isSelected = index === selectedCompIndex;
            return (
              <button
                key={record.competitor}
                onClick={() => setSelectedCompIndex(index)}
                className={`nexora-battlecard-pill-btn ${isSelected ? 'active' : ''}`}
                role="tab"
                aria-selected={isSelected}
                type="button"
              >
                <span>{record.competitor}</span>
              </button>
            );
          })}
        </div>

        {/* Main Battlecard Card */}
        <div className="nexora-battlecard-display-card">
          {/* Card Header & Actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--radar-gray-500)' }}>
                Competitive Battlecard
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--radar-black)', margin: '2px 0 6px 0' }}>
                {activeRecord.competitor}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--radar-gray-600)', margin: 0 }}>
                {card.strategicMotive}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopy}
                className="nexora-secondary-btn"
                style={{ padding: '7px 14px', fontSize: '12px' }}
                type="button"
              >
                {copied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="nexora-primary-btn"
                style={{ padding: '7px 14px', fontSize: '12px' }}
                type="button"
                title="Export detailed PDF battlecard & intelligence dossier"
              >
                <FileDown size={13} />
                <span>Export PDF</span>
              </button>

              <button
                onClick={handleDownload}
                className="nexora-secondary-btn"
                style={{ padding: '7px 14px', fontSize: '12px' }}
                type="button"
                title="Download text script"
              >
                <Download size={13} />
                <span>Text</span>
              </button>

              <button
                onClick={() =>
                  onAskQuestion(
                    `Let's practice a mock sales call against ${activeRecord.competitor}. You act as a customer comparing their pricing, and I will pitch against you.`
                  )
                }
                className="nexora-primary-btn"
                style={{ padding: '7px 14px', fontSize: '12px' }}
                type="button"
              >
                <Sparkles size={13} />
                <span>Practice in AI Chat</span>
              </button>
            </div>
          </div>

          {/* Section 1: Immediate Counter-Pitch */}
          <div style={{ background: 'var(--radar-gray-50)', padding: '20px', borderRadius: '14px', borderLeft: '4px solid var(--radar-black)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-600)', display: 'block', marginBottom: '8px' }}>
              What To Say (Direct Counter-Pitch)
            </span>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--radar-black)', margin: 0, lineHeight: '1.6' }}>
              {card.immediateCounterPitch}
            </p>
          </div>

          {/* Section 2: Key Talking Points & Differentiation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'var(--radar-white)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-700)', display: 'block', marginBottom: '12px' }}>
                Key Talking Points:
              </span>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: 'var(--radar-gray-700)', lineHeight: '1.6' }}>
                {card.keyTalkingPoints.map((tp, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{tp}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tactical Question */}
              <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#1d4ed8', display: 'block', marginBottom: '4px' }}>
                  Killer Discovery Question:
                </span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e3a8a', margin: 0, lineHeight: '1.5' }}>
                  &quot;{card.killerFollowUpQuestion}&quot;
                </p>
              </div>

              {/* Claims to Avoid */}
              <div style={{ background: '#fff1f2', padding: '14px', borderRadius: '12px', borderLeft: '4px solid #e11d48' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9f1239', display: 'block', marginBottom: '4px' }}>
                  Strictly Avoid Saying:
                </span>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12px', color: '#9f1239', lineHeight: '1.5' }}>
                  {card.claimsToAvoid.map((ca, idx) => (
                    <li key={idx}>{ca}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Modal to Create Battlecard */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="nexora-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="nexora-modal-card"
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: 0 }}>
                    Create a New Battlecard
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      1. Who is the competitor?
                    </label>
                    <input
                      type="text"
                      value={newCompetitor}
                      onChange={(e) => setNewCompetitor(e.target.value)}
                      placeholder="e.g. Croma, Reliance Digital, CloudScale, Local Shop"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      2. What are you selling?
                    </label>
                    <input
                      type="text"
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      placeholder="e.g. Laptops and mobile phones with free doorstep setup"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      3. Who are you selling to?
                    </label>
                    <input
                      type="text"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      placeholder="e.g. Local shop owners, working professionals, families"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      4. What do customers usually ask? (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCommonQuestion}
                      onChange={(e) => setNewCommonQuestion(e.target.value)}
                      placeholder="e.g. Why should I buy from you when they are cheaper?"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="submit"
                      disabled={isGenerating || !newCompetitor.trim()}
                      className="nexora-primary-btn"
                    >
                      <Sparkles size={14} />
                      <span>{isGenerating ? 'Building battlecard...' : 'Generate Battlecard'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: PDF Export Center */}
        <PdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          initialCompetitorId={
            CompetitorsStore.getCompetitors().find(
              (c) => c.name.toLowerCase() === activeRecord.competitor.toLowerCase()
            )?.id
          }
        />
      </div>
    </div>
  );
};
