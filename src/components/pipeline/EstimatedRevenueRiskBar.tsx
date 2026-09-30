import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingDown,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  PieChart,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  calculateRevenueRisk,
  formatCurrency,
  RevenueRiskCalculation,
} from '../../services/revenueRiskService.ts';

interface EstimatedRevenueRiskBarProps {
  scenarioId: string;
  customObjection?: string | null;
  onCustomObjectionChange?: (val: string) => void;
  className?: string;
}

export const EstimatedRevenueRiskBar: React.FC<EstimatedRevenueRiskBarProps> = ({
  scenarioId,
  customObjection = null,
  className = '',
}) => {
  const [pipelineTotal, setPipelineTotal] = useState<number>(750000);
  const [dealsCount, setDealsCount] = useState<number>(14);
  const [repMode, setRepMode] = useState<'unprepared' | 'armed'>('unprepared');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Dynamic calculation based on active scenario and competitive intelligence
  const riskData: RevenueRiskCalculation = calculateRevenueRisk(
    scenarioId,
    customObjection,
    pipelineTotal,
    dealsCount,
    repMode
  );

  const { insight } = riskData;

  const PIPELINE_PRESETS = [
    { label: '$250K', value: 250000, deals: 6 },
    { label: '$500K', value: 500000, deals: 10 },
    { label: '$750K', value: 750000, deals: 14 },
    { label: '$1.5M', value: 1500000, deals: 22 },
    { label: '$3.0M', value: 3000000, deals: 35 },
  ];

  return (
    <div className={`radar-revenue-risk-container ${className}`}>
      {/* Top Banner Indicator Bar */}
      <div className="radar-revenue-risk-bar">
        {/* Left: Active Threat & Severity Indicator */}
        <div className="radar-risk-header-left">
          <div className={`radar-risk-severity-badge ${riskData.severity.toLowerCase()}`}>
            <span className="radar-risk-pulse-dot" />
            <span>
              {riskData.severity === 'CRITICAL' && 'Critical Revenue Exposure'}
              {riskData.severity === 'ELEVATED' && 'Elevated Deal Risk'}
              {riskData.severity === 'MODERATE' && 'Moderate Shift Impact'}
            </span>
          </div>

          <div className="radar-risk-title-group">
            <span className="radar-risk-title-label">Active Threat Intelligence Target</span>
            <div className="radar-risk-title-target">
              <span>{insight.competitor}</span>
              <span style={{ color: 'var(--radar-gray-400)', fontWeight: 400 }}>·</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--radar-gray-600)',
                  maxWidth: '300px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {insight.primaryTrigger}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Dynamic Financial Exposure Stats */}
        <div className="radar-risk-metrics-row">
          {/* Main Risk / Protected Metric */}
          <div className="radar-risk-stat-item">
            <span className="radar-risk-stat-label">
              {repMode === 'unprepared' ? 'Estimated Revenue At Risk' : 'Protected Revenue with Nexora'}
            </span>
            <div
              className={`radar-risk-stat-val ${
                repMode === 'unprepared' ? 'risk-danger' : 'risk-success'
              }`}
            >
              {repMode === 'unprepared'
                ? formatCurrency(riskData.revenueAtRisk)
                : `+${formatCurrency(riskData.protectedRevenue)} ARR`}
            </div>
            <span className="radar-risk-stat-sub">
              {repMode === 'unprepared'
                ? `Across ${riskData.dealsExposed} exposed pipeline deals`
                : `${Math.round(insight.nexoraRecoveryRate * 100)}% deal defense recovery`}
            </span>
          </div>

          {/* Exposed Pipeline Base */}
          <div className="radar-risk-stat-item">
            <span className="radar-risk-stat-label">Exposed Pipeline</span>
            <div className="radar-risk-stat-val neutral">
              {formatCurrency(riskData.exposedPipeline)}
            </div>
            <span className="radar-risk-stat-sub">
              {Math.round(insight.exposureRate * 100)}% of {formatCurrency(pipelineTotal)} total
            </span>
          </div>

          {/* Win-Rate Impact */}
          <div className="radar-risk-stat-item">
            <span className="radar-risk-stat-label">Win-Rate Impact</span>
            <div
              className={`radar-risk-stat-val ${
                repMode === 'unprepared' ? 'risk-danger' : 'risk-success'
              }`}
            >
              {repMode === 'unprepared'
                ? `-${riskData.winRateDropPercent}% Drag`
                : 'Defended (94% win rate retention)'}
            </div>
            <span className="radar-risk-stat-sub">
              {repMode === 'unprepared'
                ? `+${insight.salesCycleDelayDays} days sales cycle slip`
                : 'Zero cycle stall'}
            </span>
          </div>
        </div>

        {/* Right: Rep Preparedness Mode & Tune Pipeline Trigger */}
        <div className="radar-risk-controls-right">
          {/* Mode Switcher */}
          <div className="radar-risk-mode-toggle" role="group" aria-label="Sales Rep Readiness Simulation">
            <button
              type="button"
              className={`radar-risk-mode-btn ${repMode === 'unprepared' ? 'active unprepared' : ''}`}
              onClick={() => setRepMode('unprepared')}
              title="Simulate sales rep entering call without verified competitor intelligence"
            >
              <AlertTriangle size={12} />
              <span>Unprepared Rep</span>
            </button>
            <button
              type="button"
              className={`radar-risk-mode-btn ${repMode === 'armed' ? 'active armed' : ''}`}
              onClick={() => setRepMode('armed')}
              title="Simulate sales rep armed with Nexora deterministic counter-pitch"
            >
              <ShieldCheck size={12} />
              <span>Armed with Nexora</span>
            </button>
          </div>

          {/* Modeling Drawer Toggle */}
          <button
            type="button"
            className={`radar-risk-tune-btn ${isDrawerOpen ? 'open' : ''}`}
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-expanded={isDrawerOpen}
          >
            <Sliders size={13} />
            <span>{isDrawerOpen ? 'Close Modeling' : 'Tune Pipeline'}</span>
            {isDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expandable Pipeline Modeling & Risk Breakdown Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="radar-risk-drawer"
          >
            <div className="radar-risk-drawer-grid">
              {/* Left Column: Interactive Tuning Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="radar-risk-slider-card">
                  <div className="radar-risk-slider-header">
                    <span className="radar-risk-slider-label">Quarterly Active Pipeline Volume</span>
                    <span className="radar-risk-slider-val">{formatCurrency(pipelineTotal)}</span>
                  </div>

                  <input
                    type="range"
                    min="150000"
                    max="3000000"
                    step="50000"
                    value={pipelineTotal}
                    onChange={(e) => setPipelineTotal(Number(e.target.value))}
                    className="radar-risk-range-input"
                    aria-label="Quarterly active pipeline volume"
                  />

                  {/* Preset chips */}
                  <div className="radar-risk-presets">
                    <span style={{ fontSize: '11px', color: 'var(--radar-gray-400)', marginRight: '4px' }}>
                      Presets:
                    </span>
                    {PIPELINE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className={`radar-risk-preset-chip ${
                          pipelineTotal === preset.value ? 'active' : ''
                        }`}
                        onClick={() => {
                          setPipelineTotal(preset.value);
                          setDealsCount(preset.deals);
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="radar-risk-slider-card">
                  <div className="radar-risk-slider-header">
                    <span className="radar-risk-slider-label">Active Late-Stage Deals in Flight</span>
                    <span className="radar-risk-slider-val">{dealsCount} deals</span>
                  </div>

                  <input
                    type="range"
                    min="4"
                    max="40"
                    step="1"
                    value={dealsCount}
                    onChange={(e) => setDealsCount(Number(e.target.value))}
                    className="radar-risk-range-input"
                    aria-label="Active deals in flight"
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                    <span>Estimated ACV: ~{formatCurrency(Math.round(pipelineTotal / dealsCount))}</span>
                    <span>Exposed to {insight.competitor}: ~{riskData.dealsExposed} deals</span>
                  </div>
                </div>

                {/* Risk Drivers Breakdown */}
                <div className="radar-risk-deal-stages-card">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)' }}>
                    Why This Competitor Shift Creates Revenue Friction:
                  </span>
                  <div className="radar-risk-drivers-list">
                    {insight.riskDrivers.map((driver, idx) => (
                      <div key={idx} className="radar-risk-driver-row">
                        <AlertTriangle size={13} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <strong>{driver.factor}:</strong> {driver.detail}{' '}
                          <span style={{ color: '#b91c1c', fontWeight: 600 }}>({driver.impact})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Stage Vulnerability & Executive Directive */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="radar-risk-deal-stages-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)' }}>
                      Pipeline Vulnerability By Sales Stage
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                      Primary: {insight.affectedDealStage}
                    </span>
                  </div>

                  <div className="radar-risk-stages-list">
                    {insight.stageBreakdown.map((stage, idx) => {
                      // Pro-rate values based on current pipelineTotal
                      const ratio = pipelineTotal / 750000;
                      const proratedVal = Math.round(stage.value * ratio);
                      return (
                        <div key={idx} className="radar-risk-stage-item">
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--radar-black)' }}>
                              {stage.stageName}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--radar-gray-500)' }}>
                              {Math.max(1, Math.round(stage.dealsCount * (dealsCount / 14)))} deals evaluating {insight.competitor}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(proratedVal)}
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color:
                                  stage.riskStatus === 'HIGH'
                                    ? '#b91c1c'
                                    : stage.riskStatus === 'MEDIUM'
                                    ? '#b45309'
                                    : '#059669',
                              }}
                            >
                              {stage.riskStatus} RISK
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Executive Sales Directive */}
                <div
                  style={{
                    background: 'var(--radar-white)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '14px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Sparkles size={16} color="var(--radar-black)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Recommended Sales Leadership Action
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--radar-gray-700)', margin: 0 }}>
                    {insight.executiveAction}
                  </p>

                  <div
                    style={{
                      marginTop: '14px',
                      padding: '10px 12px',
                      background: 'var(--radar-gray-50)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ color: 'var(--radar-gray-600)' }}>
                      Total Net Preserved ARR (Nexora Armed):
                    </span>
                    <strong style={{ color: '#059669', fontSize: '13px' }}>
                      +{formatCurrency(riskData.protectedRevenue)} Protected
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
