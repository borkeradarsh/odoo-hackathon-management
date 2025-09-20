import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const operatorId = params.id;

    if (!operatorId) {
      return NextResponse.json(
        { error: 'Operator ID is required' },
        { status: 400 }
      );
    }

    // Call the get_operator_analytics database function
    const { data, error } = await supabase.rpc('get_operator_analytics', {
      operator_id: operatorId
    });

    if (error) {
      console.error('Error fetching operator analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch operator analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || {
        total_assigned: 0,
        pending: 0,
        completed: 0
      }
    });

  } catch (error) {
    console.error('Unexpected error fetching operator analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}