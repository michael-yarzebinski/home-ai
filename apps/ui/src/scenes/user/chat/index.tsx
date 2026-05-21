import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Conversation } from '@home-ai/shared/domain/conversation/converstation';
import type { Paginated } from '@/types/api';

// ---------------------------------------------------------------------------
// UI types
// ---------------------------------------------------------------------------

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface UISession {
  /** externalId — matches what the chat API uses as chatSessionId */
  id: string;
  title: string;
  messages: UIMessage[];
  lastActivity: Date;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function conversationToSession(conv: Conversation): UISession {
  const msgs = (conv.messages ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m, i) => ({
      id: `${conv.externalId}_${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: new Date(m.timestamp),
    }));

  const firstUserMsg = msgs.find((m) => m.role === 'user');
  const title =
    (conv as { summary?: string }).summary ||
    (firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : '')
      : 'Chat');

  return {
    // Use externalId (not DB id) — this is what the chat API expects as chatSessionId
    id: conv.externalId,
    title,
    messages: msgs,
    lastActivity: new Date(conv.lastActivity),
  };
}

function groupSessionsByDate(sessions: UISession[]): Array<{ label: string; sessions: UISession[] }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400_000);
  const weekAgo = new Date(today.getTime() - 7 * 86400_000);

  const groups: Record<string, UISession[]> = {};
  for (const s of sessions) {
    const d = new Date(s.lastActivity.getFullYear(), s.lastActivity.getMonth(), s.lastActivity.getDate());
    let label: string;
    if (d >= today) label = 'Today';
    else if (d >= yesterday) label = 'Yesterday';
    else if (d >= weekAgo) label = 'This Week';
    else label = 'Older';
    groups[label] = groups[label] ?? [];
    groups[label].push(s);
  }

  return ['Today', 'Yesterday', 'This Week', 'Older']
    .filter((l) => groups[l]?.length)
    .map((label) => ({ label, sessions: groups[label] }));
}

const fmtRelative = (d: Date) => {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ---------------------------------------------------------------------------
// Suggested prompts
// ---------------------------------------------------------------------------

const SUGGESTED_PROMPTS = [
  "What's on the family calendar this week?",
  'Set a reminder for tomorrow at 8am',
  'Check on the living room lights',
  'What recipes can I make for dinner?',
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FormatContent({ text }: { text: string }) {
  // Defensively coerce — LLM content can arrive as a complex object before the server fix is deployed
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  const lines = str.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={li}>
            {parts.map((part, pi) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={pi}>{part.slice(2, -2)}</strong>
                : <span key={pi}>{part}</span>,
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
}

function AIAvatar() {
  return (
    <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
      <Sparkles size={12} className="text-primary" />
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {!isUser && <AIAvatar />}
      <div
        className={cn(
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm',
        )}
      >
        <FormatContent text={message.content} />
        <p className={cn('text-[10px] mt-1.5', isUser ? 'text-primary-foreground/50' : 'text-muted-foreground/50')}>
          {fmtRelative(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function SessionItem({
  session,
  active,
  onClick,
}: {
  session: UISession;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-2.5 transition-colors',
        active ? 'bg-accent text-foreground' : 'hover:bg-accent/50 text-muted-foreground',
      )}
    >
      <p className="text-xs font-medium truncate">{session.title}</p>
      <p className="text-[10px] text-muted-foreground/50 mt-0.5">{fmtRelative(session.lastActivity)}</p>
    </button>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 pb-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
        <Sparkles size={22} className="text-primary" />
      </div>
      <div className="text-center">
        <h3 className="text-base font-semibold text-foreground mb-1">How can I help?</h3>
        <p className="text-sm text-muted-foreground/60">Start a conversation or try one of these suggestions</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className={cn(
              'text-left px-4 py-3 rounded-lg border border-border',
              'text-xs text-muted-foreground hover:text-foreground',
              'hover:bg-accent/50 hover:border-border/80 transition-colors',
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Chat() {
  const [sessions, setSessions] = useState<UISession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  // Load sessions on mount — mounted flag prevents double-fire in React StrictMode
  useEffect(() => {
    let mounted = true;
    api
      .get<Paginated<Conversation>>('/v1/chat/sessions')
      .then((result) => {
        if (!mounted) return;
        const uiSessions = result.items.map(conversationToSession);
        setSessions(uiSessions);
        if (uiSessions.length > 0) {
          setActiveId(uiSessions[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setSessionsLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, isThinking]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: UIMessage = {
      id: `m_${Date.now()}_u`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    setInput('');
    setIsThinking(true);

    // Capture the current session ID as a local variable.
    // This survives across the await without needing a ref, and is unambiguous
    // even if React re-creates the callback closure during the async operation.
    let currentSessionId: string;

    if (!activeId) {
      // New chat — optimistically add a placeholder session
      const tempId = `temp_${Date.now()}`;
      currentSessionId = tempId;
      setSessions((prev) => [
        { id: tempId, title: text.slice(0, 60), messages: [userMsg], lastActivity: new Date() },
        ...prev,
      ]);
      setActiveId(tempId);
    } else {
      currentSessionId = activeId;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? { ...s, messages: [...s.messages, userMsg], lastActivity: new Date() }
            : s,
        ),
      );
    }

    try {
      const result = await api.post<{
        success: boolean;
        chatSessionId: string;
        response?: string;
        requiresApproval?: boolean;
        timestamp: string;
      }>('/v1/chat', {
        message: text,
        // Pass the externalId (UISession.id) so the server can find the existing conversation
        chatSessionId: activeId ?? undefined,
      });

      const returnedId = result.chatSessionId;
      const content = result.requiresApproval
        ? 'This action requires approval. A pending request has been created.'
        : (result.response ?? 'I received your message.');

      const aiMsg: UIMessage = {
        id: `m_${Date.now()}_a`,
        role: 'assistant',
        content,
        createdAt: new Date(result.timestamp),
      };

      // Append AI message to the session we tracked above (by local var, not ref)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, id: returnedId, messages: [...s.messages, aiMsg], lastActivity: new Date() }
            : s,
        ),
      );

      // Always sync activeId to the returned session ID (handles new sessions + edge cases)
      setActiveId(returnedId);

    } catch (err) {
      const errMsg: UIMessage = {
        id: `m_${Date.now()}_err`,
        role: 'assistant',
        content: `Sorry, something went wrong: ${(err as Error).message}`,
        createdAt: new Date(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, errMsg] }
            : s,
        ),
      );
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, activeId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setInput('');
    setIsThinking(false);
    textareaRef.current?.focus();
  };

  const groups = groupSessionsByDate(sessions);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden -mt-6 -mb-6">
      {/* ── Page header ── */}
      <div className="px-5 py-3.5 border-b border-border flex-shrink-0 flex items-center gap-3">
        <button
          onClick={() => setPanelOpen((o) => !o)}
          title={panelOpen ? 'Collapse history' : 'Expand history'}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
        >
          {panelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 flex-shrink-0">
          <MessageSquare size={15} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">
            {activeSession ? activeSession.title : 'Chat'}
          </h1>
          {activeSession && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {activeSession.messages.length} message{activeSession.messages.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Plus size={13} />
          New Chat
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel: session list ── */}
        {panelOpen && (
          <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto py-2">
              {sessionsLoading ? (
                <div className="px-4 py-3 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded bg-border/40 animate-pulse" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <p className="px-4 py-8 text-xs text-muted-foreground/50 text-center">
                  No conversations yet
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.label} className="mb-2">
                    <span className="block px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                      {group.label}
                    </span>
                    {group.sessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        active={session.id === activeId}
                        onClick={() => setActiveId(session.id)}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {!activeSession ? (
              <EmptyState onPrompt={(p) => { setInput(p); textareaRef.current?.focus(); }} />
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {activeSession.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Thinking indicator — only show for the active session */}
                {isThinking && (
                  <div className="flex items-start gap-3">
                    <AIAvatar />
                    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-card border border-border">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input bar ── */}
          <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div
                className={cn(
                  'flex items-end gap-3 rounded-xl border bg-background px-4 py-3 transition-colors',
                  isThinking ? 'border-border' : 'border-border focus-within:border-primary/50',
                )}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Home AI…"
                  disabled={isThinking}
                  rows={1}
                  className={cn(
                    'flex-1 resize-none bg-transparent text-sm text-foreground',
                    'placeholder:text-muted-foreground/50',
                    'focus:outline-none disabled:opacity-50',
                  )}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isThinking}
                  className={cn(
                    'flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 active:scale-95',
                    'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100',
                  )}
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
