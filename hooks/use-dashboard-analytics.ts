'use client';
import { useState, useEffect } from 'react';

// Define the expected data structure
interface RecentOrder {
  id: number;
  status: string;
  created_at: string;
  product_name: string;
  quantity_to_produce: number;
}

interface StockAlert {
  id: number;
  name: string;
  stock_on_hand: number;
  min_stock_level: number;
}

interface DashboardData {
  kpis: {
    total_products: number;
    active_boms: number;
    in_progress_mos: number;
    pending_wos: number;
    low_stock_items: number;
    completed_this_month: number;
  };
  recentOrders: RecentOrder[];
  stockAlerts: StockAlert[];
  operatorAnalytics: Array<{
    id: string;
    name: string;
    completed: number;
    assigned: number;
    in_progress: number;
  }>;
}

export function useDashboardAnalytics() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Reset state on new fetch
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/dashboard/analytics');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        // The API may nest the data, so we access result.data if it exists
        setData(result.data || result);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  return { data, isLoading, error };
}