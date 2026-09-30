import { MonitoredCompetitor, CompetitorsStore } from './competitorsStore.ts';
import { FirestoreSyncService } from './firestoreSyncService.ts';

export interface RadarAlert {
  id: string;
  competitorId: string;
  competitorName: string;
  severity: 'IMPORTANT' | 'MODERATE' | 'UPDATE' | 'HIGH';
  title: string;
  changeType: string;
  before?: string;
  after?: string;
  whatChanged?: string;
  whyItMatters: string;
  threatOrOpportunity?: 'threat' | 'opportunity';
  impactLevel?: 'IMPORTANT' | 'HIGH' | 'MODERATE' | 'LOW';
  recommendedAction: string;
  improvedSolution?: string;
  customerResponse?: string;
  detectedAt: string;
  read?: boolean;
}

export interface AddCompetitorRequest {
  website: string;
  displayName?: string;
  category?: string;
  keywords?: string;
}

export interface AddCompetitorResponse {
  success: boolean;
  competitor: MonitoredCompetitor;
  error?: string;
  warning?: string;
}

export interface ScanCompetitorResponse {
  success: boolean;
  meaningfulChange: boolean;
  changeType?: string;
  summary?: string;
  before?: string;
  after?: string;
  whatChanged?: string;
  whyItMatters?: string;
  impactLevel?: 'IMPORTANT' | 'HIGH' | 'MODERATE' | 'LOW';
  threatOrOpportunity?: 'threat' | 'opportunity';
  confidence?: number;
  businessImpact?: string;
  recommendedAction?: string;
  improvedSolution?: string;
  customerResponse?: string;
  updatedCompetitor?: MonitoredCompetitor;
  error?: string;
}

const ALERTS_STORAGE_KEY = 'nexora_radar_alerts';

// Initial pre-seeded alert to showcase live intelligence out of the box
const INITIAL_ALERTS: RadarAlert[] = [
  {
    id: 'alert_cloudscale_pricing',
    competitorId: 'comp_1',
    competitorName: 'CloudScale Inc.',
    severity: 'IMPORTANT',
    title: 'Competitor change detected: CloudScale Inc.',
    changeType: 'pricing',
    before: '₹7,999/mo (All-inclusive dedicated SLA & multi-region backups)',
    after: '₹5,499/mo (Base tier only — SLA & backups stripped into ₹11,900 add-on)',
    whatChanged:
      'CloudScale dropped its base plan sticker price from ₹7,999/mo to ₹5,499/mo, while unbundling dedicated SLAs and multi-region backups into a separate ₹11,900/mo add-on package.',
    whyItMatters:
      'The competitor is attempting to win early RFP price evaluations by creating an artificial headline discount that masks a higher overall total cost of ownership.',
    threatOrOpportunity: 'opportunity',
    impactLevel: 'IMPORTANT',
    recommendedAction:
      'Highlight total cost of ownership (TCO) in prospect calls and guarantee all-inclusive enterprise SLAs from day one without surprise add-on charges.',
    improvedSolution:
      'Provide transparent, bundled SLAs and production disaster recovery built directly into the base agreement, showing 22% lower 3-year TCO.',
    customerResponse:
      'Acknowledge the headline price drop immediately, then show the prospect that CloudScale requires an extra ₹11,900 add-on for production SLAs, making your all-inclusive tier 22% cheaper.',
    detectedAt: '2 hours ago',
    read: false,
  },
];

