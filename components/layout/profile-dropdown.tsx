"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function ProfileDropdown({ onSignOut }: { onSignOut: () => void }) {
  const { profile, user } = useAuth();
  return (
    <div className="absolute left-16 top-16 z-50 w-64 bg-white rounded-xl shadow-lg border border-slate-200">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <div className="font-semibold text-lg text-slate-800">{profile?.full_name || user?.email || 'User'}</div>
            <div className="text-xs text-slate-500 mb-2">Role: {profile?.role || 'N/A'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
