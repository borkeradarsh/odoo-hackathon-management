import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

// PUT: Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Validate type field if provided
    if (body.type && !['Raw Material', 'Finished Good'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Type must be either "Raw Material" or "Finished Good"' },
        { status: 400 }
      );
    }

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Prepare update data - only allow specific fields
    const updateData: Partial<{
      name: string;
      type: string;
      stock_on_hand: number;
      min_stock_level: number;
    }> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.stock_on_hand !== undefined) updateData.stock_on_hand = body.stock_on_hand;
    if (body.min_stock_level !== undefined) updateData.min_stock_level = body.min_stock_level;

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Product name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Unexpected error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      
      // Handle foreign key constraint violations
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete product: it is referenced by other records' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Unexpected error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}