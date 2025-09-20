'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default', 
  className = '', 
  showIcon = true,
  children 
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);
    
    try {
      await signOut();
      // Auth provider handles the redirect
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      setIsLoggingOut(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant={variant}
        size={size}
        className={className}
      >
        {showIcon && <LogOut className="w-4 h-4 mr-2" />}
        {children || (isLoggingOut ? 'Signing Out...' : 'Sign Out')}
      </Button>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}