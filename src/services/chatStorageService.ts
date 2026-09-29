import { supabase, isSupabaseConfigured } from './supabase.ts';
import { Conversation, ChatMessage, MessageRole, ConversationMemory } from '../types/chat.ts';

export interface WorkspaceMemory {
  userCompany?: string;
  userProduct?: string;
  targetCustomer?: string;
  keyDifferentiators?: string[];
  activeCompetitors?: string[];
  notes?: Record<string, string>;
  lastUpdated?: string;
}

const DEMO_CONVERSATIONS_KEY_PREFIX = 'nexora_conversations_';
const DEMO_MESSAGES_KEY_PREFIX = 'nexora_messages_';
const DEMO_WORKSPACE_MEMORY_KEY_PREFIX = 'nexora_workspace_memory_';

export class ChatStorageService {
  private static getStorageKey(prefix: string, userId: string, workspaceId: string): string {
    return `${prefix}${userId}_${workspaceId}`;
  }

  // --- CONVERSATIONS ---

  static async listConversations(userId: string, workspaceId: string): Promise<Conversation[]> {
    if (isSupabaseConfigured() && supabase && !userId.startsWith('usr_demo')) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('workspace_id', workspaceId)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          return data.map((d) => ({
            id: d.id,
            workspaceId: d.workspace_id,
            userId: d.user_id,
            title: d.title,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            memory: d.memory || {},
          }));
        }
      } catch (e) {
        console.warn('[NexoraChat] Supabase listConversations fallback to local', e);
      }
    }

    // Local / Demo storage
    try {
      const key = this.getStorageKey(DEMO_CONVERSATIONS_KEY_PREFIX, userId, workspaceId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: Conversation[] = JSON.parse(raw);
        return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
    } catch (e) {
      console.warn('[NexoraChat] Error reading local conversations', e);
    }

    return [];
  }

  static async createConversation(
    userId: string,
    workspaceId: string,
    initialTitle = 'New Conversation',
    initialMemory: ConversationMemory = {}
  ): Promise<Conversation> {
    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      workspaceId,
      userId,
      title: initialTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memory: initialMemory,
    };

    if (isSupabaseConfigured() && supabase && !userId.startsWith('usr_demo')) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            workspace_id: workspaceId,
            user_id: userId,
            title: initialTitle,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            workspaceId: data.workspace_id,
            userId: data.user_id,
            title: data.title,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            memory: initialMemory,
          };
        }
      } catch (e) {
        console.warn('[NexoraChat] Supabase createConversation error, falling back to local', e);
      }
    }

    // Local / Demo persistence
    try {
      const key = this.getStorageKey(DEMO_CONVERSATIONS_KEY_PREFIX, userId, workspaceId);
      const existing = await this.listConversations(userId, workspaceId);
      const updated = [newConv, ...existing];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('[NexoraChat] Failed to save conversation locally', e);
    }

    return newConv;
  }

  static async updateConversationMemory(
    userId: string,
    workspaceId: string,
    conversationId: string,
    deltaMemory: Partial<ConversationMemory>
  ): Promise<ConversationMemory> {
    const key = this.getStorageKey(DEMO_CONVERSATIONS_KEY_PREFIX, userId, workspaceId);
    let updatedMemory: ConversationMemory = {};

    try {
      const convList = await this.listConversations(userId, workspaceId);
      const conv = convList.find((c) => c.id === conversationId);
      if (conv) {
        conv.memory = { ...(conv.memory || {}), ...deltaMemory };
        conv.updatedAt = new Date().toISOString();
        updatedMemory = conv.memory;
        localStorage.setItem(key, JSON.stringify(convList));
      }
    } catch (e) {
      console.warn('[NexoraChat] Failed to update conversation memory', e);
    }

    return updatedMemory;
  }

  // --- WORKSPACE MEMORY (Cross-Session Context) ---

  static getWorkspaceMemory(workspaceId: string): WorkspaceMemory {
    try {
      const raw = localStorage.getItem(`${DEMO_WORKSPACE_MEMORY_KEY_PREFIX}${workspaceId}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('[NexoraChat] Failed to retrieve workspace memory', e);
      return {};
    }
  }

  static saveWorkspaceMemory(workspaceId: string, delta: Partial<WorkspaceMemory>): WorkspaceMemory {
    try {
      const current = this.getWorkspaceMemory(workspaceId);
      const updated: WorkspaceMemory = {
        ...current,
        ...delta,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        `${DEMO_WORKSPACE_MEMORY_KEY_PREFIX}${workspaceId}`,
        JSON.stringify(updated)
      );
      return updated;
    } catch (e) {
      console.warn('[NexoraChat] Failed to save workspace memory', e);
      return delta;
    }
  }

  static async renameConversation(
    userId: string,
    workspaceId: string,
    conversationId: string,
    newTitle: string
  ): Promise<void> {
    const trimmed = newTitle.trim() || 'Untitled Conversation';

    if (isSupabaseConfigured() && supabase && !userId.startsWith('usr_demo')) {
      try {
        await supabase
          .from('conversations')
          .update({ title: trimmed, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        return;
      } catch (e) {
        console.warn('[NexoraChat] Supabase renameConversation error', e);
      }
    }

    try {
      const key = this.getStorageKey(DEMO_CONVERSATIONS_KEY_PREFIX, userId, workspaceId);
      const list = await this.listConversations(userId, workspaceId);
      const target = list.find((c) => c.id === conversationId);
      if (target) {
        target.title = trimmed;
        target.updatedAt = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('[NexoraChat] Failed to rename local conversation', e);
    }
  }

  static async deleteConversation(
    userId: string,
    workspaceId: string,
    conversationId: string
  ): Promise<void> {
    if (isSupabaseConfigured() && supabase && !userId.startsWith('usr_demo')) {
      try {
        await supabase.from('conversations').delete().eq('id', conversationId);
        return;
      } catch (e) {
        console.warn('[NexoraChat] Supabase deleteConversation error', e);
      }
    }

    try {
      const convKey = this.getStorageKey(DEMO_CONVERSATIONS_KEY_PREFIX, userId, workspaceId);
      const list = await this.listConversations(userId, workspaceId);
      const filtered = list.filter((c) => c.id !== conversationId);
      localStorage.setItem(convKey, JSON.stringify(filtered));

      // Remove messages too
      localStorage.removeItem(`${DEMO_MESSAGES_KEY_PREFIX}${conversationId}`);
    } catch (e) {
      console.warn('[NexoraChat] Failed to delete local conversation', e);
    }
  }

  // --- MESSAGES ---

  static async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (isSupabaseConfigured() && supabase && !conversationId.startsWith('conv_')) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data.map((m) => ({
            id: m.id,
            conversationId: m.conversation_id,
            role: m.role as MessageRole,
            content: m.content,
            createdAt: m.created_at,
          }));
        }
      } catch (e) {
        console.warn('[NexoraChat] Supabase getMessages error', e);
      }
    }

    try {
      const raw = localStorage.getItem(`${DEMO_MESSAGES_KEY_PREFIX}${conversationId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[NexoraChat] Failed to load local messages', e);
    }

    return [];
  }

  static async addMessage(
    userId: string,
    workspaceId: string,
    conversationId: string,
    role: MessageRole,
    content: string,
    extra?: Partial<ChatMessage>
  ): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      conversationId,
      role,
      content,
      createdAt: new Date().toISOString(),
      ...extra,
    };

    if (isSupabaseConfigured() && supabase && !conversationId.startsWith('conv_')) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role,
            content,
          })
          .select()
          .single();

        // Touch updated_at on conversation
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        if (!error && data) {
          return {
            id: data.id,
            conversationId: data.conversation_id,
            role: data.role as MessageRole,
            content: data.content,
            createdAt: data.created_at,
            ...extra,
          };
        }
      } catch (e) {
        console.warn('[NexoraChat] Supabase addMessage error, persisting locally', e);
      }
    }

    try {
      const current = await this.getMessages(conversationId);
      const updated = [...current, newMessage];
      localStorage.setItem(`${DEMO_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(updated));

      // Update conversation timestamp
      const convKey = this.getStorageKey(DEMO_CONVERSATIONS_KEY_PREFIX, userId, workspaceId);
      const convList = await this.listConversations(userId, workspaceId);
      const targetConv = convList.find((c) => c.id === conversationId);
      if (targetConv) {
        targetConv.updatedAt = new Date().toISOString();
        targetConv.lastMessageSnippet = content.slice(0, 60);
        targetConv.messageCount = updated.length;
        localStorage.setItem(convKey, JSON.stringify(convList));
      }
    } catch (e) {
      console.warn('[NexoraChat] Failed to append message locally', e);
    }

    return newMessage;
  }

  static async updateMessage(
    conversationId: string,
    messageId: string,
    patch: Partial<ChatMessage>
  ): Promise<void> {
    try {
      const current = await this.getMessages(conversationId);
      const updated = current.map((msg) => (msg.id === messageId ? { ...msg, ...patch } : msg));
      localStorage.setItem(`${DEMO_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('[NexoraChat] Failed to update message locally', e);
    }
  }

  static async clearMessages(conversationId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase && !conversationId.startsWith('conv_')) {
      try {
        await supabase.from('messages').delete().eq('conversation_id', conversationId);
        return;
      } catch (e) {
        console.warn('[NexoraChat] Supabase clearMessages error', e);
      }
    }

    try {
      localStorage.removeItem(`${DEMO_MESSAGES_KEY_PREFIX}${conversationId}`);
    } catch (e) {
      console.warn('[NexoraChat] Failed to clear messages locally', e);
    }
  }

  static generateAutoTitle(firstUserMessage: string): string {
    const cleaned = firstUserMessage.replace(/[^\w\s-]/gi, '').trim();
    if (!cleaned) return 'New Conversation';
    const words = cleaned.split(/\s+/);
    if (words.length <= 5) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return words.slice(0, 5).join(' ') + '...';
  }
}
