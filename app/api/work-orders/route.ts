import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';
import { getAllWorkOrders } from '@/lib/api/work-orders';
import { getNoCacheHeaders } from '@/lib/api-utils';

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

    // Use the getAllWorkOrders server function
    const { data: workOrders, error } = await getAllWorkOrders();

    if (error) {
      console.error('Error fetching work orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch work orders', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workOrders || []
    }, {
      headers: getNoCacheHeaders()
    });

  } catch (error) {
    console.error('Unexpected error fetching work orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}