import React, { useState } from 'react';
import { useAuth, mapAuthError } from '../../hooks/useAuth';
import { isFirebaseConfigured } from '../../services/firebase';

type Mode = 'signin' | 'signup' | 'reset';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-[var(--bg)] text-[var(--text)]">
        <div className="blueprint max-w-sm w-full p-6 flex flex-col gap-2 text-center">
          <i className="corner tl"></i>
          <i className="corner tr"></i>
          <i className="corner bl"></i>
          <i className="corner br"></i>
          <h1 className="text-xl font-semibold">Firebase is not configured</h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
            VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID and
            VITE_FIREBASE_APP_ID in your environment, then rebuild.
          </p>
        </div>
      </div>
    );
  }

  const resetMessages = () => {
    setError('');
    setMessage('');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (mode === 'reset') {
      setBusy(true);
      try {
        await resetPassword(email.trim());
        setMessage('Check your inbox for a password reset link.');
      } catch (err) {
        setError(mapAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-[var(--bg)] text-[var(--text)]">
      <div className="blueprint w-full max-w-sm p-6 sm:p-7 flex flex-col gap-5">
        <i className="corner tl"></i>
        <i className="corner tr"></i>
        <i className="corner bl"></i>
        <i className="corner br"></i>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] tracking-[0.14em] uppercase text-[var(--muted)] font-medium">
            Strand
          </span>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            {mode === 'signin' && 'Sign in'}
            {mode === 'signup' && 'Create account'}
            {mode === 'reset' && 'Reset password'}
          </h1>
        </div>

        {error && (
          <div className="p-2.5 text-xs border border-[var(--acc)] text-[var(--acc)] bg-rose-500/5">
            {error}
          </div>
        )}
        {message && (
          <div className="p-2.5 text-xs border border-[var(--p)] text-[var(--p)] bg-[var(--ptint)]">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              data-testid="auth-email"
              placeholder="you@example.com"
              className="h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] text-sm outline-none focus:border-[var(--p)]"
            />
          </div>

          {mode !== 'reset' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                data-testid="auth-password"
                placeholder="••••••••"
                className="h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] text-sm outline-none focus:border-[var(--p)]"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                Confirm password
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 px-3 border border-[var(--line)] bg-[var(--surf)] text-[var(--text)] text-sm outline-none focus:border-[var(--p)]"
              />
            </div>
          )}

          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className="self-end text-xs font-medium text-[var(--p)] bg-transparent border-0 cursor-pointer hover:underline"
            >
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            disabled={busy}
            data-testid="auth-submit"
            className="blueprint h-11 mt-1 bg-[var(--btn)] text-white border-0 text-sm font-semibold cursor-pointer hover:brightness-105 active:scale-95 disabled:opacity-60"
          >
            <i className="corner tl"></i>
            <i className="corner tr"></i>
            <i className="corner bl"></i>
            <i className="corner br"></i>
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>
        </form>

        <div className="text-center text-xs text-[var(--muted)]">
          {mode === 'signin' && (
            <>
              New to Strand?{' '}
              <button
                onClick={() => switchMode('signup')}
                className="text-[var(--p)] font-semibold bg-transparent border-0 cursor-pointer hover:underline"
              >
                Create an account
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('signin')}
                className="text-[var(--p)] font-semibold bg-transparent border-0 cursor-pointer hover:underline"
              >
                Sign in
              </button>
            </>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => switchMode('signin')}
              className="text-[var(--p)] font-semibold bg-transparent border-0 cursor-pointer hover:underline"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
