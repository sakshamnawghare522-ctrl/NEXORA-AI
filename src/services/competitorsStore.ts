import { VERIFIED_COMPETITOR_DATABASE, CompetitorIntelRecord } from './intelligenceContext.ts';

export interface BaselineSnapshot {
  contentHash: string;
  capturedAt: string;
  pageTitle?: string;
  summary: string;
  pricingInfo?: string;
  features?: string[];
  positioning?: string;
  targetAudience?: string;
  keywords?: string[];
  rawSnippet?: string;
  cleanTextSnippet?: string;
  extractedPrices?: string[];
}

export interface RadarAlert {
  id: string;
  competitorName: string;
  changeType: 'pricing' | 'feature' | 'positioning' | 'offer' | 'cta' | 'product';
  summary: string;
  before: string;
  after: string;
  impactLevel: 'IMPORTANT' | 'OPPORTUNITY' | 'MODERATE' | 'HIGH';
  threatOrOpportunity: 'opportunity' | 'threat';
  confidence: number;
  whyItMatters: string;
  recommendedAction: string;
  improvedSolution?: string;
  customerResponse: string;
  detectedAt: string;
}

export interface MonitoredCompetitor {
  id: string;
  name: string;
  website: string;
  status: 'Monitoring active' | 'Scanning' | 'Pending';
  lastScannedAt: string;
  nextCheckAt: string;
  keyShift: string;
  category: string;
  watchedSections: string[];
  changesCount: number;
  isCustom?: boolean;
  impactLevel?: 'IMPORTANT' | 'OPPORTUNITY' | 'MODERATE' | 'HIGH';
  lastChangeType?: string;
  lastChangeTime?: string;
  keywords?: string[];
  baselineSnapshot?: BaselineSnapshot;
  baseline?: BaselineSnapshot;
  recentAlert?: RadarAlert;
  lastChange?: {
    type: string;
    summary: string;
    detectedAt: string;
    impactLevel: string;
    before?: string;
    after?: string;
    whyItMatters?: string;
    recommendedAction?: string;
    customerResponse?: string;
  };
}

const STORAGE_KEY = 'nexora_monitored_competitors';

// Pre-seeded competitors from verified database + familiar local context
const INITIAL_COMPETITORS: MonitoredCompetitor[] = [
  ...VERIFIED_COMPETITOR_DATABASE.map((c, index) => ({
    id: `comp_${index + 1}`,
    name: c.competitor,
    website: c.domain.startsWith('http') ? c.domain : `https://${c.domain}`,
    status: 'Monitoring active' as const,
    lastScannedAt: 'Today, 2:30 PM',
    nextCheckAt: 'Tonight, 11:30 PM',
    keyShift: c.observedChanges[0]?.diffSummary || 'Pricing & tier change detected',
    category: c.category,
    watchedSections: ['Pricing', 'Products', 'Offers', 'Features'],
    changesCount: 3,
    impactLevel: (c.threatLevel === 'HIGH' ? 'IMPORTANT' : 'MODERATE') as 'IMPORTANT' | 'MODERATE',
    lastChangeType: 'Pricing',
    lastChangeTime: '2 hours ago',
    recentAlert: {
      id: `alert_${index + 1}`,
      competitorName: c.competitor,
      changeType: 'pricing' as const,
      summary: `${c.competitor} modified baseline pricing tables and SLA commitments.`,
      before: '$99/seat/month (Dedicated SLA & Multi-Region)',
      after: '$69/seat/month (Unbundled — SLA moved to $149 add-on pack)',
      impactLevel: 'IMPORTANT' as const,
      threatOrOpportunity: 'opportunity' as const,
      confidence: 0.94,
      whyItMatters: 'The competitor is attempting to win early RFP price evaluations by unbundling essential operational guarantees into post-sale add-ons.',
      recommendedAction: 'Highlight total cost of ownership (TCO) and include all-inclusive SLA guarantees in proposal slides.',
      customerResponse: `When prospects mention ${c.competitor} is 30% cheaper, clarify that their $69 tier excludes mission-critical uptime SLAs, which add $149/mo, making your all-inclusive rate 22% lower total.`,
      detectedAt: 'Today, 2:30 PM',
    },
  })),
  {
    id: 'comp_reliance_digital',
    name: 'Reliance Digital',
    website: 'https://reliancedigital.in',
    status: 'Monitoring active' as const,
    lastScannedAt: 'Today, 11:15 AM',
    nextCheckAt: 'Tomorrow, 9:00 AM',
    keyShift: 'Launched festive 10% instant bank discount on electronics & appliances',
    category: 'Consumer Electronics & Home Retail',
    watchedSections: ['Pricing', 'Offers', 'Discounts'],
    changesCount: 4,
    isCustom: true,
    impactLevel: 'OPPORTUNITY',
    lastChangeType: 'New offer',
    lastChangeTime: '4 hours ago',
    recentAlert: {
      id: 'alert_reliance',
      competitorName: 'Reliance Digital',
      changeType: 'offer' as const,
      summary: 'Promoted 10% instant discount on major credit cards up to ₹2,500.',
      before: 'Standard retail MRP with manufacturer cashback vouchers',
      after: '10% instant card discount with 6-month no-cost EMI',
      impactLevel: 'OPPORTUNITY' as const,
      threatOrOpportunity: 'opportunity' as const,
      confidence: 0.91,
      whyItMatters: 'Competitor is subsidizing card processing fees to drive footfall in regional retail hubs like Pune and Mumbai.',
      recommendedAction: 'Offer bundled local setup and same-day in-home delivery guarantees that online portals cannot fulfill.',
      customerResponse: 'Match the net effective price or provide free 1-year extended local store warranty with doorstep exchange.',
      detectedAt: 'Today, 11:15 AM',
    },
  },
];

