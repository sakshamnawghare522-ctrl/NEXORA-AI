import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Trash2,
  CheckCircle,
  X,
  Shield,
  ArrowRight,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { CompetitorsStore, MonitoredCompetitor } from '../../services/competitorsStore.ts';

interface CompetitorsViewProps {
  onAskQuestion: (query: string) => void;
  onSelectCompetitor: (competitor: MonitoredCompetitor) => void;
  onNavigateToBattlecards: (compName: string) => void;
  onNavigateToDiscover?: () => void;
}

export const CompetitorsView: React.FC<CompetitorsViewProps> = ({
  onAskQuestion,
  onSelectCompetitor,
  onNavigateToBattlecards,
  onNavigateToDiscover,
}) => {
  const [competitors, setCompetitors] = useState<MonitoredCompetitor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 3-Step Wizard Form State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedWatches, setSelectedWatches] = useState<string[]>([
    'Pricing',
    'Products',
    'Offers',
  ]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const WATCH_OPTIONS = [
    'Pricing',
    'Products',
    'Offers',
    'Features',
    'Website messaging',
    'Everything',
  ];

  useEffect(() => {
    setCompetitors(CompetitorsStore.getCompetitors());
  }, []);

  const handleToggleWatch = (option: string) => {
    if (option === 'Everything') {
      if (selectedWatches.includes('Everything')) {
        setSelectedWatches(['Pricing']);
      } else {
        setSelectedWatches(['Everything', 'Pricing', 'Products', 'Offers', 'Features', 'Website messaging']);
      }
      return;
    }

    if (selectedWatches.includes(option)) {
      setSelectedWatches(selectedWatches.filter((w) => w !== option && w !== 'Everything'));
    } else {
      setSelectedWatches([...selectedWatches, option]);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide the competitor's name.");
      return;
    }
    if (!website.trim()) {
      setError("Please provide the competitor's website.");
      return;
    }

    setError('');
    const newComp = CompetitorsStore.addCompetitor(name, website, selectedWatches);
    setCompetitors(CompetitorsStore.getCompetitors());

    // Reset Form
    setName('');
    setWebsite('');
    setSelectedWatches(['Pricing', 'Products', 'Offers']);
    setStep(1);
    setIsAddModalOpen(false);

    setSuccessMessage(`Now monitoring ${newComp.name} for price and product updates!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
              Add any competitor you want Nexora to watch. We track their pricing, product features, and promotional offers every day.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onNavigateToDiscover && (
              <button
                onClick={onNavigateToDiscover}
                className="nexora-secondary-btn"
                type="button"
              >
                <span>Find From Idea</span>
              </button>
            )}

            <button
              onClick={() => {
                setStep(1);
                setIsAddModalOpen(true);
              }}
              className="nexora-primary-btn"
              type="button"
            >
              <Plus size={16} />
              <span>Add Competitor</span>
            </button>
          </div>
        </div>

        {/* Discovery Helper Banner */}
        {onNavigateToDiscover && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #86efac',
              borderRadius: '14px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <strong style={{ fontSize: '13px', color: '#166534', display: 'block', marginBottom: '2px' }}>
                Don&apos;t know who your competitors are yet?
              </strong>
              <span style={{ fontSize: '12px', color: '#14532d' }}>
                Tell Nexora what you&apos;re building and we&apos;ll automatically identify your category and discover companies like yours.
              </span>
            </div>

            <button
              onClick={onNavigateToDiscover}
              className="nexora-primary-btn"
              style={{ background: '#166534', borderColor: '#166534', fontSize: '12px', padding: '7px 14px' }}
              type="button"
            >
              <span>Find From Your Idea &rarr;</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        <AnimatePresence>
          {successMessage && (
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
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Competitor Cards List */}
        <div className="nexora-competitors-grid">
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className="nexora-competitor-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectCompetitor(comp)}
            >
              <div>
                <div className="nexora-comp-card-top">
                  <div className="nexora-comp-info">
                    <h3 className="nexora-comp-name">{comp.name}</h3>
                    <a
                      href={comp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nexora-comp-url"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{comp.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <span className="nexora-comp-status-badge">
                    <span className="nexora-status-dot-active" />
                    <span>Monitoring Active</span>
                  </span>
                </div>

                {/* Shift Summary in plain words */}
                <div className="nexora-comp-shift-box" style={{ marginTop: '14px' }}>
                  <strong>Latest shift detected:</strong> {comp.keyShift}
                </div>

                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                  Watching: <strong>{comp.watchedSections?.join(', ') || 'Pricing, Products, Offers'}</strong>
                </div>
              </div>

              {/* Card Actions */}
              <div className="nexora-comp-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onSelectCompetitor(comp)}
                  className="nexora-primary-btn"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  type="button"
                >
                  <span>View Competitor</span>
                  <ChevronRight size={13} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => onAskQuestion(`What should I know about ${comp.name}?`)}
                    className="nexora-secondary-btn"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    type="button"
                    title="Ask AI about this competitor"
                  >
                    <Sparkles size={13} />
                    <span>Ask AI</span>
                  </button>

                  {comp.isCustom && (
                    <button
                      onClick={(e) => handleDelete(comp.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--radar-gray-400)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                      }}
                      title="Stop watching this competitor"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3-Step Wizard Modal for Adding Competitor */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="nexora-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="nexora-modal-card"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--radar-gray-500)' }}>
                      Step {step} of 3
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: '2px 0 0 0' }}>
                      Add Competitor
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--radar-gray-500)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', color: '#991b1b', fontSize: '12px' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Step 1: Competitor Name */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--radar-black)', marginBottom: '8px' }}>
                        Step 1: What is the competitor&apos;s name?
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Reliance Digital, Croma, CloudScale, Local Shop"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                        autoFocus
                      />

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          type="button"
                          disabled={!name.trim()}
                          onClick={() => {
                            if (name.trim()) setStep(2);
                          }}
                          className="nexora-primary-btn"
                        >
                          <span>Next: Website URL</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Website */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--radar-black)', marginBottom: '8px' }}>
                        Step 2: What is their website?
                      </label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="e.g. reliancedigital.in or competitor.com"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                        autoFocus
                      />
                      <span style={{ fontSize: '11px', color: 'var(--radar-gray-500)', marginTop: '4px', display: 'block' }}>
                        Nexora will read their public pricing and product pages.
                      </span>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="nexora-secondary-btn"
                        >
                          <span>Back</span>
                        </button>

                        <button
                          type="button"
                          disabled={!website.trim()}
                          onClick={() => {
                            if (website.trim()) setStep(3);
                          }}
                          className="nexora-primary-btn"
                        >
                          <span>Next: What to Watch</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: What do you want Nexora to watch? */}
                  {step === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--radar-black)', marginBottom: '8px' }}>
                        Step 3: What do you want Nexora to watch?
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '10px 0' }}>
                        {WATCH_OPTIONS.map((opt) => {
                          const isChecked = selectedWatches.includes(opt);
                          return (
                            <label
                              key={opt}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px',
                                borderRadius: '8px',
                                border: `1px solid ${isChecked ? 'var(--radar-black)' : 'var(--border-subtle)'}`,
                                background: isChecked ? 'var(--radar-gray-50)' : 'var(--radar-white)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: isChecked ? 600 : 400,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleWatch(opt)}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="nexora-secondary-btn"
                        >
                          <span>Back</span>
                        </button>

                        <button type="submit" className="nexora-primary-btn">
                          <CheckCircle size={14} />
                          <span>Start Monitoring</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
