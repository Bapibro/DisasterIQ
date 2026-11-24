import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ResetPasswordPage() {
  const { loading, session, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isRecoveryLink = typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to update your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (!session && isRecoveryLink)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 text-sm text-white/60">
        Validating your password reset link…
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#080d11]/90 p-8 text-center text-white shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
            <Check size={22} />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Password updated</h1>
          <p className="mt-2 text-sm text-white/60">Your password has been changed and you are now signed in.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-white/90"
          >
            Continue to DisasterIQ
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#080d11]/90 p-8 text-center text-white shadow-2xl">
          <h1 className="text-2xl font-semibold">Reset link unavailable</h1>
          <p className="mt-2 text-sm text-white/60">This password reset link is invalid or has expired. Request a new link from the login screen.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-white/90"
          >
            Return to DisasterIQ
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#080d11]/90 p-8 text-white shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
          <Lock size={19} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Choose a new password</h1>
        <p className="mt-2 text-sm text-white/60">Enter a new password for your existing DisasterIQ account.</p>

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-[11px] font-medium text-white/70">New password</label>
            <input
              id="reset-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="reset-password-confirm" className="block text-[11px] font-medium text-white/70">Confirm new password</label>
            <input
              id="reset-password-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {submitting ? 'Updating password…' : 'Update password'}
            {!submitting && <ArrowRight size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
