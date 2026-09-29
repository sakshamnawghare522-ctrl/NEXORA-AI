import {
  TaskIntent,
  ClarificationField,
  ClarificationRequest,
  ChatMessage,
  ConversationMemory,
} from '../types/chat.ts';
import { VERIFIED_COMPETITOR_DATABASE } from './intelligenceContext.ts';

export interface EvaluationResult {
  needsClarification: boolean;
  intent: TaskIntent;
  clarificationRequest?: ClarificationRequest;
  extractedContext: Record<string, string>;
  isContextUpdateOnly?: boolean;
  contextUpdateAcknowledgment?: string;
  suggestedActions?: string[];
}

// Monitored competitors list for smart chips
const MONITORED_COMPETITOR_NAMES = VERIFIED_COMPETITOR_DATABASE.map((c) => c.competitor);

export class ClarificationEngine {
  /**
   * Evaluates a user message against conversation history and memory.
   * Determines intent, gathers known context, identifies missing critical fields,
   * and decides whether to ask targeted questions or proceed directly to generation.
   */
  static evaluateRequest(
    userPrompt: string,
    history: ChatMessage[],
    memory: ConversationMemory = {},
    userProfile?: { name?: string; company?: string; role?: string },
    preprocessedContext?: Record<string, string>
  ): EvaluationResult {
    const raw = userPrompt.trim();
    const lower = raw.toLowerCase();

    // 1. Detect if the user is declaring their company or product context directly
    const contextDeclaration = this.detectContextDeclaration(raw);
    if (contextDeclaration) {
      return {
        needsClarification: false,
        intent: 'GENERAL_QA',
        isContextUpdateOnly: true,
        extractedContext: contextDeclaration,
        contextUpdateAcknowledgment: this.formatContextAcknowledgment(contextDeclaration),
        suggestedActions: [
          'Create a competitor battlecard',
          'Analyze our main competitor',
          'My competitor is cheaper. What should I say?',
        ],
      };
    }

    // 2. Classify task intent
    const intent = this.classifyIntent(lower);

    // 3. Extract entities from current prompt
    const promptEntities = this.extractEntitiesFromPrompt(raw);

    // 4. Merge known context across (user profile -> memory -> prompt -> preprocessed context)
    const knownContext: Record<string, string> = {};

    // From user profile
    if (userProfile?.company && !userProfile.company.toLowerCase().includes('workspace')) {
      knownContext.userCompany = userProfile.company;
    }

    // From conversation memory
    if (memory.userCompany) knownContext.userCompany = memory.userCompany;
    if (memory.userProduct) knownContext.userProduct = memory.userProduct;
    if (memory.targetCustomer) knownContext.targetCustomer = memory.targetCustomer;
    if (memory.activeCompetitor) knownContext.competitor = memory.activeCompetitor;
    if (memory.keyDifferentiators && memory.keyDifferentiators.length > 0) {
      knownContext.differentiators = memory.keyDifferentiators.join(', ');
    }

    // From current message entities
    Object.assign(knownContext, promptEntities);

    // From context-aware preprocessing layer (workspace data & conversation history)
    if (preprocessedContext) {
      Object.assign(knownContext, preprocessedContext);
    }

    // 5. Determine missing critical fields based on intent
    const fieldsToAsk: ClarificationField[] = [];

    switch (intent) {
      case 'BATTLECARD': {
        // Need: Competitor, User's Product
        if (!knownContext.competitor) {
          fieldsToAsk.push({
            id: 'competitor',
            label: 'Competitor Name',
            why: 'Allows Nexora to retrieve verified DOM diffs, pricing shifts, and product matrices.',
            type: 'chips',
            options: [...MONITORED_COMPETITOR_NAMES, 'Other Competitor...'],
            placeholder: 'e.g. CloudScale Inc. or type custom',
            required: true,
          });
        }

        if (!knownContext.userProduct && !knownContext.userCompany) {
          fieldsToAsk.push({
            id: 'userProduct',
            label: 'Your Product / Offering',
            why: 'Contrasts their unbundled fees or rate limits against your actual enterprise solution.',
            type: 'text',
            placeholder: 'e.g. Enterprise Cloud DB, Apex CRM, or Compliance Suite',
            required: true,
          });
        }

        // Optional target customer chip
        if (!knownContext.targetCustomer) {
          fieldsToAsk.push({
            id: 'targetCustomer',
            label: 'Target Customer Segment (Optional)',
            why: 'Tuning battlecards for SMBs focuses on simplicity; enterprise focuses on SLAs and compliance.',
            type: 'chips',
            options: ['Enterprise (1,000+)', 'Mid-Market (100-999)', 'SMB (<100)', 'All Segments'],
            required: false,
          });
        }
        break;
      }

      case 'COUNTER_PITCH': {
        // Need: Competitor, Specific Objection/Price
        if (!knownContext.competitor) {
          fieldsToAsk.push({
            id: 'competitor',
            label: 'Competitor Name',
            why: 'Identifies whether their price reduction unbundled critical enterprise SLAs or backups.',
            type: 'chips',
            options: [...MONITORED_COMPETITOR_NAMES, 'Other Competitor...'],
            placeholder: 'e.g. CloudScale Inc.',
            required: true,
          });
        }

        if (!knownContext.objection && !lower.includes('cheaper') && !lower.includes('price')) {
          fieldsToAsk.push({
            id: 'objection',
            label: 'Customer Objection or Claim',
            why: 'Generates the exact mathematical and positioning counter-script for your sales conversation.',
            type: 'text',
            placeholder: 'e.g. "They dropped their price 30%" or "They offer free automated SOC-2"',
            required: true,
          });
        }

        if (!knownContext.userProduct && !knownContext.userCompany) {
          fieldsToAsk.push({
            id: 'userProduct',
            label: 'Your Product / Value Proposition (Optional)',
            why: 'Positions your all-inclusive enterprise model against their unbundled line items.',
            type: 'text',
            placeholder: 'e.g. Flat-rate all-inclusive cloud data platform',
            required: false,
          });
        }
        break;
      }

      case 'COMPETITOR_ANALYSIS': {
        if (!knownContext.competitor) {
          fieldsToAsk.push({
            id: 'competitor',
            label: 'Competitor Name',
            why: 'Directs Nexora surveillance snapshots and AST diff comparison.',
            type: 'chips',
            options: [...MONITORED_COMPETITOR_NAMES, 'Other Competitor...'],
            placeholder: 'e.g. MetricPulse, CloudScale, or NexusData',
            required: true,
          });
        }

        fieldsToAsk.push({
          id: 'focusArea',
          label: 'Analysis Focus Area (Optional)',
          why: 'Focuses the analysis on what matters most for your sales cycle.',
          type: 'chips',
          options: ['Pricing & Packaging Shifts', 'Feature Changes', 'Security & Compliance', 'Full Strategic Analysis'],
          required: false,
        });

        if (!knownContext.userProduct && !knownContext.userCompany) {
          fieldsToAsk.push({
            id: 'userProduct',
            label: 'Your Product (Optional)',
            why: 'Enables direct side-by-side positioning comparisons.',
            type: 'text',
            placeholder: 'e.g. Cloud Infrastructure / Data Ingestion',
            required: false,
          });
        }
        break;
      }

      case 'COMPETITOR_CHANGE_ANALYSIS': {
        if (!knownContext.competitor) {
          fieldsToAsk.push({
            id: 'competitor',
            label: 'Competitor to Inspect',
            why: 'Identifies the snapshot records and commit hashes to compare.',
            type: 'chips',
            options: [...MONITORED_COMPETITOR_NAMES, 'Other Competitor...'],
            placeholder: 'e.g. CloudScale Inc.',
            required: true,
          });
        }
        break;
      }

      case 'GENERAL_QA':
      default: {
        // Simple/factual questions do NOT require clarification
        break;
      }
    }

    // Limit to maximum 3 questions
    const finalFields = fieldsToAsk.slice(0, 3);
    const hasRequiredMissing = finalFields.some((f) => f.required);

    // If no required fields are missing, proceed immediately!
    if (!hasRequiredMissing || finalFields.length === 0) {
      return {
        needsClarification: false,
        intent,
        extractedContext: knownContext,
        suggestedActions: this.getSuggestedActionsForIntent(intent, knownContext),
      };
    }

    // Build the conversational lead explanation
    const leadExplanation = this.buildLeadExplanation(intent, knownContext, finalFields);

    const clarificationRequest: ClarificationRequest = {
      id: `clarify_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      intent,
      intentTitle: this.getIntentTitle(intent),
      leadExplanation,
      fields: finalFields,
      knownContext,
      isCompleted: false,
    };

    return {
      needsClarification: true,
      intent,
      clarificationRequest,
      extractedContext: knownContext,
      suggestedActions: this.getSuggestedActionsForIntent(intent, knownContext),
    };
  }

  /**
   * Detects if the user prompt is a statement providing background context.
   */
  private static detectContextDeclaration(prompt: string): Record<string, string> | null {
    const p = prompt.trim();
    const lower = p.toLowerCase();

    // Check for company/product declaration patterns
    const companyMatch = p.match(/(?:my company is|we are|i work at|our company is)\s+([A-Za-z0-9\s&.-]+?)(?:\.|$|,)/i);
    const productMatch = p.match(/(?:we sell|our product is|our platform is|we offer|we build)\s+([A-Za-z0-9\s&.-]+?)(?:\.|$|,)/i);

    if (
      (companyMatch || productMatch) &&
      !lower.startsWith('analyze') &&
      !lower.startsWith('create') &&
      !lower.startsWith('compare') &&
      !lower.includes('what should i say') &&
      !lower.includes('battlecard')
    ) {
      const result: Record<string, string> = {};
      if (companyMatch) result.userCompany = companyMatch[1].trim();
      if (productMatch) result.userProduct = productMatch[1].trim();
      return Object.keys(result).length > 0 ? result : null;
    }

    return null;
  }

  private static formatContextAcknowledgment(context: Record<string, string>): string {
    const parts: string[] = [];
    if (context.userCompany) parts.push(`**${context.userCompany}**`);
    if (context.userProduct) parts.push(`offering **${context.userProduct}**`);

    return `Got it! I've saved your context as ${parts.join(' ')}. Nexora will remember this and automatically apply it to all your competitive comparisons, battlecards, and sales counter-pitches without asking again.`;
  }

  /**
   * Classifies user intent into distinct tactical workflows.
   */
  private static classifyIntent(lower: string): TaskIntent {
    if (
      lower.includes('battlecard') ||
      lower.includes('cheat sheet') ||
      lower.includes('kill sheet') ||
      lower.includes('pitch card')
    ) {
      return 'BATTLECARD';
    }

    if (
      lower.includes('cheaper') ||
      lower.includes('price objection') ||
      lower.includes('what should i say') ||
      lower.includes('counter-pitch') ||
      lower.includes('counter pitch') ||
      lower.includes('handle objection') ||
      lower.includes('they offer') ||
      lower.includes('they claimed') ||
      lower.includes('they said')
    ) {
      return 'COUNTER_PITCH';
    }

    if (
      lower.includes('what changed') ||
      lower.includes('site update') ||
      lower.includes('pricing change') ||
      lower.includes('diff') ||
      lower.includes('changelog') ||
      lower.includes('recent update')
    ) {
      return 'COMPETITOR_CHANGE_ANALYSIS';
    }

    if (
      lower.includes('analyze') ||
      lower.includes('compare') ||
      lower.includes('versus') ||
      lower.includes(' vs ') ||
      lower.includes('breakdown') ||
      lower.includes('evaluation') ||
      lower.includes('intelligence on')
    ) {
      return 'COMPETITOR_ANALYSIS';
    }

    return 'GENERAL_QA';
  }

  /**
   * Extracts entities directly present in the prompt.
   */
  private static extractEntitiesFromPrompt(prompt: string): Record<string, string> {
    const entities: Record<string, string> = {};
    const lower = prompt.toLowerCase();

    // Check for monitored competitors
    for (const comp of VERIFIED_COMPETITOR_DATABASE) {
      const compLower = comp.competitor.toLowerCase();
      const domainLower = comp.domain.toLowerCase();
      if (lower.includes(compLower) || lower.includes(domainLower)) {
        entities.competitor = comp.competitor;
        break;
      }
    }

    // Check common industry competitors if mentioned
    if (!entities.competitor) {
      const commonNames = ['Salesforce', 'HubSpot', 'Datadog', 'Snowflake', 'Dynatrace', 'New Relic', 'CloudScale', 'MetricPulse', 'NexusData'];
      for (const name of commonNames) {
        if (lower.includes(name.toLowerCase())) {
          entities.competitor = name;
          break;
        }
      }
    }

    // Check for explicit competitor mentions: "competitor X"
    if (!entities.competitor) {
      const compRegex = /(?:competitor|rival|competing against|compare with|versus|vs\.?)\s+([A-Z][A-Za-z0-9&.-]+(?:\s+[A-Z][A-Za-z0-9&.-]+)?)/i;
      const match = prompt.match(compRegex);
      if (match && match[1]) {
        entities.competitor = match[1].trim();
      }
    }

    // Check for pricing specifics in prompt
    if (lower.includes('30%') || lower.includes('$69') || lower.includes('cheaper') || lower.includes('discount')) {
      entities.pricingSignal = 'Price Reduction';
      entities.objection = prompt;
    }

    // Check for user company declaration in prompt
    const companyMatch = prompt.match(/(?:my company is|we are|at)\s+([A-Za-z0-9\s&.-]+?)(?:\.|$|,)/i);
    if (companyMatch) {
      entities.userCompany = companyMatch[1].trim();
    }

    return entities;
  }

  private static getIntentTitle(intent: TaskIntent): string {
    switch (intent) {
      case 'BATTLECARD':
        return 'Sales Battlecard Request';
      case 'COUNTER_PITCH':
        return 'Tactical Counter-Pitch Request';
      case 'COMPETITOR_ANALYSIS':
        return 'Competitor Strategic Analysis';
      case 'COMPETITOR_CHANGE_ANALYSIS':
        return 'Competitor Change Verification';
      case 'GENERAL_QA':
      default:
        return 'Strategic Inquiry';
    }
  }

  private static buildLeadExplanation(
    intent: TaskIntent,
    knownContext: Record<string, string>,
    fields: ClarificationField[]
  ): string {
    const count = fields.length;
    const countStr = count === 1 ? 'one key detail' : `${count} quick details`;

    if (intent === 'BATTLECARD') {
      if (knownContext.competitor) {
        return `I can create an executive battlecard against **${knownContext.competitor}**. To tailor the differentiation and objections to your deal, I need ${countStr}:`;
      }
      return `I can create an actionable sales battlecard for you. Before I generate it, I need ${countStr} to ensure the intelligence is accurate to your deal:`;
    }

    if (intent === 'COUNTER_PITCH') {
      if (knownContext.competitor) {
        return `I can formulate a high-impact counter-pitch against **${knownContext.competitor}**. Before generating the response, clarify ${countStr}:`;
      }
      return `I can craft an immediate counter-pitch script for your conversation. Before I generate it, tell me ${countStr}:`;
    }

    if (intent === 'COMPETITOR_ANALYSIS') {
      return `I can run a full competitive analysis for you. To focus on the most relevant tactical insights, clarify ${countStr}:`;
    }

    if (intent === 'COMPETITOR_CHANGE_ANALYSIS') {
      return `I can inspect our surveillance DOM snapshots and diff logs. Please confirm ${countStr}:`;
    }

    return `I want to give you an accurate, evidence-backed answer. Please confirm ${countStr}:`;
  }

  static getSuggestedActionsForIntent(intent: TaskIntent, context: Record<string, string>): string[] {
    const comp = context.competitor || 'the competitor';
    switch (intent) {
      case 'BATTLECARD':
        return [
          `Generate Counter-Pitch for ${comp}`,
          `Deep Dive on ${comp} Pricing`,
          'Analyze another competitor',
        ];
      case 'COUNTER_PITCH':
        return [
          `Build Full Battlecard for ${comp}`,
          `Review ${comp} SLA Fine Print`,
          'Killer follow-up questions',
        ];
      case 'COMPETITOR_ANALYSIS':
        return [
          `Generate Sales Battlecard for ${comp}`,
          `Compare Feature Matrices`,
          `Check ${comp} Pricing Shifts`,
        ];
      case 'COMPETITOR_CHANGE_ANALYSIS':
        return [
          `Generate Counter-Pitch on this change`,
          `Add ${comp} to Live Watchlist`,
          'View raw AST diff',
        ];
      case 'GENERAL_QA':
      default:
        return [
          'Create a competitor battlecard',
          'My competitor is cheaper. What should I say?',
          'Analyze monitored competitors',
        ];
    }
  }
}
