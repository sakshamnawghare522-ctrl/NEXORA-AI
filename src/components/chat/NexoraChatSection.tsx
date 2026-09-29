import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PanelLeft,
  Plus,
  RefreshCw,
  Sparkles,
  Database,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Conversation, ChatMessage } from '../../types/chat.ts';
import { ChatStorageService, WorkspaceMemory } from '../../services/chatStorageService.ts';
import { ChatApiService } from '../../services/chatApiService.ts';
import { ClarificationEngine } from '../../services/clarificationEngine.ts';
import { ChatPreprocessingLayer, PreprocessingResult } from '../../services/chatPreprocessingLayer.ts';
import { VERIFIED_COMPETITOR_DATABASE } from '../../services/intelligenceContext.ts';
import { ContextBadge } from '../../types/chat.ts';
import { ChatSidebar } from './ChatSidebar.tsx';
import { ChatMessageItem } from './ChatMessageItem.tsx';
import { ChatWelcomeScreen } from './ChatWelcomeScreen.tsx';
import { ChatInput } from './ChatInput.tsx';

export const NexoraChatSection: React.FC = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const userId = user?.id || 'usr_demo_ae_01';
  const workspaceId = user?.company || 'Primary Workspace';

  // Workspace Memory & Context Profile State
  const [workspaceMem, setWorkspaceMem] = useState<WorkspaceMemory>(() =>
    ChatStorageService.getWorkspaceMemory(workspaceId)
  );
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextFormCompany, setContextFormCompany] = useState(workspaceMem.userCompany || '');
  const [contextFormProduct, setContextFormProduct] = useState(workspaceMem.userProduct || '');
  const [contextFormTargetCustomer, setContextFormTargetCustomer] = useState(workspaceMem.targetCustomer || '');
  const [contextSavedNotice, setContextSavedNotice] = useState(false);

  // Sync workspace memory state when workspaceId or user changes
  useEffect(() => {
    const mem = ChatStorageService.getWorkspaceMemory(workspaceId);
    setWorkspaceMem(mem);
    setContextFormCompany(
      mem.userCompany || (user?.company && !user.company.includes('Workspace') ? user.company : '')
    );
    setContextFormProduct(mem.userProduct || '');
    setContextFormTargetCustomer(mem.targetCustomer || '');
  }, [workspaceId, user]);

  const refreshWorkspaceMem = useCallback(() => {
    const mem = ChatStorageService.getWorkspaceMemory(workspaceId);
    setWorkspaceMem(mem);
  }, [workspaceId]);

  const handleSaveWorkspaceContext = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = ChatStorageService.saveWorkspaceMemory(workspaceId, {
      userCompany: contextFormCompany.trim() || undefined,
      userProduct: contextFormProduct.trim() || undefined,
      targetCustomer: contextFormTargetCustomer.trim() || undefined,
    });
    setWorkspaceMem(updated);
    setContextSavedNotice(true);
    setTimeout(() => {
      setContextSavedNotice(false);
      setShowContextModal(false);
    }, 700);
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AE';

  // Auto-scroll to bottom of message thread
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  // 1. Load conversations on mount or user change
  const reloadConversations = useCallback(async () => {
    try {
      const list = await ChatStorageService.listConversations(userId, workspaceId);
      setConversations(list);
      return list;
    } catch (e) {
      console.warn('[NexoraChat] Error loading conversations', e);
      return [];
    }
  }, [userId, workspaceId]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const list = await reloadConversations();
      if (!mounted) return;
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [reloadConversations]);

  // 2. Load messages whenever activeConversationId changes
  useEffect(() => {
    let mounted = true;
    async function loadConvMessages() {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }
      setIsLoadingMessages(true);
      try {
        const msgs = await ChatStorageService.getMessages(activeConversationId);
        if (mounted) {
          setMessages(msgs);
          setTimeout(() => scrollToBottom('auto'), 80);
        }
      } finally {
        if (mounted) {
          setIsLoadingMessages(false);
        }
      }
    }
    loadConvMessages();
    return () => {
      mounted = false;
    };
  }, [activeConversationId]);

  // 3. Start New Conversation
  const handleNewConversation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  // Helper to stream final intelligence response given a conversation and gathered context
  const executeIntelligenceStream = async (
    currentConvId: string,
    historyMessages: ChatMessage[],
    gatheredContext: Record<string, string>,
    promptSummary: string,
    actionSuggestions?: string[],
    preprocessedBadges?: ContextBadge[]
  ) => {
    // Generate context badges showing origins (workspace data, conversation history, verified surveillance)
    const contextBadges: ContextBadge[] =
      preprocessedBadges && preprocessedBadges.length > 0
        ? preprocessedBadges
        : Object.entries(gatheredContext).map(([k, v]) => ({
            label: k.replace(/([A-Z])/g, ' $1').trim(),
            value: v,
          }));

    const assistantPlaceholder: ChatMessage = {
      id: `stream_${Date.now()}`,
      conversationId: currentConvId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
      contextBadges,
    };

    setMessages([...historyMessages, assistantPlaceholder]);
    setIsGenerating(true);
    setTimeout(() => scrollToBottom('smooth'), 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulated = '';

    try {
      const historyForApi = [
        ...historyMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: promptSummary },
      ];

      await ChatApiService.streamChat(
        {
          conversationId: currentConvId,
          messages: historyForApi,
          userContext: {
            userId,
            userName: user?.name || 'Sales Representative',
            workspaceName: workspaceId,
            userRole: user?.role || 'Account Executive',
          },
          gatheredContext,
        },
        (token) => {
          accumulated += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholder.id
                ? { ...msg, content: accumulated }
                : msg
            )
          );
          scrollToBottom('smooth');
        },
        controller.signal
      );

      // Save assistant message in persistent storage
      const savedAssistantMsg = await ChatStorageService.addMessage(
        userId,
        workspaceId,
        currentConvId,
        'assistant',
        accumulated,
        {
          actionSuggestions,
          contextBadges: assistantPlaceholder.contextBadges,
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id ? savedAssistantMsg : msg
        )
      );

      await reloadConversations();
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        if (accumulated.trim()) {
          const savedMsg = await ChatStorageService.addMessage(
            userId,
            workspaceId,
            currentConvId,
            'assistant',
            accumulated
          );
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholder.id ? savedMsg : msg
            )
          );
          await reloadConversations();
        } else {
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantPlaceholder.id));
        }
        return;
      }

      console.error('[NexoraChat] Error in chat streaming', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id
            ? {
                ...msg,
                isStreaming: false,
                isError: true,
                content: 'An error occurred while connecting to the Nexora intelligence engine. Please check your connection and retry.',
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // 4. Send Message (Input-First Evaluation with Context-Aware Preprocessing Layer)
  const handleSendMessage = useCallback(
    async (textToSend?: string, isRegeneration = false) => {
      const content = (textToSend || input).trim();
      if (!content || isGenerating) return;

      setInput('');

      let currentConvId = activeConversationId;
      let activeConv = conversations.find((c) => c.id === currentConvId);

      // Create conversation if first message
      if (!currentConvId) {
        const autoTitle = ChatStorageService.generateAutoTitle(content);
        const newConv = await ChatStorageService.createConversation(userId, workspaceId, autoTitle);
        currentConvId = newConv.id;
        activeConv = newConv;
        setActiveConversationId(newConv.id);
        await reloadConversations();
      }

      const baseMessages = isRegeneration && messages.length > 0 && messages[messages.length - 1].role === 'assistant'
        ? messages.slice(0, -1)
        : messages;

      // Add user message if not regeneration
      let userMsg: ChatMessage | null = null;
      if (!isRegeneration) {
        userMsg = await ChatStorageService.addMessage(
          userId,
          workspaceId,
          currentConvId,
          'user',
          content
        );
      }

      const updatedHistory = userMsg ? [...baseMessages, userMsg] : baseMessages;

      // =========================================================================
      // CONTEXT-AWARE PREPROCESSING LAYER
      // Deeply inspects existing workspace data and conversation history
      // BEFORE triggering new AI requests or asking redundant questions.
      // =========================================================================
      const preprocessed: PreprocessingResult = ChatPreprocessingLayer.preprocess({
        rawPrompt: content,
        conversationHistory: updatedHistory,
        currentConversationMemory: activeConv?.memory,
        workspaceId,
        userId,
        userProfile: user ? { name: user.name, company: user.company, role: user.role } : undefined,
        allWorkspaceConversations: conversations,
      });

      // Synchronize any newly discovered context back to workspace-level memory
      if (preprocessed.resolvedContext.userCompany || preprocessed.resolvedContext.userProduct) {
        ChatStorageService.saveWorkspaceMemory(workspaceId, {
          userCompany: preprocessed.resolvedContext.userCompany,
          userProduct: preprocessed.resolvedContext.userProduct,
          targetCustomer: preprocessed.resolvedContext.targetCustomer,
          keyDifferentiators: preprocessed.resolvedContext.differentiators
            ? preprocessed.resolvedContext.differentiators.split(',').map((s) => s.trim())
            : undefined,
        });
        refreshWorkspaceMem();
      }

      // Merge preprocessed context with session memory
      const currentMemory = {
        ...(activeConv?.memory || {}),
        ...preprocessed.resolvedContext,
      };

      // Run Input-First Evaluation using preprocessed context
      const evaluation = ClarificationEngine.evaluateRequest(
        preprocessed.processedPrompt,
        updatedHistory,
        currentMemory,
        user ? { name: user.name, company: user.company, role: user.role } : undefined,
        preprocessed.resolvedContext
      );

      // CASE A: User is declaring company/product context directly (e.g. "My company sells CRM software")
      if (evaluation.isContextUpdateOnly) {
        await ChatStorageService.updateConversationMemory(
          userId,
          workspaceId,
          currentConvId,
          evaluation.extractedContext
        );

        ChatStorageService.saveWorkspaceMemory(workspaceId, {
          userCompany: evaluation.extractedContext.userCompany,
          userProduct: evaluation.extractedContext.userProduct,
        });
        refreshWorkspaceMem();

        const ackMsg = await ChatStorageService.addMessage(
          userId,
          workspaceId,
          currentConvId,
          'assistant',
          evaluation.contextUpdateAcknowledgment || 'Got it!',
          { actionSuggestions: evaluation.suggestedActions }
        );

        setMessages([...updatedHistory, ackMsg]);
        await reloadConversations();
        return;
      }

      // CASE B: Missing critical information -> Ask targeted questions via ClarificationCard
      if (evaluation.needsClarification && evaluation.clarificationRequest) {
        const clarifyMsg = await ChatStorageService.addMessage(
          userId,
          workspaceId,
          currentConvId,
          'assistant',
          '',
          { clarification: evaluation.clarificationRequest }
        );

        setMessages([...updatedHistory, clarifyMsg]);
        await reloadConversations();
        setTimeout(() => scrollToBottom('smooth'), 50);
        return;
      }

      // CASE C: Preprocessed context satisfies request -> Trigger AI stream directly!
      const unifiedContext = {
        ...preprocessed.resolvedContext,
        ...evaluation.extractedContext,
      };

      if (Object.keys(unifiedContext).length > 0) {
        await ChatStorageService.updateConversationMemory(
          userId,
          workspaceId,
          currentConvId,
          unifiedContext
        );
      }

      await executeIntelligenceStream(
        currentConvId,
        updatedHistory,
        unifiedContext,
        preprocessed.processedPrompt,
        evaluation.suggestedActions,
        preprocessed.contextBadges
      );
    },
    [input, isGenerating, activeConversationId, userId, workspaceId, reloadConversations, messages, conversations, user]
  );

  // 5. Handle Clarification Form Submission from ClarificationCard
  const handleClarificationSubmit = useCallback(
    async (messageId: string, submittedValues: Record<string, string>) => {
      if (!activeConversationId || isGenerating) return;

      const targetMsgIndex = messages.findIndex((m) => m.id === messageId);
      if (targetMsgIndex === -1) return;

      const targetMsg = messages[targetMsgIndex];
      const clarReq = targetMsg.clarification;
      if (!clarReq) return;

      // Update message to mark clarification as completed
      const updatedClarification = {
        ...clarReq,
        isCompleted: true,
        submittedValues,
      };

      await ChatStorageService.updateMessage(activeConversationId, messageId, {
        clarification: updatedClarification,
      });

      // Update conversation memory with new values
      await ChatStorageService.updateConversationMemory(
        userId,
        workspaceId,
        activeConversationId,
        submittedValues
      );

      // Merge knownContext + submittedValues
      const fullContext: Record<string, string> = {
        ...clarReq.knownContext,
        ...submittedValues,
      };

      // Persist to workspace memory so all future queries in this workspace inherit this context
      ChatStorageService.saveWorkspaceMemory(workspaceId, {
        userCompany: fullContext.userCompany,
        userProduct: fullContext.userProduct,
        targetCustomer: fullContext.targetCustomer,
      });
      refreshWorkspaceMem();

      // Update messages in state
      const newMessages = [...messages];
      newMessages[targetMsgIndex] = {
        ...targetMsg,
        clarification: updatedClarification,
      };
      setMessages(newMessages);

      // Build synthesized prompt summary for execution
      const comp = fullContext.competitor || 'Competitor';
      const prod = fullContext.userProduct || 'Your Solution';
      const obj = fullContext.objection || fullContext.focusArea || '';
      const promptSummary = `Generate ${clarReq.intent.toLowerCase().replace(/_/g, ' ')} for ${comp} against ${prod}${obj ? ` focusing on: "${obj}"` : ''}.`;

      // Run preprocessing on synthesized prompt to pull verified diffs / badges
      const preprocessed = ChatPreprocessingLayer.preprocess({
        rawPrompt: promptSummary,
        conversationHistory: newMessages,
        currentConversationMemory: fullContext,
        workspaceId,
        userId,
        userProfile: user ? { name: user.name, company: user.company, role: user.role } : undefined,
        allWorkspaceConversations: conversations,
      });

      const suggestedActions = ClarificationEngine.getSuggestedActionsForIntent(
        clarReq.intent,
        fullContext
      );

      // Execute stream with full gathered context and traceable context badges
      await executeIntelligenceStream(
        activeConversationId,
        newMessages,
        { ...fullContext, ...preprocessed.resolvedContext },
        promptSummary,
        suggestedActions,
        preprocessed.contextBadges
      );
    },
    [activeConversationId, isGenerating, messages, userId, workspaceId, user]
  );

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response in place
  const handleRegenerate = () => {
    if (isGenerating || messages.length === 0) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleSendMessage(lastUser.content, true);
    }
  };

  // Rename Conversation
  const handleRename = async (id: string, newTitle: string) => {
    await ChatStorageService.renameConversation(userId, workspaceId, id, newTitle);
    await reloadConversations();
  };

  // Delete Conversation
  const handleDelete = async (id: string) => {
    await ChatStorageService.deleteConversation(userId, workspaceId, id);
    if (activeConversationId === id) {
      handleNewConversation();
    }
    await reloadConversations();
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <section className="nexora-chat-section" aria-label="Nexora Strategic AI Chat">
      {/* Sidebar for History & Management */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRename}
        onDeleteConversation={handleDelete}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="nexora-chat-main-area">
        {/* Chat Header */}
        <header className="nexora-chat-header">
          <div className="nexora-chat-header-left">
            <button
              className="nexora-mobile-menu-trigger"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Toggle chat history sidebar"
              type="button"
            >
              <PanelLeft size={18} />
            </button>

            <div className="nexora-chat-title-box">
              <h2 className="nexora-chat-current-title">
                {activeConversation ? activeConversation.title : 'New Strategic Session'}
              </h2>
              <span className="nexora-chat-model-badge">
                <Sparkles size={11} color="#7c3aed" />
                <span>NEXORA Competitive Engine</span>
              </span>
            </div>
          </div>

          <div className="nexora-chat-header-right">
            <button
              className="nexora-header-context-btn"
              onClick={() => setShowContextModal(true)}
              type="button"
              aria-label="View Workspace Intelligence Context Profile"
              title="View and configure workspace competitive intelligence profile"
            >
              <Database size={13} color="#2563eb" />
              <span className="nexora-context-pill-text">
                {workspaceMem.userProduct
                  ? `Context: ${workspaceMem.userProduct}`
                  : workspaceMem.userCompany
                  ? `Context: ${workspaceMem.userCompany}`
                  : 'Workspace Context'}
              </span>
              <span className="nexora-context-active-dot" title="Context-aware preprocessing active" />
            </button>

            <button
              className="nexora-header-new-btn"
              onClick={handleNewConversation}
              type="button"
              aria-label="Start new chat"
            >
              <Plus size={14} />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Message Thread or Welcome Screen */}
        <div className="nexora-chat-messages-container" role="log" aria-live="polite">
          {isLoadingMessages ? (
            <div className="nexora-chat-loading-state">
              <RefreshCw size={20} className="nexora-spinner" />
              <span>Loading conversation history...</span>
            </div>
          ) : messages.length === 0 ? (
            <ChatWelcomeScreen
              onSelectPrompt={(prompt) => {
                setInput(prompt);
                handleSendMessage(prompt);
              }}
              userName={user?.name}
              workspaceName={user?.company}
            />
          ) : (
            <div className="nexora-messages-list">
              {messages.map((msg, idx) => (
                <ChatMessageItem
                  key={msg.id || idx}
                  message={msg}
                  userInitials={userInitials}
                  isLastAssistantMessage={
                    msg.role === 'assistant' && idx === messages.length - 1
                  }
                  isGenerating={isGenerating}
                  onRegenerate={handleRegenerate}
                  onRetry={handleRegenerate}
                  onClarificationSubmit={handleClarificationSubmit}
                  onSelectActionSuggestion={(action) => handleSendMessage(action)}
                />
              ))}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="nexora-chat-bottom-bar">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            onStop={handleStopGeneration}
            isGenerating={isGenerating}
            placeholder={
              activeConversation
                ? `Message Nexora about ${activeConversation.title}...`
                : 'Ask Nexora about competitor changes, pricing adjustments, or sales battlecards...'
            }
          />
        </div>
      </div>

      {/* Workspace Intelligence Profile Modal */}
      {showContextModal && (
        <div
          className="nexora-context-modal-backdrop"
          onClick={() => setShowContextModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nexora-context-modal-heading"
        >
          <div className="nexora-context-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nexora-context-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#2563eb" />
                <h3 id="nexora-context-modal-heading" className="nexora-context-modal-title">
                  Workspace Intelligence Profile
                </h3>
              </div>
              <button
                className="nexora-modal-close-btn"
                onClick={() => setShowContextModal(false)}
                type="button"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="nexora-context-modal-body">
              <p className="nexora-context-modal-desc">
                Nexora inspects this workspace data and your conversation history before answering requests. This ensures you never have to re-enter known details.
              </p>

              <form onSubmit={handleSaveWorkspaceContext}>
                <div className="nexora-context-form-field">
                  <label className="nexora-context-form-label" htmlFor="ctx-company">
                    Your Company / Organization
                  </label>
                  <input
                    id="ctx-company"
                    type="text"
                    className="nexora-context-form-input"
                    value={contextFormCompany}
                    onChange={(e) => setContextFormCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div className="nexora-context-form-field" style={{ marginTop: '12px' }}>
                  <label className="nexora-context-form-label" htmlFor="ctx-product">
                    Your Product / Solution
                  </label>
                  <input
                    id="ctx-product"
                    type="text"
                    className="nexora-context-form-input"
                    value={contextFormProduct}
                    onChange={(e) => setContextFormProduct(e.target.value)}
                    placeholder="e.g. Enterprise Cloud DB, Apex CRM, Observability Suite"
                  />
                </div>

                <div className="nexora-context-form-field" style={{ marginTop: '12px' }}>
                  <label className="nexora-context-form-label" htmlFor="ctx-customer">
                    Target Customer Segment
                  </label>
                  <input
                    id="ctx-customer"
                    type="text"
                    className="nexora-context-form-input"
                    value={contextFormTargetCustomer}
                    onChange={(e) => setContextFormTargetCustomer(e.target.value)}
                    placeholder="e.g. Enterprise (1,000+ seats), Mid-Market, SMB"
                  />
                </div>

                <div className="nexora-context-monitored-box" style={{ marginTop: '14px' }}>
                  <span className="nexora-context-monitored-title">
                    Monitored Competitors in Verified Database:
                  </span>
                  <div className="nexora-context-competitor-tags">
                    {VERIFIED_COMPETITOR_DATABASE.map((comp) => (
                      <div key={comp.competitor} className="nexora-context-competitor-tag">
                        <span className="nexora-comp-tag-name">{comp.competitor}</span>
                        <span className={`nexora-comp-tag-threat ${comp.threatLevel.toLowerCase()}`}>
                          {comp.threatLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="nexora-context-modal-actions">
                  <button
                    type="button"
                    className="nexora-context-modal-cancel"
                    onClick={() => setShowContextModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="nexora-context-modal-save">
                    {contextSavedNotice ? (
                      <>
                        <Check size={14} /> Saved!
                      </>
                    ) : (
                      'Save Workspace Context'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
