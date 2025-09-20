
"use client";

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

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
});

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
  // Fetch dashboard analytics using SWR
  const { 
    data: analyticsData, 
    error, 
    isLoading,
    mutate 
  } = useSWR('/api/dashboard/analytics', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  });

  const analytics: DashboardAnalytics = analyticsData?.data || {
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

  // Handle manual refresh
  const handleRefresh = () => {
    mutate();
  };

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
                <Button onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </Sidebar>
      </ProtectedRoute>
    );
  }


  return (
    <ProtectedRoute>
      <Sidebar>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <PageHeader
              title="Dashboard"
              description="Overview of your manufacturing operations"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
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
        </div>
      </Sidebar>
    </ProtectedRoute>
  )
}