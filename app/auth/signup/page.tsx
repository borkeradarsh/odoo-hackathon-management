"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleGoogleSignUp = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== rePassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) throw error;
      setShowConfirmation(true);
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden flex-col items-center p-10">
          <h2 className="text-2xl font-bold mb-4 text-center">Confirm your email</h2>
          <p className="text-gray-600 mb-6 text-center">A confirmation email has been sent to <span className="font-semibold">{email}</span>.<br />Please check your inbox and click the link to activate your account before logging in.</p>
          <Button
            variant="default"
            className="rounded-lg px-6 py-2 text-base font-semibold"
            onClick={() => router.push('/auth/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left: Signup Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-2">Create an Account</h2>
          <p className="text-gray-500 mb-8">Sign up to make your work easier and organized with Manufacturing App.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                className="mt-1 rounded-full px-4 py-2 border"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                autoComplete="new-password"
                className="mt-1 rounded-full px-4 py-2 border"
              />
            </div>
            <div>
              <Label htmlFor="rePassword">Re-enter Password</Label>
              <Input
                id="rePassword"
                type="password"
                value={rePassword}
                onChange={e => setRePassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1 rounded-full px-4 py-2 border"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 text-center">{error}</div>
            )}
            <Button type="submit" className="w-full rounded-full py-2 text-base font-semibold" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
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
              onClick={handleGoogleSignUp}
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
              Already have an account? <a href="/auth/login" className="text-blue-600 hover:underline">Log in</a>
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
