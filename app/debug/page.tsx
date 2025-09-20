'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SessionTestPage() {
  const [sessionInfo, setSessionInfo] = useState<{
    hasSession: boolean;
    user: object | null;
    error: string | null;
    localStorage: Record<string, string> | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      setSessionInfo({
        hasSession: !!session,
        user: session?.user || null,
        error: error?.message || null,
        localStorage: typeof window !== 'undefined' ? 
          Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth')).reduce((acc, key) => {
            acc[key] = localStorage.getItem(key) || '';
            return acc;
          }, {} as Record<string, string>) : null
      });
      
      setLoading(false);
    };
    
    checkSession();
  }, []);

  if (loading) {
    return <div className="p-8">Loading session info...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug Page</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Session Info:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      </div>
      
      <div className="space-x-4">
        <Link href="/auth/logout" className="bg-red-500 text-white px-4 py-2 rounded">
          Force Logout
        </Link>
        <Link href="/auth/login" className="bg-blue-500 text-white px-4 py-2 rounded">
          Go to Login
        </Link>
        <Link href="/dashboard" className="bg-green-500 text-white px-4 py-2 rounded">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}