import { createServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

export interface AuthValidationResult {
  success: boolean;
  user?: User;
  profile?: { role: 'admin' | 'operator' };
  error?: NextResponse;
}

/**
 * Validates user authentication and role permissions
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns AuthValidationResult with user data or error response
 */
export async function validateUserAuth(
  allowedRoles: ('admin' | 'operator')[] = ['admin', 'operator']
): Promise<AuthValidationResult> {
  try {
    const supabase = await createServer();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      };
    }

    // Verify user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Profile not found' },
          { status: 403 }
        )
      };
    }

    if (!allowedRoles.includes(profile.role)) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      };
    }

    return {
      success: true,
      user,
      profile
    };

  } catch (error) {
    console.error('Error validating user auth:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}