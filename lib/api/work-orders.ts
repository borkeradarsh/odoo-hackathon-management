import { createServer } from '@/lib/supabase/server';

export interface WorkOrderWithOperator {
  id: string;
  mo_id: number;
  name: string;
  status: string;
  assignee_id: string | null;
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

interface WorkOrderFromDB {
  id: string;
  mo_id: number;
  name: string;
  status: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
  manufacturing_orders?: {
    id: number;
    product_id: number;
    products?: {
      id: number;
      name: string;
    } | null;
  } | null;
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
        profiles (
          full_name
        ),
        manufacturing_orders!work_orders_mo_id_fkey (
          id,
          product_id,
          products (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
      return { data: null, error: new Error(error.message) };
    }

    // Transform the data to include operator information
    const workOrdersWithOperators: WorkOrderWithOperator[] = (data as WorkOrderFromDB[] || []).map((wo) => ({
      id: wo.id,
      mo_id: wo.mo_id,
      name: wo.name,
      status: wo.status,
      assignee_id: wo.assignee_id,
      created_at: wo.created_at,
      updated_at: wo.updated_at,
      profiles: wo.profiles || null,
      manufacturing_orders: wo.manufacturing_orders || null,
      operator_name: wo.profiles?.full_name || null,
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