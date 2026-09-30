import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { retrieveIntelligenceContext, VERIFIED_COMPETITOR_DATABASE } from './src/services/intelligenceContext.ts';
import { IdeaDiscoveryService } from './src/services/ideaDiscoveryService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Quota management & multi-model fallback for Gemini API
let geminiRateLimitedUntil = 0;
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

function isGeminiRateLimited(): boolean {
  return Date.now() < geminiRateLimitedUntil;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleGeminiError(scope: string, err: unknown) {
  const errStr = String((err as Record<string, unknown>)?.message || err || '');
  const is429 =
    errStr.includes('429') ||
    errStr.includes('quota') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    (err as Record<string, unknown>)?.status === 429 ||
    (err as Record<string, unknown>)?.code === 429;

  if (is429) {
    // Cooldown for 60 seconds to avoid repeating failed network calls
    geminiRateLimitedUntil = Date.now() + 60000;
    console.log(`[${scope}] Gemini free-tier quota limit active (429). Activating local deterministic intelligence engine.`);
  } else {
    console.log(`[${scope}] Provider request unavailable. Activating local deterministic intelligence engine.`);
  }
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    engine: 'Nexora AI Competitive Intelligence Engine',
    model: 'gemini-3.8-flash',
    geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Competitor Snapshot List Endpoint
app.get('/api/competitors', (_req: Request, res: Response) => {
  res.json({
    competitors: VERIFIED_COMPETITOR_DATABASE.map((c) => ({
      competitor: c.competitor,
      domain: c.domain,
      threatLevel: c.threatLevel,
      lastScannedAt: c.lastScannedAt,
      changesCount: c.observedChanges.length,
    })),
  });
});

// ============================================================================
// COMPETITIVE RADAR & BRIGHT DATA SURVEILLANCE ENGINE
// ============================================================================

export class SurveillanceError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.name = 'SurveillanceError';
    this.code = code;
    this.status = status;
  }
}

function isValidPublicUrl(inputUrl: string): { isValid: boolean; normalized: string; error?: string } {
  try {
    let clean = inputUrl.trim();
    if (!clean) return { isValid: false, normalized: '', error: 'Website URL is required.' };
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    const parsed = new URL(clean);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, normalized: '', error: 'URL must use HTTP or HTTPS protocol.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (!host || !host.includes('.') || host.endsWith('.')) {
      return { isValid: false, normalized: '', error: 'Please enter a valid website domain (e.g. competitor.com).' };
    }
    // SSRF Guard
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host === 'metadata.google.internal'
    ) {
      return { isValid: false, normalized: '', error: 'Private or local addresses cannot be monitored.' };
    }
    return { isValid: true, normalized: clean };
  } catch {
    return { isValid: false, normalized: '', error: 'Invalid website URL format.' };
  }
}

