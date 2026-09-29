import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Copy, Check, RotateCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../../types/chat.ts';
import { NexoraLogo } from '../NexoraLogo.tsx';
import { ClarificationCard } from './ClarificationCard.tsx';

interface ChatMessageItemProps {
  message: ChatMessage;
  userInitials: string;
  isLastAssistantMessage?: boolean;
  isGenerating?: boolean;
  onRegenerate?: () => void;
  onRetry?: () => void;
  onClarificationSubmit?: (messageId: string, values: Record<string, string>) => void;
  onSelectActionSuggestion?: (action: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  userInitials,
  isLastAssistantMessage = false,
  isGenerating = false,
  onRegenerate,
  onRetry,
  onClarificationSubmit,
  onSelectActionSuggestion,
}) => {
  const [copied, setCopied] = useState(false);

  const isAssistant = message.role === 'assistant';

  // Render markdown with custom code block wrapping
  const renderedHtml = useMemo(() => {
    if (!isAssistant || !message.content) return null;
    try {
      const renderer = new marked.Renderer();
      renderer.code = function (token: any) {
        const text = typeof token === 'object' && token !== null ? token.text : String(token || '');
        const lang = (typeof token === 'object' && token !== null ? token.lang : arguments[1]) || 'code';
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

        return `<div class="nexora-code-block-wrapper"><div class="nexora-code-header"><span class="nexora-code-lang">${lang.toUpperCase()}</span><button class="nexora-code-copy-btn" type="button" aria-label="Copy code snippet"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span></button></div><pre><code class="language-${lang}">${escaped}</code></pre></div>`;
      };

      marked.setOptions({
        gfm: true,
        breaks: true,
        renderer,
      });
      return marked.parse(message.content) as string;
    } catch {
      return message.content;
    }
  }, [message.content, isAssistant]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleMarkdownClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.nexora-code-copy-btn') as HTMLElement;
    if (!btn) return;
    const wrapper = btn.closest('.nexora-code-block-wrapper');
    const codeEl = wrapper?.querySelector('code');
    if (codeEl) {
      try {
        await navigator.clipboard.writeText(codeEl.textContent || '');
        const span = btn.querySelector('span');
        if (span) {
          span.textContent = 'Copied!';
          setTimeout(() => {
            span.textContent = 'Copy';
          }, 2000);
        }
      } catch {
        // fallback
      }
    }
  };

  return (
    <div className={`nexora-chat-message-row ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="nexora-chat-message-container">
        {/* Avatar */}
        <div className="nexora-message-avatar" aria-hidden="true">
          {isAssistant ? (
            <div className="nexora-ai-avatar-badge" style={{ backgroundColor: '#0b0b0b' }}>
              <NexoraLogo size={16} showText={false} style={{ backgroundColor: '#0b0b0b' }} />
            </div>
          ) : (
            <div className="nexora-user-avatar-badge">{userInitials}</div>
          )}
        </div>

        {/* Message Content Bubble */}
        <div className="nexora-message-content-wrapper">
          <div className="nexora-message-header">
            <span className="nexora-message-author">{isAssistant ? 'Nexora AI' : 'You'}</span>
            <span className="nexora-message-time">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* User Message */}
          {!isAssistant && (
            <div className="nexora-user-message-bubble">
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
            </div>
          )}

          {/* Assistant Message */}
          {isAssistant && (
            <div className="nexora-assistant-message-card">
              {message.isError ? (
                <div className="nexora-chat-error-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <span>Failed to generate intelligence response.</span>
                  </div>
                  {onRetry && (
                    <button
                      className="nexora-retry-btn"
                      onClick={onRetry}
                      type="button"
                    >
                      <RotateCw size={13} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Context Badges if present */}
                  {message.contextBadges && message.contextBadges.length > 0 && (
                    <div className="nexora-message-context-badges">
                      {message.contextBadges.map((badge, idx) => (
                        <div key={idx} className="nexora-context-badge">
                          <span className="nexora-badge-label">{badge.label}:</span>
                          <span className="nexora-badge-value">{badge.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Standard Text/Markdown Content */}
                  {message.content && (
                    <div
                      className="nexora-markdown-body"
                      onClick={handleMarkdownClick}
                      dangerouslySetInnerHTML={{ __html: renderedHtml || '' }}
                    />
                  )}

                  {/* Conversational Clarification Input Card if requested */}
                  {message.clarification && (
                    <ClarificationCard
                      request={message.clarification}
                      onSubmit={(vals) => onClarificationSubmit?.(message.id, vals)}
                      isGenerating={isGenerating}
                    />
                  )}

                  {/* Follow-up Action Suggestions */}
                  {message.actionSuggestions &&
                    message.actionSuggestions.length > 0 &&
                    !message.isStreaming &&
                    !message.clarification?.fields?.length && (
                      <div className="nexora-action-suggestions-container">
                        <span className="nexora-action-suggestions-label">Recommended Next Steps:</span>
                        <div className="nexora-action-suggestions-chips">
                          {message.actionSuggestions.map((act) => (
                            <button
                              key={act}
                              className="nexora-action-chip"
                              onClick={() => onSelectActionSuggestion?.(act)}
                              type="button"
                            >
                              <span>{act}</span>
                              <ArrowRight size={11} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Streaming cursor */}
                  {message.isStreaming && (
                    <span className="nexora-streaming-cursor" aria-hidden="true" />
                  )}
                </>
              )}

              {/* Message Actions */}
              {!message.isStreaming && !message.isError && message.content && (
                <div className="nexora-message-action-bar">
                  <button
                    className="nexora-msg-action-btn"
                    onClick={handleCopyMessage}
                    aria-label={copied ? 'Copied' : 'Copy message'}
                    type="button"
                  >
                    {copied ? <Check size={13} color="var(--radar-green-pulse)" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  {isLastAssistantMessage && !isGenerating && onRegenerate && (
                    <button
                      className="nexora-msg-action-btn"
                      onClick={onRegenerate}
                      aria-label="Regenerate intelligence"
                      type="button"
                    >
                      <RotateCw size={13} />
                      <span>Regenerate</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
