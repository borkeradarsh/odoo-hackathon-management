import { createServer } from '@/lib/supabase/server';

// Type definitions for the analytics data
interface DashboardKPIs {
  total_products: number;
  active_boms: number;
  in_progress_mos: number;
  pending_wos: number;
  low_stock_items: number;
  completed_this_month: number;
}

interface RecentOrder {
  id: string;
  product_name: string;
  quantity_to_produce: number;
  status: string;
}

interface StockAlert {
  id: string;
  name: string;
  stock_on_hand: number;
  min_stock_level: number;
}

export interface DashboardAnalytics {
  kpis: DashboardKPIs;
  recentOrders: RecentOrder[];
  stockAlerts: StockAlert[];
}

/**
 * Main server-side function to fetch dashboard analytics
 * Uses complex SQL query with CTEs for optimal performance
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const supabase = await createServer();
  
  try {
    // First try to use the optimized PostgreSQL function with CTEs
    const { data, error } = await supabase.rpc('get_dashboard_analytics');

    if (error) {
      console.warn('Dashboard analytics function not found, falling back to individual queries:', error);
      
      // If the function doesn't exist (error code 42883), fall back to individual queries
      if (error.code === '42883') {
        return await getFallbackAnalytics(supabase);
      }
      
      throw new Error(`Database error: ${error.message}`);
    }

    // The RPC function returns the structured data directly
    return data || getEmptyAnalytics();
    
  } catch (error) {
    console.error('Error in getDashboardAnalytics:', error);
    
    // Try fallback approach as last resort
    try {
      return await getFallbackAnalytics(supabase);
    } catch (fallbackError) {
      console.error('Fallback analytics also failed:', fallbackError);
      return getEmptyAnalytics();
    }
  }
}

/**
 * Fallback function for basic analytics when the database function doesn't exist
 * Uses individual Supabase queries instead of the optimized CTE function
 */
async function getFallbackAnalytics(supabase: Awaited<ReturnType<typeof createServer>>): Promise<DashboardAnalytics> {
  try {
    // Get basic counts from individual queries
    const [
      { count: totalProducts },
      { count: activeBoms },
      { count: inProgressMos },
      { count: pendingWos }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('boms').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('manufacturing_orders').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    // Get recent manufacturing orders
    const { data: recentOrders } = await supabase
      .from('manufacturing_orders')
      .select(`
        id,
        quantity_to_produce,
        status,
        products!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(3);

    // Get stock alerts (products with low stock)
    const { data: stockAlerts } = await supabase
      .from('products')
      .select('id, name, stock_on_hand, min_stock_level')
      .lt('stock_on_hand', 'min_stock_level')
      .order('stock_on_hand', { ascending: true })
      .limit(5);

    // Calculate completed orders this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count: completedThisMonth } = await supabase
      .from('manufacturing_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', startOfMonth.toISOString());

    // Calculate low stock items
    const { count: lowStockItems } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock_on_hand', 'min_stock_level');

    return {
      kpis: {
        total_products: totalProducts || 0,
        active_boms: activeBoms || 0,
        in_progress_mos: inProgressMos || 0,
        pending_wos: pendingWos || 0,
        low_stock_items: lowStockItems || 0,
        completed_this_month: completedThisMonth || 0
      },
      recentOrders: (recentOrders || []).map(order => ({
        id: order.id,
        // @ts-expect-error - Supabase types don't properly infer nested relations
        product_name: order.products?.name || 'Unknown Product',
        quantity_to_produce: order.quantity_to_produce,
        status: order.status
      })),
      stockAlerts: (stockAlerts || []).map(item => ({
        id: item.id,
        name: item.name,
        stock_on_hand: item.stock_on_hand,
        min_stock_level: item.min_stock_level
      }))
    };
    
  } catch (error) {
    console.error('Error in fallback analytics:', error);
    return getEmptyAnalytics();
  }
}

/**
 * Returns empty analytics structure when no data is available
 */
function getEmptyAnalytics(): DashboardAnalytics {
  return {
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
  };
}