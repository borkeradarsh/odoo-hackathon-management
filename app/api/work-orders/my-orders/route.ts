import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';
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

    // EMERGENCY DEBUG - Let's try without foreign key constraint
    console.log('Fetching work orders for user:', user.id);
    
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        profiles!work_orders_operator_id_fkey(full_name)
      `)
      .eq('operator_id', user.id)
      .order('created_at', { ascending: false });

    console.log('Work orders data:', JSON.stringify(data, null, 2));
    console.log('Work orders error:', error);

    // Now let's manually fetch manufacturing orders
    let moData = null;
    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moIds = [...new Set(data.map((wo: any) => wo.mo_id))];
      console.log('MO IDs to fetch:', moIds);
      
      const { data: manufacturingOrders, error: moError } = await supabase
        .from('manufacturing_orders')
        .select(`
          id,
          product_id,
          products(id, name)
        `)
        .in('id', moIds);
        
      console.log('Manufacturing orders data:', JSON.stringify(manufacturingOrders, null, 2));
      console.log('Manufacturing orders error:', moError);
      moData = manufacturingOrders;
    }

    if (error) {
      console.error('Error fetching my work orders:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to fetch your work orders', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data with manual joins - EMERGENCY FIX
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedData = data?.map((wo: any) => {
      // Find matching manufacturing order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchingMO = moData?.find((mo: any) => mo.id === wo.mo_id);
      
      return {
        id: wo.id,
        mo_id: wo.mo_id,
        name: wo.name,
        status: wo.status,
        created_at: wo.created_at,
        profiles: wo.profiles,
        manufacturing_orders: matchingMO || null,
        operator_name: wo.profiles?.full_name?.split(' ')[0] || '',
        operator_full_name: wo.profiles?.full_name || '',
        finished_product_name: matchingMO?.products?.[0]?.name || wo.name || 'Unknown Product'
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: transformedData
    }, {
      headers: getNoCacheHeaders()
    });

  } catch (error) {
    console.error('Unexpected error fetching my work orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}