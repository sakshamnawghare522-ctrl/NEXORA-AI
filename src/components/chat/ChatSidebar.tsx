import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  Check,
  X,
  PanelLeftClose,
  Zap,
} from 'lucide-react';
import { Conversation } from '../../types/chat.ts';
import { NexoraLogo } from '../NexoraLogo.tsx';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.lastMessageSnippet && c.lastMessageSnippet.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!editingId) return;
    if (editTitle.trim()) {
      await onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await onDeleteConversation(id);
    setDeletingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="nexora-chat-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`nexora-chat-sidebar ${isOpenMobile ? 'open-mobile' : ''}`}>
        {/* Sidebar Header */}
        <div className="nexora-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NexoraLogo size={20} showText={true} />
            <span className="nexora-sidebar-tag">Chat</span>
          </div>

          <button
            className="nexora-sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            type="button"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '0 12px 12px 12px' }}>
          <button
            className="nexora-new-chat-btn"
            onClick={() => {
              onNewConversation();
              onCloseMobile();
            }}
            type="button"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="nexora-sidebar-search-box">
          <Search size={14} className="nexora-search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nexora-sidebar-search-input"
          />
          {searchQuery && (
            <button
              className="nexora-search-clear-btn"
              onClick={() => setSearchQuery('')}
              type="button"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="nexora-sidebar-conversations-list">
          {filteredConversations.length === 0 ? (
            <div className="nexora-empty-conversations-state">
              {searchQuery ? (
                <span>No matching conversations found</span>
              ) : (
                <span>No previous conversations yet. Start a new chat above.</span>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingId === conv.id;
              const isConfirmingDelete = deletingId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`nexora-conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectConversation(conv.id);
                      onCloseMobile();
                    }
                  }}
                >
                  <MessageSquare size={14} className="nexora-conv-icon" />

                  {/* Title / Inline Edit */}
                  <div className="nexora-conv-content">
                    {isEditing ? (
                      <form onSubmit={handleSaveRename} className="nexora-rename-form">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="nexora-rename-input"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          type="submit"
                          className="nexora-rename-action-btn"
                          aria-label="Save title"
                          onClick={handleSaveRename}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          className="nexora-rename-action-btn"
                          aria-label="Cancel rename"
                          onClick={handleCancelRename}
                        >
                          <X size={12} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="nexora-conv-title">{conv.title}</span>
                        {conv.lastMessageSnippet && (
                          <span className="nexora-conv-snippet">{conv.lastMessageSnippet}</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions: Rename / Delete */}
                  {!isEditing && (
                    <div className="nexora-conv-actions">
                      {isConfirmingDelete ? (
                        <div className="nexora-delete-confirm-box" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="nexora-confirm-del-btn"
                            onClick={(e) => handleConfirmDelete(e, conv.id)}
                            type="button"
                          >
                            Delete
                          </button>
                          <button
                            className="nexora-cancel-del-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="nexora-conv-action-btn"
                            onClick={(e) => handleStartRename(e, conv)}
                            aria-label="Rename conversation"
                            type="button"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="nexora-conv-action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(conv.id);
                            }}
                            aria-label="Delete conversation"
                            type="button"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="nexora-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--radar-gray-500)' }}>
            <Zap size={12} color="#f59e0b" />
            <span>Context Grounded Intelligence</span>
          </div>
        </div>
      </aside>
    </>
  );
};
