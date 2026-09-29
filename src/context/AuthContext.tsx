import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase.ts';
import { AuthDemoService, UserProfile, AuthSession } from '../services/authDemoService.ts';

interface AuthContextType {
  user: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  isSupabaseActive: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    name: string;
    email: string;
    password: string;
    role: UserProfile['role'];
    company: string;
  }) => Promise<void>;
  signInQuickDemo: (userKey: 'alex' | 'sarah' | 'david') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isSupabaseActive = useMemo(() => isSupabaseConfigured(), []);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseActive);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseActive && supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data.session && mounted) {
            const sbUser = data.session.user;
            const mappedUser: UserProfile = {
              id: sbUser.id,
              email: sbUser.email || '',
              name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
              role: (sbUser.user_metadata?.role as UserProfile['role']) || 'Account Executive',
              company: sbUser.user_metadata?.company || 'My Workspace',
              createdAt: sbUser.created_at,
              isDemoUser: false,
            };
            setUser(mappedUser);
            setSession({
              user: mappedUser,
              token: data.session.access_token,
              expiresAt: (data.session.expires_at || 0) * 1000,
            });
            setIsDemoMode(false);
            setLoading(false);
            return;
          }
        }

        // Fallback or demo session
        const stored = AuthDemoService.getStoredSession();
        if (stored && mounted) {
          setUser(stored.user);
          setSession(stored);
          setIsDemoMode(stored.user.isDemoUser);
        }
      } catch (err) {
        console.warn('[NexoraAuth] Error during session restoration', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen to Supabase auth state change if active
    if (isSupabaseActive && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, sbSession) => {
        if (!mounted) return;
        if (sbSession?.user) {
          const mapped: UserProfile = {
            id: sbSession.user.id,
            email: sbSession.user.email || '',
            name: sbSession.user.user_metadata?.full_name || sbSession.user.email?.split('@')[0] || 'User',
            role: (sbSession.user.user_metadata?.role as UserProfile['role']) || 'Account Executive',
            company: sbSession.user.user_metadata?.company || 'My Workspace',
            createdAt: sbSession.user.created_at,
            isDemoUser: false,
          };
          setUser(mapped);
          setSession({
            user: mapped,
            token: sbSession.access_token,
            expiresAt: (sbSession.expires_at || 0) * 1000,
          });
          setIsDemoMode(false);
        } else {
          // If Supabase logs out, check if we have a demo session
          const stored = AuthDemoService.getStoredSession();
          if (stored) {
            setUser(stored.user);
            setSession(stored);
            setIsDemoMode(true);
          } else {
            setUser(null);
            setSession(null);
          }
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isSupabaseActive]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isSupabaseActive && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          throw new Error(error.message);
        }
        if (data.session && data.user) {
          const mapped: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: (data.user.user_metadata?.role as UserProfile['role']) || 'Account Executive',
            company: data.user.user_metadata?.company || 'My Workspace',
            createdAt: data.user.created_at,
            isDemoUser: false,
          };
          setUser(mapped);
          setSession({
            user: mapped,
            token: data.session.access_token,
            expiresAt: (data.session.expires_at || 0) * 1000,
          });
          setIsDemoMode(false);
          return;
        }
      }

      // Demo Mode login
      const demoSession = await AuthDemoService.signIn(email, password);
      setUser(demoSession.user);
      setSession(demoSession);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseActive]);

  const signUp = useCallback(async (params: {
    name: string;
    email: string;
    password: string;
    role: UserProfile['role'];
    company: string;
  }) => {
    setLoading(true);
    try {
      if (isSupabaseActive && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: params.email.trim(),
          password: params.password,
          options: {
            data: {
              full_name: params.name.trim(),
              role: params.role,
              company: params.company.trim(),
            },
          },
        });
        if (error) {
          throw new Error(error.message);
        }
        if (data.user) {
          const mapped: UserProfile = {
            id: data.user.id,
            email: data.user.email || params.email,
            name: params.name.trim(),
            role: params.role,
            company: params.company.trim(),
            createdAt: data.user.created_at,
            isDemoUser: false,
          };
          setUser(mapped);
          if (data.session) {
            setSession({
              user: mapped,
              token: data.session.access_token,
              expiresAt: (data.session.expires_at || 0) * 1000,
            });
          }
          setIsDemoMode(false);
          return;
        }
      }

      // Demo Mode signup
      const demoSession = await AuthDemoService.signUp(params);
      setUser(demoSession.user);
      setSession(demoSession);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseActive]);

  const signInQuickDemo = useCallback(async (userKey: 'alex' | 'sarah' | 'david') => {
    setLoading(true);
    try {
      const demoSession = await AuthDemoService.quickDemoLogin(userKey);
      setUser(demoSession.user);
      setSession(demoSession);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseActive && supabase) {
        await supabase.auth.signOut();
      }
      await AuthDemoService.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [isSupabaseActive]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isSupabaseActive,
      isDemoMode,
      signIn,
      signUp,
      signInQuickDemo,
      signOut,
    }),
    [user, session, loading, isSupabaseActive, isDemoMode, signIn, signUp, signInQuickDemo, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
