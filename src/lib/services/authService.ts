import { supabase, isSupabaseConfigured } from '../supabase';
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

export const authService = {
  async signUp(email: string, password: string, fullName: string, _roleRequested: UserRole = 'student') {
    const role: UserRole = 'student'; // Always force student role per requirements

    if (!isSupabaseConfigured()) {
      const configErr = new Error('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in this deployment. Please add them under Vercel Project Settings > Environment Variables.');
      (configErr as any).status = 400;
      (configErr as any).code = 'MISSING_ENV_VARS';
      (configErr as any).name = 'SupabaseConfigError';
      throw configErr;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      const authErr = new Error(error.message);
      (authErr as any).status = error.status || 400;
      (authErr as any).code = error.code || 'AUTH_SIGNUP_ERROR';
      (authErr as any).name = error.name || 'AuthApiError';
      throw authErr;
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
      const configErr = new Error('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in this deployment. Please add them under Vercel Project Settings > Environment Variables.');
      (configErr as any).status = 400;
      (configErr as any).code = 'MISSING_ENV_VARS';
      (configErr as any).name = 'SupabaseConfigError';
      throw configErr;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const authErr = new Error(error.message);
      (authErr as any).status = error.status || 400;
      (authErr as any).code = error.code || 'AUTH_LOGIN_ERROR';
      (authErr as any).name = error.name || 'AuthApiError';
      throw authErr;
    }

    return { user: data.user, session: data.session };
  },

  async signOut() {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.OLD_USER);
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const p = await profileService.getProfile(userId);
      if (p) return p;

      // If missing, check if this is the authenticated Supabase user and ensure profile row exists
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
    }

    // Fallback: Read from LocalStorage profile
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
          full_name: p.fullName || userObj.name || 'Alex Vance',
          email: p.email || userObj.email || 'alex.vance@gmail.com',
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
      full_name: userObj.name || 'Alex Vance',
      email: userObj.email || 'alex.vance@gmail.com',
      role: userObj.role || 'student',
    };
  },
};
