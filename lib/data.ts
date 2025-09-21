// in lib/data.ts
import { createServer } from '@/lib/supabase/server';
import { z } from 'zod';

// Define a schema for validation
const bomItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().min(1),
});

const createBomSchema = z.object({
  name: z.string().min(3),
  product_id: z.number(),
  items: z.array(bomItemSchema).min(1),
});

export async function getDashboardAnalytics() {
  const supabase = await createServer();
  
  try {
    // First, try to call the optimized database function
    const { data, error } = await supabase.rpc('get_dashboard_analytics');

    if (error) {
      console.warn('Database function not available, using fallback queries:', error.message);
      // Fallback to individual queries if the function doesn't exist
      return await getFallbackDashboardAnalytics(supabase);
    }

    return { data };
  } catch (error) {
    console.warn('Error calling database function, using fallback:', error);
    // Fallback to individual queries
    return await getFallbackDashboardAnalytics(supabase);
  }
}

// Fallback function with individual queries
async function getFallbackDashboardAnalytics(supabase: Awaited<ReturnType<typeof createServer>>) {
  try {
    // Get KPIs with fallback for missing tables
    const kpis = {
      total_products: 0,
      active_boms: 0,
      in_progress_mos: 0,
      pending_wos: 0,
      low_stock_items: 0,
      completed_this_month: 0
    };

    // Try to get products count
    try {
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      kpis.total_products = productsCount || 0;
    } catch (error) {
      console.warn('Products table not accessible:', error);
    }

    // Try to get BOMs count
    try {
      const { count: bomsCount } = await supabase
        .from('boms')
        .select('*', { count: 'exact', head: true });
      kpis.active_boms = bomsCount || 0;
    } catch (error) {
      console.warn('BOMs table not accessible:', error);
    }

    // Try to get manufacturing orders
    try {
      const { count: inProgressCount } = await supabase
        .from('manufacturing_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'In Progress');
      kpis.in_progress_mos = inProgressCount || 0;
    } catch (error) {
      console.warn('Manufacturing orders table not accessible:', error);
    }

    // Try to get pending work orders
    try {
      const { count: pendingWorkOrdersCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      kpis.pending_wos = pendingWorkOrdersCount || 0;
    } catch (error) {
      console.warn('Work orders table not accessible:', error);
    }

    // Try to get completed orders this month
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: completedThisMonthCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', startOfMonth.toISOString());
      kpis.completed_this_month = completedThisMonthCount || 0;
    } catch (error) {
      console.warn('Could not fetch completed orders this month:', error);
    }
    try {
      // First, let's check what products exist
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_on_hand, min_stock_level')
        .limit(10);
      
      console.log('📦 Sample products:', allProducts);
      console.log('🚨 Products error:', productsError);

      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .not('min_stock_level', 'is', null)
        .filter('stock_on_hand', 'lt', 'min_stock_level');
      
      console.log('📉 Low stock count:', lowStockCount);
      kpis.low_stock_items = lowStockCount || 0;
    } catch (error) {
      console.warn('Products table not accessible for low stock:', error);
    }

    // Get recent orders (with fallback to empty array)
    let recentOrders: Array<{
      id: string;
      product_name: string;
      quantity_to_produce: number;
      status: string;
      created_at: string;
    }> = [];
    try {
      const { data: ordersData } = await supabase
        .from('manufacturing_orders')
        .select(`
          id, 
          quantity_to_produce, 
          status, 
          created_at,
          products!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      interface OrderWithProduct {
        id: string;
        quantity_to_produce: number;
        status: string;
        created_at: string;
        products: { name: string }[];
      }

      recentOrders = (ordersData || []).map((order: OrderWithProduct) => ({
        id: order.id,
        product_name: order.products?.[0]?.name || 'Unknown Product',
        quantity_to_produce: order.quantity_to_produce,
        status: order.status,
        created_at: order.created_at
      }));
    } catch (error) {
      console.warn('Could not fetch recent orders:', error);
    }

    // Get stock alerts (with fallback to empty array)
    let stockAlerts: Array<{
      id: string;
      name: string;
      stock_on_hand: number;
      min_stock_level: number;
    }> = [];
    try {
      const { data: stockData, error: stockError } = await supabase
        .from('products')
        .select('id, name, stock_on_hand, min_stock_level')
        .not('min_stock_level', 'is', null)
        .filter('stock_on_hand', 'lte', 'min_stock_level')
        .order('stock_on_hand', { ascending: true })
        .limit(5);

      console.log('📊 Stock alerts data:', stockData);
      console.log('❗ Stock alerts error:', stockError);
      
      stockAlerts = stockData || [];
    } catch (error) {
      console.warn('Could not fetch stock alerts:', error);
    }

    // Fetch all operators from profiles table
    let operators: Array<{ id: string; name: string }> = [];
    try {
      const { data: operatorData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'operator');
      
      interface OperatorProfile {
        id: string;
        full_name: string | null;
        role: string;
      }
      
      operators = (operatorData || []).map((op: OperatorProfile) => ({ 
        id: op.id, 
        name: op.full_name || 'Operator' 
      }));
    } catch (error) {
      console.warn('Could not fetch operators:', error);
    }

    // For each operator, fetch order stats
    const operatorAnalytics: Array<{
      id: string;
      name: string;
      completed: number;
      assigned: number;
      in_progress: number;
    }> = [];
    for (const op of operators) {
      let completed = 0, assigned = 0, in_progress = 0;
      try {
        // Completed orders
        const { count: completedCount } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('operator_id', op.id)
          .eq('status', 'completed');
        completed = completedCount || 0;

        // Assigned orders
        const { count: assignedCount } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('operator_id', op.id);
        assigned = assignedCount || 0;

        // In progress orders
        const { count: inProgressCount } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('operator_id', op.id)
          .eq('status', 'in_progress');
        in_progress = inProgressCount || 0;
      } catch (error) {
        console.warn(`Could not fetch order stats for operator ${op.id}:`, error);
      }
      operatorAnalytics.push({
        id: op.id,
        name: op.name,
        completed,
        assigned,
        in_progress
      });
    }

    return {
      data: {
        kpis,
        recentOrders,
        stockAlerts,
        operatorAnalytics
      }
    };
  } catch (error) {
    console.error('Fallback analytics failed:', error);
    // Return empty data structure if everything fails
    return {
      data: {
        kpis: {
          total_products: 0,
          active_boms: 0,
          in_progress_mos: 0,
          pending_wos: 0,
          low_stock_items: 0,
          completed_this_month: 0
        },
        recentOrders: [],
        stockAlerts: []
      }
    };
  }
}

export async function createBom(bomData: unknown) {
  const validation = createBomSchema.safeParse(bomData);
  if (!validation.success) {
    throw new Error(`Invalid BOM data: ${validation.error.message}`);
  }
  const { name, product_id, items } = validation.data;

  const supabase = await createServer();

  // 1. Create the main BOM record
  const { data: newBom, error: bomError } = await supabase
    .from('boms')
    .insert({ name, product_id })
    .select()
    .single();

  if (bomError) {
    console.error('Error creating BOM:', bomError);
    throw new Error('Failed to create BOM.');
  }

  // 2. Prepare and insert the BOM item lines
  // THIS IS THE FIX: We are now creating a new object with ONLY the required columns.
  const bomLinesData = items.map(item => ({
    bom_id: newBom.id,
    product_id: item.product_id,
    quantity: item.quantity,
  }));

  const { error: linesError } = await supabase
    .from('bom_items')
    .insert(bomLinesData);

  if (linesError) {
    console.error('Error creating BOM lines:', linesError);
    await supabase.from('boms').delete().eq('id', newBom.id); // Clean up failed BOM
    throw new Error('Failed to create BOM lines.');
  }

  return newBom;
}

// Stock Ledger function
export async function getStockLedger() {
  const supabase = await createServer();
  
  try {
    const { data, error } = await supabase
      .from('stock_ledger')
      .select('*, products(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stock ledger:', error);
      throw new Error('Failed to fetch stock ledger data');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getStockLedger:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}