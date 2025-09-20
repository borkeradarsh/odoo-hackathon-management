'use client'

import { useAuth } from './auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'operator')[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  fallback 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  console.log('🔐 ProtectedRoute Debug:', {
    hasUser: !!user,
    hasProfile: !!profile,
    isLoading: loading,
    userRole: profile?.role || 'none',
    allowedRoles: allowedRoles || 'any'
  });

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔐 ProtectedRoute: Redirecting to login');
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    console.log('🔐 ProtectedRoute: Showing auth loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || !profile) {
    console.log('🔐 ProtectedRoute: No user/profile, showing auth loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    console.log('🔐 ProtectedRoute: Access denied for role:', profile.role);
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      )
    )
  }

  console.log('🔐 ProtectedRoute: ✅ Allowing access, rendering children');
  return <>{children}</>
}