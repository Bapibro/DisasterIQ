import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, type UserProfile, type UserRole } from '../lib/services/authService';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
  isSupabaseActive: boolean;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ user: any; session: any; needsEmailConfirmation: boolean; profile: UserProfile | null }>;
  signIn: (email: string, password: string) => Promise<{ user: any; session: any; profile: UserProfile | null }>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
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
      let active = true;

      const applySession = (nextSession: any) => {
        if (!active) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          setProfile((current) => current?.id === nextSession.user.id ? current : null);
          loadSupabaseUserProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      };

      supabase.auth.getSession()
        .then(({ data: { session } }) => applySession(session))
        .catch((error) => {
          console.warn('Could not restore Supabase session:', error);
          if (active) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        applySession(session);
      });

      return () => {
        active = false;
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
      let profile: UserProfile | null = null;

      if (res.session && res.user) {
        setUser(res.user);
        setSession(res.session);
        profile = await authService.getProfile(res.user.id);
        setProfile(profile);
      } else {
        setUser(null);
        setProfile(null);
        setSession(null);
      }

      return { ...res, profile };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      let profile: UserProfile | null = null;

      if (res.user) {
        setUser(res.user);
        setSession(res.session);
        profile = await authService.getProfile(res.user.id);
        setProfile(profile);
      }

      return { ...res, profile };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const updatePassword = async (password: string) => {
    await authService.updatePassword(password);
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
        resetPassword,
        updatePassword,
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
