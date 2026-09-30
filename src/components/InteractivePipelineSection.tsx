import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  GitCompare,
  BrainCircuit,
  ShieldAlert,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { EstimatedRevenueRiskBar } from './pipeline/EstimatedRevenueRiskBar.tsx';
import {
  calculateRevenueRisk,
  formatCurrency,
  SCENARIO_RISK_PROFILES,
} from '../services/revenueRiskService.ts';

interface ObjectionScenario {
  id: string;
  competitor: string;
  url: string;
  objection: string;
  threatLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  observedChange: {
    previous: string;
    current: string;
    diffSummary: string;
    capturedAt: string;
  };
  counterPitch: {
    immediateResponse: string;
    talkingPoints: string[];
    followUpQuestion: string;
    claimsToAvoid: string[];
    evidenceNote: string;
  };
}

const PRESET_OBJECTIONS: ObjectionScenario[] = [
  {
    id: 'pricing-drop',
    competitor: 'CloudScale Inc.',
    url: 'https://cloudscale.example.com/pricing',
    objection: 'They are 30% cheaper.',
    threatLevel: 'HIGH',
    observedChange: {
      previous: '$99/seat/month (Annual commitment, includes dedicated SLA & backup)',
      current: '$69/seat/month (Base tier, dedicated SLA and multi-region backups moved to $149 Add-on)',
      diffSummary: 'Headline price dropped 30% ($99 -> $69), but core enterprise features unbundled into paid add-ons.',
      capturedAt: '2026-09-26 14:22:08 UTC',
    },
    counterPitch: {
      immediateResponse:
        '"I understand budget is top of mind. Just so you are aware, CloudScale dropped their baseline sticker price yesterday from $99 to $69 by stripping out dedicated SLA support and multi-region backups, which are now an extra $149 add-on. With our all-inclusive enterprise model, your total cost of ownership actually remains 22% lower without unexpected line items."',
      talkingPoints: [
        'Acknowledge the headline price change directly so the buyer knows you have real-time visibility.',
        'Highlight hidden costs: CloudScale now charges extra for SLA response guarantees.',
        'Reinforce predictability: Our flat transparent tier includes enterprise backup, SOC-2 compliance, and 99.99% SLA.',
      ],
      followUpQuestion:
        '"Are mission-critical uptime SLAs and multi-region backups required for your production workload?"',
      claimsToAvoid: [
        'Do NOT claim CloudScale has bad software or unreliable performance.',
        'Do NOT offer an immediate discount before clarifying the unbundled add-on reality.',
      ],
      evidenceNote:
        'Captured via Bright Data DOM Snapshot. Deterministic diff verified price table row update from commit #e4f91.',
    },
  },
  {
    id: 'feature-launch',
    competitor: 'MetricPulse',
    url: 'https://metricpulse.example.com/features',
    objection: 'They just launched automated SOC-2 compliance for free.',
    threatLevel: 'MEDIUM',
    observedChange: {
      previous: 'SOC-2 Type II: "Available on Custom Enterprise Tier only"',
      current: 'SOC-2 Type II: "Self-serve automated audit export included in Pro ($49/mo)"',
      diffSummary: 'Automated compliance badge added to self-serve tier. Fine print limits audit exports to 1 per quarter.',
      capturedAt: '2026-09-25 09:15:30 UTC',
    },
    counterPitch: {
      immediateResponse:
        '"MetricPulse did introduce an automated export this week, but their terms limit reports to 1 per quarter and exclude real-time continuous auditor access. In contrast, our platform provides live continuous evidence streams that your external auditor can access directly 365 days a year."',
      talkingPoints: [
        'Validate the customer inquiry gracefully.',
        'Clarify the limitation: MetricPulse offers quarterly static exports, not continuous real-time auditor integration.',
        'Position our solution as the enterprise gold standard for audit readiness.',
      ],
      followUpQuestion:
        '"Does your compliance team require continuous auditor portal access or only periodic static PDF exports?"',
      claimsToAvoid: [
        'Do not accuse MetricPulse of false advertising.',
        'Do not dismiss compliance as an unimportant buyer priority.',
      ],
      evidenceNote:
        'Observed in MetricPulse Pricing Footnote #4 and feature comparison matrix change.',
    },
  },
  {
    id: 'api-limits',
    competitor: 'NexusData',
    url: 'https://nexusdata.example.com/platform',
    objection: 'Their new tier includes unlimited API requests.',
    threatLevel: 'LOW',
    observedChange: {
      previous: 'API Rate Limit: 10,000 requests/day',
      current: 'API Rate Limit: "Unlimited requests* (*Subject to Fair Use throttling at 25 req/sec)"',
      diffSummary: 'Marketing copy updated to "Unlimited API", but fair use policy introduces aggressive throttling at 25 req/sec.',
      capturedAt: '2026-09-24 18:04:12 UTC',
    },
    counterPitch: {
      immediateResponse:
        '"While their marketing page now headlines \'unlimited API\', their updated fair-use clause throttles throughput at 25 requests per second. If your sync batch exceeds 1,500 operations a minute, your pipeline will queue. We guarantee sustained 500 req/sec bursts with zero throttling."',
      talkingPoints: [
        'Distinguish between marketing claims and technical throughput limits.',
        'Reference their documented 25 req/sec threshold.',
        'Highlight our low-latency burst capabilities for peak hours.',
      ],
      followUpQuestion:
        '"What is your peak concurrency requirement during high-traffic batch ingestion?"',
      claimsToAvoid: [
        'Avoid overly technical jargon if speaking to non-technical business buyers.',
      ],
      evidenceNote:
        'Extracted from NexusData Developer Docs API Terms Section 7.2 updated 48h ago.',
    },
  },
];

