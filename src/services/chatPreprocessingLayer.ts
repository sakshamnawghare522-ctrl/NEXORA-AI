import { ChatMessage, ConversationMemory, ContextBadge, Conversation } from '../types/chat.ts';
import {
  VERIFIED_COMPETITOR_DATABASE,
  CompetitorIntelRecord,
  retrieveIntelligenceContext,
} from './intelligenceContext.ts';
import { ChatStorageService, WorkspaceMemory } from './chatStorageService.ts';

export interface PreprocessingInput {
  rawPrompt: string;
  conversationHistory: ChatMessage[];
  currentConversationMemory?: ConversationMemory;
  workspaceId: string;
  userId: string;
  userProfile?: {
    name?: string;
    company?: string;
    role?: string;
  };
  allWorkspaceConversations?: Conversation[];
}

export interface ContextSourceItem {
  source: 'workspace_profile' | 'workspace_memory' | 'conversation_history' | 'competitor_surveillance' | 'prompt';
  key: string;
  value: string;
  confidence: 'high' | 'medium';
  description: string;
}

export interface PreprocessingResult {
  /** Cleaned or pronoun-resolved prompt */
  processedPrompt: string;

  /** Comprehensive resolved key-value context for AI and clarification evaluation */
  resolvedContext: Record<string, string>;

  /** Traceable context sources for explainability and UI badges */
  contextSources: ContextSourceItem[];

  /** UI context badges indicating origins of resolved information */
  contextBadges: ContextBadge[];

  /** Matched competitor record from verified surveillance database, if any */
  matchedCompetitorRecord?: CompetitorIntelRecord | null;

  /** History resolution metadata */
  historyResolution: {
    inferredCompetitor?: string;
    inferredProduct?: string;
    resolvedPronoun: boolean;
    referencedPriorChange: boolean;
    priorObjection?: string;
  };

  /** Verified evidence text from workspace database */
  verifiedEvidenceSnippet?: string;

  /** Suggested next actions derived from resolved context */
  suggestedActions: string[];
}

