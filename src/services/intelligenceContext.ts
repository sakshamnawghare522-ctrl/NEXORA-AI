export interface CompetitorIntelRecord {
  competitor: string;
  domain: string;
  lastScannedAt: string;
  sourceUrl: string;
  category: string;
  threatLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  observedChanges: Array<{
    targetSection: string;
    previousState: string;
    currentState: string;
    diffSummary: string;
    capturedAt: string;
    hash: string;
  }>;
  battlecard: {
    strategicMotive: string;
    immediateCounterPitch: string;
    keyTalkingPoints: string[];
    killerFollowUpQuestion: string;
    claimsToAvoid: string[];
    evidenceNote: string;
  };
}

export const VERIFIED_COMPETITOR_DATABASE: CompetitorIntelRecord[] = [
  {
    competitor: 'CloudScale Inc.',
    domain: 'cloudscale.example.com',
    sourceUrl: 'https://cloudscale.example.com/pricing',
    lastScannedAt: '2026-09-26 14:22:08 UTC',
    category: 'Cloud Infrastructure & Managed Database Platforms',
    threatLevel: 'HIGH',
    observedChanges: [
      {
        targetSection: 'Pro Tier Pricing Card',
        previousState: '$99/seat/month (Annual commitment, includes dedicated SLA & backup)',
        currentState: '$69/seat/month (Base tier, dedicated SLA and multi-region backups moved to $149 Add-on)',
        diffSummary: 'Headline price dropped 30% ($99 -> $69), but core enterprise features unbundled into paid add-ons.',
        capturedAt: '2026-09-26 14:22:08 UTC',
        hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      },
    ],
    battlecard: {
      strategicMotive: 'CloudScale is executing a margin-unbundling strategy to capture mid-market deals by lowering headline sticker cost while recouping margins via mandatory enterprise add-ons.',
      immediateCounterPitch: 'I understand budget is top of mind. Just so you are aware, CloudScale dropped their baseline sticker price yesterday from $99 to $69 by stripping out dedicated SLA support and multi-region backups, which are now an extra $149 add-on. With our all-inclusive enterprise model, your total cost of ownership actually remains 22% lower without unexpected line items.',
      keyTalkingPoints: [
        'Acknowledge the headline price change directly so the buyer knows you have real-time visibility.',
        'Highlight hidden costs: CloudScale now charges extra for SLA response guarantees.',
        'Reinforce predictability: Our flat transparent tier includes enterprise backup, SOC-2 compliance, and 99.99% SLA.',
      ],
      killerFollowUpQuestion: 'Are mission-critical uptime SLAs and multi-region backups required for your production workload?',
      claimsToAvoid: [
        'Do NOT claim CloudScale has bad software or unreliable performance.',
        'Do NOT offer an immediate discount before clarifying the unbundled add-on reality.',
      ],
      evidenceNote: 'Captured via Bright Data DOM Snapshot. Deterministic diff verified price table row update from commit #e4f91.',
    },
  },
  {
    competitor: 'MetricPulse',
    domain: 'metricpulse.example.com',
    sourceUrl: 'https://metricpulse.example.com/features',
    lastScannedAt: '2026-09-25 09:15:30 UTC',
    category: 'Product Observability & Compliance Monitoring',
    threatLevel: 'MEDIUM',
    observedChanges: [
      {
        targetSection: 'Security & Compliance Matrix',
        previousState: 'SOC-2 Type II: "Available on Custom Enterprise Tier only"',
        currentState: 'SOC-2 Type II: "Self-serve automated audit export included in Pro ($49/mo)"',
        diffSummary: 'Automated compliance badge added to self-serve tier. Fine print limits audit exports to 1 per quarter.',
        capturedAt: '2026-09-25 09:15:30 UTC',
        hash: 'sha256:3a91b4129fe0281b37bda014f77a834190bcfc239d1b6e41b9d107a21356e391',
      },
    ],
    battlecard: {
      strategicMotive: 'Pre-empting enterprise buyers by advertising SOC-2 automation at a low entry price, but throttling export velocity to prevent true continuous audit integration.',
      immediateCounterPitch: 'MetricPulse did introduce an automated export this week, but their terms limit reports to 1 per quarter and exclude real-time continuous auditor access. In contrast, our platform provides live continuous evidence streams that your external auditor can access directly 365 days a year.',
      keyTalkingPoints: [
        'Validate the customer inquiry gracefully.',
        'Clarify the limitation: MetricPulse offers quarterly static exports, not continuous real-time auditor integration.',
        'Position our solution as the enterprise gold standard for audit readiness.',
      ],
      killerFollowUpQuestion: 'Does your compliance team require continuous auditor portal access or only periodic static PDF exports?',
      claimsToAvoid: [
        'Do not accuse MetricPulse of false advertising.',
        'Do not dismiss compliance as an unimportant buyer priority.',
      ],
      evidenceNote: 'Observed in MetricPulse Pricing Footnote #4 and feature comparison matrix change.',
    },
  },
  {
    competitor: 'NexusData',
    domain: 'nexusdata.example.com',
    sourceUrl: 'https://nexusdata.example.com/platform',
    lastScannedAt: '2026-09-24 18:04:12 UTC',
    category: 'Data Integration & API Ingestion',
    threatLevel: 'LOW',
    observedChanges: [
      {
        targetSection: 'Developer Throughput Specs',
        previousState: 'API Rate Limit: 10,000 requests/day',
        currentState: 'API Rate Limit: "Unlimited requests* (*Subject to Fair Use throttling at 25 req/sec)"',
        diffSummary: 'Marketing copy updated to "Unlimited API", but fair use policy introduces aggressive throttling at 25 req/sec.',
        capturedAt: '2026-09-24 18:04:12 UTC',
        hash: 'sha256:190efb41c098718a22de4f77c8e90a2139b817cd1e5a2b0019284fa9817e0812',
      },
    ],
    battlecard: {
      strategicMotive: 'Masking API constraints behind an "Unlimited" marketing veil while instituting strict concurrency rate limits to keep infrastructure costs down.',
      immediateCounterPitch: 'While their marketing page now headlines \'unlimited API\', their updated fair-use clause throttles throughput at 25 requests per second. If your sync batch exceeds 1,500 operations a minute, your pipeline will queue. We guarantee sustained 500 req/sec bursts with zero throttling.',
      keyTalkingPoints: [
        'Distinguish between marketing claims and technical throughput limits.',
        'Reference their documented 25 req/sec threshold.',
        'Highlight our low-latency burst capabilities for peak hours.',
      ],
      killerFollowUpQuestion: 'What is your peak concurrency requirement during high-traffic batch ingestion?',
      claimsToAvoid: [
        'Avoid overly technical jargon if speaking to non-technical business buyers.',
      ],
      evidenceNote: 'Extracted from NexusData Developer Docs API Terms Section 7.2 updated 48h ago.',
    },
  },
];

