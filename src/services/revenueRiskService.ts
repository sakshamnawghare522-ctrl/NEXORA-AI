export type RiskSeverity = 'CRITICAL' | 'ELEVATED' | 'MODERATE';

export interface CompetitiveRiskInsight {
  competitor: string;
  threatLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  headlineShift: string;
  primaryTrigger: string;
  exposureRate: number; // Percentage of total active pipeline deals assessing this competitor
  winRateErosion: number; // Expected drop in close rate if reps cannot counter the shift
  salesCycleDelayDays: number; // Days deals stall due to buyer confusion or pricing hesitation
  nexoraRecoveryRate: number; // Share of at-risk revenue reclaimed with real-time counter-pitch
  affectedDealStage: string;
  riskDrivers: Array<{
    factor: string;
    detail: string;
    impact: string;
  }>;
  stageBreakdown: Array<{
    stageName: string;
    dealsCount: number;
    value: number;
    riskStatus: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  executiveAction: string;
}

export interface RevenueRiskCalculation {
  totalPipeline: number;
  dealsCount: number;
  exposedPipeline: number;
  dealsExposed: number;
  revenueAtRisk: number;
  protectedRevenue: number;
  residualRisk: number;
  winRateDropPercent: number;
  cycleDelayDays: number;
  severity: RiskSeverity;
  repMode: 'unprepared' | 'armed';
  insight: CompetitiveRiskInsight;
}

export const SCENARIO_RISK_PROFILES: Record<string, CompetitiveRiskInsight> = {
  'pricing-drop': {
    competitor: 'CloudScale Inc.',
    threatLevel: 'HIGH',
    category: 'Cloud Infrastructure & Managed Platforms',
    headlineShift: 'Unbundled 30% Sticker Price Drop ($99 -> $69) with $149 Hidden SLA Add-ons',
    primaryTrigger: '"They are 30% cheaper"',
    exposureRate: 0.38,
    winRateErosion: 0.32,
    salesCycleDelayDays: 19,
    nexoraRecoveryRate: 0.88,
    affectedDealStage: 'Stage 4: Solution Validation & Commercial Negotiation',
    riskDrivers: [
      {
        factor: 'Sticker Price Anchoring',
        detail: 'Prospects fixate on $69 baseline headline before evaluating enterprise SLA tiers.',
        impact: '-18% win-rate drop in initial quote stage',
      },
      {
        factor: 'Procurement Pushback',
        detail: 'CFOs request competitive discount matching without seeing the unbundled add-on reality.',
        impact: '-14% margin squeeze or lost deals',
      },
      {
        factor: 'Evaluation Stalls',
        detail: 'Sales reps forced into emergency discounting spreadsheet comparisons.',
        impact: '+19 days cycle slip',
      },
    ],
    stageBreakdown: [
      { stageName: 'Stage 3: Technical Validation', dealsCount: 2, value: 85000, riskStatus: 'MEDIUM' },
      { stageName: 'Stage 4: Proposal & Pricing', dealsCount: 2, value: 125000, riskStatus: 'HIGH' },
      { stageName: 'Stage 5: Procurement & Legal', dealsCount: 1, value: 75000, riskStatus: 'HIGH' },
    ],
    executiveAction:
      'Mandate reps lead with the $149 SLA unbundling counter-pitch before prospects send competitive quotes to procurement.',
  },
  'feature-launch': {
    competitor: 'MetricPulse',
    threatLevel: 'MEDIUM',
    category: 'Product Observability & Compliance Monitoring',
    headlineShift: 'Free "Automated SOC-2 Export" in $49 Tier (Limited to 1 Quarterly Static PDF)',
    primaryTrigger: '"They launched automated SOC-2 compliance for free"',
    exposureRate: 0.26,
    winRateErosion: 0.22,
    salesCycleDelayDays: 12,
    nexoraRecoveryRate: 0.85,
    affectedDealStage: 'Stage 3: Technical Discovery & Security Review',
    riskDrivers: [
      {
        factor: 'Compliance Checkbox Trap',
        detail: 'Non-security buyers assume MetricPulse $49 tier satisfies enterprise continuous audit.',
        impact: '-12% win-rate without auditor clarification',
      },
      {
        factor: 'Audit Readiness Friction',
        detail: 'Prospect security officers delay pipeline while verifying static vs continuous exports.',
        impact: '+12 days review cycle',
      },
      {
        factor: 'Value Proposition Discounting',
        detail: 'Pressure on our premium security & continuous live portal pricing tier.',
        impact: '-10% average deal size pressure',
      },
    ],
    stageBreakdown: [
      { stageName: 'Stage 2: Solution Scoping', dealsCount: 1, value: 45000, riskStatus: 'LOW' },
      { stageName: 'Stage 3: Security & InfoSec Review', dealsCount: 2, value: 95000, riskStatus: 'HIGH' },
      { stageName: 'Stage 4: Executive Sign-off', dealsCount: 1, value: 55000, riskStatus: 'MEDIUM' },
    ],
    executiveAction:
      'Equip Account Executives with the "Continuous Auditor Portal vs Quarterly PDF" comparison matrix immediately.',
  },
  'api-limits': {
    competitor: 'NexusData',
    threatLevel: 'LOW',
    category: 'Data Integration & High-Throughput Ingestion',
    headlineShift: '"Unlimited API" Marketing Headline Coupled with 25 req/sec Fair Use Throttling',
    primaryTrigger: '"Their new tier includes unlimited API requests"',
    exposureRate: 0.16,
    winRateErosion: 0.12,
    salesCycleDelayDays: 6,
    nexoraRecoveryRate: 0.90,
    affectedDealStage: 'Stage 3: Architecture & Proof of Concept (POC)',
    riskDrivers: [
      {
        factor: 'Marketing Claim Confusion',
        detail: 'Engineering managers believe NexusData supports unlimited continuous streaming.',
        impact: '-7% win rate in initial POC sizing',
      },
      {
        factor: 'POC Verification Delay',
        detail: 'Technical teams spend extra testing cycles benchmarking throttle limits.',
        impact: '+6 days technical validation',
      },
      {
        factor: 'Competitive Parity Drift',
        detail: 'Perception that competitor has caught up to high-volume enterprise ingestion.',
        impact: '-5% competitive pricing power',
      },
    ],
    stageBreakdown: [
      { stageName: 'Stage 3: Architecture Proof of Concept', dealsCount: 2, value: 78000, riskStatus: 'MEDIUM' },
      { stageName: 'Stage 4: Commercial Terms', dealsCount: 1, value: 42000, riskStatus: 'LOW' },
    ],
    executiveAction:
      'Train Sales Engineers to ask the 500 req/sec peak concurrency discovery question during initial tech deep-dives.',
  },
};

/**
 * Dynamically infers a risk insight profile for custom user-submitted objections.
 */
export function getCustomObjectionRiskInsight(customObjection: string): CompetitiveRiskInsight {
  const normalized = customObjection.toLowerCase();

  let threatLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let exposureRate = 0.28;
  let winRateErosion = 0.24;
  let salesCycleDelayDays = 14;
  let headlineShift = `Prospect Objection: "${customObjection.slice(0, 70)}${customObjection.length > 70 ? '...' : ''}"`;
  let affectedDealStage = 'Stage 4: Commercial & Feature Evaluation';

  if (
    normalized.includes('price') ||
    normalized.includes('cheap') ||
    normalized.includes('discount') ||
    normalized.includes('cost') ||
    normalized.includes('free') ||
    normalized.includes('tier') ||
    normalized.includes('half') ||
    normalized.includes('dollar') ||
    normalized.includes('$')
  ) {
    threatLevel = 'HIGH';
    exposureRate = 0.42;
    winRateErosion = 0.35;
    salesCycleDelayDays = 21;
    affectedDealStage = 'Stage 4 & 5: Commercial Negotiation & Pricing Sign-off';
  } else if (
    normalized.includes('compliance') ||
    normalized.includes('soc') ||
    normalized.includes('security') ||
    normalized.includes('audit') ||
    normalized.includes('hipaa') ||
    normalized.includes('iso') ||
    normalized.includes('gdpr')
  ) {
    threatLevel = 'HIGH';
    exposureRate = 0.30;
    winRateErosion = 0.25;
    salesCycleDelayDays = 16;
    affectedDealStage = 'Stage 3: InfoSec & Compliance Review';
  } else if (
    normalized.includes('api') ||
    normalized.includes('integration') ||
    normalized.includes('limit') ||
    normalized.includes('speed') ||
    normalized.includes('latency') ||
    normalized.includes('scale')
  ) {
    threatLevel = 'MEDIUM';
    exposureRate = 0.20;
    winRateErosion = 0.16;
    salesCycleDelayDays = 8;
    affectedDealStage = 'Stage 3: Architecture Proof of Concept (POC)';
  } else if (
    normalized.includes('migration') ||
    normalized.includes('trial') ||
    normalized.includes('onboard') ||
    normalized.includes('switch')
  ) {
    threatLevel = 'MEDIUM';
    exposureRate = 0.32;
    winRateErosion = 0.22;
    salesCycleDelayDays = 11;
    affectedDealStage = 'Stage 2 & 3: Solution Evaluation & Onboarding Feasibility';
  }

  return {
    competitor: 'Custom Competitor Scenario',
    threatLevel,
    category: 'Ad-hoc Market Shift',
    headlineShift,
    primaryTrigger: `"${customObjection}"`,
    exposureRate,
    winRateErosion,
    salesCycleDelayDays,
    nexoraRecoveryRate: 0.86,
    affectedDealStage,
    riskDrivers: [
      {
        factor: 'Unaddressed Buyer Comparison',
        detail: `Prospect is anchoring against competitor's advertised capability: "${customObjection.slice(0, 60)}"`,
        impact: `-${Math.round(winRateErosion * 60)}% win-rate drop if rep hesitates`,
      },
      {
        factor: 'Cycle Velocity Friction',
        detail: 'Unverified competitor claims introduce hesitation during closing conversations.',
        impact: `+${salesCycleDelayDays} days extended sales cycle`,
      },
      {
        factor: 'Margin Erosion Danger',
        detail: 'Risk of unwarranted defensive discounting without verified counter-evidence.',
        impact: `-${Math.round(winRateErosion * 40)}% deal value erosion`,
      },
    ],
    stageBreakdown: [
      { stageName: 'Stage 3: Solution Evaluation', dealsCount: 2, value: 72000, riskStatus: threatLevel },
      { stageName: 'Stage 4: Proposal Negotiation', dealsCount: 2, value: 110000, riskStatus: threatLevel },
    ],
    executiveAction:
      'Provide reps with structured proof points addressing total cost of ownership and technical SLAs before next scheduled prospect call.',
  };
}

/**
 * Dynamically calculates estimated revenue risk and mitigated impact.
 */
export function calculateRevenueRisk(
  scenarioId: string,
  customObjection: string | null,
  totalPipeline: number = 750000,
  dealsCount: number = 14,
  repMode: 'unprepared' | 'armed' = 'unprepared'
): RevenueRiskCalculation {
  const insight: CompetitiveRiskInsight =
    customObjection && customObjection.trim().length > 0
      ? getCustomObjectionRiskInsight(customObjection.trim())
      : SCENARIO_RISK_PROFILES[scenarioId] || SCENARIO_RISK_PROFILES['pricing-drop'];

  const exposedPipeline = Math.round(totalPipeline * insight.exposureRate);
  const dealsExposed = Math.max(1, Math.round(dealsCount * insight.exposureRate));

  // Gross revenue at risk (what would be lost if reps are unprepared)
  const revenueAtRisk = Math.round(exposedPipeline * insight.winRateErosion);

  // Protected revenue through Nexora counter-pitch
  const protectedRevenue = Math.round(revenueAtRisk * insight.nexoraRecoveryRate);

  // Residual risk if armed
  const residualRisk = Math.max(0, revenueAtRisk - protectedRevenue);

  // Severity classification
  let severity: RiskSeverity = 'MODERATE';
  if (revenueAtRisk >= 70000 || insight.threatLevel === 'HIGH') {
    severity = 'CRITICAL';
  } else if (revenueAtRisk >= 30000 || insight.threatLevel === 'MEDIUM') {
    severity = 'ELEVATED';
  }

  const cycleDelayDays = repMode === 'armed' ? 0 : insight.salesCycleDelayDays;
  const winRateDropPercent = Math.round(insight.winRateErosion * 100);

  return {
    totalPipeline,
    dealsCount,
    exposedPipeline,
    dealsExposed,
    revenueAtRisk,
    protectedRevenue,
    residualRisk,
    winRateDropPercent,
    cycleDelayDays,
    severity,
    repMode,
    insight,
  };
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
