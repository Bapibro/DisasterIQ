import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, type UserProfile, type UserRole } from '../lib/services/authService';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
  isSupabaseActive: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const isSupabaseActive = isSupabaseConfigured();

  const loadLocalUser = () => {
    try {
      const saved = localStorage.getItem('disasteriq_user') || localStorage.getItem('readysphere_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mockProfile: UserProfile = {
          id: 'local-user-id',
          full_name: parsed.name || 'User',
          email: parsed.email || '',
          role: parsed.role || 'student',
        };
        setUser({ id: 'local-user-id', email: parsed.email });
        setProfile(mockProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    }
  };

  const loadSupabaseUserProfile = async (userId: string) => {
    try {
      const p = await authService.getProfile(userId);
      setProfile(p);
    } catch (err) {
      console.warn('Could not fetch Supabase profile:', err);
    }
  };

  useEffect(() => {
    if (isSupabaseActive) {
      // Fetch initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadSupabaseUserProfile(session.user.id);
        } else {
          loadLocalUser();
        }
        setLoading(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadSupabaseUserProfile(session.user.id);
        } else {
          loadLocalUser();
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      loadLocalUser();
      setLoading(false);
    }
  }, [isSupabaseActive]);

  const signUp = async (email: string, password: string, fullName: string, _roleRequested?: UserRole) => {
    setLoading(true);
    try {
      const res = await authService.signUp(email, password, fullName, 'student');
      if (res.user) {
        setUser(res.user);
        const p = await authService.getProfile(res.user.id);
        setProfile(p);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.user) {
        setUser(res.user);
        const p = await authService.getProfile(res.user.id);
        setProfile(p);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await authService.getProfile(user.id);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isSupabaseActive,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
