// Example usage in a component like /components/user-profile.tsx
'use client';

import { useAuth } from '@/components/auth/auth-provider';

export function UserProfileDisplay() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div>
      <p>{profile.full_name}</p>
      {/* This will now display the correct, up-to-date role */}
      <p>{profile.role}</p>
    </div>
  );
}