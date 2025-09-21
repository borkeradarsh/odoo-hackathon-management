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
        const response = await fetch('/api/dashboard/analytics', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        // Handle both direct data and nested data structures
        if (result.data) {
          // If the result has a nested 'data' property
          setData(result.data);
        } else if (result.kpis) {
          // If the result has the data structure directly
          setData(result);
        } else {
          // Fallback with default structure
          setData({
            kpis: {
              total_products: 0,
              active_boms: 0,
              in_progress_mos: 0,
              pending_wos: 0,
              low_stock_items: 0,
              completed_this_month: 0
            },
            recentOrders: [],
            stockAlerts: [],
            operatorAnalytics: []
          });
        }
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