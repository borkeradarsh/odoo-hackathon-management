import { createServer } from '@/lib/supabase/server';

export interface WorkOrderWithOperator {
  id: string;
  mo_id: number;
  name: string;
  status: string;
  operator_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  } | null;
  manufacturing_orders?: {
    id: number;
    product_id: number;
    products?: {
      id: number;
      name: string;
    } | null;
  } | null;
  operator_name?: string | null;
  operator_full_name?: string | null;
  finished_product_name?: string | null;
}

/**
 * Fetches all work orders with operator information for Admin view
 * Joins with profiles table to get operator full names
 */
export async function getAllWorkOrders(): Promise<{
  data: WorkOrderWithOperator[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createServer();

    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        profiles(full_name),
        manufacturing_orders!work_orders_mo_id_fkey(
          id,
          product_id,
          products(id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
      return { data: null, error: new Error(error.message) };
    }

    // Transform the data to include operator information - QUICK FIX
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workOrdersWithOperators: WorkOrderWithOperator[] = (data || []).map((wo: any) => ({
      id: wo.id,
      mo_id: wo.mo_id,
      name: wo.name,
      status: wo.status,
      operator_id: wo.operator_id,
      created_at: wo.created_at,
      updated_at: wo.updated_at,
      profiles: wo.profiles,
      manufacturing_orders: wo.manufacturing_orders,
      operator_name: wo.profiles?.full_name?.split(' ')[0] || null,
      operator_full_name: wo.profiles?.full_name || null,
      finished_product_name: wo.manufacturing_orders?.products?.name || null
    }));

    return { data: workOrdersWithOperators, error: null };
  } catch (error) {
    console.error('Unexpected error in getAllWorkOrders:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}