/**
 * Searches and retrieves context for user queries.
 * Returns grounded facts and an explicit notification if evidence is not tracked yet.
 */
export function retrieveIntelligenceContext(query: string): {
  foundEvidence: boolean;
  contextText: string;
  matchedCompetitors: string[];
} {
  const normalized = query.toLowerCase();
  const matched = VERIFIED_COMPETITOR_DATABASE.filter((c) => {
    return (
      normalized.includes(c.competitor.toLowerCase()) ||
      normalized.includes(c.domain.toLowerCase()) ||
      c.observedChanges.some(
        (ch) =>
          normalized.includes(ch.targetSection.toLowerCase()) ||
          normalized.includes('pricing') ||
          normalized.includes('sla') ||
          normalized.includes('soc-2') ||
          normalized.includes('api') ||
          normalized.includes('cheap') ||
          normalized.includes('battlecard')
      )
    );
  });

  if (matched.length === 0) {
    return {
      foundEvidence: false,
      contextText: `[NEXORA CONTEXT: No verified competitor evidence was specifically found matching the query in the currently monitored surveillance snapshot index. Instruct the user that Nexora Surveillance has not captured verified evidence for this entity yet, and offer to analyze any competitor claims, objections, or URLs they provide. Do NOT hallucinate unverified website diffs.]`,
      matchedCompetitors: [],
    };
  }

  const sections = matched.map((c) => {
    const changes = c.observedChanges
      .map(
        (ch) =>
          `  - Observed Diff on ${ch.targetSection} (${ch.capturedAt}):\n    Before: "${ch.previousState}"\n    Current: "${ch.currentState}"\n    Summary: ${ch.diffSummary}\n    DOM Hash: ${ch.hash}`
      )
      .join('\n');

    return `Competitor: ${c.competitor} (${c.domain})
Category: ${c.category} | Threat Level: ${c.threatLevel} | Last Scan: ${c.lastScannedAt}
Source URL: ${c.sourceUrl}
Documented Changes:
${changes}
Battlecard Guidance:
  Strategic Motive: ${c.battlecard.strategicMotive}
  Recommended Counter-Pitch: "${c.battlecard.immediateCounterPitch}"
  Key Talking Points:
${c.battlecard.keyTalkingPoints.map((tp) => `    * ${tp}`).join('\n')}
  Killer Follow-up Question: "${c.battlecard.killerFollowUpQuestion}"
  Claims To Avoid:
${c.battlecard.claimsToAvoid.map((ca) => `    * ${ca}`).join('\n')}
  Evidence Note: ${c.battlecard.evidenceNote}`;
  });

  return {
    foundEvidence: true,
    contextText: `[NEXORA VERIFIED INTELLIGENCE SNAPSHOTS]:\n\n${sections.join('\n\n---\n\n')}`,
    matchedCompetitors: matched.map((c) => c.competitor),
  };
}
