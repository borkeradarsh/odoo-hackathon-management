"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/layout/sidebar'
import { PageHeader } from '@/components/layout/page-header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { 
  Package, 
  FileText, 
  ClipboardList, 
  TrendingDown,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { DashboardAnalytics } from '@/lib/api';

// Cache key for localStorage
const DASHBOARD_CACHE_KEY = 'dashboard_analytics_cache';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

// Enhanced fetcher function with caching
const fetcher = async (url: string) => {
  try {
    // Check localStorage cache first
    const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRY_TIME;
      
      if (!isExpired) {
        console.log('📦 Using cached dashboard data');
        return data;
      }
    }

    console.log('🌐 Fetching fresh dashboard data');
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error('Failed to fetch');
    }
    
    const result = await res.json();
    const data = result.data || result;
    
    // Cache the fresh data
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    return data;
  } catch (error) {
    // If fetch fails, try to return cached data even if expired
    const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      console.log('⚠️ Using expired cache due to fetch error');
      return data;
    }
    throw error;
  }
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in progress':
    case 'in_progress':
      return 'bg-blue-100 text-blue-600';
    case 'completed':
    case 'done':
      return 'bg-green-100 text-green-600';
    case 'draft':
      return 'bg-orange-100 text-orange-600';
    case 'pending':
      return 'bg-yellow-100 text-yellow-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

// Stock alert severity
const getStockAlertColor = (current: number, minimum: number) => {
  const ratio = current / minimum;
  if (ratio < 0.5) {
    return 'bg-red-50 border-red-200 text-red-900';
  } else if (ratio < 1) {
    return 'bg-yellow-50 border-yellow-200 text-yellow-900';
  } else {
    return 'bg-green-50 border-green-200 text-green-900';
  }
};