export class ChatPreprocessingLayer {
  /**
   * Main entrypoint for context-aware preprocessing.
   * Runs prior to triggering any AI request or clarification check.
   */
  static preprocess(input: PreprocessingInput): PreprocessingResult {
    const raw = input.rawPrompt.trim();
    const lower = raw.toLowerCase();

    const resolvedContext: Record<string, string> = {};
    const contextSources: ContextSourceItem[] = [];
    const contextBadges: ContextBadge[] = [];

    // =========================================================================
    // STEP 1: CHECK EXISTING WORKSPACE PROFILE & WORKSPACE MEMORY
    // =========================================================================
    const workspaceMemory: WorkspaceMemory = ChatStorageService.getWorkspaceMemory(input.workspaceId);

    // 1a. User Workspace Profile
    if (input.userProfile?.company && !input.userProfile.company.toLowerCase().includes('workspace')) {
      resolvedContext.userCompany = input.userProfile.company;
      contextSources.push({
        source: 'workspace_profile',
        key: 'userCompany',
        value: input.userProfile.company,
        confidence: 'high',
        description: 'Retrieved from active user organization profile',
      });
    }

    // 1b. Workspace-level Memory (cross-conversation knowledge)
    if (workspaceMemory.userCompany && !resolvedContext.userCompany) {
      resolvedContext.userCompany = workspaceMemory.userCompany;
      contextSources.push({
        source: 'workspace_memory',
        key: 'userCompany',
        value: workspaceMemory.userCompany,
        confidence: 'high',
        description: 'Retrieved from saved workspace memory',
      });
    }

    if (workspaceMemory.userProduct) {
      resolvedContext.userProduct = workspaceMemory.userProduct;
      contextSources.push({
        source: 'workspace_memory',
        key: 'userProduct',
        value: workspaceMemory.userProduct,
        confidence: 'high',
        description: 'Retrieved from saved workspace product offering',
      });
    }

    if (workspaceMemory.targetCustomer) {
      resolvedContext.targetCustomer = workspaceMemory.targetCustomer;
      contextSources.push({
        source: 'workspace_memory',
        key: 'targetCustomer',
        value: workspaceMemory.targetCustomer,
        confidence: 'high',
        description: 'Retrieved from workspace target customer segment',
      });
    }

    if (workspaceMemory.keyDifferentiators && workspaceMemory.keyDifferentiators.length > 0) {
      resolvedContext.differentiators = workspaceMemory.keyDifferentiators.join(', ');
      contextSources.push({
        source: 'workspace_memory',
        key: 'differentiators',
        value: resolvedContext.differentiators,
        confidence: 'high',
        description: 'Retrieved from workspace key differentiators',
      });
    }

    // 1c. Conversation-level Memory (highest precedence for current session)
    const convMem = input.currentConversationMemory || {};
    if (convMem.userCompany) {
      resolvedContext.userCompany = convMem.userCompany;
      contextSources.push({
        source: 'conversation_history',
        key: 'userCompany',
        value: convMem.userCompany,
        confidence: 'high',
        description: 'Declared in current conversation session',
      });
    }

    if (convMem.userProduct) {
      resolvedContext.userProduct = convMem.userProduct;
      contextSources.push({
        source: 'conversation_history',
        key: 'userProduct',
        value: convMem.userProduct,
        confidence: 'high',
        description: 'Declared in current conversation session',
      });
    }

    if (convMem.targetCustomer) {
      resolvedContext.targetCustomer = convMem.targetCustomer;
    }

    if (convMem.activeCompetitor) {
      resolvedContext.competitor = convMem.activeCompetitor;
      contextSources.push({
        source: 'conversation_history',
        key: 'competitor',
        value: convMem.activeCompetitor,
        confidence: 'high',
        description: 'Active competitor established in current session',
      });
    }

    // 1d. Cross-conversation workspace discovery (check prior conversations in workspace)
    if (input.allWorkspaceConversations && input.allWorkspaceConversations.length > 0) {
      for (const conv of input.allWorkspaceConversations) {
        if (!conv.memory) continue;
        if (!resolvedContext.userCompany && conv.memory.userCompany) {
          resolvedContext.userCompany = conv.memory.userCompany;
          contextSources.push({
            source: 'workspace_memory',
            key: 'userCompany',
            value: conv.memory.userCompany,
            confidence: 'high',
            description: `Retrieved from prior workspace conversation "${conv.title}"`,
          });
        }
        if (!resolvedContext.userProduct && conv.memory.userProduct) {
          resolvedContext.userProduct = conv.memory.userProduct;
          contextSources.push({
            source: 'workspace_memory',
            key: 'userProduct',
            value: conv.memory.userProduct,
            confidence: 'high',
            description: `Retrieved from prior workspace conversation "${conv.title}"`,
          });
        }
        if (!resolvedContext.targetCustomer && conv.memory.targetCustomer) {
          resolvedContext.targetCustomer = conv.memory.targetCustomer;
        }
        if (resolvedContext.userCompany && resolvedContext.userProduct) break;
      }
    }

    // =========================================================================
    // STEP 2: SCAN CONVERSATION HISTORY (Anaphora & Implicit Entity Resolution)
    // =========================================================================
    const historyResolution = this.scanConversationHistory(input.conversationHistory, lower);

    if (historyResolution.inferredCompetitor && !resolvedContext.competitor) {
      resolvedContext.competitor = historyResolution.inferredCompetitor;
      contextSources.push({
        source: 'conversation_history',
        key: 'competitor',
        value: historyResolution.inferredCompetitor,
        confidence: 'high',
        description: 'Inferred from preceding messages in conversation thread',
      });
    }

    if (historyResolution.inferredProduct && !resolvedContext.userProduct) {
      resolvedContext.userProduct = historyResolution.inferredProduct;
      contextSources.push({
        source: 'conversation_history',
        key: 'userProduct',
        value: historyResolution.inferredProduct,
        confidence: 'medium',
        description: 'Extracted from conversation history mentions',
      });
    }

    if (historyResolution.priorObjection && !resolvedContext.objection) {
      resolvedContext.objection = historyResolution.priorObjection;
    }

    // =========================================================================
    // STEP 3: ANALYZE RAW PROMPT FOR OVERRIDES & DIRECT ENTITIES
    // =========================================================================
    // Check if prompt explicitly names a competitor
    const directCompetitor = this.findCompetitorInText(raw);
    if (directCompetitor) {
      resolvedContext.competitor = directCompetitor;
      contextSources.push({
        source: 'prompt',
        key: 'competitor',
        value: directCompetitor,
        confidence: 'high',
        description: 'Directly specified in user prompt',
      });
    }

    // Check for explicit user company/product declarations in the prompt
    const declaration = this.detectContextDeclarations(raw);
    if (declaration.userCompany) {
      resolvedContext.userCompany = declaration.userCompany;
      contextSources.push({
        source: 'prompt',
        key: 'userCompany',
        value: declaration.userCompany,
        confidence: 'high',
        description: 'Declared in prompt',
      });
      // Synchronize back to workspace memory
      ChatStorageService.saveWorkspaceMemory(input.workspaceId, { userCompany: declaration.userCompany });
    }
    if (declaration.userProduct) {
      resolvedContext.userProduct = declaration.userProduct;
      contextSources.push({
        source: 'prompt',
        key: 'userProduct',
        value: declaration.userProduct,
        confidence: 'high',
        description: 'Declared in prompt',
      });
      // Synchronize back to workspace memory
      ChatStorageService.saveWorkspaceMemory(input.workspaceId, { userProduct: declaration.userProduct });
    }

    // Check for pricing specifics in prompt
    if (lower.includes('30%') || lower.includes('$69') || lower.includes('cheaper') || lower.includes('discount')) {
      resolvedContext.pricingSignal = 'Observed Price Shift';
      resolvedContext.objection = raw;
    }

    // =========================================================================
    // STEP 4: PRONOUN RESOLUTION (Synthesize Processed Prompt)
    // =========================================================================
    let processedPrompt = raw;
    const activeComp = resolvedContext.competitor;

    if (activeComp && historyResolution.resolvedPronoun) {
      // Replace ambiguous pronouns like "they are 30% cheaper" -> "CloudScale Inc. is 30% cheaper"
      processedPrompt = raw
        .replace(/\bthey\b/gi, activeComp)
        .replace(/\bthem\b/gi, activeComp)
        .replace(/\btheir\b/gi, `${activeComp}'s`)
        .replace(/\bthe competitor\b/gi, activeComp);
    }

    // =========================================================================
    // STEP 5: CHECK VERIFIED WORKSPACE COMPETITOR DATABASE & RETRIEVE DIFFS
    // =========================================================================
    let matchedCompetitorRecord: CompetitorIntelRecord | null = null;
    let verifiedEvidenceSnippet: string | undefined;

    if (resolvedContext.competitor) {
      matchedCompetitorRecord =
        VERIFIED_COMPETITOR_DATABASE.find(
          (c) =>
            c.competitor.toLowerCase() === resolvedContext.competitor.toLowerCase() ||
            c.domain.toLowerCase().includes(resolvedContext.competitor.toLowerCase())
        ) || null;

      if (matchedCompetitorRecord) {
        contextSources.push({
          source: 'competitor_surveillance',
          key: 'verifiedSurveillance',
          value: `${matchedCompetitorRecord.competitor} (${matchedCompetitorRecord.threatLevel} Threat)`,
          confidence: 'high',
          description: `DOM snapshots verified with ${matchedCompetitorRecord.observedChanges.length} documented change(s)`,
        });

        // Pull verified diff summary
        const latestChange = matchedCompetitorRecord.observedChanges[0];
        if (latestChange) {
          verifiedEvidenceSnippet = latestChange.diffSummary;
          resolvedContext.verifiedDiff = latestChange.diffSummary;
          resolvedContext.domHash = latestChange.hash;
        }
      }
    }

    // =========================================================================
    // STEP 6: BUILD EXPLANATORY CONTEXT BADGES FOR UI
    // =========================================================================
    if (resolvedContext.competitor) {
      const isFromHistory = contextSources.some((s) => s.key === 'competitor' && s.source === 'conversation_history');
      contextBadges.push({
        label: 'Competitor',
        value: isFromHistory ? `${resolvedContext.competitor} (from history)` : resolvedContext.competitor,
      });
    }

    if (resolvedContext.userProduct) {
      const isFromWorkspace = contextSources.some((s) => s.key === 'userProduct' && s.source === 'workspace_memory');
      contextBadges.push({
        label: 'Your Product',
        value: isFromWorkspace ? `${resolvedContext.userProduct} (from workspace)` : resolvedContext.userProduct,
      });
    } else if (resolvedContext.userCompany) {
      contextBadges.push({
        label: 'Company',
        value: resolvedContext.userCompany,
      });
    }

    if (matchedCompetitorRecord) {
      contextBadges.push({
        label: 'Surveillance Status',
        value: `Verified DOM Snapshot (${matchedCompetitorRecord.threatLevel})`,
      });
    }

    // Suggested actions
    const suggestedActions = this.computeSuggestedActions(resolvedContext);

    return {
      processedPrompt,
      resolvedContext,
      contextSources,
      contextBadges,
      matchedCompetitorRecord,
      historyResolution,
      verifiedEvidenceSnippet,
      suggestedActions,
    };
  }

