import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

// GET: Fetch a single BOM with all details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServer();
    const { id } = params;

    const { data: bom, error } = await supabase
      .from('boms')
      .select(`
        *,
        product:products(id, name, sku),
        bom_lines:bom_lines(
          *,
          component:products(id, name, sku, unit_of_measure)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching BOM:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'BOM not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch BOM' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bom });
  } catch (error) {
    console.error('Unexpected error fetching BOM:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a BOM (this would typically be complex, involving BOM line updates)
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

    // Check if BOM exists
    const { data: existingBom, error: fetchError } = await supabase
      .from('boms')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingBom) {
      return NextResponse.json(
        { error: 'BOM not found' },
        { status: 404 }
      );
    }

    // Prepare update data (basic BOM fields only)
    const updateData = {
      version: body.version,
      is_active: body.is_active,
      quantity: body.quantity,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const { data: bom, error } = await supabase
      .from('boms')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        product:products(id, name, sku),
        bom_lines:bom_lines(
          *,
          component:products(id, name, sku, unit_of_measure)
        )
      `)
      .single();

    if (error) {
      console.error('Error updating BOM:', error);
      return NextResponse.json(
        { error: 'Failed to update BOM' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bom });
  } catch (error) {
    console.error('Unexpected error updating BOM:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a BOM and all its BOM lines
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

    // Check if BOM exists
    const { data: existingBom, error: fetchError } = await supabase
      .from('boms')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingBom) {
      return NextResponse.json(
        { error: 'BOM not found' },
        { status: 404 }
      );
    }

    // Delete BOM lines first (due to foreign key constraints)
    const { error: bomLinesError } = await supabase
      .from('bom_lines')
      .delete()
      .eq('bom_id', id);

    if (bomLinesError) {
      console.error('Error deleting BOM lines:', bomLinesError);
      return NextResponse.json(
        { error: 'Failed to delete BOM lines' },
        { status: 500 }
      );
    }

    // Delete the BOM
    const { error } = await supabase
      .from('boms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting BOM:', error);
      
      // Handle foreign key constraint violations
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete BOM: it is referenced by other records' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete BOM' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'BOM deleted successfully' });
  } catch (error) {
    console.error('Unexpected error deleting BOM:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}