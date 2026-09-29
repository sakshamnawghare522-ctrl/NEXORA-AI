export type MessageRole = 'user' | 'assistant' | 'system';

export type TaskIntent =
  | 'BATTLECARD'
  | 'COUNTER_PITCH'
  | 'COMPETITOR_ANALYSIS'
  | 'COMPETITOR_CHANGE_ANALYSIS'
  | 'GENERAL_QA';

export interface ClarificationField {
  id: string;
  label: string;
  why: string;
  type: 'text' | 'select' | 'chips' | 'url' | 'number';
  placeholder?: string;
  options?: string[];
  required: boolean;
  defaultValue?: string;
}

export interface ClarificationRequest {
  id: string;
  intent: TaskIntent;
  intentTitle: string;
  leadExplanation: string;
  fields: ClarificationField[];
  knownContext: Record<string, string>;
  isCompleted?: boolean;
  submittedValues?: Record<string, string>;
}

export interface ContextBadge {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  isError?: boolean;
  clarification?: ClarificationRequest;
  contextBadges?: ContextBadge[];
  actionSuggestions?: string[];
}

export interface ConversationMemory {
  userCompany?: string;
  userProduct?: string;
  targetCustomer?: string;
  activeCompetitor?: string;
  competitorsMentioned?: string[];
  keyDifferentiators?: string[];
  pricingNotes?: string;
  lastIntent?: TaskIntent;
  [key: string]: any;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
  messageCount?: number;
  memory?: ConversationMemory;
}

export interface ChatApiStreamPayload {
  conversationId: string;
  messages: Array<{ role: MessageRole; content: string }>;
  userContext?: {
    userId: string;
    userName: string;
    workspaceName: string;
    userRole: string;
  };
  gatheredContext?: Record<string, string>;
  taskIntent?: TaskIntent;
}

export interface StarterPrompt {
  id: string;
  title: string;
  prompt: string;
  iconName: 'zap' | 'shield' | 'trending-up' | 'file-text' | 'crosshair';
  category: 'Competitive Diff' | 'Battlecard' | 'Objection Handling' | 'Executive Brief' | 'Tactical';
}