export class CompetitorsStore {
  static getCompetitors(): MonitoredCompetitor[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[CompetitorsStore] Failed to read from localStorage', e);
    }
    return INITIAL_COMPETITORS;
  }

  static getCompetitorById(id: string): MonitoredCompetitor | undefined {
    const all = this.getCompetitors();
    return all.find((c) => c.id === id);
  }

  static isCompetitorMonitored(name: string): boolean {
    const all = this.getCompetitors();
    const clean = name.trim().toLowerCase();
    return all.some((c) => c.name.toLowerCase() === clean || c.name.toLowerCase().includes(clean) || clean.includes(c.name.toLowerCase()));
  }

  static addRadarCompetitor(target: MonitoredCompetitor): MonitoredCompetitor {
    return this.addCompetitorTarget(target);
  }

  static addCompetitorTarget(target: MonitoredCompetitor): MonitoredCompetitor {
    const current = this.getCompetitors();
    const filtered = current.filter((c) => c.id !== target.id && c.name.toLowerCase() !== target.name.toLowerCase());
    const updated = [target, ...filtered];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[CompetitorsStore] Failed to save to localStorage', e);
    }
    return target;
  }

  static updateCompetitor(id: string, updates: Partial<MonitoredCompetitor>): MonitoredCompetitor | undefined {
    const current = this.getCompetitors();
    const index = current.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const updatedComp = { ...current[index], ...updates };
    current[index] = updatedComp;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('[CompetitorsStore] Failed to save updates to localStorage', e);
    }
    return updatedComp;
  }

  static addCompetitor(
    name: string,
    website: string,
    watchedSections: string[] = ['Pricing', 'Products', 'Offers'],
    category: string = 'Market Competitor Target'
  ): MonitoredCompetitor {
    const cleanedName = name.trim();
    let cleanedUrl = website.trim();
    if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
      cleanedUrl = `https://${cleanedUrl}`;
    }

    const newComp: MonitoredCompetitor = {
      id: `comp_${Date.now()}`,
      name: cleanedName,
      website: cleanedUrl,
      status: 'Monitoring active',
      lastScannedAt: 'Just now',
      nextCheckAt: 'Tonight, 11:30 PM',
      keyShift: 'Baseline snapshot established · Watching for pricing & product updates',
      category: category || 'Market Competitor Target',
      watchedSections: watchedSections.length > 0 ? watchedSections : ['Everything'],
      changesCount: 1,
      isCustom: true,
      impactLevel: 'IMPORTANT',
      lastChangeType: 'Baseline',
      lastChangeTime: 'Just now',
    };

    return this.addCompetitorTarget(newComp);
  }

  static deleteCompetitor(id: string): void {
    const current = this.getCompetitors();
    const updated = current.filter((c) => c.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[CompetitorsStore] Failed to save to localStorage', e);
    }
  }
}
