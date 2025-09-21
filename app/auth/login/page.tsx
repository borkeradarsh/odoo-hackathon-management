"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };
  // Apple and Facebook buttons are placeholders
  const handleAppleLogin = () => {};
  const handleFacebookLogin = () => {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // For demo, treat username as email
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });
      if (error) throw error;
      
      // Get user profile to determine redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        // Redirect based on role
        if (profile?.role === 'operator') {
          router.push("/operator/my-orders");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left: Login Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-gray-500 mb-8">Simplify your workflow and boost your productivity with Manufacturing App. Get started for free.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="mt-1 rounded-full px-4 py-2 border"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 rounded-full px-4 py-2 border"
              />
            </div>
            <div className="flex justify-end text-xs mb-2">
              <a href="#" className="text-gray-500 hover:underline">Forgot Password?</a>
            </div>
            {error && (
              <div className="text-sm text-red-600 text-center">{error}</div>
            )}
            <Button type="submit" className="w-full rounded-full py-2 text-base font-semibold" disabled={loading}>
              {loading ? "Logging In..." : "Login"}
            </Button>
            <div className="flex items-center my-4">
              <span className="flex-1 h-px bg-gray-200" />
              <span className="px-2 text-gray-400 text-xs">or continue with</span>
              <span className="flex-1 h-px bg-gray-200" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-lg flex items-center justify-center gap-2 py-2 text-base font-semibold border-gray-300"
              onClick={handleGoogleLogin}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g>
                  <circle cx="12" cy="12" r="12" fill="#fff"/>
                  <path d="M21.6 12.227c0-.818-.073-1.597-.209-2.345H12v4.44h5.37a4.59 4.59 0 0 1-1.99 3.01v2.497h3.22c1.89-1.74 2.98-4.3 2.98-7.602z" fill="#4285F4"/>
                  <path d="M12 22c2.7 0 4.97-.89 6.63-2.42l-3.22-2.497c-.89.6-2.03.96-3.41.96-2.62 0-4.84-1.77-5.63-4.15H3.01v2.61A9.99 9.99 0 0 0 12 22z" fill="#34A853"/>
                  <path d="M6.37 13.89a5.98 5.98 0 0 1 0-3.78V7.5H3.01a9.99 9.99 0 0 0 0 9.01l3.36-2.62z" fill="#FBBC05"/>
                  <path d="M12 6.58c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.97 3.89 14.7 3 12 3A9.99 9.99 0 0 0 3.01 7.5l3.36 2.61C7.16 8.35 9.38 6.58 12 6.58z" fill="#EA4335"/>
                </g>
              </svg>
              Continue with Google
            </Button>
            <div className="text-center text-sm mt-4">
              Not a member? <a href="/auth/signup" className="text-blue-600 hover:underline">Register now</a>
            </div>
          </form>
        </div>
        {/* Right: Illustration */}
        <div className="hidden md:flex w-1/2 bg-green-50 items-center justify-center p-10">
          <Image
            src="/login-illustration.png"
            alt="Login Illustration"
            width={400}
            height={400}
            className="max-w-full h-auto rounded-xl"
            priority
          />
        </div>
      </div>
    </div>
  );
}
