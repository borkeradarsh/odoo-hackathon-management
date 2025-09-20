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

    // Join work_orders with manufacturing_orders, products, bom, bom_items, and component products
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        id, status, created_at, updated_at,
        mo_id,
        component:products(id, name)
      `)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my work orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch work orders', details: error.message },
        { status: 500 }
      );
    }

    // If no work orders, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Transform data for frontend
    const formatted = data.map(wo => {
      const component = Array.isArray(wo.component) ? wo.component[0] : wo.component;
      return {
        id: wo.id,
        status: wo.status,
        created_at: wo.created_at,
        updated_at: wo.updated_at,
        manufacturing_order_id: wo.mo_id,
        component: component ? { id: component.id, name: component.name } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('Unexpected error fetching my work orders:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}