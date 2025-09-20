import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServer();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all users with 'operator' role from profiles table
    const { data: operators, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'operator')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching operators:', error);
      return NextResponse.json(
        { error: 'Failed to fetch operators' },
        { status: 500 }
      );
    }

    console.log('Operators fetched:', operators);

    return NextResponse.json({
      success: true,
      data: operators || []
    });

  } catch (error) {
    console.error('Unexpected error fetching operators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}