  /**
   * Scans previous messages in the conversation thread to identify:
   * - Previously active competitor
   * - Previously stated product or company
   * - Unresolved objections
   * - Pronoun references in current turn
   */
  private static scanConversationHistory(
    history: ChatMessage[],
    currentPromptLower: string
  ): {
    inferredCompetitor?: string;
    inferredProduct?: string;
    resolvedPronoun: boolean;
    referencedPriorChange: boolean;
    priorObjection?: string;
  } {
    let inferredCompetitor: string | undefined;
    let inferredProduct: string | undefined;
    let priorObjection: string | undefined;

    // Detect if current prompt uses pronouns or anaphoric references
    const hasPronouns = /\b(they|them|their|the competitor|that competitor|their pricing|their sla|this competitor)\b/i.test(
      currentPromptLower
    );

    const referencedPriorChange = /\b(that change|the change|the diff|the update|why did they do that|explain that)\b/i.test(
      currentPromptLower
    );

    // Traverse history from newest to oldest
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];

      // Check clarification submitted values if any
      if (msg.clarification?.submittedValues) {
        if (!inferredCompetitor && msg.clarification.submittedValues.competitor) {
          inferredCompetitor = msg.clarification.submittedValues.competitor;
        }
        if (!inferredProduct && msg.clarification.submittedValues.userProduct) {
          inferredProduct = msg.clarification.submittedValues.userProduct;
        }
        if (!priorObjection && msg.clarification.submittedValues.objection) {
          priorObjection = msg.clarification.submittedValues.objection;
        }
      }

