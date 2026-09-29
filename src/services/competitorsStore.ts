import { VERIFIED_COMPETITOR_DATABASE, CompetitorIntelRecord } from './intelligenceContext.ts';

export interface MonitoredCompetitor {
  id: string;
  name: string;
  website: string;
  status: 'Monitoring active' | 'Scanning' | 'Pending';
  lastScannedAt: string;
  keyShift: string;
  category: string;
  isCustom?: boolean;
}

const STORAGE_KEY = 'nexora_monitored_competitors';

// Pre-seeded competitors from verified database
const INITIAL_COMPETITORS: MonitoredCompetitor[] = VERIFIED_COMPETITOR_DATABASE.map((c, index) => ({
  id: `comp_${index + 1}`,
  name: c.competitor,
  website: c.domain.startsWith('http') ? c.domain : `https://${c.domain}`,
  status: 'Monitoring active',
  lastScannedAt: c.lastScannedAt,
  keyShift: c.observedChanges[0]?.diffSummary || 'Pricing & tier change detected',
  category: c.category,
}));

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

  static addCompetitor(name: string, website: string): MonitoredCompetitor {
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
      keyShift: 'Baseline snapshot established · Continuous scanning active',
      category: 'Competitor Intelligence Target',
      isCustom: true,
    };

    const current = this.getCompetitors();
    const updated = [newComp, ...current];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[CompetitorsStore] Failed to save to localStorage', e);
    }

    return newComp;
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
