
"use client";
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  FileText, 
  ClipboardList, 
  TrendingDown,
  CheckCircle,
  Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { DashboardStats } from '@/types/index';


export default function DashboardPage() {
  // Dynamic dashboard stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        // The lead developer should provide a view or function for dashboard stats
        // Example: select * from dashboard_stats (replace with actual table/view)
        const { data, error } = await supabase
          .from('dashboard_stats')
          .select('*')
          .single();
        if (error) throw error;
        setStats(data as DashboardStats);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <ProtectedRoute>
      <Sidebar>
        <div className="space-y-6">
          <PageHeader
            title="Dashboard"
            description="Overview of your manufacturing operations"
          />
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 text-center py-8">Loading stats...</div>
            ) : error ? (
              <div className="col-span-3 text-center text-red-600 py-8">{error}</div>
            ) : stats ? (
              <>
                <StatsCard
                  title="Total Products"
                  value={stats.total_products}
                  description="Products in inventory"
                  icon={Package}
                />
                <StatsCard
                  title="Active BOMs"
                  value={stats.total_active_boms}
                  description="Bill of materials configured"
                  icon={FileText}
                />
                <StatsCard
                  title="Manufacturing Orders"
                  value={stats.active_manufacturing_orders}
                  description="Currently in progress"
                  icon={ClipboardList}
                />
                <StatsCard
                  title="Pending Work Orders"
                  value={stats.pending_work_orders}
                  description="Awaiting execution"
                  icon={Clock}
                />
                <StatsCard
                  title="Low Stock Items"
                  value={stats.low_stock_products}
                  description="Below minimum threshold"
                  icon={TrendingDown}
                />
                <StatsCard
                  title="Completed This Month"
                  value={stats.completed_orders_this_month}
                  description="Manufacturing orders finished"
                  icon={CheckCircle}
                />
              </>
            ) : null}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Manufacturing Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* TODO: Replace with actual data */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Assembly Unit X</p>
                      <p className="text-sm text-gray-600">Quantity: 50 units</p>
                    </div>
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      In Progress
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Widget A</p>
                      <p className="text-sm text-gray-600">Quantity: 100 units</p>
                    </div>
                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Widget B</p>
                      <p className="text-sm text-gray-600">Quantity: 25 units</p>
                    </div>
                    <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      Draft
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* TODO: Replace with actual data */}
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-red-900">Screw M4</p>
                      <p className="text-sm text-red-700">Current: 85 | Min: 100</p>
                    </div>
                    <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                      Low Stock
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-yellow-900">Widget B</p>
                      <p className="text-sm text-yellow-700">Current: 18 | Min: 15</p>
                    </div>
                    <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      Near Minimum
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Widget A</p>
                      <p className="text-sm text-gray-600">Current: 100 | Min: 20</p>
                    </div>
                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                      Healthy
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Sidebar>
    </ProtectedRoute>
  )
}