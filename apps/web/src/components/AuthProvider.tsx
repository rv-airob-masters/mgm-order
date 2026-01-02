import { useState, useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AuthContext,
  type AuthUser,
  type AuthContextType,
  fetchUserRole,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getCurrentSession,
  onAuthStateChange,
} from '../lib/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    getCurrentSession().then(async (session) => {
      setSession(session);
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role,
        });
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      setSession(session);
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: authUser, error } = await signInWithEmail(email, password);
    if (authUser && !error) {
      const role = await fetchUserRole(authUser.id);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        role,
      });
    }
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { user: authUser, error } = await signUpWithEmail(email, password);
    if (authUser && !error) {
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        role: 'viewer', // New users are viewers by default
      });
    }
    return { error };
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAdmin: user?.role === 'admin',
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