export default function DashboardPage() {
  // Enhanced SWR configuration for optimal caching
  const { 
    data: analyticsData, 
    error, 
    isLoading,
    mutate 
  } = useSWR('/api/dashboard/analytics', fetcher, {
    // Cache configuration
    revalidateOnFocus: false, // Don't refetch when window gains focus
    revalidateOnReconnect: true, // Refetch when connection is restored
    refreshInterval: 60000, // Refresh every 60 seconds (reduced from 30)
    dedupingInterval: 30000, // Dedupe requests within 30 seconds
    
    // Performance optimizations
    errorRetryCount: 3, // Retry failed requests 3 times
    errorRetryInterval: 5000, // Wait 5 seconds between retries
    keepPreviousData: true, // Keep showing old data while fetching new
    
    // Fallback data from cache
    fallbackData: (() => {
      try {
        const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log('🔄 Using fallback cache data for initial render');
          return data;
        }
      } catch (error) {
        console.warn('Failed to load cache:', error);
      }
      return undefined;
    })(),
  });

  const analytics: DashboardAnalytics = analyticsData || {
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

  // Cache management functions
  const clearCache = () => {
    localStorage.removeItem(DASHBOARD_CACHE_KEY);
    console.log('🗑️ Dashboard cache cleared');
    mutate(); // Trigger fresh fetch
  };

  const getCacheInfo = () => {
    try {
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        const isExpired = age > CACHE_EXPIRY_TIME;
        return {
          exists: true,
          age: Math.round(age / 1000), // in seconds
          isExpired,
          expiresIn: Math.max(0, Math.round((CACHE_EXPIRY_TIME - age) / 1000))
        };
      }
    } catch (error) {
      console.warn('Failed to read cache info:', error);
    }
    return { exists: false };
  };

  const handleRefreshWithCacheBust = () => {
    clearCache();
  };

  // State for UI indicators
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Background refresh effect
  useEffect(() => {
    // Preload from cache on mount
    const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cached) {
      console.log('🚀 Dashboard mounted with cached data available');
    }

    // Set up periodic background refresh
    const backgroundRefresh = setInterval(() => {
      // Only refresh if the page is visible and user is not actively interacting
      if (document.visibilityState === 'visible' && !isRefreshing) {
        console.log('🔄 Background refresh triggered');
        mutate();
      }
    }, 120000); // Background refresh every 2 minutes

    return () => clearInterval(backgroundRefresh);
  }, [mutate, isRefreshing]);

  // Handle refresh with loading state
  const handleRefreshWithLoading = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Keep loading for visual feedback
    }
  };

  // Debug logging
  console.log('Dashboard State Debug:', {
    isLoading,
    hasAnalyticsData: !!analyticsData,
    analyticsDataType: typeof analyticsData,
    analyticsDataKeys: analyticsData ? Object.keys(analyticsData) : null,
    error: error?.message || null
  });

  // Force render after a reasonable time or if we have any data
  const [forceRender, setForceRender] = useState(false);
  
  useEffect(() => {
    // Force render after 3 seconds to prevent infinite loading
    const timer = setTimeout(() => {
      console.log('Force rendering dashboard after timeout');
      setForceRender(true);
    }, 3000);
    
    // Also force render if we get any data (even empty)
    if (analyticsData !== undefined) {
      setForceRender(true);
    }
    
    return () => clearTimeout(timer);
  }, [analyticsData]);

  // Improved loading condition - only show loading if we truly don't have data and no error
  const showLoading = (isLoading && !analyticsData && !forceRender && !error);
  
  console.log('Loading Condition Debug:', {
    isLoading,
    hasAnalyticsData: !!analyticsData,
    forceRender,
    hasError: !!error,
    showLoading,
    shouldRenderDashboard: !showLoading && !error
  });
  
  if (showLoading) {
    return (
      <ProtectedRoute>
        <Sidebar>
          <div className="space-y-6">
            <PageHeader
              title="Dashboard"
              description="Overview of your manufacturing operations"
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Loading Dashboard...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading analytics data...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </Sidebar>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Sidebar>
          <div className="space-y-6">
            <PageHeader
              title="Dashboard"
              description="Overview of your manufacturing operations"
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Error Loading Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive mb-4">
                  Failed to load dashboard data. This is likely because the database tables haven&apos;t been created yet.
                </p>
                <div className="flex space-x-2">
                  <Button onClick={handleRefreshWithLoading} disabled={isRefreshing}>
                    {isRefreshing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isRefreshing ? 'Retrying...' : 'Try Again'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshWithCacheBust}
                    disabled={isRefreshing}
                    title="Clear cache and try again"
                  >
                    Clear Cache & Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Sidebar>
      </ProtectedRoute>
    );
  }

  console.log('Analytics data structure:', {
    hasKpis: !!(analyticsData?.kpis),
    hasRecentOrders: !!(analyticsData?.recentOrders),
    hasStockAlerts: !!(analyticsData?.stockAlerts),
    fullData: analyticsData
  });

  return (
    <ProtectedRoute>
      <Sidebar>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <PageHeader
              title="Analytics Dashboard"
              description="Overview of your manufacturing operations"
            />
            <div className="flex items-center space-x-2">
              {/* Cache status indicator */}
              <div className="text-xs text-gray-500 hidden sm:block">
                {analyticsData ? (
                  <span className="flex items-center">
                    📦 Cached data
                  </span>
                ) : null}
              </div>
              
              {/* Refresh button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshWithLoading}
                disabled={isLoading || isRefreshing}
              >
                {isLoading || isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              {/* Clear cache button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefreshWithCacheBust}
                disabled={isLoading || isRefreshing}
                title="Clear cache and fetch fresh data"
              >
                🗑️
              </Button>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Total Products"
              value={analytics.kpis.total_products}
              description="Products in inventory"
              icon={Package}
            />
            <StatsCard
              title="Active BOMs"
              value={analytics.kpis.active_boms}
              description="Bill of materials configured"
              icon={FileText}
            />
            <StatsCard
              title="Manufacturing Orders"
              value={analytics.kpis.in_progress_mos}
              description="Currently in progress"
              icon={ClipboardList}
            />
            <StatsCard
              title="Pending Work Orders"
              value={analytics.kpis.pending_wos}
              description="Awaiting execution"
              icon={Clock}
            />
            <StatsCard
              title="Low Stock Items"
              value={analytics.kpis.low_stock_items}
              description="Below minimum threshold"
              icon={TrendingDown}
            />
            <StatsCard
              title="Completed This Month"
              value={analytics.kpis.completed_this_month}
              description="Manufacturing orders finished"
              icon={CheckCircle}
            />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Manufacturing Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading recent orders...</span>
                  </div>
                ) : analytics.recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent manufacturing orders found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{order.product_name}</p>
                          <p className="text-sm text-gray-600">Quantity: {order.quantity_to_produce} units</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading stock alerts...</span>
                  </div>
                ) : analytics.stockAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No stock alerts. All products are well-stocked!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.stockAlerts.map((item) => {
                      const ratio = item.stock_on_hand / item.min_stock_level;
                      const alertType = ratio < 0.5 ? 'Critical' : ratio < 1 ? 'Low Stock' : 'Near Minimum';
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${getStockAlertColor(item.stock_on_hand, item.min_stock_level)}`}
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm">
                              Current: {item.stock_on_hand} | Min: {item.min_stock_level}
                            </p>
                          </div>
                          <Badge 
                            variant={ratio < 0.5 ? 'destructive' : ratio < 1 ? 'secondary' : 'default'}
                          >
                            {alertType}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Cache Status Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-4">
              <span>
                💾 Data cached for faster loading
              </span>
              <span>•</span>
              <span>
                🔄 Auto-refreshes every 60 seconds
              </span>
              <span>•</span>
              <span>
                ⚡ Instant load from cache
              </span>
            </div>
          </div>
        </div>
      </Sidebar>
    </ProtectedRoute>
  )
}