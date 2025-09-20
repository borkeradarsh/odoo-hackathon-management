import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

// Types for Manufacturing Order creation
interface CreateMORequest {
  product_id: number | string; // Allow both number and string for FormData compatibility
  quantity: number | string; // Allow both number and string for FormData compatibility
  assignee_id?: string; // Optional operator assignment
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
    let { product_id, quantity } = body;
    const { assignee_id } = body;

    // Convert string values to numbers if necessary (for FormData compatibility)
    if (typeof product_id === 'string') {
      product_id = parseInt(product_id, 10);
    }
    if (typeof quantity === 'string') {
      quantity = parseInt(quantity, 10);
    }

    // Validate request data
    if (!product_id || !quantity || isNaN(product_id) || isNaN(quantity)) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required and must be valid numbers' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    console.log('Creating manufacturing order with params:', {
      product_id,
      quantity,
      assignee_id: assignee_id || null
    });

    // Call the PostgreSQL function to create the Manufacturing Order
    const { data, error } = await supabase.rpc('create_manufacturing_order', {
      product_id_to_create: product_id,
      quantity_to_produce: quantity,
      assignee_id: assignee_id
    });

    if (error) {
      console.error('Error creating manufacturing order:', error);
      
      // Check if this is a function not found error
      if (error.message.includes('could not find function') || error.message.includes('schema cache')) {
        return NextResponse.json(
          { 
            error: 'Manufacturing order function not found in database',
            details: 'The create_manufacturing_order function needs to be created in the database. Please run the SQL migration.',
            suggestion: 'Execute the SQL file: sql/create_manufacturing_order_function.sql',
            originalError: error.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create manufacturing order', details: error.message },
        { status: 500 }
      );
    }

    // Parse the result from the function
    const result: CreateMOResponse = data;
    console.log('Manufacturing order creation result:', result);

    if (!result.success) {
      console.error('Manufacturing order creation failed:', result);
      return NextResponse.json(
        { error: result.error || 'Unknown error occurred', code: result.error_code, details: result },
        { status: 400 }
      );
    }

    // If an assignee is provided, update the work orders to assign the operator
    if (assignee_id && result.mo_id) {
      try {
        const { error: assignError } = await supabase
          .from('work_orders')
          .update({ assignee_id: assignee_id })
          .eq('mo_id', result.mo_id);

        if (assignError) {
          console.error('Error assigning operator to work orders:', assignError);
          // Don't fail the whole request for assignment errors, just log it
        } else {
          console.log(`Assigned operator ${assignee_id} to work orders for MO ${result.mo_id}`);
        }
      } catch (assignmentError) {
        console.error('Error during operator assignment:', assignmentError);
        // Don't fail the whole request for assignment errors
      }
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