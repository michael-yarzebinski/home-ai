import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Pin input — individual digit boxes, auto-advances focus
// ---------------------------------------------------------------------------

const PIN_LENGTH = 6;

interface PinInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
}

function PinInput({ value, onChange, error, disabled }: PinInputProps) {
  const refs = Array.from({ length: PIN_LENGTH }, () => useRef<HTMLInputElement>(null)); // eslint-disable-line

  const cells = Array.from({ length: PIN_LENGTH }, (_, i) => value[i] ?? '');

  const focus = (i: number) => refs[i]?.current?.focus();

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (cells[i]) {
        const next = value.slice(0, i) + value.slice(i + 1);
        onChange(next);
      } else if (i > 0) {
        const next = value.slice(0, i - 1) + value.slice(i);
        onChange(next);
        focus(i - 1);
      }
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowLeft' && i > 0) { focus(i - 1); return; }
    if (e.key === 'ArrowRight' && i < PIN_LENGTH - 1) { focus(i + 1); return; }
  };

  const handleInput = (i: number, e: React.FormEvent<HTMLInputElement>) => {
    const ch = (e.currentTarget.value ?? '').replace(/\D/g, '').slice(-1);
    if (!ch) return;
    const arr = cells.map((c, idx) => (idx === i ? ch : c));
    // fill remaining slots
    const newVal = arr.join('').slice(0, PIN_LENGTH);
    onChange(newVal);
    if (i < PIN_LENGTH - 1) focus(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    onChange(pasted);
    const nextFocus = Math.min(pasted.length, PIN_LENGTH - 1);
    focus(nextFocus);
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {cells.map((ch, i) => {
        const filled = Boolean(ch);
        return (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={ch}
            disabled={disabled}
            onKeyDown={(e) => handleKey(i, e)}
            onInput={(e) => handleInput(i, e)}
            onChange={() => {}} // suppress React warning; handled by onInput
            onClick={() => focus(i)}
            className={cn(
              'h-12 w-10 rounded-lg border text-center text-xl font-semibold',
              'bg-background caret-transparent',
              'focus:outline-none transition-colors',
              filled && !error
                ? 'border-primary text-primary bg-primary/5'
                : error
                  ? 'border-red-500/60 text-red-400 bg-red-500/5'
                  : 'border-border text-foreground focus:border-ring',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → go home
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    const result = await login(name, code);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error ?? 'Invalid credentials.');
      triggerShake();
    }
    setSubmitting(false);
  }, [submitting, login, name, code, navigate]); // eslint-disable-line

  // Submit when PIN is fully filled
  useEffect(() => {
    if (code.length === PIN_LENGTH && name.trim()) {
      void handleSubmit();
    }
  }, [code]); // eslint-disable-line

  const canSubmit = name.trim().length > 0 && code.length >= 4;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Card */}
      <div
        className={cn(
          'relative w-full max-w-sm mx-4',
          'rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-2xl',
          'px-8 py-10',
          shake && 'animate-shake',
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3) 0%, hsl(var(--primary) / 0.1) 100%)',
              border: '1px solid hsl(var(--primary) / 0.3)',
            }}
          >
            <span className="text-primary font-bold text-2xl tracking-tighter">AI</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Home AI</h1>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Sign in to your hub</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="login-name">
              Name
            </label>
            <input
              id="login-name"
              type="text"
              autoComplete="given-name"
              autoFocus
              placeholder="Your name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              disabled={submitting}
              className={cn(
                'flex h-10 w-full rounded-lg border bg-background px-3 text-sm',
                'text-foreground placeholder:text-muted-foreground/40',
                'focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
                error && !code ? 'border-red-500/60' : 'border-border',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            />
          </div>

          {/* Code */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Access Code
              </label>
              <button
                type="button"
                onClick={() => setShowCode((s) => !s)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {showCode ? <EyeOff size={11} /> : <Eye size={11} />}
                {showCode ? 'Hide' : 'Reveal'}
              </button>
            </div>

            {showCode ? (
              /* Plain text input when revealed */
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter code"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH)); setError(null); }}
                disabled={submitting}
                className={cn(
                  'flex h-10 w-full rounded-lg border bg-background px-3 text-sm text-center tracking-[0.4em] font-mono',
                  'text-foreground placeholder:text-muted-foreground/40 placeholder:tracking-normal',
                  'focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
                  error ? 'border-red-500/60' : 'border-border',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              />
            ) : (
              <PinInput
                value={code}
                onChange={(v) => { setCode(v); setError(null); }}
                error={Boolean(error)}
                disabled={submitting}
              />
            )}

            <p className={cn(
              'text-[11px] text-center transition-colors',
              error ? 'text-red-500' : 'text-muted-foreground/50',
            )}>
              {error ?? 'At least 4 digits'}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={cn(
              'w-full h-10 rounded-lg text-sm font-medium transition-all',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 active:scale-[0.98]',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
            )}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </div>
  );
}
