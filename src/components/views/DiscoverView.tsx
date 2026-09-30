import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Check,
  ExternalLink,
  Shield,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit2,
  Bookmark,
  Share2,
  Layers,
  Activity,
  Plus,
  Table,
  Zap,
} from 'lucide-react';
import {
  IdeaDiscoveryService,
  IdeaAnalysisResult,
  DiscoveredCompetitor,
  CompetitorClassification,
} from '../../services/ideaDiscoveryService.ts';
import { CompetitorsStore } from '../../services/competitorsStore.ts';
import { NavDestination } from '../Navbar.tsx';

interface DiscoverViewProps {
  onAskQuestion: (query: string) => void;
  onNavigateToBattlecards: (compName: string) => void;
  onNavigateToCounterPitch: (compName: string, objection?: string) => void;
  onNavigateToMonitoring: () => void;
  onNavigate: (view: NavDestination) => void;
}

const BUILDING_TYPES = [
  'Startup',
  'Business',
  'Product',
  'App',
  'SaaS',
  'Website',
  'Local Business',
  'Other',
];

const INSPIRATION_IDEAS = [
  {
    label: 'AI Legal Assistant (India)',
    idea: "I'm building an AI legal assistant for Indian citizens.",
    type: 'Startup / App',
  },
  {
    label: 'Clothing Shop in Pune',
    idea: "I'm opening a clothing shop in Pune.",
    type: 'Local Business',
  },
  {
    label: 'Food Delivery in Small Cities',
    idea: "I'm building a food delivery app for smaller Indian cities.",
    type: 'Startup / App',
  },
  {
    label: 'Competitor Tracking SaaS',
    idea: "I'm making software that helps small businesses monitor competitors.",
    type: 'SaaS',
  },
  {
    label: 'Vague Concept Test',
    idea: 'I have an idea.',
    type: 'Business',
  },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onAskQuestion,
  onNavigateToBattlecards,
  onNavigateToCounterPitch,
  onNavigateToMonitoring,
  onNavigate,
}) => {
  const [ideaInput, setIdeaInput] = useState('');
  const [selectedBuildingType, setSelectedBuildingType] = useState('Startup');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [clarificationAnswer, setClarificationAnswer] = useState('');

  // Results State
  const [analysisResult, setAnalysisResult] = useState<IdeaAnalysisResult | null>(() =>
    IdeaDiscoveryService.getSavedIdea()
  );

  // Filter & View State
  const [activeTab, setActiveTab] = useState<'ALL' | CompetitorClassification>('ALL');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isEditingIdea, setIsEditingIdea] = useState(false);
  const [editIdeaText, setEditIdeaText] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [isOpportunitiesOpen, setIsOpportunitiesOpen] = useState(true);
  const [isGapsOpen, setIsGapsOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | null>(null);
  const [monitoredCompNames, setMonitoredCompNames] = useState<string[]>(() =>
    CompetitorsStore.getCompetitors().map((c) => c.name.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Perform Discovery
  const handleDiscover = async (e?: React.FormEvent, overrideIdea?: string, overrideType?: string) => {
    if (e) e.preventDefault();
    const targetIdea = (overrideIdea ?? ideaInput).trim();

    if (!targetIdea) {
      setErrorMessage('Please describe your idea or concept before discovering competitors.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await IdeaDiscoveryService.discoverCompetitors(
        targetIdea,
        overrideType ?? selectedBuildingType,
        clarificationAnswer
      );
      setAnalysisResult(result);
      setCustomCategoryInput(result.understanding.category);
      setEditIdeaText(result.understanding.idea);
      if (!result.needsClarification) {
        showToast(`Discovered ${result.competitors.length} relevant competitors for your idea!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to discover competitors. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Clarification submission
  const handleClarifySubmit = (optionText: string) => {
    setClarificationAnswer(optionText);
    const combinedIdea = `${ideaInput}. Specifically: ${optionText}`;
    setIdeaInput(combinedIdea);
    handleDiscover(undefined, combinedIdea);
  };

  // Save Idea to Workspace
  const handleSaveToWorkspace = () => {
    if (!analysisResult) return;
    IdeaDiscoveryService.saveIdeaToWorkspace(analysisResult);
    showToast('Idea saved to your workspace! Nexora will use this context in all future chats.');
  };

  // Monitor Competitor
  const handleMonitorCompetitor = (comp: DiscoveredCompetitor) => {
    if (CompetitorsStore.isCompetitorMonitored(comp.name)) {
      showToast(`${comp.name} is already in your monitoring list!`);
      return;
    }

    CompetitorsStore.addCompetitor(
      comp.name,
      comp.website,
      ['Pricing', 'Products', 'Offers', 'Features'],
      comp.category
    );

    setMonitoredCompNames((prev) => [...prev, comp.name.toLowerCase()]);
    showToast(`Added ${comp.name} to active daily monitoring!`);
  };

  // Update Category
  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisResult || !customCategoryInput.trim()) return;

    setAnalysisResult({
      ...analysisResult,
      understanding: {
        ...analysisResult.understanding,
        category: customCategoryInput.trim(),
      },
    });
    setIsEditingCategory(false);
    showToast(`Category updated to "${customCategoryInput.trim()}".`);
  };

  // Filtered Competitors List
  const filteredCompetitors = analysisResult
    ? activeTab === 'ALL'
      ? analysisResult.competitors
      : analysisResult.competitors.filter((c) => c.type === activeTab)
    : [];

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              style={{
                position: 'fixed',
                top: '80px',
                right: '24px',
                zIndex: 300,
                background: 'var(--radar-black)',
                color: 'var(--radar-white)',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <CheckCircle size={16} color="#10b981" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Header */}
        <div className="nexora-view-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="nexora-insight-tag watch" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Compass size={12} />
                <span>Idea → Category → Competitors</span>
              </span>
            </div>
            <h1 className="nexora-view-title">Find My Competitors</h1>
            <p className="nexora-view-subtitle">
              You don&apos;t need to already know your competitors. Just tell Nexora what you&apos;re building, and we&apos;ll automatically detect your category, find who competes with you, explain why they match, and uncover market gaps.
            </p>
          </div>

          {analysisResult && !analysisResult.needsClarification && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleSaveToWorkspace}
                className="nexora-secondary-btn"
                type="button"
                title="Save this idea into your profile memory"
              >
                <Bookmark size={14} />
                <span>Save Idea</span>
              </button>

              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setIdeaInput('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="nexora-secondary-btn"
                type="button"
              >
                <RotateCcw size={14} />
                <span>New Idea</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Step 1: Input Box & Building Type Selection */}
        <div
          style={{
            background: 'var(--radar-white)',
            border: '1px solid var(--border-medium)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <form onSubmit={(e) => handleDiscover(e)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Building Type Selector */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--radar-black)',
                  marginBottom: '8px',
                }}
              >
                What are you building?
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {BUILDING_TYPES.map((type) => {
                  const isSelected = selectedBuildingType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedBuildingType(type)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 600 : 500,
                        background: isSelected ? 'var(--radar-black)' : 'var(--radar-gray-50)',
                        color: isSelected ? 'var(--radar-white)' : 'var(--radar-gray-700)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--radar-black)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Idea Description Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--radar-black)',
                  }}
                >
                  Or just tell Nexora your idea
                </label>
                <span style={{ fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                  Plain English or Hinglish supported
                </span>
              </div>
              <textarea
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                placeholder="Example: I'm building an AI tool that helps small shops understand what their competitors are doing."
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-medium)',
                  fontSize: '14px',
                  color: 'var(--radar-black)',
                  outline: 'none',
                  background: 'var(--radar-white)',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
                required
              />

              {/* Inspiration Examples */}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--radar-gray-500)', marginRight: '6px' }}>
                  Try a real scenario:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {INSPIRATION_IDEAS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIdeaInput(item.idea);
                        setSelectedBuildingType(item.type);
                        handleDiscover(undefined, item.idea, item.type);
                      }}
                      style={{
                        background: 'var(--radar-gray-100)',
                        color: 'var(--radar-gray-700)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '9999px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                disabled={isLoading || !ideaInput.trim()}
                className="nexora-primary-btn"
                style={{ padding: '12px 24px', fontSize: '14px' }}
              >
                <Search size={16} />
                <span>{isLoading ? 'Analyzing Idea & Discovering Competitors...' : 'Find My Competitors'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. Clarification Step (Step 14 & 21: When input is too short, e.g. "I have an idea") */}
        {analysisResult && analysisResult.needsClarification && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <HelpCircle size={20} color="#b45309" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#92400e', margin: '0 0 4px 0' }}>
                  Got it! What are you thinking of building?
                </h3>
                <p style={{ fontSize: '13px', color: '#78350f', margin: 0 }}>
                  {analysisResult.clarificationQuestion || 'Tell Nexora what your product or business will help customers do:'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {analysisResult.clarificationOptions?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleClarifySubmit(opt)}
                  className="nexora-secondary-btn"
                  style={{
                    background: 'var(--radar-white)',
                    borderColor: '#fcd34d',
                    color: '#78350f',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  type="button"
                >
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 4. Step 2 & 3: "Here's what I understood" & Smart Category Detection */}
        {analysisResult && !analysisResult.needsClarification && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
          >
            <div
              style={{
                background: 'var(--radar-white)',
                border: '1px solid var(--border-medium)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--radar-blue-accent)" />
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: 0 }}>
                    Here&apos;s what I understood
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIsEditingIdea((prev) => !prev)}
                    className="nexora-text-link-btn"
                    style={{ fontSize: '12px' }}
                    type="button"
                  >
                    <Edit2 size={13} />
                    <span>{isEditingIdea ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>
              </div>

              {/* Editable Idea box */}
              {isEditingIdea ? (
                <div style={{ marginBottom: '20px' }}>
                  <textarea
                    value={editIdeaText}
                    onChange={(e) => setEditIdeaText(e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--radar-black)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => {
                        setIdeaInput(editIdeaText);
                        handleDiscover(undefined, editIdeaText);
                        setIsEditingIdea(false);
                      }}
                      className="nexora-primary-btn"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      type="button"
                    >
                      Update &amp; Re-discover
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Grid of Extracted Parameters (Zero Jargon) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* YOUR IDEA */}
                <div style={{ background: 'var(--radar-gray-50)', padding: '16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-500)', display: 'block', marginBottom: '4px' }}>
                    YOUR IDEA
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--radar-black)', lineHeight: '1.5' }}>
                    &ldquo;{analysisResult.understanding.idea}&rdquo;
                  </div>
                </div>

                {/* CATEGORY (with Change Category button) */}
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#166534' }}>
                      DETECTED CATEGORY
                    </span>
                    <button
                      onClick={() => setIsEditingCategory((prev) => !prev)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      type="button"
                    >
                      {isEditingCategory ? 'Cancel' : 'Change Category'}
                    </button>
                  </div>

                  {isEditingCategory ? (
                    <form onSubmit={handleUpdateCategory} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #86efac',
                          fontSize: '12px',
                        }}
                      />
                      <button
                        type="submit"
                        className="nexora-primary-btn"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#14532d' }}>
                      {analysisResult.understanding.category}
                    </div>
                  )}
                  <span style={{ fontSize: '11px', color: '#166534', marginTop: '4px', display: 'block' }}>
                    Your business appears to be in this sector
                  </span>
                </div>

                {/* TARGET CUSTOMER */}
                <div style={{ background: 'var(--radar-gray-50)', padding: '16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-500)', display: 'block', marginBottom: '4px' }}>
                    TARGET CUSTOMER
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--radar-gray-800)', lineHeight: '1.4' }}>
                    {analysisResult.understanding.targetCustomer}
                  </div>
                </div>

                {/* MAIN PROBLEM SOLVED */}
                <div style={{ background: 'var(--radar-gray-50)', padding: '16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-500)', display: 'block', marginBottom: '4px' }}>
                    MAIN PROBLEM SOLVED
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--radar-gray-800)', lineHeight: '1.4' }}>
                    {analysisResult.understanding.customerProblem}
                  </div>
                </div>
              </div>

              {/* Geographic Market & Business Model pill line */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--radar-gray-600)' }}>
                <span><strong>Market:</strong> {analysisResult.understanding.geographicMarket}</span>
                <span>•</span>
                <span><strong>Business Model:</strong> {analysisResult.understanding.businessModel}</span>
              </div>
            </div>

            {/* 5. Step 5 & 6: "Competitors Nexora Found" */}
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 4px 0' }}>
                    Competitors Nexora Found ({analysisResult.competitors.length})
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--radar-gray-600)', margin: 0 }}>
                    Identified based on your target audience, customer problem, category, and business model.
                  </p>
                </div>

                {/* Compare & Actions Toggle */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIsComparing((prev) => !prev)}
                    className="nexora-secondary-btn"
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                    type="button"
                  >
                    <Table size={14} />
                    <span>{isComparing ? 'Hide Comparison' : 'Compare Competitors'}</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs: [All], [Direct Competitors], [Indirect], [Alternatives], [Emerging] */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {[
                  { key: 'ALL', label: `All (${analysisResult.competitors.length})` },
                  { key: 'DIRECT', label: `Direct Competitors (${analysisResult.competitors.filter((c) => c.type === 'DIRECT').length})` },
                  { key: 'INDIRECT', label: `Indirect Competitors (${analysisResult.competitors.filter((c) => c.type === 'INDIRECT').length})` },
                  { key: 'ALTERNATIVE', label: `Alternatives (${analysisResult.competitors.filter((c) => c.type === 'ALTERNATIVE').length})` },
                  { key: 'EMERGING', label: `Emerging / New (${analysisResult.competitors.filter((c) => c.type === 'EMERGING').length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: activeTab === tab.key ? 600 : 500,
                      background: activeTab === tab.key ? 'var(--radar-black)' : 'var(--radar-white)',
                      color: activeTab === tab.key ? 'var(--radar-white)' : 'var(--radar-gray-700)',
                      border: '1px solid',
                      borderColor: activeTab === tab.key ? 'var(--radar-black)' : 'var(--border-medium)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Truth / Evidence Legend (Step 6) */}
              <div
                style={{
                  background: 'var(--radar-gray-50)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  fontSize: '11px',
                  color: 'var(--radar-gray-600)',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--radar-black)' }}>Evidence Layer:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <strong>VERIFIED INFORMATION</strong>: Supported by public website data
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
                  <strong>NEXORA ANALYSIS</strong>: AI-generated strategic match deduction
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <strong>POTENTIAL MATCH</strong>: Cautious categorization without unsupported claims
                </span>
              </div>

              {/* Competitor Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredCompetitors.map((comp) => {
                  const isMonitored = monitoredCompNames.includes(comp.name.toLowerCase());
                  const isSourcesOpen = expandedSourcesId === comp.id;

                  return (
                    <div
                      key={comp.id}
                      style={{
                        background: 'var(--radar-white)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '18px',
                        padding: '24px',
                        boxShadow: 'var(--shadow-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}
                    >
                      {/* Top Header of Card */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            {/* Confidence / Classification Label */}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background:
                                  comp.type === 'DIRECT'
                                    ? '#fef2f2'
                                    : comp.type === 'INDIRECT'
                                    ? '#eff6ff'
                                    : comp.type === 'ALTERNATIVE'
                                    ? '#fffbeb'
                                    : '#f5f3ff',
                                color:
                                  comp.type === 'DIRECT'
                                    ? '#b91c1c'
                                    : comp.type === 'INDIRECT'
                                    ? '#1d4ed8'
                                    : comp.type === 'ALTERNATIVE'
                                    ? '#92400e'
                                    : '#6d28d9',
                                border: '1px solid currentColor',
                              }}
                            >
                              {comp.confidenceLabel}
                            </span>

                            <span style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                              {comp.category}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 4px 0' }}>
                            {comp.name}
                          </h3>

                          {comp.website && (
                            <a
                              href={comp.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="nexora-comp-url"
                              style={{ fontSize: '12px' }}
                            >
                              <span>{comp.website.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>

                        {/* Relevance Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              background: comp.matchRelevance === 'HIGH' ? '#f0fdf4' : '#fffbeb',
                              color: comp.matchRelevance === 'HIGH' ? '#166534' : '#92400e',
                              border: '1px solid',
                              borderColor: comp.matchRelevance === 'HIGH' ? '#bbf7d0' : '#fde68a',
                            }}
                          >
                            {comp.matchRelevance === 'HIGH' ? 'High match' : 'Moderate match'}
                          </span>
                        </div>
                      </div>

                      {/* What they do & Target Customer */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: '14px',
                          background: 'var(--radar-gray-50)',
                          padding: '16px',
                          borderRadius: '12px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-500)', display: 'block', marginBottom: '4px' }}>
                            WHAT THEY DO
                          </span>
                          <p style={{ fontSize: '13px', color: 'var(--radar-black)', margin: 0, lineHeight: '1.5' }}>
                            {comp.whatTheyDo}
                          </p>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-500)', display: 'block', marginBottom: '4px' }}>
                            THEIR TARGET CUSTOMER
                          </span>
                          <p style={{ fontSize: '13px', color: 'var(--radar-gray-700)', margin: 0, lineHeight: '1.5' }}>
                            {comp.targetCustomer}
                          </p>
                        </div>
                      </div>

                      {/* Step 7: Why Does This Match My Idea? */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px 18px',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--radar-black)', display: 'block', marginBottom: '6px' }}>
                          WHY THIS COMPANY MATCHES
                        </span>
                        <p style={{ fontSize: '13px', color: 'var(--radar-gray-800)', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                          {comp.whyTheyMatch}
                        </p>

                        {/* Match Factors Checkboxes */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--radar-gray-700)' }}>
                          {comp.matchFactors.similarProduct && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#166534', fontWeight: 500 }}>
                              <Check size={14} color="#16a34a" /> Similar product/service
                            </span>
                          )}
                          {comp.matchFactors.similarCustomer && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#166534', fontWeight: 500 }}>
                              <Check size={14} color="#16a34a" /> Similar target customers
                            </span>
                          )}
                          {comp.matchFactors.solvesSimilarProblem && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#166534', fontWeight: 500 }}>
                              <Check size={14} color="#16a34a" /> Solves a similar problem
                            </span>
                          )}
                          {comp.matchFactors.operatesInSameMarket && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#166534', fontWeight: 500 }}>
                              <Check size={14} color="#16a34a" /> Operates in same market
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evidence & Sources Toggle (Step 6 & 18) */}
                      <div>
                        <button
                          onClick={() => setExpandedSourcesId(isSourcesOpen ? null : comp.id)}
                          className="nexora-text-link-btn"
                          style={{ fontSize: '12px' }}
                          type="button"
                        >
                          <Shield size={13} />
                          <span>{isSourcesOpen ? 'Hide Evidence & Sources' : 'View Evidence & Sources'}</span>
                          {isSourcesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        <AnimatePresence>
                          {isSourcesOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{
                                marginTop: '10px',
                                background: 'var(--radar-gray-50)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '10px',
                                padding: '14px',
                                fontSize: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                overflow: 'hidden',
                              }}
                            >
                              <div>
                                <strong style={{ color: '#059669' }}>VERIFIED INFORMATION:</strong>{' '}
                                <span style={{ color: 'var(--radar-gray-800)' }}>{comp.verifiedInfo}</span>
                              </div>
                              <div>
                                <strong style={{ color: '#7c3aed' }}>NEXORA STRATEGIC ANALYSIS:</strong>{' '}
                                <span style={{ color: 'var(--radar-gray-800)' }}>{comp.nexoraAnalysis}</span>
                              </div>
                              <div style={{ color: 'var(--radar-gray-500)', fontSize: '11px', marginTop: '4px' }}>
                                Source: {comp.sourceLabel} {comp.sourceUrl ? `(${comp.sourceUrl})` : ''}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Competitor Actions (Step 11) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleMonitorCompetitor(comp)}
                            className="nexora-primary-btn"
                            style={{ padding: '7px 14px', fontSize: '12px' }}
                            type="button"
                          >
                            <Activity size={13} />
                            <span>{isMonitored ? 'Monitoring Active ✓' : 'Monitor Competitor'}</span>
                          </button>

                          <button
                            onClick={() => onNavigateToBattlecards(comp.name)}
                            className="nexora-secondary-btn"
                            style={{ padding: '7px 14px', fontSize: '12px' }}
                            type="button"
                          >
                            <FileText size={13} />
                            <span>Create Battlecard</span>
                          </button>

                          <button
                            onClick={() =>
                              onNavigateToCounterPitch(
                                comp.name,
                                `A customer says ${comp.name} is cheaper than our solution.`
                              )
                            }
                            className="nexora-secondary-btn"
                            style={{ padding: '7px 14px', fontSize: '12px' }}
                            type="button"
                          >
                            <Shield size={13} />
                            <span>Counter-Pitch</span>
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            onAskQuestion(
                              `Analyze ${comp.name} for my idea: "${analysisResult.understanding.idea}". What are their main pricing tricks and how do I beat them?`
                            )
                          }
                          className="nexora-text-link-btn"
                          style={{ fontSize: '12px' }}
                          type="button"
                        >
                          <Sparkles size={13} />
                          <span>Ask Nexora about {comp.name}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Step 8: Competitor Comparison Matrix */}
            {isComparing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  background: 'var(--radar-white)',
                  border: '1.5px solid var(--radar-black)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  overflowX: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 2px 0' }}>
                      Competitor Comparison Matrix
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                      Side-by-side assessment of discovered companies against your idea
                    </span>
                  </div>

                  <button
                    onClick={() => setIsComparing(false)}
                    className="nexora-text-link-btn"
                    style={{ fontSize: '12px' }}
                    type="button"
                  >
                    Close Comparison
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--radar-gray-100)', borderBottom: '2px solid var(--border-medium)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--radar-black)' }}>Criteria</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: '#16a34a', background: '#f0fdf4' }}>
                        ★ YOUR IDEA
                      </th>
                      {analysisResult.competitors.slice(0, 3).map((c) => (
                        <th key={c.id} style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--radar-black)' }}>
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--radar-gray-600)' }}>Category</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>
                        {analysisResult.understanding.category}
                      </td>
                      {analysisResult.competitors.slice(0, 3).map((c) => (
                        <td key={c.id} style={{ padding: '12px 14px' }}>{c.category}</td>
                      ))}
                    </tr>

                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--radar-gray-600)' }}>Target Market</td>
                      <td style={{ padding: '12px 14px', background: '#f0fdf4', color: '#15803d' }}>
                        {analysisResult.understanding.geographicMarket}
                      </td>
                      {analysisResult.competitors.slice(0, 3).map((c) => (
                        <td key={c.id} style={{ padding: '12px 14px' }}>{c.targetCustomer}</td>
                      ))}
                    </tr>

                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--radar-gray-600)' }}>Pricing Approach</td>
                      <td style={{ padding: '12px 14px', background: '#f0fdf4', color: '#15803d', fontWeight: 600 }}>
                        Transparent / Flat fee
                      </td>
                      {analysisResult.competitors.slice(0, 3).map((c) => (
                        <td key={c.id} style={{ padding: '12px 14px' }}>{c.pricing || 'Not enough verified information'}</td>
                      ))}
                    </tr>

                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--radar-gray-600)' }}>Strengths</td>
                      <td style={{ padding: '12px 14px', background: '#f0fdf4', color: '#15803d' }}>
                        Agile, zero legacy baggage, personalized touch
                      </td>
                      {analysisResult.competitors.slice(0, 3).map((c) => (
                        <td key={c.id} style={{ padding: '12px 14px' }}>
                          {c.strengths?.join(', ') || 'Not enough verified information'}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--radar-gray-600)' }}>Potential Vulnerabilities</td>
                      <td style={{ padding: '12px 14px', background: '#f0fdf4', color: '#15803d' }}>
                        Brand awareness to be built
                      </td>
                      {analysisResult.competitors.slice(0, 3).map((c) => (
                        <td key={c.id} style={{ padding: '12px 14px', color: '#b91c1c' }}>
                          {c.potentialWeaknesses?.join(', ') || 'Not enough verified information'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* 7. Step 9: "What Makes My Idea Different?" (Find My Opportunity) */}
            <div
              style={{
                background: 'var(--radar-white)',
                border: '1px solid var(--border-medium)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} color="#f59e0b" />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: 0 }}>
                    What Makes Your Idea Different? (Differentiation Opportunities)
                  </h3>
                </div>

                <span style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '3px 8px', borderRadius: '6px' }}>
                  Nexora analysis
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {analysisResult.differentiatorOpportunities.map((diff, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--radar-gray-50)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--radar-black)' }}>
                      ✦ {diff.area}
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--radar-black)', margin: 0, lineHeight: '1.5' }}>
                      {diff.suggestion}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--radar-gray-600)', margin: 0, lineHeight: '1.5' }}>
                      {diff.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Step 10: Competitor Gap Analysis (Find Gaps) */}
            <div
              style={{
                background: 'var(--radar-white)',
                border: '1px solid var(--border-medium)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#059669" />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: 0 }}>
                    Competitor Gap Analysis
                  </h3>
                </div>

                <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px' }}>
                  Potential opportunity
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Underserved Segments */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#166534', display: 'block', marginBottom: '8px' }}>
                    UNDERSERVED CUSTOMER SEGMENTS
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#14532d', lineHeight: '1.6' }}>
                    {analysisResult.gapAnalysis.underservedSegments.map((seg, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{seg}</li>
                    ))}
                  </ul>
                </div>

                {/* Unmet Needs */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#1e40af', display: 'block', marginBottom: '8px' }}>
                    UNMET MARKET NEEDS
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e3a8a', lineHeight: '1.6' }}>
                    {analysisResult.gapAnalysis.unmetNeeds.map((need, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{need}</li>
                    ))}
                  </ul>
                </div>

                {/* Common Competitor Traps */}
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#be123c', display: 'block', marginBottom: '8px' }}>
                    COMMON COMPETITOR APPROACHES
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#9f1239', lineHeight: '1.6' }}>
                    {analysisResult.gapAnalysis.commonPricingApproaches.map((trap, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{trap}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Actions Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                color: 'var(--radar-white)',
                borderRadius: '20px',
                padding: '28px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
                  Ready to turn these insights into sales wins?
                </h4>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
                  Ask Nexora to roleplay objection handling, or jump directly to your battlecards.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() =>
                    onAskQuestion(
                      `I am working on my idea: "${analysisResult.understanding.idea}". Based on the competitors we discovered (${analysisResult.competitors.slice(0, 3).map((c) => c.name).join(', ')}), what is the single best customer acquisition angle to win deals?`
                    )
                  }
                  className="nexora-primary-btn"
                  style={{ background: 'var(--radar-white)', color: 'var(--radar-black)', padding: '10px 18px', fontSize: '13px' }}
                  type="button"
                >
                  <Sparkles size={14} />
                  <span>Ask Nexora Advice</span>
                </button>

                <button
                  onClick={() => onNavigate('battlecards')}
                  className="nexora-secondary-btn"
                  style={{ background: 'transparent', color: 'var(--radar-white)', borderColor: '#3f3f46', padding: '10px 18px', fontSize: '13px' }}
                  type="button"
                >
                  <FileText size={14} />
                  <span>View Battlecards</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
