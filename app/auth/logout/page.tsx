'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logoutAction } from './actions';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        const supabase = createClient();
        
        // Client-side signout
        await supabase.auth.signOut();
        
        // Clear all possible auth-related storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear all cookies more thoroughly
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
        }

        // Also call server action for server-side cleanup
        await logoutAction();
        
      } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if there's an error
        window.location.href = '/auth/login';
      }
    };
    
    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p>Please wait while we sign you out.</p>
      </div>
    </div>
  );
}