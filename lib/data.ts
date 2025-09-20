// in lib/data.ts
import { createServer } from '@/lib/supabase/server';

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

    // Get stock alerts (with fallback to empty array)
    let stockAlerts: Array<{
      id: string;
      name: string;
      stock_on_hand: number;
      min_stock_level: number;
    }> = [];
    try {
      const { data: stockData } = await supabase
        .from('products')
        .select('id, name, stock_on_hand, min_stock_level')
        .filter('stock_on_hand', 'lt', 'min_stock_level')
        .order('stock_on_hand', { ascending: true })
        .limit(3);

      stockAlerts = stockData || [];
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