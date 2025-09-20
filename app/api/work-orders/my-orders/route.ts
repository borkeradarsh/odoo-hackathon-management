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

    // Call the PostgreSQL function to get work orders for the current user
    // The function automatically filters by the authenticated user's ID
    const { data, error } = await supabase.rpc('get_my_work_orders');

    if (error) {
      console.error('Error fetching my work orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch your work orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Unexpected error fetching my work orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}