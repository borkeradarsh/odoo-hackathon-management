import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

// Types for Manufacturing Order creation
interface CreateMORequest {
  productId: number;
  quantity: number;
}

interface CreateMOResponse {
  success: boolean;
  mo_id?: number;
  product_id?: number;
  bom_id?: number;
  quantity_to_produce?: number;
  work_orders_created?: number;
  status?: string;
  created_at?: string;
  error?: string;
  error_code?: string;
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateMORequest = await request.json();
    const { productId, quantity } = body;

    // Validate request data
    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Call the PostgreSQL function to create the Manufacturing Order
    const { data, error } = await supabase.rpc('create_manufacturing_order', {
      product_id_to_create: productId,
      quantity_to_produce: quantity
    });

    if (error) {
      console.error('Error creating manufacturing order:', error);
      return NextResponse.json(
        { error: 'Failed to create manufacturing order', details: error.message },
        { status: 500 }
      );
    }

    // Parse the result from the function
    const result: CreateMOResponse = data;

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Unknown error occurred', code: result.error_code },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        moId: result.mo_id,
        productId: result.product_id,
        bomId: result.bom_id,
        quantityToProduce: result.quantity_to_produce,
        workOrdersCreated: result.work_orders_created,
        status: result.status,
        createdAt: result.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in manufacturing order creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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