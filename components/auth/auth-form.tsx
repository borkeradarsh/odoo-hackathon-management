'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AuthForm() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new login page
    router.push('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Redirecting to login...</h2>
        </div>
      </div>
    </div>
  )
}