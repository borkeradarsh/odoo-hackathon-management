import { createServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getNoCacheHeaders } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const { product_id, quantity, assignee_id } = await request.json();

    // Basic validation
    if (!product_id || !quantity || !assignee_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createServer();
    const { data, error } = await supabase.rpc('create_manufacturing_order', {
      product_id_to_create: product_id,
      quantity_to_produce: quantity,
      assignee_id: assignee_id
    });

    if (error) {
      // This handles real database errors
      throw new Error(error.message);
    }

    // SUCCESS PATH: Return a 200 OK status with the new MO ID
    return NextResponse.json({ success: true, new_mo_id: data }, {
      headers: getNoCacheHeaders()
    });

  } catch (err: unknown) {
    // This catches all errors and returns a clear 500 error
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error("Critical error creating MO:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Get all Manufacturing Orders
export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('manufacturing_orders')
      .select(`
        id,
        quantity_to_produce,
        status,
        created_at,
        product:products(
          id,
          name
        ),
        bom:boms(
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: manufacturingOrders, error } = await query;

    if (error) {
      console.error('Error fetching manufacturing orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch manufacturing orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: manufacturingOrders,
      pagination: {
        limit,
        offset,
        total: manufacturingOrders.length
      }
    });

  } catch (error) {
    console.error('Unexpected error fetching manufacturing orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}