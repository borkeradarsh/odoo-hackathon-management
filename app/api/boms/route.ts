import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

// GET: Fetch all BOMs with product information
export async function GET() {
  try {
    const supabase = await createServer();
    
    const { data: boms, error } = await supabase
      .from('boms')
      .select(`
        id, created_at,
        product:products(id, name),
        bom_items:bom_items(
          quantity,
          component:products(id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching BOMs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch BOMs' },
        { status: 500 }
      );
    }

    // Transform the response to match frontend expectations
    const formatted = (boms || []).map(bom => {
      // Supabase returns joined objects as arrays if multiple, so pick first
      const product = Array.isArray(bom.product) ? bom.product[0] : bom.product;
      return {
        id: bom.id,
        created_at: bom.created_at,
        product: product ? { id: product.id, name: product.name } : null,
        bom_items: (bom.bom_items || []).map(item => {
          const component = Array.isArray(item.component) ? item.component[0] : item.component;
          return {
            quantity: item.quantity,
            component: component ? { id: component.id, name: component.name } : null
          };
        })
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error('Unexpected error fetching BOMs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new BOM with BOM lines (transactional)
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
    const requiredFields = ['name', 'product_id', 'items'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'BOM must have at least one item' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have a valid product_id and positive quantity' },
          { status: 400 }
        );
      }
    }

    console.log('BOM creation request body:', body);

    // Start transaction by creating BOM first
    const bomData = {
      name: body.name,
      product_id: body.product_id,
      created_at: new Date().toISOString(),
    };

    console.log('Creating BOM with data:', bomData);

    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .insert([bomData])
      .select()
      .single();

    if (bomError) {
      console.error('Error creating BOM:', bomError);
      
      // Handle foreign key constraint violations
      if (bomError.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid product_id specified' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create BOM' },
        { status: 500 }
      );
    }

    // Create BOM lines
    const bomLines = body.items.map((item: { product_id: string; quantity: number }) => ({
      bom_id: bom.id,
      product_id: item.product_id, // CORRECTED: from component_id to product_id
      quantity: item.quantity, // CORRECTED: from quantity_needed to quantity
    }));

    const { error: bomLinesError } = await supabase
      .from('bom_items')
      .insert(bomLines)
      .select(`
        *,
        component:products(id, name)
      `);

    if (bomLinesError) {
      console.error('Error creating BOM lines:', bomLinesError);
      
      // Clean up: delete the created BOM if BOM lines creation failed
      await supabase.from('boms').delete().eq('id', bom.id);
      
      // Handle foreign key constraint violations
      if (bomLinesError.code === '23503') {
        return NextResponse.json(
          { error: 'One or more component product_ids are invalid' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create BOM lines' },
        { status: 500 }
      );
    }

    // Fetch the complete BOM with all relationships
    const { data: completeBom, error: fetchError } = await supabase
      .from('boms')
      .select(`
        *,
        product:products(id, name),
        bom_items:bom_items(
          *,
          component:products(id, name)
        )
      `)
      .eq('id', bom.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete BOM:', fetchError);
      return NextResponse.json(
        { error: 'BOM created but failed to fetch complete data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bom: completeBom }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating BOM:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}