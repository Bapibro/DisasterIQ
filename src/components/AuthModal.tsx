import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Check, Eye, EyeOff, ArrowRight, GraduationCap, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface UserSession {
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: UserSession) => void;
}

export function AuthModal({ isOpen, onClose, onSuccessLogin }: AuthModalProps) {
  const { signIn: supabaseSignIn, signUp: supabaseSignUp, resetPassword: supabaseResetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // UI status states
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ message: string; status?: number; code?: string; name?: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    const rootWasInert = root?.hasAttribute('inert') ?? false;
    const previousAriaHidden = root?.getAttribute('aria-hidden');
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    (dialog?.querySelector<HTMLElement>('input[autocomplete="email"]') ?? dialog)?.focus();
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (root) {
        if (rootWasInert) root.setAttribute('inert', '');
        else root.removeAttribute('inert');
        if (previousAriaHidden == null) root.removeAttribute('aria-hidden');
        else root.setAttribute('aria-hidden', previousAriaHidden);
      }
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const clearAlerts = () => {
    setErrorMessage('');
    setErrorDetails(null);
    setSuccessMessage('');
    setForgotPasswordSent(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await supabaseSignIn(loginEmail.trim(), loginPassword);
      const nameFromEmail = loginEmail.trim().split('@')[0] || 'User';
      const formattedName = result.profile?.full_name || result.user?.user_metadata?.full_name || nameFromEmail;
      const accountRole = result.profile?.role || result.user?.user_metadata?.role;
      const resolvedRole = accountRole === 'teacher' || accountRole === 'faculty' ? 'teacher' : 'student';

      onSuccessLogin({ name: formattedName, email: loginEmail.trim(), role: resolvedRole });
      setSuccessMessage(`Logged in as ${resolvedRole === 'teacher' ? 'Faculty Member' : 'Student'}!`);
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 800);
    } catch (err: any) {
      setErrorDetails({
        message: err.message || 'Error signing in. Check your credentials.',
        status: err.status,
        code: err.code,
        name: err.name,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      // Force default role 'student' on signup per requirements
      const res = await supabaseSignUp(signupEmail.trim(), signupPassword, signupName.trim(), 'student');

      if (res?.needsEmailConfirmation) {
        setSuccessMessage('Account created. Check your email inbox for the confirmation link before signing in.');
      } else {
        onSuccessLogin({
          name: res.profile?.full_name || signupName.trim(),
          email: signupEmail.trim(),
          role: 'student',
        });
        setSuccessMessage('Account created successfully.');
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 1200);
      }
    } catch (err: any) {
      setErrorDetails({
        message: err.message || 'Error creating account.',
        status: err.status,
        code: err.code,
        name: err.name,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearAlerts();

    if (!loginEmail.trim()) {
      setErrorMessage('Enter your email address to receive reset instructions.');
      return;
    }

    setIsResettingPassword(true);
    try {
      await supabaseResetPassword(loginEmail.trim());
      setForgotPasswordSent(true);
    } catch (err: any) {
      setErrorDetails({
        message: err.message || 'Unable to send a password reset email. Please try again.',
        status: err.status,
        code: err.code,
        name: err.name,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const shouldShowErrorDetails = Boolean(
    errorDetails &&
      ((errorDetails.status && errorDetails.status >= 500) ||
        errorDetails.code === 'MISSING_ENV_VARS' ||
        errorDetails.code === 'SUPABASE_CONNECTION_ERROR')
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md transition-all animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-[#080d11]/90 p-6 md:p-8 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8)] liquid-glass"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        {/* Modal Title / Header */}
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">DisasterIQ Access</span>
          <h2 id="auth-modal-title" className="mt-1 font-[Inter] text-2xl font-normal tracking-tight text-white md:text-3xl">
            {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p id="auth-modal-description" className="mt-1 text-xs text-white/60">
            {activeTab === 'login'
              ? 'Access your personalized emergency preparedness dashboard.'
              : 'Join the community disaster readiness and safety platform.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-4 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            aria-pressed={activeTab === 'login'}
            onClick={() => {
              clearAlerts();
              setActiveTab('login');
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'login'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'signup'}
            onClick={() => {
              clearAlerts();
              setActiveTab('signup');
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Selector: Student vs Teacher (Login portal portal choice) */}
        {activeTab === 'login' && (
          <div className="mb-5" role="group" aria-label="Portal access">
            <span className="block mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Portal Access:
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/40 p-1">
              <button
                type="button"
                aria-pressed={role === 'student'}
                onClick={() => setRole('student')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                  role === 'student'
                    ? 'bg-cyan-400 text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <GraduationCap size={14} />
                <span>Student</span>
              </button>
              <button
                type="button"
                aria-pressed={role === 'teacher'}
                onClick={() => setRole('teacher')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                  role === 'teacher'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Award size={14} />
                <span>Teacher / Faculty</span>
              </button>
            </div>
          </div>
        )}

        {/* Alert Notifications */}
        {errorMessage && (
          <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {errorDetails && (
          <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 space-y-1.5">
            <div className="font-semibold text-red-200">{errorDetails.message}</div>
            {shouldShowErrorDetails && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-red-300/80 pt-1.5 border-t border-red-500/20 mt-1">
                {errorDetails?.code && <div><span className="text-white/40 font-mono">code:</span> {errorDetails.code}</div>}
                {errorDetails?.status && <div><span className="text-white/40 font-mono">status:</span> {errorDetails.status}</div>}
                {errorDetails?.name && <div><span className="text-white/40 font-mono">name:</span> {errorDetails.name}</div>}
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {forgotPasswordSent && (
          <div role="status" className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300">
            If an account exists for <strong>{loginEmail.trim()}</strong>, a password reset link has been sent. Check your inbox.
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="auth-login-email" className="block text-[11px] font-medium text-white/70">Email Address</label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  id="auth-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-login-password" className="block text-[11px] font-medium text-white/70">Password</label>
              <div className="relative mt-1">
                <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  id="auth-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-10 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-white/40 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-white/70">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-black/60 text-cyan-400 focus:ring-0"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                className="text-cyan-400 hover:underline disabled:opacity-50"
              >
                {isResettingPassword ? 'Sending reset link…' : 'Forgot password?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* TAB 2: SIGN UP FORM */
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label htmlFor="auth-signup-name" className="block text-[11px] font-medium text-white/70">Full Name</label>
              <div className="relative mt-1">
                <User size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  id="auth-signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-signup-email" className="block text-[11px] font-medium text-white/70">Email Address</label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  id="auth-signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="auth-signup-password" className="block text-[11px] font-medium text-white/70">Password</label>
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    id="auth-signup-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-signup-confirm-password" className="block text-[11px] font-medium text-white/70">Confirm Password</label>
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    id="auth-signup-confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
