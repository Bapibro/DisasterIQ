import { supabase, isSupabaseConfigured } from '../supabase';

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
  async signUp(email: string, password: string, fullName: string, role: UserRole) {
    if (isSupabaseConfigured()) {
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

      if (error) throw error;

      if (data.user) {
        // Upsert into public.profiles
        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          role,
          updated_at: new Date().toISOString(),
        });
        if (profileErr) console.warn('Profile upsert warning:', profileErr.message);
      }

      return { user: data.user, session: data.session };
    }

    // Fallback: LocalStorage simulation
    const mockUser: UserSession = { name: fullName, email, role };
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(mockUser));
    return { user: { id: 'local-user-id', email }, session: null };
  },

  async signIn(email: string, password: string) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { user: data.user, session: data.session };
    }

    // Fallback: LocalStorage simulation
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.USER) || localStorage.getItem(LOCAL_STORAGE_KEYS.OLD_USER);
    let mockUser: UserSession = { name: email.split('@')[0], email, role: 'student' };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        mockUser = { ...parsed, email };
      } catch {
        // ignore
      }
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(mockUser));
    return { user: { id: 'local-user-id', email }, session: null };
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return data as UserProfile;
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
