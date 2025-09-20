'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  FileText,
  Settings,
  ClipboardList,
  Wrench,
  TrendingUp,
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: ('admin' | 'operator')[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin'],
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
    roles: ['admin'],
  },
  {
    title: 'BOMs',
    href: '/boms',
    icon: FileText,
    roles: ['admin'],
  },
  {
    title: 'Manufacturing Orders',
    href: '/manufacturing',
    icon: ClipboardList,
    roles: ['admin'],
  },
  {
    title: 'Work Orders',
    href: '/work-orders',
    icon: Wrench,
    roles: ['admin'],
  },
  {
    title: 'Stock Management',
    href: '/stock',
    icon: TrendingUp,
    roles: ['admin'],
  },
  // Operator-specific routes
  {
    title: 'My Work Orders',
    href: '/operator/my-orders',
    icon: Wrench,
    roles: ['operator'],
  },
  {
    title: 'BOMs (View Only)',
    href: '/operator/boms',
    icon: FileText,
    roles: ['operator'],
  },
  {
    title: 'Stock Info',
    href: '/operator/stock',
    icon: TrendingUp,
    roles: ['operator'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
]

interface SidebarProps {
  children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const { profile, user, signOut } = useAuth();
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(profile?.role || 'operator');
  });

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      // The auth provider will handle the redirect
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSignOutError(err.message);
      } else {
        setSignOutError('Sign out failed');
      }
      setSigningOut(false); // Only reset if there's an error
    }
  };

  return (
    <div className="flex h-screen bg-sidebar">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-sidebar-primary text-sidebar-primary-foreground rounded-full shadow-md border-sidebar-border"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar shadow-xl rounded-r-3xl border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border bg-sidebar-primary rounded-tr-3xl">
            <h1 className="text-2xl font-extrabold text-sidebar-primary-foreground tracking-tight">
              Manufacturing
            </h1>
            <p className="text-sm text-sidebar-accent-foreground">Management System</p>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-sidebar-border bg-sidebar-accent rounded-br-3xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sidebar-ring rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || user?.email || 'User'}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={profile?.role === 'admin' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {profile?.role === 'admin' ? 'Administrator' : 'Operator'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-ring"
                  )} />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sign out button */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 rounded-full bg-destructive text-white shadow-md border-none"
              disabled={signingOut}
            >
              <LogOut className="w-4 h-4" />
              <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </Button>
            {signOutError && (
              <div className="mt-2 text-sm text-red-600 text-center">{signOutError}</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 rounded-l-3xl">
          {children}
        </main>
      </div>
    </div>
  )
}