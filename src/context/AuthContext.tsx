import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  auth,
  signInWithGoogle as firebaseGoogleSignIn,
  signOutUser,
  testFirestoreConnection,
} from '../services/firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirestoreSyncService } from '../services/firestoreSyncService.ts';
import { AuthDemoService, UserProfile, AuthSession } from '../services/authDemoService.ts';

interface AuthContextType {
  user: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  isFirebaseActive: boolean;
  isSupabaseActive: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
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
  const isFirebaseActive = true;
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Initialize connection test and Firebase auth listener on mount
  useEffect(() => {
    let unsubscribeSync: (() => void) | null = null;

    // Test Firestore connection on boot
    testFirestoreConnection().catch((err) =>
      console.warn('[Firebase] Connection probe:', err)
    );

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const mappedUser: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          role: 'Account Executive',
          company: 'Nexora Enterprise',
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          isDemoUser: false,
        };

        setUser(mappedUser);
        setSession({
          user: mappedUser,
          token: 'firebase_token_' + fbUser.uid,
          expiresAt: Date.now() + 3600000 * 24,
        });
        setIsDemoMode(false);

        // Start real-time Firestore synchronization
        unsubscribeSync = FirestoreSyncService.initRealtimeSync(fbUser.uid);
      } else {
        // If not logged in via Firebase, check if demo session exists
        const stored = AuthDemoService.getStoredSession();
        if (stored) {
          setUser(stored.user);
          setSession(stored);
          setIsDemoMode(stored.user.isDemoUser);
        } else {
          setUser(null);
          setSession(null);
          setIsDemoMode(false);
        }

        if (unsubscribeSync) {
          unsubscribeSync();
          unsubscribeSync = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSync) unsubscribeSync();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const fbUser = await firebaseGoogleSignIn();
      const mappedUser: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        role: 'Account Executive',
        company: 'Nexora Enterprise',
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        isDemoUser: false,
      };

      setUser(mappedUser);
      setSession({
        user: mappedUser,
        token: 'firebase_token_' + fbUser.uid,
        expiresAt: Date.now() + 3600000 * 24,
      });
      setIsDemoMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const authSession = await AuthDemoService.signInWithEmail(email, password);
      setUser(authSession.user);
      setSession(authSession);
      setIsDemoMode(authSession.user.isDemoUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (params: {
      name: string;
      email: string;
      password: string;
      role: UserProfile['role'];
      company: string;
    }) => {
      setLoading(true);
      try {
        const authSession = await AuthDemoService.signUpWithEmail(params);
        setUser(authSession.user);
        setSession(authSession);
        setIsDemoMode(authSession.user.isDemoUser);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signInQuickDemo = useCallback(async (userKey: 'alex' | 'sarah' | 'david') => {
    setLoading(true);
    try {
      const authSession = await AuthDemoService.signInQuickDemo(userKey);
      setUser(authSession.user);
      setSession(authSession);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      FirestoreSyncService.stopRealtimeSync();
      await signOutUser();
      AuthDemoService.clearStoredSession();
      setUser(null);
      setSession(null);
      setIsDemoMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isFirebaseActive,
        isSupabaseActive: false,
        isDemoMode,
        signInWithGoogle,
        signIn,
        signUp,
        signInQuickDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
