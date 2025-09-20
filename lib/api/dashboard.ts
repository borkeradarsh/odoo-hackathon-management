// Dashboard Analytics API
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

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_SITE_URL || ''
  : 'http://localhost:3000';

export const dashboardApi = {
  // Get dashboard analytics data
  async getAnalytics(): Promise<{ data: DashboardAnalytics }> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboard analytics');
    }

    return response.json();
  },
};