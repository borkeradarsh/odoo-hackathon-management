'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on user role
      if (profile.role === 'operator') {
        router.push('/operator/my-orders');
      } else {
        router.push('/dashboard');
      }
    } else if (!loading && !user) {
      // User not authenticated, redirect to login
      router.push('/auth/login');
    }
  }, [router, user, profile, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Manufacturing Management</h1>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}