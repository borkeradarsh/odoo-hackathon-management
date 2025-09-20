// /components/auth/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Define the shape of your profile data
type Profile = {
  id: string;
  full_name: string | null;
  role: 'admin' | 'operator';
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch the user's profile from the 'profiles' table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          // This is the critical step: update the profile state
          setProfile(profileData as Profile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signout error:', error);
        throw error;
      }

      // Clear local state
      setUser(null);
      setProfile(null);

      // Clear browser storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies more reliably
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name) {
            // Clear for current domain and path
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            // Clear for parent domain as well
            const parts = window.location.hostname.split('.');
            if (parts.length > 1) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${parts.slice(-2).join('.')}`;
            }
          }
        });

        // Force redirect to login page
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Error during signout:', error);
      // Even if there's an error, try to clear local state and redirect
      setUser(null);
      setProfile(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw error;
    }
  };

  const value = { user, profile, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context in your components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};