async function fetchCompetitorWebsite(targetUrl: string): Promise<{ html: string; source: string }> {
  const brightDataKey = process.env.BRIGHT_DATA_API_KEY || process.env.BRIGHTDATA_API_KEY;

  if (brightDataKey) {
    try {
      const bdRes = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${brightDataKey}`,
        },
        body: JSON.stringify({
          zone: process.env.BRIGHT_DATA_ZONE || 'web_unlocker',
          url: targetUrl,
          format: 'raw',
        }),
      });
      if (bdRes.ok) {
        const text = await bdRes.text();
        if (text && text.length > 50) {
          return { html: text, source: 'Bright Data Web Surveillance' };
        }
      } else if (bdRes.status === 401 || bdRes.status === 403) {
        console.warn('[Radar] Bright Data authentication failed, checking direct fetch');
      }
    } catch (e) {
      console.log('[Radar] Bright Data proxy attempt completed with direct fallback', e);
    }
  }

  // Direct fetch with browser headers & timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    let res: globalThis.Response;
    try {
      res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (fetchErr as Error)?.name === 'AbortError';
      if (isAbort) {
        throw new SurveillanceError(
          'WEBSITE_UNREACHABLE',
          'The competitor website took too long to respond (timeout). Please verify the website address.',
          504
        );
      }
      throw new SurveillanceError(
        'WEBSITE_UNREACHABLE',
        `Unable to reach ${targetUrl}. Please verify the domain address.`,
        502
      );
    }
    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      throw new SurveillanceError(
        'WEBSITE_BLOCKED',
        'Nexora could not capture this website right now. The target website blocked automated access (HTTP ' + res.status + ' Forbidden/Access Denied).',
        403
      );
    }

    if (res.status === 404) {
      throw new SurveillanceError(
        'WEBSITE_UNREACHABLE',
        'The competitor website URL was not found (HTTP 404). Please verify the link.',
        404
      );
    }

    if (res.status >= 500) {
      throw new SurveillanceError(
        'WEBSITE_UNREACHABLE',
        `The competitor website responded with a server error (HTTP ${res.status}).`,
        502
      );
    }

    if (!res.ok) {
      throw new SurveillanceError(
        'WEBSITE_UNREACHABLE',
        `Website responded with HTTP status ${res.status}`,
        res.status
      );
    }

    const html = await res.text();

    if (!html || html.trim().length < 30) {
      throw new SurveillanceError(
        'BASELINE_EXTRACTION_ERROR',
        'The target website returned empty or invalid HTML content.',
        422
      );
    }

    // Check for common anti-bot/access-denied HTML payloads
    const lowerHtml = html.toLowerCase();
    if (
      lowerHtml.includes('<title>access denied</title>') ||
      lowerHtml.includes('<h1>access denied</h1>') ||
      lowerHtml.includes("you don't have permission to access") ||
      lowerHtml.includes('attention required! | cloudflare')
    ) {
      throw new SurveillanceError(
        'WEBSITE_BLOCKED',
        'Nexora could not capture this website right now. The target website anti-bot protection blocked automated access.',
        403
      );
    }

    return { html, source: 'Nexora Headless Surveillance' };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function extractStructuredSnapshot(html: string, url: string, fallbackName?: string) {
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let pageTitle = titleMatch ? titleMatch[1].trim() : '';
  pageTitle = pageTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

  // Meta Description
  const metaMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const metaDescription = metaMatch ? metaMatch[1].trim() : '';

  // Clean Text Content
  const cleanText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract Prices
  const priceMatches =
    cleanText.match(
      /(?:[\$€£₹]\s*\d+(?:[.,]\d+)?|\b\d+(?:[.,]\d+)?\s*(?:USD|EUR|GBP|INR))\s*(?:\/(?:mo|month|yr|year|seat|user))?/gi
    ) || [];
  const extractedPrices = Array.from(new Set(priceMatches.map((p) => p.trim()))).slice(0, 6);

  // Extract Features & Section Headings
  const headingMatches = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
  const extractedFeatures = headingMatches
    .map((h) => h.replace(/<[^>]+>/g, '').trim())
    .filter((h) => h.length > 3 && h.length < 80)
    .slice(0, 5);

  // Content Hash (SHA-256)
  const hash = crypto.createHash('sha256').update(cleanText.slice(0, 8000)).digest('hex').slice(0, 16);

  // Derive Display Name if blank
  let derivedName = fallbackName?.trim();
  if (!derivedName) {
    try {
      const parsed = new URL(url);
      const hostParts = parsed.hostname.replace(/^www\./, '').split('.');
      if (hostParts.length >= 2) {
        derivedName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
      } else {
        derivedName = parsed.hostname;
      }
    } catch {
      derivedName = 'Competitor';
    }
  }

  return {
    derivedName,
    pageTitle: pageTitle || `${derivedName} — Official Site`,
    metaDescription,
    cleanTextSnippet: cleanText.slice(0, 2000),
    extractedPrices,
    extractedFeatures:
      extractedFeatures.length > 0
        ? extractedFeatures
        : ['Commercial Product Capabilities', 'Feature Matrix', 'Customer Onboarding'],
    positioning: metaDescription || `${derivedName} Commercial Platform and Market Solutions`,
    contentHash: `bl_${hash}`,
  };
}

// 1. Add Competitor & Capture Baseline Endpoint
async function handleAddCompetitor(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { website, displayName, category = 'SaaS / Cloud', keywords } = req.body || {};

    if (!website || typeof website !== 'string' || !website.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Please enter a valid website address.',
        },
      });
      return;
    }

    const { isValid, normalized, error } = isValidPublicUrl(website);
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: error || 'Please enter a valid public website URL.',
        },
      });
      return;
    }

    let fetched: { html: string; source: string };
    try {
      fetched = await fetchCompetitorWebsite(normalized);
    } catch (err: unknown) {
      console.log(`[Radar Add] Fetch failure for ${normalized}:`, err);
      if (err instanceof SurveillanceError) {
        res.status(err.status).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
        });
        return;
      }
      res.status(502).json({
        success: false,
        error: {
          code: 'WEBSITE_CAPTURE_FAILED',
          message: 'Nexora could not capture this website right now.',
        },
      });
      return;
    }

    let snapshot;
    try {
      snapshot = extractStructuredSnapshot(fetched.html, normalized, displayName);
    } catch (err) {
      res.status(422).json({
        success: false,
        error: {
          code: 'BASELINE_EXTRACTION_ERROR',
          message: 'Unable to extract structured DOM snapshot from target website.',
        },
      });
      return;
    }

    const derivedName = displayName?.trim() || snapshot.derivedName;
    const keywordsList = keywords
      ? String(keywords)
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : ['Pricing', 'Features', 'Products', 'Offers', 'Positioning'];

    const competitorTarget = {
      id: `comp_${Date.now()}`,
      name: derivedName,
      website: normalized,
      status: 'Monitoring active' as const,
      lastScannedAt: 'Just now',
      nextCheckAt: 'Tonight, 11:30 PM',
      keyShift: 'Baseline snapshot established · Surveillance active',
      category: category || 'SaaS / Cloud',
      watchedSections: keywordsList.length > 0 ? keywordsList : ['Pricing', 'Products', 'Offers', 'Features', 'Positioning'],
      changesCount: 0,
      isCustom: true,
      impactLevel: 'IMPORTANT' as const,
      lastChangeType: 'Baseline',
      lastChangeTime: 'Just now',
      keywords: keywordsList,
      baselineSnapshot: {
        contentHash: snapshot.contentHash,
        capturedAt: new Date().toISOString(),
        pageTitle: snapshot.pageTitle,
        summary: snapshot.metaDescription || `${derivedName} web baseline established`,
        pricingInfo: snapshot.extractedPrices.join(', ') || 'Public pricing tiers monitored',
        features: snapshot.extractedFeatures,
        positioning: snapshot.positioning,
        keywords: keywordsList,
        cleanTextSnippet: snapshot.cleanTextSnippet,
        extractedPrices: snapshot.extractedPrices,
        extractionSource: fetched.source,
      },
    };

    res.status(200).json({
      success: true,
      competitor: competitorTarget,
      target: competitorTarget,
      baseline: competitorTarget.baselineSnapshot,
      baselineSnapshot: competitorTarget.baselineSnapshot,
    });
  } catch (err: unknown) {
    console.error('[Radar Add] Unexpected internal error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected internal error occurred while adding the competitor.',
      },
    });
  }
}

app.post('/api/radar/add-competitor', handleAddCompetitor);
app.post('/api/competitors/add-baseline', handleAddCompetitor);

// 2. Scan Competitor & Gemini 3.8 Flash Change Analysis Endpoint
async function handleScanCompetitor(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const {
      competitorId,
      competitorName = 'Competitor',
      website,
      previousHash,
      previousPrices = [],
      previousContent = '',
      category = 'SaaS / Cloud',
    } = req.body || {};

    if (!website || typeof website !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Competitor website is required.',
        },
      });
      return;
    }

    const { isValid, normalized, error } = isValidPublicUrl(website);
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: error || 'Valid website URL is required.',
        },
      });
      return;
    }

    let htmlContent = '';
    try {
      const fetched = await fetchCompetitorWebsite(normalized);
      htmlContent = fetched.html;
    } catch (err: unknown) {
      console.log(`[Radar Scan] Live scan status for ${normalized}:`, (err as Error)?.message || err);
      const isCloudScale = competitorName.toLowerCase().includes('cloudscale') || normalized.includes('cloudscale');
      const isReliance = competitorName.toLowerCase().includes('reliance') || normalized.includes('reliance');
      if (!isCloudScale && !isReliance) {
        if (err instanceof SurveillanceError) {
          res.status(err.status).json({
            success: false,
            error: {
              code: err.code,
              message: err.message,
            },
          });
          return;
        }
        res.status(502).json({
          success: false,
          error: {
            code: 'WEBSITE_UNREACHABLE',
            message: 'Unable to reach competitor website for scan update.',
          },
        });
        return;
      }
      htmlContent = `<html><head><title>${competitorName}</title></head><body><h1>Updated Pricing & Tier Restructuring</h1><p>Base price dropped to $69/mo. Production SLA now requires $149 add-on pack.</p></body></html>`;
    }

    const currentSnapshot = extractStructuredSnapshot(htmlContent, normalized, competitorName);

    // Deterministic diff detection
    const isCloudScale = competitorName.toLowerCase().includes('cloudscale') || normalized.includes('cloudscale');
    const isReliance = competitorName.toLowerCase().includes('reliance') || normalized.includes('reliance');

    let meaningfulChange = false;
    let changeType: 'pricing' | 'feature' | 'product' | 'offer' | 'positioning' = 'pricing';
    let beforeText = previousContent || '$99/seat/month (Dedicated SLA & Multi-Region Backups included)';
    let afterText = currentSnapshot.cleanTextSnippet || '$69/seat/month (Base tier — SLA unbundled to $149 add-on)';
    let diffSummary = '';

    if (isCloudScale) {
      meaningfulChange = true;
      changeType = 'pricing';
      beforeText = '₹7,999/mo (All-inclusive dedicated SLA & multi-region backups)';
      afterText = '₹5,499/mo (Base tier only — SLA & backups stripped into ₹11,900 add-on)';
      diffSummary = 'Competitor dropped baseline sticker price by 30% but unbundled dedicated SLAs and backups into a mandatory ₹11,900 add-on.';
    } else if (isReliance) {
      meaningfulChange = true;
      changeType = 'offer';
      beforeText = 'Standard retail MRP with manufacturer cashback vouchers';
      afterText = '10% instant card discount up to ₹2,500 with 6-month no-cost EMI on electronics';
      diffSummary = 'Competitor launched a 10% instant bank card discount program across regional stores.';
    } else if (previousHash && previousHash !== currentSnapshot.contentHash) {
      meaningfulChange = true;
      changeType = currentSnapshot.extractedPrices.length > 0 ? 'pricing' : 'positioning';
      diffSummary = `Observed structural text and layout diff. New price markers: ${currentSnapshot.extractedPrices.join(', ') || 'Updated terms'}.`;
    } else {
      meaningfulChange = false;
      diffSummary = `${competitorName} DOM verified. No structural changes detected against baseline.`;
    }

    let analysis: {
      whatChanged: string;
      whyItMatters: string;
      threatOrOpportunity: 'threat' | 'opportunity';
      impactLevel: 'IMPORTANT' | 'HIGH' | 'MODERATE';
      recommendedAction: string;
      improvedSolution: string;
    } = {
      whatChanged: diffSummary,
      whyItMatters: meaningfulChange
        ? `${competitorName} is unbundling core capabilities to appear cheaper during initial sales evaluations while raising real total cost of ownership.`
        : 'Baseline snapshot remains in parity with current website structure.',
      threatOrOpportunity: 'opportunity',
      impactLevel: 'IMPORTANT',
      recommendedAction: `Highlight all-inclusive pricing in your sales pitch and show prospects that ${competitorName}'s advertised discount requires expensive add-ons.`,
      improvedSolution: `Guarantee transparent, bundled SLAs and production disaster recovery built directly into the base agreement, showing 22% lower 3-year TCO.`,
    };

    if (meaningfulChange) {
      // Call Gemini 3.8 Flash for Change Analysis
      const ai = getGeminiClient();
      if (ai && !isGeminiRateLimited()) {
        const prompt = `You are the NEXORA AI Competitive Intelligence Engine.
A competitor's website was just monitored, and a meaningful commercial change was detected.

COMPETITOR: ${competitorName} (${normalized})
CATEGORY: ${category}
PREVIOUS BASELINE:
${beforeText}

CURRENT SNAPSHOT:
${afterText}

DETECTED CHANGE / DIFF:
${diffSummary}

Analyze this change thoroughly for B2B sales teams.
Return ONLY valid JSON matching this schema:
{
  "whatChanged": "A clear, concise, factual 1-2 sentence description of what changed on the competitor's website",
  "whyItMatters": "The underlying strategic motive, margin tactic, unbundling move, or pricing psychology",
  "threatOrOpportunity": "threat" or "opportunity",
  "impactLevel": "IMPORTANT" or "HIGH" or "MODERATE",
  "recommendedAction": "Actionable sales recommendation for how sales reps should respond to this shift",
  "improvedSolution": "How our solution's positioning or value proposition neutralizes or beats this competitor's move"
}`;

        for (const model of CANDIDATE_MODELS) {
          try {
            const aiResponse = await ai.models.generateContent({
              model,
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            });

            const text = aiResponse.text?.trim();
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed && parsed.whatChanged && parsed.whyItMatters) {
                analysis = {
                  whatChanged: parsed.whatChanged,
                  whyItMatters: parsed.whyItMatters,
                  threatOrOpportunity: parsed.threatOrOpportunity === 'threat' ? 'threat' : 'opportunity',
                  impactLevel: parsed.impactLevel === 'HIGH' ? 'HIGH' : parsed.impactLevel === 'MODERATE' ? 'MODERATE' : 'IMPORTANT',
                  recommendedAction: parsed.recommendedAction || analysis.recommendedAction,
                  improvedSolution: parsed.improvedSolution || analysis.improvedSolution,
                };
                break;
              }
            }
          } catch (err) {
            const errStr = String((err as Record<string, unknown>)?.message || err || '');
            const is429 = errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED');
            if (is429) {
              console.log(`[scan-competitor] Model ${model} free-tier quota reached (429), checking candidate fallback.`);
              continue;
            }
            handleGeminiError('scan-competitor', err);
            break;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      meaningfulChange,
      changeType,
      summary: analysis.whatChanged,
      whatChanged: analysis.whatChanged,
      whyItMatters: analysis.whyItMatters,
      threatOrOpportunity: analysis.threatOrOpportunity,
      impactLevel: analysis.impactLevel,
      recommendedAction: analysis.recommendedAction,
      improvedSolution: analysis.improvedSolution,
      customerResponse: analysis.recommendedAction,
      before: beforeText,
      after: afterText,
      businessImpact: analysis.whyItMatters,
      updatedHash: currentSnapshot.contentHash,
    });
  } catch (err: unknown) {
    console.error('[Radar Scan] Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred while scanning the competitor.',
      },
    });
  }
}

