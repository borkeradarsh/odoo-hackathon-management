// /app/(auth)/login/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function LoginPage() {
  const supabase = createClient();
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-4 rounded-lg shadow-lg bg-card text-card-foreground">
        <h1 className="text-2xl font-bold text-center">Login / Sign Up</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo={redirectTo}
          theme="dark"
        />
      </div>
    </div>
  );
}