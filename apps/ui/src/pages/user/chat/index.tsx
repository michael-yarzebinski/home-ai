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
import {
  MOCK_CHAT_SESSIONS,
  generateMockResponse,
  groupSessionsByDate,
  type ChatMessage,
  type ChatSession,
} from '@/mock/chat';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtRelative = (d: Date) => {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Simple markdown-ish formatter: bold and newlines only
function FormatContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={li}>
            {parts.map((part, pi) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={pi}>{part.slice(2, -2)}</strong>
                : <span key={pi}>{part}</span>
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_CHAT_SESSIONS);
  const [activeId, setActiveId] = useState<string | null>(MOCK_CHAT_SESSIONS[0]?.id ?? null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const thinkingSessionRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

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

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_u`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    let targetId = activeId;

    if (!activeId) {
      // Start a new session
      const newSession: ChatSession = {
        id: `sess_${Date.now()}`,
        title: text.length > 50 ? text.slice(0, 47) + '…' : text,
        messages: [userMsg],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveId(newSession.id);
      targetId = newSession.id;
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? { ...s, messages: [...s.messages, userMsg], updatedAt: new Date() }
            : s,
        ),
      );
    }

    setInput('');
    setIsThinking(true);
    thinkingSessionRef.current = targetId;

    const delay = 900 + Math.random() * 700;
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `m_${Date.now()}_a`,
        role: 'assistant',
        content: generateMockResponse(text),
        createdAt: new Date(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === thinkingSessionRef.current
            ? { ...s, messages: [...s.messages, aiMsg], updatedAt: new Date() }
            : s,
        ),
      );
      setIsThinking(false);
      thinkingSessionRef.current = null;
    }, delay);
  }, [input, isThinking, activeId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setInput('');
    setIsThinking(false);
    textareaRef.current?.focus();
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
              {groups.length === 0 ? (
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

                {/* Thinking indicator */}
                {isThinking && activeId === activeSession.id && (
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
              <div className={cn(
                'flex items-end gap-3 rounded-xl border bg-background px-4 py-3',
                'transition-colors',
                isThinking ? 'border-border' : 'border-border focus-within:border-primary/50',
              )}>
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
                    'focus:outline-none',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'max-h-40 leading-relaxed',
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                    input.trim() && !isThinking
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed',
                  )}
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground/40 text-center">
                Enter to send · Shift + Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SessionItem({
  session,
  active,
  onClick,
}: {
  session: ChatSession;
  active: boolean;
  onClick: () => void;
}) {
  const last = session.messages[session.messages.length - 1];
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-2.5 transition-colors',
        active
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-xs font-medium truncate', active && 'text-foreground')}>
          {session.title}
        </span>
        <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 mt-0.5">
          {fmtRelative(session.updatedAt)}
        </span>
      </div>
      {last && (
        <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5 leading-tight">
          {last.role === 'user' ? 'You: ' : ''}
          {last.content.replace(/\n/g, ' ')}
        </p>
      )}
    </button>
  );
}

function AIAvatar() {
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center mt-0.5">
      <Sparkles size={13} className="text-primary" />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary/10 border border-primary/20 text-sm text-foreground leading-relaxed">
            <FormatContent text={message.content} />
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-1 text-right">
            {fmtRelative(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <AIAvatar />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground leading-relaxed">
          <FormatContent text={message.content} />
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          {fmtRelative(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state — shown when no session is selected
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "What's on the calendar today?",
  'Turn off the living room lights',
  'Set the thermostat to 72 degrees',
  'Find a pasta recipe for tonight',
];

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles size={24} className="text-primary" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground">How can I help?</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Ask me to control your home, check the calendar, find a recipe, or anything else.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPrompt(s)}
            className={cn(
              'px-4 py-3 rounded-xl text-left text-sm text-muted-foreground',
              'border border-border bg-card',
              'hover:text-foreground hover:border-primary/30 hover:bg-accent/50',
              'transition-colors',
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