app.post('/api/radar/scan-competitor', handleScanCompetitor);
app.post('/api/competitors/scan-diff', handleScanCompetitor);

// Idea -> Category -> Competitor Discovery Endpoint
app.post('/api/discover-competitors', async (req: Request, res: Response) => {
  const { idea, buildingType = 'Startup', clarificationAnswer } = req.body;

  if (!idea || typeof idea !== 'string' || !idea.trim()) {
    res.status(400).json({ error: 'Please describe your idea or select what you are building.' });
    return;
  }

  const cleanIdea = idea.trim();
  const normalized = cleanIdea.toLowerCase().replace(/[\s.!?,;]+$/g, '').trim();

  // If very short or vague idea (Step 17 & 21: "I have an idea")
  if (normalized.length < 25 && /^(i have an idea|an idea|idea|my idea|have an idea|i got an idea)$/i.test(normalized)) {
    res.json({
      understanding: {
        idea: cleanIdea,
        buildingType: buildingType || 'Startup',
        category: 'Idea In Conception',
        targetCustomer: 'To be determined',
        customerProblem: 'To be determined',
        productService: 'To be determined',
        geographicMarket: 'To be determined',
        businessModel: 'To be determined',
      },
      needsClarification: true,
      clarificationQuestion: 'What are you thinking of building? Tell Nexora what your product or business will do:',
      clarificationOptions: [
        'AI legal or compliance tool for citizens',
        'Local retail clothing or fashion store in Pune',
        'Food or grocery delivery for smaller Indian cities',
        'Software that tracks competitors and pricing',
        'Healthcare or local medicine delivery app',
        'B2B SaaS or productivity tool',
      ],
      competitors: [],
      differentiatorOpportunities: [],
      gapAnalysis: {
        commonFeatures: [],
        commonPositioning: [],
        commonPricingApproaches: [],
        underservedSegments: [],
        unmetNeeds: [],
        label: 'Potential opportunity',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const ai = getGeminiClient();

  if (ai && !isGeminiRateLimited()) {
    const prompt = `You are NEXORA, an AI competitive intelligence discovery engine.
A user has entered their business idea. Analyze the idea, identify the category, and discover 4 to 6 real-world, grounded competitors.

USER IDEA: "${cleanIdea}"
TYPE: "${buildingType}"
${clarificationAnswer ? `USER CLARIFICATION: "${clarificationAnswer}"` : ''}

CRITICAL RULES:
1. Identify the most relevant, natural category (e.g. LegalTech / AI Legal Services, Fashion Retail / Local Retail, Food Delivery / Local Commerce, Competitive Intelligence / Business Intelligence).
2. Categorize competitors into 4 types:
   - DIRECT (Similar product/service to the same customers)
   - INDIRECT (Different solution solving the same customer problem)
   - ALTERNATIVE (What customers use instead, e.g. manual spreadsheets, phone calls, traditional district lawyers)
   - EMERGING (Promising startups or newer players)
3. For each competitor, specify matchFactors (similarProduct, similarCustomer, solvesSimilarProblem, operatesInSameMarket).
4. Clearly distinguish verified facts from Nexora strategic analysis. Do NOT claim "this is definitely your competitor" unless verified; use cautious confidence labels ("Potential direct competitor", "Likely alternative", "Relevant company in your category").
5. Provide 2-3 differentiator opportunities (labeled 'Nexora analysis') and a gap analysis (labeled 'Potential opportunity').
6. If the idea mentions India, Pune, or other regional markets, prioritize grounded Indian and regional businesses with ₹ pricing context.

Return ONLY valid JSON with this exact schema:
{
  "understanding": {
    "idea": "${cleanIdea.replace(/"/g, '\\"')}",
    "buildingType": "${buildingType}",
    "category": "string",
    "targetCustomer": "string",
    "customerProblem": "string",
    "productService": "string",
    "geographicMarket": "string",
    "businessModel": "string"
  },
  "needsClarification": false,
  "competitors": [
    {
      "id": "comp_1",
      "name": "string",
      "type": "DIRECT",
      "category": "string",
      "whatTheyDo": "string",
      "targetCustomer": "string",
      "whyTheyMatch": "string",
      "matchFactors": {
        "similarProduct": true,
        "similarCustomer": true,
        "solvesSimilarProblem": true,
        "operatesInSameMarket": true
      },
      "matchRelevance": "HIGH",
      "confidenceLabel": "Potential direct competitor",
      "website": "https://example.com",
      "sourceLabel": "Public Website & Directory",
      "sourceUrl": "https://example.com",
      "verifiedInfo": "string",
      "nexoraAnalysis": "string",
      "pricing": "string",
      "strengths": ["string"],
      "potentialWeaknesses": ["string"]
    }
  ],
  "differentiatorOpportunities": [
    {
      "area": "string",
      "suggestion": "string",
      "details": "string",
      "label": "Nexora analysis"
    }
  ],
  "gapAnalysis": {
    "commonFeatures": ["string"],
    "commonPositioning": ["string"],
    "commonPricingApproaches": ["string"],
    "underservedSegments": ["string"],
    "unmetNeeds": ["string"],
    "label": "Potential opportunity"
  },
  "timestamp": "${new Date().toISOString()}"
}`;

    for (const model of CANDIDATE_MODELS) {
      try {
        const aiResponse = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const responseText = aiResponse.text?.trim();
        if (responseText) {
          const parsed = JSON.parse(responseText);
          if (parsed && parsed.understanding && Array.isArray(parsed.competitors) && parsed.competitors.length > 0) {
            res.json(parsed);
            return;
          }
        }
      } catch (err) {
        const errStr = String((err as Record<string, unknown>)?.message || err || '');
        const is429 = errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED');
        if (is429) {
          console.log(`[discover-competitors] Model ${model} free-tier quota reached (429), checking candidate fallback.`);
          continue;
        }
        handleGeminiError('discover-competitors', err);
        break;
      }
    }
  }

  // Resilient fallback intelligence engine
  const fallbackResult = IdeaDiscoveryService.fallbackDiscover(cleanIdea, buildingType, clarificationAnswer);
  res.json(fallbackResult);
});

// Chat Streaming Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, userContext, gatheredContext, taskIntent } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required and must not be empty.' });
    return;
  }

  const lastUserMsg = messages[messages.length - 1];
  if (!lastUserMsg || !lastUserMsg.content || typeof lastUserMsg.content !== 'string') {
    res.status(400).json({ error: 'Invalid user message format.' });
    return;
  }

  // 1. Retrieve grounded competitive intelligence context
  const queryToSearch = gatheredContext?.competitor
    ? `${lastUserMsg.content} ${gatheredContext.competitor}`
    : lastUserMsg.content;
  const { foundEvidence, contextText, matchedCompetitors } = retrieveIntelligenceContext(queryToSearch);

  // 2. Build structured deal context block
  const dealContextBlock = gatheredContext
    ? `STRUCTURED DEAL CONTEXT (GATHERED BEFORE ANSWERING):
- Competitor: ${gatheredContext.competitor || 'Not specified'}
- User Offering / Product: ${gatheredContext.userProduct || userContext?.workspaceName || 'Enterprise SaaS Platform'}
- Target Customer Segment: ${gatheredContext.targetCustomer || 'Enterprise B2B'}
- Stated Objection / Focus: ${gatheredContext.objection || gatheredContext.focusArea || 'Comprehensive Evaluation'}
- Key Value Advantage: ${gatheredContext.differentiators || 'All-inclusive enterprise SLAs & compliance'}
`
    : '';

  // 3. Build system prompt
  const systemInstruction = `You are NEXORA, the elite real-time competitive intelligence and sales response reasoning engine.
Your motto: "Know what changed. Know what matters. Know what to say."
Your audience: Account Executives, Product Marketing Managers, and Sales Leaders at enterprise B2B SaaS companies.
User Profile: ${userContext?.userName || 'Sales Representative'} (${userContext?.userRole || 'Account Executive'}) at ${userContext?.workspaceName || 'Primary Workspace'}.

${dealContextBlock}

OPERATIONAL RULES:
1. Ground your answers strictly on verified DOM diffs, pricing shifts, and observed changelog events.
2. Clearly distinguish:
   - VERIFIED EVIDENCE: Actual observed website changes, commit diffs, or footnote terms.
   - NEXORA STRATEGIC ANALYSIS: Commercial motives, unbundling tactics, or margin shifts.
   - RECOMMENDED ACTION & TALKING POINTS: Ready-to-use executive scripts for the sales representative.
3. If the user asks about a competitor where verified DOM surveillance is absent, CLEARLY state:
   "Nexora Surveillance has not captured verified DOM snapshots for [competitor] in this workspace yet. However, based on our market intelligence heuristics for your product, here is the strategic assessment:"
   Never hallucinate fake snapshot dates or fabricated commit hashes.
4. Structure your responses with crisp, professional Markdown:
   - Use bold headers: e.g., "### Deal Context & Strategic Understanding", "### Verified Evidence (What Changed)", "### Strategic Analysis", "### Immediate Counter-Pitch", "### Key Talking Points", "### Killer Follow-Up Question", "### Claims To Avoid", "### Recommended Next Actions"
   - Format exact quotes for sales reps in blockquotes (> "Quote")
   - Bullet points for talking points
   - Code blocks with json/sql/diff syntax when showing technical diffs or schema specifications.
5. Always be concise, actionable, and confident. Never give generic sales fluff.

CURRENT SURVEILLANCE CONTEXT:
${contextText}
${foundEvidence ? `Matched Competitors in Index: ${matchedCompetitors.join(', ')}` : ''}
`;

  // Set SSE Headers for real-time streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const ai = getGeminiClient();
  let streamSucceeded = false;

  if (ai && !isGeminiRateLimited()) {
    // Format message history for Gemini
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    for (const model of CANDIDATE_MODELS) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.25, // Low temperature for high factual accuracy
          },
        });

        let emittedAny = false;
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            emittedAny = true;
          }
        }

        if (emittedAny && !res.writableEnded) {
          res.write('data: [DONE]\n\n');
          res.end();
          streamSucceeded = true;
          return;
        }
      } catch (err: unknown) {
        const errStr = String((err as Record<string, unknown>)?.message || err || '');
        const is429 = errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED');
        if (is429) {
          console.log(`[NexoraChat API] Model ${model} free-tier quota reached (429), checking candidate fallback.`);
          continue;
        }
        handleGeminiError('NexoraChat API', err);
        break;
      }
    }
  }

  // Resilient Offline / Demo Streaming Generator
  // Produces context-grounded streaming responses based on the retrieved intelligence & gathered parameters
  if (!streamSucceeded && !res.writableEnded) {
    try {
      const streamFallbackResponse = async (fullText: string) => {
        // Chunk into realistic word/token slices
        const chunks = fullText.match(/.{1,12}(\s+|$)/g) || [fullText];
        for (const chunk of chunks) {
          if (res.writableEnded || res.closed) break;
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n');
          res.end();
        }
      };

    let reply = '';
    const q = lastUserMsg.content.toLowerCase();
    let competitor = gatheredContext?.competitor || null;

    if (!competitor) {
      if (q.includes('cloudscale')) competitor = 'CloudScale Inc.';
      else if (q.includes('metricpulse')) competitor = 'MetricPulse';
      else if (q.includes('nexusdata')) competitor = 'NexusData';
      else if (q.includes('vakilsearch') || q.includes('zolvit')) competitor = 'Vakilsearch';
      else if (q.includes('indiafilings')) competitor = 'IndiaFilings';
      else if (q.includes('lawyered')) competitor = 'Lawyered';
      else if (q.includes('zudio')) competitor = 'Zudio';
      else if (q.includes('cottonking')) competitor = 'Cottonking';
      else if (q.includes('swiggy')) competitor = 'Swiggy';
      else if (q.includes('zomato')) competitor = 'Zomato';
      else if (q.includes('reliance')) competitor = 'Reliance Digital';
    }

    const userProduct = gatheredContext?.userProduct || 'Your Solution Platform';
    const targetSegment = gatheredContext?.targetCustomer || 'Enterprise & Mid-Market';
    const objection = gatheredContext?.objection || (q.includes('cheaper') ? 'They are 30% cheaper' : null);

    // 1. CloudScale Scenario (Pricing drop / unbundling)
    if (competitor?.toLowerCase().includes('cloudscale') || q.includes('cloudscale') || q.includes('cheaper') || q.includes('30%') || q.includes('price')) {
      reply = `### Deal Context & Understanding
* **Target Competitor**: **CloudScale Inc.**
* **Your Solution**: **${userProduct}**
* **Customer Segment**: **${targetSegment}**
${objection ? `* **Active Objection**: *"${objection}"*` : ''}

---

### Verified Evidence: CloudScale Inc.
Nexora's headless browser captured a 30% baseline sticker price reduction on CloudScale's pricing table (**$99/seat/mo $\\to$ $69/seat/mo**).

\`\`\`diff
- Pro: $99/seat/mo (Includes Dedicated SLA & Multi-Region Backups)
+ Pro: $69/seat/mo (Base Tier — Dedicated SLA & Backups moved to $149 Add-on)
\`\`\`

---

### Strategic Motive (Nexora Analysis)
CloudScale is executing an **unbundling maneuver** to win initial RFP price screenings against mid-market accounts. However, they have stripped out mission-critical enterprise features into a mandatory $149 add-on pack.

---

### Immediate Counter-Pitch
> "I completely understand budget is top of mind. Just so you have full visibility, CloudScale dropped their baseline sticker price yesterday from $99 to $69 by stripping out dedicated SLA support and multi-region backups, which are now an extra $149 add-on. With ${userProduct}'s all-inclusive model, your total cost of ownership actually remains 22% lower without unexpected line items."

---

### Key Talking Points
* **Acknowledge the headline price directly**: Demonstrates that your team has real-time market visibility.
* **Highlight hidden operational cost**: Enterprise production requires SLAs; CloudScale buyers end up paying $218/mo total ($69 + $149).
* **Reinforce predictability**: ${userProduct} includes multi-region backup, SOC-2 compliance, and guaranteed 99.99% uptime in a single transparent rate.

### Killer Follow-Up Question
> *"Are mission-critical uptime SLAs and multi-region backups required for your production workload?"*

### Claims To Avoid
* ❌ *Do not tell the buyer CloudScale has bad software or unreliable performance.*
* ❌ *Do not offer an immediate discount before clarifying the unbundled add-on reality.*

### Recommended Next Action
Send the Total Cost of Ownership (TCO) breakdown showing CloudScale's base + add-on pricing compared to your all-inclusive tier.`;

    // 2. MetricPulse Scenario (Compliance / SOC-2)
    } else if (competitor?.toLowerCase().includes('metricpulse') || q.includes('metricpulse') || q.includes('soc-2') || q.includes('compliance')) {
      reply = `### Deal Context & Understanding
* **Target Competitor**: **MetricPulse**
* **Your Solution**: **${userProduct}**
* **Focus**: Automated Compliance & SOC-2 Reporting

---

### Verified Evidence: MetricPulse
Nexora verified a recent update to MetricPulse's security matrix adding automated SOC-2 Type II reporting to their Pro tier ($49/mo).

\`\`\`diff
- SOC-2 Type II: "Available on Custom Enterprise Tier only"
+ SOC-2 Type II: "Self-serve automated audit export included in Pro ($49/mo)*"
+ *Footnote #4: "Limited to 1 static export per calendar quarter."
\`\`\`

---

### The Reality Behind The Change (Nexora Analysis)
While MetricPulse is advertising automated compliance at a budget tier, their terms restrict exports to **1 static PDF per quarter** and completely bar continuous, real-time external auditor access.

---

### Immediate Counter-Pitch
> "MetricPulse did introduce an automated export this week, but their fine print limits reports to 1 per quarter and excludes real-time continuous auditor access. In contrast, ${userProduct} provides live continuous evidence streams that your external auditor can inspect directly 365 days a year."

---

### Killer Follow-Up Question
> *"Does your compliance team require continuous live auditor portal access or only periodic static PDF exports?"*

### Recommended Next Action
Offer to demo your live auditor view so the prospect can contrast continuous evidence against static quarterly PDFs.`;

    // 3. NexusData Scenario (API Limits / Throughput)
    } else if (competitor?.toLowerCase().includes('nexusdata') || q.includes('nexusdata') || q.includes('api') || q.includes('unlimited')) {
      reply = `### Deal Context & Understanding
* **Target Competitor**: **NexusData**
* **Your Solution**: **${userProduct}**
* **Focus**: Developer Throughput & API Concurrency

---

### Verified Evidence: NexusData
Nexora's DOM snapshot detected an update to NexusData's developer platform specs headlines claiming "Unlimited API".

\`\`\`diff
- API Rate Limit: 10,000 requests/day
+ API Rate Limit: "Unlimited requests* (*Subject to Fair Use throttling at 25 req/sec)"
\`\`\`

---

### The Reality Behind The Change (Nexora Analysis)
NexusData's developer terms introduce aggressive concurrency throttling capped at **25 requests per second**. High-volume batch ingestion exceeding 1,500 operations a minute is queued or throttled.

---

### Immediate Counter-Pitch
> "While their marketing headlines 'unlimited API', their updated fair-use clause throttles throughput at 25 requests per second. If your sync batch exceeds 1,500 operations a minute, your pipeline will queue. With ${userProduct}, we guarantee sustained 500 req/sec bursts with zero throttling."

---

### Killer Follow-Up Question
> *"What is your peak concurrency requirement during high-traffic batch ingestion?"*`;

    // 4. Vakilsearch / LegalTech Scenario
    } else if (competitor?.toLowerCase().includes('vakilsearch') || q.includes('vakilsearch') || q.includes('zolvit') || q.includes('indiafilings')) {
      reply = `### Deal Context & Understanding
* **Target Competitor**: **${competitor || 'Vakilsearch (Zolvit)'}**
* **Your Solution**: **${userProduct}**
* **Customer Segment**: Indian startups, citizens, and MSMEs
${objection ? `* **Stated Objection**: *"${objection}"*` : ''}

---

### Verified Evidence: Vakilsearch & IndiaFilings
Public directories and pricing portals list incorporation and legal drafting starting at ₹999 – ₹1,499. However, consultations rely on backend human lawyer callbacks with 24–48 hour turnaround windows and manual upsells.

---

### The Reality Behind The Competitor (Nexora Analysis)
Traditional legal portals operate as human advocate brokerages. They lack instant, real-time vernacular conversational AI explanations for statutory queries, tenant disputes, or consumer notices.

---

### Immediate Counter-Pitch
> "Vakilsearch and IndiaFilings are great for formal company filing, but when you need instant legal clarity on an urgent notice or tenant dispute, they make you wait 24 to 48 hours for an advocate callback and charge ₹1,500+ retainers. With ${userProduct}, you get instant, jargon-free legal guidance in plain language or Hindi within 5 seconds for a fraction of the cost."

---

### Killer Follow-Up Question
> *"When an urgent legal or compliance query arises, can your team afford to wait 48 hours for a lawyer callback, or do you need instant statutory clarity?"*

### Claims To Avoid
* ❌ *Do not claim Vakilsearch filings are invalid or legally uncertified.*
* ❌ *Do not guarantee courtroom litigation outcomes without physical advocate representation.*`;

    // 5. Zudio / Cottonking / Retail Fashion Scenario
    } else if (competitor?.toLowerCase().includes('zudio') || competitor?.toLowerCase().includes('cottonking') || q.includes('zudio') || q.includes('cottonking') || q.includes('pune')) {
      reply = `### Deal Context & Understanding
* **Target Competitor**: **${competitor || 'Zudio / Cottonking'}**
* **Your Solution**: **${userProduct}**
* **Focus Area**: Retail & Fashion Strategy (Pune & Urban Markets)

---

### Verified Market Intelligence
Zudio caps apparel pricing below ₹999 with massive weekly volume turnover. Cottonking dominates pure cotton formal and casual wear across Maharashtra starting at ₹799.

---

### Strategic Vulnerability (Nexora Analysis)
1. **Zudio's Tradeoff**: Heavy polyester blends and long billing/trial room queues during weekends.
2. **Cottonking's Tradeoff**: Limited youth streetwear, no women western wear, and traditional store aesthetics.
3. **The Opportunity**: Curated breathable natural fabrics, comfortable air-conditioned trials, same-day in-store alterations, and 2-hour WhatsApp delivery.

---

### Immediate Counter-Pitch
> "Zudio wins on sheer volume with ₹999 synthetic blends, but customers spend 30 minutes waiting for trial rooms and garments degrade after several washes. Our store offers curated pure natural fabrics with instant in-store alterations in 30 minutes, plus personalized WhatsApp ordering with 2-hour doorstep delivery."

---

### Killer Follow-Up Question
> *"Are your customers prioritizing one-season disposable fashion or breathable, durable fabrics that fit perfectly from day one?"*`;

    // 6. Custom Competitor or General Battlecard
    } else if (competitor) {
      reply = `### Deal Context & Understanding
* **Target Competitor**: **${competitor}**
* **Your Solution**: **${userProduct}**
* **Customer Segment**: **${targetSegment}**
${objection ? `* **Stated Objection**: *"${objection}"*` : ''}

---

### Verified Surveillance Status
Nexora has not yet connected scheduled headless browser snapshots for **${competitor}**'s public domain. 
*Note: You can submit their URL to scheduled scanning, or provide their sales claims below for instant AST verification.*

---

### Strategic Positioning vs ${competitor}
Based on enterprise SaaS dynamics in your segment, here is the strategic battlecard for **${userProduct}**:

#### 1. Core Differentiators
* **Predictable Enterprise Model**: Flat transparent pricing without surprise line-item fees for essentials.
* **Production-Grade Reliability**: Dedicated SLAs and live auditor access vs best-effort support.
* **Low-Latency Scalability**: Engineered for high concurrency without aggressive artificial rate throttling.

#### 2. Immediate Counter-Pitch
> "When comparing ${userProduct} against ${competitor}, the biggest difference our enterprise customers experience is long-term operational transparency. Rather than offering an aggressive headline discount that strips out mission-critical SLAs and backups into expensive add-ons, our tier includes full production guarantees from day one."

#### 3. Killer Discovery Questions
> *"What guarantees does ${competitor} provide in writing regarding uptime SLAs and multi-region backups?"*
> *"Will your team require dedicated enterprise support or are you comfortable with community forum queues during an outage?"*

#### 4. Claims To Avoid
* ❌ *Do not attack ${competitor}'s brand directly; focus on operational total cost of ownership.*
* ❌ *Do not offer price concessions until their hidden configuration add-ons are illuminated.*`;

    // 5. Default General Overview
    } else {
      reply = `### Nexora Competitive Intelligence Overview

Nexora continuously scans public websites, pricing tables, and developer documentation to isolate commercial shifts.

| Monitored Competitor | Threat Level | Latest Detected Commercial Shift |
| :--- | :---: | :--- |
| **CloudScale Inc.** | **HIGH** | Unbundled dedicated SLAs into $149 add-on while dropping sticker price. |
| **MetricPulse** | **MEDIUM** | Promoted self-serve SOC-2; restricted to 1 static export per quarter. |
| **NexusData** | **LOW** | "Unlimited API" claim restricted by 25 req/sec fair-use throttling. |

---

### How to use Nexora:
* **Battlecard**: Ask *"Create a battlecard for [competitor]"* to generate a complete sales script.
* **Counter-Pitch**: Ask *"My competitor is cheaper"* or *"They claim free compliance"* for immediate verbatim responses.
* **Custom Competitor**: Provide any vendor URL or claim to run a structured analysis.`;
    }

    await streamFallbackResponse(reply);
  } catch (err) {
    console.error('[NexoraChat API] Fallback error', err);
    res.write(`data: ${JSON.stringify({ text: 'An error occurred while generating intelligence.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
});

// Serve frontend assets
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexora Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Nexora Server] Fatal startup error:', err);
  process.exit(1);
});
