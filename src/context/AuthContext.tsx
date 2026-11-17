import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isDemoMode, supabase } from '@/lib/supabase';
import * as authService from '@/services/auth.service';
import type { Profile } from '@/types';
import type { SignUpInput } from '@/services/auth.service';

export interface AppUser {
  id: string;
  email?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (updates: authService.ProfileUpdate) => Promise<void>;
  refreshProfile: () => Promise<void>;
  demoSignIn: (role?: 'customer' | 'admin') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const demoProfiles: Record<'customer' | 'admin', Profile> = {
  customer: {
    id: 'demo-customer', email: 'preview@norwood.example', full_name: 'Preview Customer',
    phone: '+1 555 010 2000', avatar_url: null, role: 'customer',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  admin: {
    id: 'demo-admin', email: 'admin@norwood.example', full_name: 'Store Administrator',
    phone: '+1 555 010 2001', avatar_url: null, role: 'super_admin',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
};

/** In-memory only: demo session resets on refresh. Never persisted. */
let demoSession: { role: 'customer' | 'admin' } | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoRole, setDemoRole] = useState<'customer' | 'admin' | null>(demoSession?.role || null);

  const refreshProfile = useCallback(async () => {
    if (isDemoMode) {
      setProfile(demoRole ? demoProfiles[demoRole] : null);
      return;
    }
    const current = (await supabase.auth.getUser()).data.user;
    setProfile(current ? await authService.getProfile(current.id) : null);
  }, [demoRole]);

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      setProfile(demoRole ? demoProfiles[demoRole] : null);
      return;
    }
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let active = true;
    authService.getProfile(session.user.id).then((p) => { if (active) setProfile(p); }).catch(() => {
      if (active) setProfile(null);
    });
    return () => { active = false; };
  }, [session?.user?.id, isDemoMode, demoRole]);

  const demoSignIn = useCallback((role: 'customer' | 'admin' = 'customer') => {
    demoSession = { role };
    setDemoRole(role);
    setProfile(demoProfiles[role]);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      demoSignIn(email.includes('admin') ? 'admin' : 'customer');
      return;
    }
    await authService.signIn(email, password);
  }, [demoSignIn]);

  const signUp = useCallback(async (input: SignUpInput) => {
    const data = await authService.signUp(input);
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      demoSession = null;
      setDemoRole(null);
      setProfile(null);
      return;
    }
    await authService.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user: AppUser | null = isDemoMode
      ? (demoRole ? { id: demoProfiles[demoRole].id, email: demoProfiles[demoRole].email } : null)
      : (session?.user ? { id: session.user.id, email: session.user.email } : null);
    return {
      user,
      profile,
      session,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: authService.isAdmin(profile),
      isSuperAdmin: authService.isSuperAdmin(profile),
      isDemo: isDemoMode,
      signIn,
      signUp,
      signOut,
      resetPassword: authService.sendPasswordReset,
      updatePassword: authService.updateUserPassword,
      updateProfile: async (updates) => {
        if (!user) throw new Error('You must be signed in.');
        if (isDemoMode) {
          setProfile((p) => (p ? { ...p, ...updates } : p));
          return;
        }
        const updated = await authService.updateProfile(user.id, updates);
        setProfile(updated);
      },
      refreshProfile,
      demoSignIn,
    };
  }, [session, profile, loading, demoRole, signIn, signUp, signOut, refreshProfile, demoSignIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
