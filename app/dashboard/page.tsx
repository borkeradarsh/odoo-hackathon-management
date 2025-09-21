"use client";

// Force dynamic rendering for real-time dashboard data
export const dynamic = 'force-dynamic';

import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';
import { useAuth } from '@/components/auth/auth-provider';
import { OperatorAnalytics } from '@/components/dashboard/operator-analytics';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { 
  Package, 
  FileText, 
  ClipboardList, 
  TrendingDown,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

// Utility function for formatting dates
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
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

// Loading spinner component
function DashboardSpinner() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Sidebar>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}

// Error component
function DashboardError({ error }: { error: string }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Sidebar>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Error loading dashboard</p>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardAnalytics();
  const { profile } = useAuth();
  const userRole = profile?.role;

  if (isLoading) {
    return <DashboardSpinner />;
  }

  if (error) {
    return <DashboardError error={error} />;
  }

  // Ensure we have valid data with fallbacks
  const dashboardData = data || {
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
  };

  // Additional safety check for kpis
  const kpis = dashboardData.kpis || {
    total_products: 0,
    active_boms: 0,
    in_progress_mos: 0,
    pending_wos: 0,
    low_stock_items: 0,
    completed_this_month: 0
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <PageHeader
              title="Manufacturing Dashboard"
              description="Overview of production operations and key metrics"
            />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Total Products"
              value={dashboardData.kpis.total_products}
              description="Products in inventory"
              icon={Package}
              className='text-slate-800 bg-emerald-100'
            />
            <StatsCard className='text-slate-800'
              title="Active BOMs"
              value={dashboardData.kpis.active_boms}
              description="Bills of Materials"
              icon={FileText}
            />
            <StatsCard className='text-slate-800'
              title="In Progress MOs"
              value={dashboardData.kpis.in_progress_mos}
              description="Manufacturing Orders"
              icon={ClipboardList}
            />
            <StatsCard className='text-slate-800'
              title="Pending Work Orders"
              value={dashboardData.kpis.pending_wos}
              description="Work orders pending"
              icon={Clock}
            />
            <StatsCard className='text-slate-800'
              title="Low Stock Items"
              value={dashboardData.kpis.low_stock_items}
              description="Items below minimum"
              icon={TrendingDown}
            />
            <StatsCard className='text-slate-800'
              title="Completed This Month"
              value={dashboardData.kpis.completed_this_month}
              description="Orders completed"
              icon={CheckCircle}
            />
          </div>

          {/* Operator Analytics for Admin */}
          {userRole === 'admin' && (
            <OperatorAnalytics data={dashboardData?.operatorAnalytics ?? [
              { id: '1', name: 'Sapnil', completed: 5, assigned: 7, in_progress: 2 },
              { id: '2', name: 'Pakhee', completed: 3, assigned: 4, in_progress: 1 },
              { id: '3', name: 'Adarsh', completed: 8, assigned: 10, in_progress: 2 }
            ]} />
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Recent Manufacturing Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all bg-white"
                        >
                          <div>
                            <div className="font-medium text-lg">
                             {order.product_name || 'Product'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              MO-{order.id.toString().padStart(4, '0')} • {formatDate(order.created_at)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Qty: {order.quantity_to_produce}
                            </div>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={`${getStatusColor(order.status)} border-0 font-medium`}
                          >
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stock Alerts */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.stockAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">All stock levels good</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.stockAlerts.map((item) => {
                        const alertSeverity = getStockAlertColor(item.stock_on_hand, item.min_stock_level);
                        const stockRatio = (item.stock_on_hand / item.min_stock_level) * 100;
                        return (
                          <div
                            key={item.id}
                            className={`p-4 border rounded-lg ${alertSeverity} transition-all hover:shadow-md`}
                          >
                            <div className="font-medium text-base">{item.name}</div>
                            <div className="text-sm mt-1">
                              Current: <span className="font-medium">{item.stock_on_hand}</span> | 
                              Minimum: <span className="font-medium">{item.min_stock_level}</span>
                            </div>
                            <div className="text-xs mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${stockRatio < 50 ? 'bg-red-500' : stockRatio < 100 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(stockRatio, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium">
                                  {stockRatio.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}