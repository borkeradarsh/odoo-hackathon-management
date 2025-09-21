'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wrench,
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  User,
  BarChart3
} from 'lucide-react';
import { WorkOrderWithOperator } from '@/lib/api/work-orders';

// Types
interface OperatorAnalytics {
  total_assigned: number;
  pending: number;
  completed: number;
}

// Fetcher function for SWR with cache-busting
const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
  }
}).then((res) => res.json());

export default function WorkOrdersPage() {
  // State for UI interactions
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Use SWR for work orders data
  const { 
    data, 
    isLoading,
    mutate 
  } = useSWR('/api/work-orders', fetcher, {
    revalidateOnFocus: true,       // Refresh when tab becomes active
    revalidateOnReconnect: true,   // Refresh on network reconnect
    refreshInterval: 0,            // No automatic polling
    dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  });

  const workOrders: WorkOrderWithOperator[] = data?.data || [];
  const loading = isLoading;
  
  // State for operator analytics dialog
  const [selectedOperator, setSelectedOperator] = useState<{ id: string; name: string } | null>(null);
  const [operatorAnalytics, setOperatorAnalytics] = useState<OperatorAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);

  // Function to refresh work orders
  const refreshWorkOrders = async () => {
    try {
      await mutate();
      setAlert({ type: 'success', message: 'Work orders refreshed' });
    } catch (error) {
      console.error('Error refreshing work orders:', error);
      setAlert({ type: 'error', message: 'Failed to refresh work orders' });
    }
  };

  const fetchOperatorAnalytics = async (operatorId: string) => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`/api/operators/${operatorId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setOperatorAnalytics(data.data);
      } else {
        setAlert({ type: 'error', message: 'Failed to load operator analytics' });
      }
    } catch (error) {
      console.error('Error fetching operator analytics:', error);
      setAlert({ type: 'error', message: 'Failed to load operator analytics' });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleOperatorClick = (operator: { id: string; full_name: string }) => {
    setSelectedOperator({ id: operator.id, name: operator.full_name });
    setAnalyticsDialogOpen(true);
    fetchOperatorAnalytics(operator.id);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-600';
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'pending':
        return AlertCircle;
      default:
        return Wrench;
    }
  };

  return (
    <ProtectedRoute>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <PageHeader
              title="Work Orders"
              description="Manage production work orders and track operator assignments"
            />
            <Button 
              onClick={refreshWorkOrders}
              variant="outline"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Alert */}
          {alert && (
            <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          {/* Work Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading work orders...</span>
                </div>
              ) : workOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No work orders found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>WO #</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>MO #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assigned Operator</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo: WorkOrderWithOperator) => {
                      const StatusIcon = getStatusIcon(wo.status);
                      return (
                        <TableRow key={wo.id}>
                          <TableCell className="font-medium">
                            WO-{wo.id.toString().padStart(4, '0')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {wo.finished_product_name || wo.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {wo.finished_product_name ? 'Finished Product' : 'Work Order Details'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            MO-{wo.mo_id.toString().padStart(4, '0')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(wo.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {wo.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              Work Order
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {wo.profiles?.full_name ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOperatorClick({ 
                                  id: wo.assignee_id!, 
                                  full_name: wo.profiles?.full_name || '' 
                                })}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 h-auto"
                              >
                                <User className="h-4 w-4 mr-1" />
                                {wo.profiles.full_name}
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(wo.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Operator Analytics Dialog */}
          <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Operator Analytics
                </DialogTitle>
                <DialogDescription>
                  Performance overview for {selectedOperator?.name}
                </DialogDescription>
              </DialogHeader>
              
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading analytics...</span>
                </div>
              ) : operatorAnalytics ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Assigned</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl font-bold">{operatorAnalytics.total_assigned}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-yellow-600">{operatorAnalytics.pending}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-green-600">{operatorAnalytics.completed}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No analytics data available
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}