interface InteractivePipelineSectionProps {
  activeStep?: number;
  onStepChange?: (step: number) => void;
}

export const InteractivePipelineSection: React.FC<InteractivePipelineSectionProps> = ({
  activeStep: controlledStep,
  onStepChange,
}) => {
  const [internalStep, setInternalStep] = useState<number>(1);
  const activeStep = controlledStep !== undefined ? controlledStep : internalStep;
  const setActiveStep = (step: number) => {
    setInternalStep(step);
    onStepChange?.(step);
  };
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('pricing-drop');
  const [customObjection, setCustomObjection] = useState<string>('');
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const currentScenario =
    PRESET_OBJECTIONS.find((s) => s.id === selectedScenarioId) || PRESET_OBJECTIONS[0];

  // Dynamic calculations for the active scenario
  const currentRisk = calculateRevenueRisk(
    selectedScenarioId,
    customResponse ? customObjection : null,
    750000,
    14,
    'unprepared'
  );

  const handleSimulateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customObjection.trim()) return;

    setIsSimulating(true);
    setCustomResponse(null);

    setTimeout(() => {
      setCustomResponse(
        `"When buyers compare our approach against competitor claims like '${customObjection.trim()}', the key strategic distinction is total operational impact. Nexora's evidence shows their changes are often accompanied by trade-offs in enterprise SLAs and hidden configuration costs. We give you guaranteed performance, transparent pricing, and zero downstream surprises."`
      );
      setIsSimulating(false);
    }, 700);
  };

  return (
    <section id="see-how-it-works" className="radar-section" aria-label="How Nexora Works">
      {/* Section Header */}
      <div className="radar-section-header">
        <div className="radar-section-eyebrow">
          <span className="radar-subtitle-dot" aria-hidden="true" />
          <span>The Nexora Pipeline</span>
        </div>
        <h2 className="radar-section-title">
          From Competitor Website Change
          <br />
          To Sales Victory In Minutes.
        </h2>
        <p className="radar-section-desc">
          Static battlecards become obsolete the moment a competitor pushes an update.
          Nexora continuously monitors public websites, isolates genuine commercial shifts,
          quantifies deal revenue exposure, and gives sales reps the exact counter-pitch before their next call.
        </p>
      </div>

      {/* Interactive Pipeline Card */}
      <div className="radar-pipeline-card">
        {/* Dynamic Estimated Revenue Risk Indicator Header Bar */}
        <EstimatedRevenueRiskBar
          scenarioId={selectedScenarioId}
          customObjection={customResponse ? customObjection : null}
        />

        {/* Navigation Tabs */}
        <div className="radar-pipeline-nav" role="tablist" aria-label="Pipeline Steps">
          <button
            className={`radar-pipeline-step-btn ${activeStep === 1 ? 'active' : ''}`}
            onClick={() => setActiveStep(1)}
            role="tab"
            aria-selected={activeStep === 1}
            type="button"
          >
            <span className="radar-pipeline-step-num">1</span>
            <span>Bright Data Extraction</span>
          </button>

          <button
            className={`radar-pipeline-step-btn ${activeStep === 2 ? 'active' : ''}`}
            onClick={() => setActiveStep(2)}
            role="tab"
            aria-selected={activeStep === 2}
            type="button"
          >
            <span className="radar-pipeline-step-num">2</span>
            <span>Deterministic Diff Engine</span>
          </button>

          <button
            className={`radar-pipeline-step-btn ${activeStep === 3 ? 'active' : ''}`}
            onClick={() => setActiveStep(3)}
            role="tab"
            aria-selected={activeStep === 3}
            type="button"
          >
            <span className="radar-pipeline-step-num">3</span>
            <span>NEXORA Strategic &amp; Risk Analysis</span>
          </button>

          <button
            className={`radar-pipeline-step-btn ${activeStep === 4 ? 'active' : ''}`}
            onClick={() => setActiveStep(4)}
            role="tab"
            aria-selected={activeStep === 4}
            type="button"
          >
            <span className="radar-pipeline-step-num">4</span>
            <span>Counter-Pitch Simulator</span>
          </button>
        </div>

        {/* Pipeline Body */}
        <div className="radar-pipeline-body">
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={20} color="var(--radar-blue-accent)" />
                <h3 style={{ fontSize: '18px', fontWeight: 500 }}>
                  Step 1: Automated Web Surveillance via Bright Data
                </h3>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--radar-gray-600)', lineHeight: '1.6', maxWidth: '780px' }}>
                Nexora executes scheduled headless scrapes across competitor pricing, product feature matrices,
                changelogs, and positioning pages. Noise from cookie banners, transient tracking pixels,
                and layout shifts is purged during HTML canonicalization.
              </p>

              <div
                style={{
                  background: 'var(--radar-gray-50)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ color: 'var(--radar-gray-500)', marginBottom: '8px' }}>
                  // Bright Data Scraping Gateway Payload
                </div>
                <div>
                  <span style={{ color: 'var(--radar-blue-accent)' }}>TARGET_URL:</span>{' '}
                  &quot;{currentScenario.url}&quot;
                </div>
                <div>
                  <span style={{ color: 'var(--radar-blue-accent)' }}>CAPTURE_ENGINE:</span>{' '}
                  &quot;Bright Data Headless Browser (Residential Proxy Pool)&quot;
                </div>
                <div>
                  <span style={{ color: 'var(--radar-blue-accent)' }}>CANONICAL_HASH:</span>{' '}
                  &quot;sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069&quot;
                </div>
                <div>
                  <span style={{ color: 'var(--radar-green-pulse)' }}>STATUS:</span>{' '}
                  &quot;200 OK — Clean DOM Normalized (2,418 tokens saved)&quot;
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GitCompare size={20} color="#d97706" />
                <h3 style={{ fontSize: '18px', fontWeight: 500 }}>
                  Step 2: Deterministic Diff Engine (Zero LLM Hallucination)
                </h3>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--radar-gray-600)', lineHeight: '1.6', maxWidth: '780px' }}>
                Before calling any AI models, Nexora runs an AST-aware deterministic diff.
                It flags actual commercial shifts: price alterations, deleted features, packaging tweaks,
                and modified disclaimer footnotes.
              </p>

              {/* Diff Viewer */}
              <div className="radar-diff-box">
                <div className="radar-diff-header">
                  <span className="radar-diff-tag">Observed Commercial Diff</span>
                  <span className="radar-diff-meta">Target: {currentScenario.competitor}</span>
                </div>
                <div className="radar-diff-line removed">
                  - {currentScenario.observedChange.previous}
                </div>
                <div className="radar-diff-line added">
                  + {currentScenario.observedChange.current}
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--radar-gray-600)' }}>
                  <strong>Summary of detected shift:</strong> {currentScenario.observedChange.diffSummary}
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BrainCircuit size={20} color="#7c3aed" />
                <h3 style={{ fontSize: '18px', fontWeight: 500 }}>
                  Step 3: NEXORA Strategic Implications &amp; Revenue Risk Scoring
                </h3>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--radar-gray-600)', lineHeight: '1.6', maxWidth: '780px' }}>
                NEXORA (Know what changed. Know what matters. Know what to say.) receives the isolated deterministic diff alongside your product positioning.
                It produces structured, schema-validated intelligence explaining the true business motive,
                threat classification, and calculates the exact pipeline revenue exposure.
              </p>

              {/* Strategic Analysis Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Strategic Motive Card */}
                <div
                  style={{
                    background: 'var(--radar-gray-50)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Commercial Intent &amp; Positioning</span>
                    <span className="radar-threat-badge">
                      <ShieldAlert size={14} /> Threat Level: {currentScenario.threatLevel}
                    </span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '4px' }}>
                      Why It Matters in Active Cycles:
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--radar-gray-600)', lineHeight: '1.5' }}>
                      {selectedScenarioId === 'pricing-drop'
                        ? 'CloudScale is executing an unbundling strategy to capture mid-market deals by lowering their headline cost, while clawing back margin via enterprise add-ons. Sales reps will encounter prospects saying CloudScale is "30% cheaper".'
                        : selectedScenarioId === 'feature-launch'
                        ? 'MetricPulse is positioning a self-serve SOC-2 badge to neutralize compliance objections in SMB and Mid-Market deals, but caps exports to quarterly PDFs to force upgrades.'
                        : 'NexusData is using "Unlimited API" marketing headlines to attract data-heavy prospects, but instituting strict 25 req/sec throttles in the updated terms of service.'}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '4px' }}>
                      Recommended Sales Counter-Strategy:
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--radar-gray-600)', lineHeight: '1.5' }}>
                      {selectedScenarioId === 'pricing-drop'
                        ? 'Do not engage in price-matching. Frame CloudScale\'s new pricing as an unexpected cost risk where mission-critical SLAs cost an extra $149/mo, proving our all-inclusive enterprise tier is more economical.'
                        : selectedScenarioId === 'feature-launch'
                        ? 'Educate prospective CISOs on continuous live auditor integrations versus quarterly static PDFs to preserve enterprise contract value.'
                        : 'Challenge engineering leads on peak batch concurrency thresholds (500 req/sec vs their 25 req/sec ceiling).'}
                    </p>
                  </div>
                </div>

                {/* Quantitative Pipeline Revenue Risk Model Card */}
                <div
                  className={`radar-risk-step-card ${currentRisk.severity.toLowerCase()}`}
                  style={{
                    padding: '24px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={18} color="#b91c1c" />
                        <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Estimated Revenue Risk Modeling
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(0,0,0,0.06)',
                        }}
                      >
                        {currentRisk.severity} EXPOSURE
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '12px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--radar-gray-500)', display: 'block' }}>
                          Revenue At Risk
                        </span>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
                          {formatCurrency(currentRisk.revenueAtRisk)}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--radar-gray-600)' }}>
                          -{currentRisk.winRateDropPercent}% close rate drag
                        </span>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '12px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--radar-gray-500)', display: 'block' }}>
                          Protected with Nexora
                        </span>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                          +{formatCurrency(currentRisk.protectedRevenue)}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--radar-gray-600)' }}>
                          {Math.round(currentRisk.insight.nexoraRecoveryRate * 100)}% quota defense
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--radar-gray-700)' }}>
                      <strong>Active Pipeline Exposure:</strong> {formatCurrency(currentRisk.exposedPipeline)} across{' '}
                      {currentRisk.dealsExposed} deals evaluating {currentScenario.competitor}. Sales cycles stall an average of{' '}
                      <strong>+{currentRisk.insight.salesCycleDelayDays} days</strong> without deterministic counter-evidence.
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600 }}>Next: Equip Sales Reps in Step 4</span>
                    <button
                      onClick={() => setActiveStep(4)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--radar-black)',
                        color: 'var(--radar-white)',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      type="button"
                    >
                      <span>Simulate Pitch</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="var(--radar-black)" />
                <h3 style={{ fontSize: '18px', fontWeight: 500 }}>
                  Step 4: Live Counter-Pitch Simulator &amp; Quota Protection
                </h3>
              </div>

              {/* Scenario Selector with Dynamic Risk Badges */}
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--radar-gray-500)',
                    marginBottom: '10px',
                  }}
                >
                  Select Competitor Objection Scenario:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PRESET_OBJECTIONS.map((scenario) => {
                    const scenarioProfile = SCENARIO_RISK_PROFILES[scenario.id];
                    const estRiskAmount = scenarioProfile
                      ? Math.round(750000 * scenarioProfile.exposureRate * scenarioProfile.winRateErosion)
                      : 0;

                    return (
                      <button
                        key={scenario.id}
                        onClick={() => {
                          setSelectedScenarioId(scenario.id);
                          setCustomResponse(null);
                        }}
                        className="radar-hero-tag-pill"
                        style={{
                          borderColor:
                            selectedScenarioId === scenario.id ? 'var(--radar-black)' : 'rgba(0,0,0,0.12)',
                          backgroundColor:
                            selectedScenarioId === scenario.id ? 'var(--radar-black)' : 'var(--radar-white)',
                          color:
                            selectedScenarioId === scenario.id ? 'var(--radar-white)' : 'var(--radar-black)',
                        }}
                        type="button"
                      >
                        <span>{scenario.competitor}:</span>
                        <strong>&quot;{scenario.objection}&quot;</strong>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            backgroundColor:
                              selectedScenarioId === scenario.id
                                ? 'rgba(255,255,255,0.2)'
                                : scenario.threatLevel === 'HIGH'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              selectedScenarioId === scenario.id
                                ? 'var(--radar-white)'
                                : scenario.threatLevel === 'HIGH'
                                ? '#991b1b'
                                : '#92400e',
                          }}
                        >
                          {formatCurrency(estRiskAmount)} Risk
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Grid */}
              <div className="radar-simulator-grid">
                {/* Left: What Nexora Observed (Evidence) */}
                <div className="radar-diff-box">
                  <div className="radar-diff-header">
                    <div>
                      <span className="radar-diff-tag">Observed Fact (Evidence)</span>
                      <div style={{ fontSize: '12px', color: 'var(--radar-gray-500)', marginTop: '2px' }}>
                        Source: {currentScenario.url}
                      </div>
                    </div>
                    <span className="radar-diff-meta">{currentScenario.observedChange.capturedAt}</span>
                  </div>

                  <div style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--radar-gray-800)' }}>
                    <strong>Detected Change:</strong> {currentScenario.observedChange.diffSummary}
                  </div>

                  <div className="radar-diff-line removed" style={{ fontSize: '12px' }}>
                    Prev: {currentScenario.observedChange.previous}
                  </div>
                  <div className="radar-diff-line added" style={{ fontSize: '12px' }}>
                    Curr: {currentScenario.observedChange.current}
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                    <CheckCircle2 size={13} color="var(--radar-green-pulse)" />
                    <span>Cryptographic proof anchored in workspace snapshot history</span>
                  </div>
                </div>

                {/* Right: What To Say Next (Sales Counter-Pitch) */}
                <div className="radar-counterpitch-box">
                  <div className="radar-counterpitch-eyebrow">
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--radar-gray-400)' }}>
                      What To Say Next
                    </span>
                    <span className="radar-threat-badge">
                      <ShieldAlert size={12} /> {currentScenario.threatLevel} PRIORITY
                    </span>
                  </div>

                  {/* Dynamic Revenue Preserved Callout */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46' }}>
                      <ShieldCheck size={15} color="#059669" />
                      <span>
                        <strong>Defending {formatCurrency(currentRisk.revenueAtRisk)} ARR:</strong> Reclaims{' '}
                        {Math.round(currentRisk.insight.nexoraRecoveryRate * 100)}% of threatened pipeline deals.
                      </span>
                    </div>
                  </div>

                  <div className="radar-counterpitch-say">
                    {currentScenario.counterPitch.immediateResponse}
                  </div>

                  {/* Supporting Talking Points */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', display: 'block', marginBottom: '6px' }}>
                      Key Talking Points:
                    </span>
                    <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--radar-gray-600)', lineHeight: '1.5' }}>
                      {currentScenario.counterPitch.talkingPoints.map((pt, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Tactical Follow-up Question */}
                  <div style={{ background: 'var(--radar-blue-soft)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid var(--radar-blue-accent)', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--radar-blue-accent)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                      Tactical Discovery Question
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--radar-black)' }}>
                      {currentScenario.counterPitch.followUpQuestion}
                    </p>
                  </div>

                  {/* Claims to Avoid */}
                  <div style={{ background: '#fff1f2', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <AlertTriangle size={14} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '12px', color: '#9f1239' }}>
                      <strong>Strictly Avoid:</strong> {currentScenario.counterPitch.claimsToAvoid[0]}
                    </div>
                  </div>

                  {/* Source Evidence */}
                  <div className="radar-evidence-row">
                    <ExternalLink size={13} />
                    <span>{currentScenario.counterPitch.evidenceNote}</span>
                  </div>
                </div>
              </div>

              {/* Custom Objection Form */}
              <div
                style={{
                  marginTop: '16px',
                  background: 'var(--radar-gray-50)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  Test Any Competitor Objection In Real-Time:
                </span>
                <form
                  onSubmit={handleSimulateCustom}
                  style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    value={customObjection}
                    onChange={(e) => setCustomObjection(e.target.value)}
                    placeholder="e.g., They are giving us free data migration and a 6-month trial..."
                    style={{
                      flex: '1',
                      minWidth: '240px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <button
                    className="radar-btn-primary"
                    type="submit"
                    disabled={isSimulating || !customObjection.trim()}
                  >
                    <Send size={13} />
                    <span>{isSimulating ? 'Analyzing & Modeling Risk...' : 'Generate Counter-Pitch'}</span>
                  </button>
                </form>

                {customResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'var(--radar-white)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {/* Dynamic Revenue Risk Tag for Custom Objection */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '10px',
                        marginBottom: '10px',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--radar-gray-500)' }}>
                        Nexora Tactical Response
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: '#fef2f2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                        }}
                      >
                        Dynamic Impact: {formatCurrency(calculateRevenueRisk(selectedScenarioId, customObjection).revenueAtRisk)} At Risk
                      </span>
                    </div>

                    <p style={{ margin: 0, color: 'var(--radar-black)' }}>{customResponse}</p>

                    <div
                      style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: '#f0fdf4',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ShieldCheck size={14} color="#059669" />
                      <span>
                        Estimated Defense: Armed reps protect ~86% of pipeline deals from this objection.
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
