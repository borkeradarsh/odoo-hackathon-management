import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

// GET: Fetch all products
export async function GET() {
  try {
    const supabase = await createServer();
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Unexpected error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServer();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate type field
    if (!['Raw Material', 'Finished Good'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Type must be either "Raw Material" or "Finished Good"' },
        { status: 400 }
      );
    }

    // Prepare product data - ensure clean data types
    const productData = {
      name: String(body.name).trim(),
      type: String(body.type),
      stock_on_hand: parseInt(body.stock_on_hand) || 0,
      min_stock_level: parseInt(body.min_stock_level) || 10,
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error.code, error.message);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Product name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}