import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  disabled = false,
  placeholder = 'Ask Nexora about competitor changes, pricing adjustments, or sales battlecards...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && input.trim() && !disabled) {
        onSend();
      }
    }
  };

  const isSendDisabled = disabled || !input.trim() || isGenerating;

  return (
    <div className="nexora-chat-input-wrapper">
      <div className="nexora-chat-input-box">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="nexora-chat-textarea"
          aria-label="Ask Nexora a question"
        />

        <div className="nexora-chat-input-actions">
          {isGenerating && onStop ? (
            <button
              className="nexora-stop-btn"
              onClick={onStop}
              aria-label="Stop response generation"
              type="button"
            >
              <Square size={13} fill="currentColor" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              className={`nexora-send-btn ${!isSendDisabled ? 'active' : ''}`}
              onClick={onSend}
              disabled={isSendDisabled}
              aria-label="Send message"
              type="button"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="nexora-chat-input-footer">
        <span className="nexora-chat-shortcut-hint">
          <strong>Enter</strong> to send · <strong>Shift + Enter</strong> for new line
        </span>
        <span className="nexora-chat-safety-hint">
          Verified with real-time DOM diffs &amp; AST analysis
        </span>
      </div>
    </div>
  );
};