export class RadarService {
  /**
   * Safely normalize user-supplied URL
   */
  static normalizeUrl(input: string): string {
    let trimmed = input.trim();
    if (!trimmed) return '';
    // Strip leading @ or quotes
    trimmed = trimmed.replace(/^[@"']+|["']+$/g, '');
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  }

  /**
   * Client-side pre-validation
   */
  static validateUrl(input: string): { isValid: boolean; normalized: string; error?: string } {
    const normalized = this.normalizeUrl(input);
    if (!normalized) {
      return { isValid: false, normalized: '', error: 'Please enter a valid website URL.' };
    }

    try {
      const url = new URL(normalized);
      const host = url.hostname.toLowerCase();

      // Check for valid hostname pattern
      if (!host || !host.includes('.') || host.endsWith('.')) {
        return { isValid: false, normalized, error: 'Please enter a valid website URL (e.g. competitor.com).' };
      }

      // Client-side quick SSRF guard
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.endsWith('.local') ||
        host.endsWith('.internal')
      ) {
        return { isValid: false, normalized, error: 'Please enter a public website address.' };
      }

      return { isValid: true, normalized };
    } catch {
      return { isValid: false, normalized, error: 'Please enter a valid website URL.' };
    }
  }

  /**
   * Add a new competitor:
   * VALIDATE -> NORMALIZE URL -> CREATE RADAR TARGET -> FETCH WEBSITE -> EXTRACT CONTENT -> BASELINE SNAPSHOT -> GEMINI ANALYSIS -> ACTIVATE RADAR
   */
  static async addCompetitor(data: AddCompetitorRequest): Promise<AddCompetitorResponse> {
    const { isValid, normalized, error: valError } = this.validateUrl(data.website);
    if (!isValid) {
      throw new Error(valError || 'Please enter a valid website URL.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    try {
      const response = await fetch(`${baseUrl}/api/radar/add-competitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          website: normalized,
          displayName: data.displayName?.trim(),
          category: data.category?.trim() || 'SaaS / Software',
          keywords: data.keywords?.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let result: any = null;

      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch {
          result = null;
        }
      }

      if (!response.ok || !result || result.success === false) {
        let errorMsg =
          result?.error?.message ||
          (typeof result?.error === 'string' ? result.error : '') ||
          result?.message;

        if (!errorMsg) {
          if (response.status === 403) {
            errorMsg = 'Nexora could not capture this website right now. The website blocked automated access (HTTP 403 Forbidden).';
          } else if (response.status === 404) {
            errorMsg = 'The website address was not found (HTTP 404). Please verify the link.';
          } else if (response.status === 408 || response.status === 504) {
            errorMsg = 'The website took too long to respond. Please try again.';
          } else if (response.status === 502) {
            errorMsg = "We couldn't connect to this website right now. Please check the domain address.";
          } else {
            errorMsg = "We couldn't capture the website baseline right now.";
          }
        }

        throw new Error(errorMsg);
      }

      const competitor = result.competitor || result.target;
      if (!competitor) {
        throw new Error("We couldn't save this competitor. Please try again.");
      }

      // Store in CompetitorsStore & Firestore
      CompetitorsStore.addRadarCompetitor(competitor);
      FirestoreSyncService.saveCompetitor(competitor).catch((err) =>
        console.warn('[Firestore] Async save competitor warning:', err)
      );

      // Notify window listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexora-competitors-updated'));
      }

      return {
        success: true,
        competitor,
        warning: result.warning,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error('The website took too long to respond. Please try again.');
        }
        throw err;
      }
      throw new Error("We couldn't capture the baseline right now.");
    }
  }

  /**
   * Scan competitor for changes
   */
  static async scanCompetitor(comp: MonitoredCompetitor): Promise<ScanCompetitorResponse> {
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    try {
      const response = await fetch(`${baseUrl}/api/radar/scan-competitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          competitorId: comp.id,
          website: comp.website,
          previousHash: comp.baseline?.contentHash,
          previousPrices: comp.baseline?.extractedPrices || [],
          previousContent: comp.baseline?.cleanTextSnippet || '',
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let result: any = null;

      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch {
          result = null;
        }
      }

      if (!response.ok || !result || result.success === false) {
        const errorMsg =
          result?.error?.message ||
          (typeof result?.error === 'string' ? result.error : '') ||
          'Failed to scan competitor.';
        throw new Error(errorMsg);
      }

      if (result.meaningfulChange && (result.summary || result.whatChanged)) {
        const whatChangedText = result.whatChanged || result.summary || 'Competitor updated key terms and positioning.';
        const whyItMattersText = result.whyItMatters || result.businessImpact || result.summary || 'Potential market shift observed.';
        const recommendedActionText = result.recommendedAction || 'Review your sales talking points and positioning.';

        // Create in-app Radar Alert
        const newAlert: RadarAlert = {
          id: `alert_${Date.now()}`,
          competitorId: comp.id,
          competitorName: comp.name,
          severity: (result.impactLevel as 'IMPORTANT' | 'MODERATE' | 'UPDATE' | 'HIGH') || 'IMPORTANT',
          title: `Competitor change detected: ${comp.name}`,
          changeType: result.changeType || 'pricing',
          before: result.before,
          after: result.after,
          whatChanged: whatChangedText,
          whyItMatters: whyItMattersText,
          threatOrOpportunity: result.threatOrOpportunity || 'opportunity',
          impactLevel: result.impactLevel || 'IMPORTANT',
          recommendedAction: recommendedActionText,
          improvedSolution: result.improvedSolution || 'Offer all-inclusive production guarantees and transparent TCO.',
          customerResponse: result.customerResponse || recommendedActionText,
          detectedAt: 'Just now',
          read: false,
        };

        this.addRadarAlert(newAlert);

        // Update competitor entry
        CompetitorsStore.updateCompetitor(comp.id, {
          lastScannedAt: 'Just now',
          keyShift: whatChangedText,
          changesCount: (comp.changesCount || 0) + 1,
          impactLevel: (result.impactLevel as 'IMPORTANT' | 'OPPORTUNITY' | 'MODERATE') || 'IMPORTANT',
          lastChangeType: result.changeType || 'Pricing',
          lastChangeTime: 'Just now',
          recentAlert: {
            id: newAlert.id,
            competitorName: comp.name,
            changeType: (result.changeType as 'pricing' | 'feature' | 'positioning' | 'offer') || 'pricing',
            summary: whatChangedText,
            before: result.before || 'Previous baseline terms',
            after: result.after || 'Current observed snapshot',
            impactLevel: (result.impactLevel as 'IMPORTANT' | 'OPPORTUNITY' | 'MODERATE') || 'IMPORTANT',
            threatOrOpportunity: result.threatOrOpportunity || 'opportunity',
            confidence: 0.95,
            whyItMatters: whyItMattersText,
            recommendedAction: recommendedActionText,
            customerResponse: result.customerResponse || recommendedActionText,
            detectedAt: 'Just now',
          },
        });
      } else {
        // Update last scanned timestamp
        CompetitorsStore.updateCompetitor(comp.id, {
          lastScannedAt: 'Just now',
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexora-competitors-updated'));
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan check failed';
      return {
        success: false,
        meaningfulChange: false,
        error: msg,
      };
    }
  }

  /**
   * Radar In-App Alerts management
   */
  static getRadarAlerts(): RadarAlert[] {
    try {
      const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[RadarService] Failed to load alerts from storage', e);
    }
    return INITIAL_ALERTS;
  }

  static addRadarAlert(alert: RadarAlert): void {
    const alerts = this.getRadarAlerts();
    const updated = [alert, ...alerts.filter((a) => a.id !== alert.id)];
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
      FirestoreSyncService.saveAlert(alert).catch((err) =>
        console.warn('[Firestore] Async save alert warning:', err)
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexora-radar-alert-new', { detail: alert }));
      }
    } catch (e) {
      console.warn('[RadarService] Failed to save alert', e);
    }
  }

  static dismissRadarAlert(id: string): void {
    const alerts = this.getRadarAlerts();
    const updated = alerts.filter((a) => a.id !== id);
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexora-radar-alert-dismissed', { detail: id }));
      }
    } catch (e) {
      console.warn('[RadarService] Failed to dismiss alert', e);
    }
  }
}
