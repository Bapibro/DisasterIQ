import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../supabase';
import { profileService } from './profileService';

export type UserRole = 'student' | 'teacher' | 'faculty';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  college?: string;
  course?: string;
  year?: string;
  city?: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSession {
  name: string;
  email: string;
  role: UserRole;
  id?: string;
}

const LOCAL_STORAGE_KEYS = {
  USER: 'disasteriq_user',
  OLD_USER: 'readysphere_user',
  PROFILE: 'readysphere_profile_v1',
};

const getAuthRedirectUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://disaster-iq-nine.vercel.app';
};

const getPasswordResetRedirectUrl = (): string =>
  `${getAuthRedirectUrl().replace(/\/$/, '')}/reset-password`;

type SupabaseAuthError = {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
};

const getFriendlyAuthMessage = (error: SupabaseAuthError, fallback: string): string => {
  if (error.name === 'AuthRetryableFetchError') {
    return 'Unable to reach Supabase. Check your connection and the existing project URL, then try again.';
  }

  if (
    error.code === 'invalid_credentials' ||
    error.code === 'invalid_grant' ||
    /invalid login credentials/i.test(error.message || '')
  ) {
    return 'The email or password is incorrect. If you recently signed up, please confirm your email before signing in.';
  }

  const messages: Record<string, string> = {
    email_not_confirmed: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.',
    user_already_exists: 'An account with this email already exists. Try signing in instead.',
    email_exists: 'An account with this email already exists. Try signing in instead.',
    weak_password: 'Please choose a stronger password that meets the project requirements.',
    same_password: 'Choose a password different from your current password.',
    signup_disabled: 'Account creation is currently unavailable. Please contact support.',
    email_address_invalid: 'Enter a valid email address and try again.',
    over_email_send_rate_limit: 'Too many email requests. Please wait a few minutes before trying again.',
    over_request_rate_limit: 'Too many attempts. Please wait a few minutes before trying again.',
    session_not_found: 'Your password reset link has expired or is invalid. Request a new reset link.',
  };

  return (error.code && messages[error.code]) || error.message || fallback;
};

const toAuthError = (error: SupabaseAuthError, fallbackCode: string, fallbackMessage: string) => {
  const isConnectionError = error.name === 'AuthRetryableFetchError';
  const authErr = new Error(getFriendlyAuthMessage(error, fallbackMessage)) as Error & {
    status: number;
    code: string;
  };
  authErr.status = isConnectionError ? 503 : error.status || 400;
  authErr.code = isConnectionError ? 'SUPABASE_CONNECTION_ERROR' : error.code || fallbackCode;
  authErr.name = error.name || 'AuthApiError';
  return authErr;
};

export const authService = {
  async signUp(email: string, password: string, fullName: string, _roleRequested: UserRole = 'student') {
    const role: UserRole = 'student'; // Always force student role per requirements

    if (!isSupabaseConfigured()) {
      throw getSupabaseConfigError();
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      throw toAuthError(error, 'AUTH_SIGNUP_ERROR', 'Unable to create your account. Please try again.');
    }

    if (!data.user) {
      const nullErr = new Error('Supabase Auth failed to return a user object.');
      (nullErr as any).status = 500;
      (nullErr as any).code = 'NULL_USER_RETURNED';
      (nullErr as any).name = 'AuthResponseError';
      throw nullErr;
    }

    const needsEmailConfirmation = !data.session;

    // If session exists (immediate login without email confirmation requirement), ensure profile
    if (data.session) {
      try {
        await profileService.ensureProfile(data.user.id, email, fullName, role);
      } catch (profileErr: any) {
        console.warn('Profile creation warning after signup:', profileErr.message);
      }
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation,
    };
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw getSupabaseConfigError();
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw toAuthError(error, 'AUTH_LOGIN_ERROR', 'Unable to sign in. Please try again.');
    }

    return { user: data.user, session: data.session };
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured()) {
      throw getSupabaseConfigError();
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    });

    if (error) {
      throw toAuthError(error, 'AUTH_RESET_ERROR', 'Unable to send a password reset email. Please try again.');
    }
  },

  async updatePassword(password: string) {
    if (!isSupabaseConfigured()) {
      throw getSupabaseConfigError();
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw toAuthError(error, 'AUTH_UPDATE_PASSWORD_ERROR', 'Unable to update your password. Please try again.');
    }
  },

  async signOut() {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.OLD_USER);
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured() || !userId || userId === 'local-user-id') {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER) || localStorage.getItem(LOCAL_STORAGE_KEYS.OLD_USER);

      let userObj: any = {};
      if (savedUser) {
        try { userObj = JSON.parse(savedUser); } catch {}
      }

      if (savedProfile) {
        try {
          const p = JSON.parse(savedProfile);
          return {
            id: userId || 'local-user-id',
            full_name: p.fullName || userObj.name || 'DisasterIQ User',
            email: p.email || userObj.email || 'user@disasteriq.app',
            phone: p.phone,
            college: p.college,
            course: p.course,
            year: p.year,
            city: p.city,
            role: userObj.role || 'student',
            avatar_url: localStorage.getItem('disasteriq_profile_photo_v1') || localStorage.getItem('readysphere_profile_photo_v1') || '',
          };
        } catch {}
      }

      return {
        id: userId || 'local-user-id',
        full_name: userObj.name || 'DisasterIQ User',
        email: userObj.email || 'user@disasteriq.app',
        role: userObj.role || 'student',
      };
    }

    const p = await profileService.getProfile(userId);
    if (p) return p;

    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      try {
        return await profileService.ensureProfile(
          user.id,
          user.email || '',
          user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
          'student'
        );
      } catch (e) {
        console.error('Fallback profile creation error:', e);
      }
    }

    return null;
  },
};
