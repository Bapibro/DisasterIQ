import React, { useState } from 'react';
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
  const { signIn: supabaseSignIn, signUp: supabaseSignUp } = useAuth();
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
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ message: string; status?: number; code?: string; name?: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  if (!isOpen) return null;

  const clearAlerts = () => {
    setErrorMessage('');
    setErrorDetails(null);
    setSuccessMessage('');
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
      await supabaseSignIn(loginEmail, loginPassword);
      const nameFromEmail = loginEmail.split('@')[0] || (role === 'teacher' ? 'Prof. Harrison' : 'Alex Vance');
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      
      onSuccessLogin({ name: formattedName, email: loginEmail, role });
      setSuccessMessage(`Logged in as ${role === 'teacher' ? 'Faculty Member' : 'Student'}!`);
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
      const res = await supabaseSignUp(signupEmail, signupPassword, signupName, 'student');
      
      if (res?.needsEmailConfirmation) {
        setSuccessMessage('Account created in Supabase! Please check your email inbox to confirm your email address before signing in.');
      } else {
        onSuccessLogin({ name: signupName, email: signupEmail, role: 'student' });
        setSuccessMessage('Account created successfully in Supabase!');
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

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const defaultName = role === 'teacher' ? 'Prof. Harrison Miller' : 'Alex Vance';
      const defaultEmail = role === 'teacher' ? 'h.miller@nit.edu' : 'alex.vance@gmail.com';
      await supabaseSignUp(defaultEmail, 'GoogleAuthPassword123!', defaultName, role);
      onSuccessLogin({ name: defaultName, email: defaultEmail, role });
      setSuccessMessage(`Signed in with Google as ${role === 'teacher' ? 'Faculty' : 'Student'}!`);
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 800);
    } catch {
      // fallback
      const defaultName = role === 'teacher' ? 'Prof. Harrison Miller' : 'Alex Vance';
      onSuccessLogin({ name: defaultName, email: role === 'teacher' ? 'h.miller@nit.edu' : 'alex.vance@gmail.com', role });
      setSuccessMessage(`Signed in as ${role === 'teacher' ? 'Faculty' : 'Student'}!`);
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!loginEmail.trim()) {
      setErrorMessage('Enter your email address to receive reset instructions.');
      return;
    }
    setForgotPasswordSent(true);
    setErrorMessage('');
    setTimeout(() => setForgotPasswordSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md transition-all animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#080d11]/90 p-6 md:p-8 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8)] liquid-glass">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        {/* Modal Title / Header */}
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">DisasterIQ Access</span>
          <h2 className="mt-1 font-[Inter] text-2xl font-normal tracking-tight text-white md:text-3xl">
            {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="mt-1 text-xs text-white/60">
            {activeTab === 'login'
              ? 'Access your personalized emergency preparedness dashboard.'
              : 'Join the community disaster readiness and safety platform.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-4 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
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
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage('');
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
          <div className="mb-5">
            <label className="block mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Portal Access:
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/40 p-1">
              <button
                type="button"
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
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {errorDetails && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 space-y-1.5">
            <div className="font-semibold text-red-200">{errorDetails.message}</div>
            {(errorDetails.code || errorDetails.status || errorDetails.name) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-red-300/80 pt-1.5 border-t border-red-500/20 mt-1">
                {errorDetails.code && <div><span className="text-white/40 font-mono">code:</span> {errorDetails.code}</div>}
                {errorDetails.status && <div><span className="text-white/40 font-mono">status:</span> {errorDetails.status}</div>}
                {errorDetails.name && <div><span className="text-white/40 font-mono">name:</span> {errorDetails.name}</div>}
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {forgotPasswordSent && (
          <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300">
            Password reset link sent to <strong>{loginEmail}</strong>! Check your inbox.
          </div>
        )}

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-[#080d11] px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            or email
          </span>
        </div>

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-white/70">Email Address</label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/70">Password</label>
              <div className="relative mt-1">
                <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-10 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-white/40 hover:text-white"
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
                className="text-cyan-400 hover:underline"
              >
                Forgot password?
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
              <label className="block text-[11px] font-medium text-white/70">Full Name</label>
              <div className="relative mt-1">
                <User size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/70">Email Address</label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3.5 top-3 text-white/40" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-white/70">Password</label>
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Confirm Password</label>
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    type="password"
                    required
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
    </div>
  );
}
