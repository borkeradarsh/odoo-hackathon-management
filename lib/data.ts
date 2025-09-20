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

    // Try to get manufacturing orders (in progress, pending, completed this month)
    try {
      // In Progress
      const { count: inProgressCount } = await supabase
        .from('manufacturing_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'In Progress');
      kpis.in_progress_mos = inProgressCount || 0;

      // Pending Work Orders
      const { count: pendingCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      kpis.pending_wos = pendingCount || 0;

      // Completed This Month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      const { count: completedCount } = await supabase
        .from('manufacturing_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Completed')
        .gte('completed_at', firstDay)
        .lte('completed_at', lastDay);
      kpis.completed_this_month = completedCount || 0;
    } catch (error) {
      console.warn('Manufacturing/work orders table not accessible:', error);
    }

    // Get recent orders (with fallback to empty array)
    let recentOrders: Array<{
      id: string;
      product_name: string;
      quantity_to_produce: number;
      status: string;
    }> = [];
    try {
      const { data: ordersData } = await supabase
        .from('manufacturing_orders')
        .select('id, quantity_to_produce, status')
        .order('created_at', { ascending: false })
        .limit(3);

      recentOrders = (ordersData || []).map((order) => ({
        id: order.id,
        product_name: 'Manufacturing Order',
        quantity_to_produce: order.quantity_to_produce,
        status: order.status
      }));
    } catch (error) {
      console.warn('Could not fetch recent orders:', error);
    }

    // Get stock alerts (with fallback to empty array) and count for low stock items
    let stockAlerts: Array<{
      id: string;
      name: string;
      stock_on_hand: number;
      min_stock_level: number;
    }> = [];
    try {
      const { data: stockData, count: lowStockCount } = await supabase
        .from('products')
        .select('id, name, stock_on_hand, min_stock_level', { count: 'exact' })
        .filter('stock_on_hand', 'lt', 'min_stock_level')
        .order('stock_on_hand', { ascending: true });

      stockAlerts = stockData || [];
      kpis.low_stock_items = lowStockCount || 0;
    } catch (error) {
      console.warn('Could not fetch stock alerts:', error);
    }

    return {
      data: {
        kpis,
        recentOrders,
        stockAlerts
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