      // Check contextBadges if any
      if (msg.contextBadges) {
        for (const badge of msg.contextBadges) {
          if (!inferredCompetitor && badge.label.toLowerCase().includes('competitor')) {
            inferredCompetitor = badge.value.replace(/\s*\(from [^)]+\)/i, '').trim();
          }
          if (!inferredProduct && badge.label.toLowerCase().includes('product')) {
            inferredProduct = badge.value.replace(/\s*\(from [^)]+\)/i, '').trim();
          }
        }
      }

      // Check text mentions of known competitors
      if (!inferredCompetitor && msg.content) {
        const found = this.findCompetitorInText(msg.content);
        if (found) {
          inferredCompetitor = found;
        }
      }

      // Check explicit declarations in prior user messages (e.g. "My company sells CRM software")
      if (msg.role === 'user' && msg.content) {
        const decl = this.detectContextDeclarations(msg.content);
        if (!inferredProduct && decl.userProduct) {
          inferredProduct = decl.userProduct;
        }
      }

      // If we found both, stop scanning
      if (inferredCompetitor && inferredProduct) break;
    }

    return {
      inferredCompetitor,
      inferredProduct,
      resolvedPronoun: hasPronouns && Boolean(inferredCompetitor),
      referencedPriorChange,
      priorObjection,
    };
  }

  /**
   * Finds any known monitored or common competitor in text.
   */
  private static findCompetitorInText(text: string): string | null {
    const lower = text.toLowerCase();

    // Check monitored database first
    for (const comp of VERIFIED_COMPETITOR_DATABASE) {
      if (lower.includes(comp.competitor.toLowerCase()) || lower.includes(comp.domain.toLowerCase())) {
        return comp.competitor;
      }
    }

    // Check other common SaaS competitors
    const commonCompetitors = [
      'Salesforce',
      'HubSpot',
      'Datadog',
      'Snowflake',
      'Dynatrace',
      'New Relic',
      'CloudScale',
      'MetricPulse',
      'NexusData',
      'CrowdStrike',
      'Palo Alto Networks',
      'MongoDB',
      'AWS',
      'Azure',
      'GCP',
      'Workday',
      'ServiceNow',
      'Splunk',
      'Atlassian',
    ];

    for (const name of commonCompetitors) {
      if (lower.includes(name.toLowerCase())) {
        return name;
      }
    }

    // Check regex pattern: "competitor X" or "battlecard for X" or "compare with X"
    const match = text.match(/(?:competitor|versus|vs\.?|rival|battlecard for|battlecard against|pitch against|compare with|compare us with|analyze)\s+([A-Z][A-Za-z0-9&.-]+(?:\s+[A-Z][A-Za-z0-9&.-]+)?)/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  /**
   * Detects explicit declarations of product or company in prompt.
   */
  private static detectContextDeclarations(text: string): { userCompany?: string; userProduct?: string } {
    const res: { userCompany?: string; userProduct?: string } = {};

    const companyMatch = text.match(/(?:my company is|we are|at|our company is)\s+([A-Za-z0-9\s&.-]+?)(?:\.|$|,)/i);
    if (companyMatch && companyMatch[1]) {
      res.userCompany = companyMatch[1].trim();
    }

    const productMatch = text.match(/(?:we sell|our product is|our platform is|we offer|we build)\s+([A-Za-z0-9\s&.-]+?)(?:\.|$|,)/i);
    if (productMatch && productMatch[1]) {
      res.userProduct = productMatch[1].trim();
    }

    return res;
  }

  private static computeSuggestedActions(context: Record<string, string>): string[] {
    const comp = context.competitor || 'the competitor';
    return [
      `Generate Counter-Pitch for ${comp}`,
      `Deep Dive on ${comp} Pricing`,
      `Review ${comp} SLA Fine Print`,
      'Compare with another competitor',
    ];
  }
}
