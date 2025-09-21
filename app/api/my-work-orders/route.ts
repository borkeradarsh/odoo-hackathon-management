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

    // Verify user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'operator' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch work orders based on the actual schema
    const { data: workOrdersData, error: workOrdersError } = await supabase
      .from('work_orders')
      .select(`
        id,
        name,
        status,
        created_at,
        mo_id,
        operator_id
      `)
      .eq('operator_id', user.id)
      .order('created_at', { ascending: false });

    if (workOrdersError) {
      console.error('Error fetching work orders:', workOrdersError);
      return NextResponse.json(
        { error: 'Failed to fetch work orders', details: workOrdersError.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const transformedData = (workOrdersData || []).map(wo => ({
      id: wo.id,
      status: wo.status,
      created_at: wo.created_at,
      manufacturing_order_id: wo.mo_id, // Map mo_id to manufacturing_order_id for frontend
      component: {
        id: wo.id, // Use work order ID as component ID for now
        name: wo.name // Use work order name as component name
      }
    }));

    const data = transformedData;
    const error = null;

    if (error) {
      console.error('Error fetching my work orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch work orders', details: 'Database error' },
        { status: 500 }
      );
    }

    // Data is already in the correct format with component details
    return NextResponse.json({
      success: true,
      data: data || []
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