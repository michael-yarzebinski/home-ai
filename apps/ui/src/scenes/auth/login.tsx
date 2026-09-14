import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const MIN_CODE_LENGTH = 4;
const MAX_CODE_LENGTH = 32;

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    // Uncontrolled fields + FormData so iOS/Safari Autofill is not overwritten by React state.
    const formData = new FormData(e.currentTarget);
    const submittedName = String(formData.get('username') ?? '').trim();
    const submittedCode = String(formData.get('password') ?? '').replace(/\D/g, '').slice(0, MAX_CODE_LENGTH);

    if (!submittedName || submittedCode.length < MIN_CODE_LENGTH) {
      setError(!submittedName ? 'Enter your name.' : 'Access code must be at least 4 digits.');
      triggerShake();
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await login(submittedName, submittedCode);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error ?? 'Invalid credentials.');
      triggerShake();
    }
    setSubmitting(false);
  }, [submitting, login, navigate]);

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

        <form onSubmit={handleSubmit} className="space-y-5" method="post" autoComplete="on" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="username">
              Name
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              required
              placeholder="Your name"
              disabled={submitting}
              onInput={() => setError(null)}
              className={cn(
                'flex h-10 w-full rounded-lg border bg-background px-3 text-sm',
                'text-foreground placeholder:text-muted-foreground/40',
                'focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
                error ? 'border-red-500/60' : 'border-border',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            />
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Access Code
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showCode ? 'text' : 'password'}
                autoComplete="current-password"
                autoCorrect="off"
                spellCheck={false}
                required
                minLength={MIN_CODE_LENGTH}
                maxLength={MAX_CODE_LENGTH}
                placeholder="Enter code"
                disabled={submitting}
                onInput={(e) => {
                  const next = e.currentTarget.value.replace(/\D/g, '').slice(0, MAX_CODE_LENGTH);
                  if (next !== e.currentTarget.value) e.currentTarget.value = next;
                  setError(null);
                }}
                className={cn(
                  'flex h-10 w-full rounded-lg border bg-background px-3 pr-10 text-sm',
                  'text-foreground placeholder:text-muted-foreground/40',
                  'focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
                  error ? 'border-red-500/60' : 'border-border',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              />
              <button
                type="button"
                onClick={() => setShowCode((s) => !s)}
                aria-label={showCode ? 'Hide access code' : 'Show access code'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className={cn(
              'text-[11px] transition-colors',
              error ? 'text-red-500' : 'text-muted-foreground/50',
            )}>
              {error ?? 'At least 4 digits'}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
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
