'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  User
} from 'lucide-react';

// Types
interface WorkOrder {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
  manufacturing_order_id: number;
  component: {
    id: number;
    name: string;
  };
}

export default function MyOrdersPage() {
  // State for work orders list
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch work orders on mount
  useEffect(() => {
    const fetchMyWorkOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/my-work-orders');
        if (response.ok) {
          const data = await response.json();
          setWorkOrders(data.data || []);
        } else {
          setAlert({ type: 'error', message: 'Failed to load your work orders' });
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
        setAlert({ type: 'error', message: 'Failed to load your work orders' });
      } finally {
        setLoading(false);
      }
    };

    fetchMyWorkOrders();
  }, []);

  const refreshWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my-work-orders');
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.data || []);
      } else {
        setAlert({ type: 'error', message: 'Failed to load your work orders' });
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      setAlert({ type: 'error', message: 'Failed to load your work orders' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWorkOrder = async (workOrderId: number) => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/complete`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setAlert({ type: 'success', message: 'Work order completed successfully!' });
        refreshWorkOrders(); // Refresh the list
      } else {
        setAlert({ type: 'error', message: 'Failed to complete work order' });
      }
    } catch (error) {
      console.error('Error completing work order:', error);
      setAlert({ type: 'error', message: 'Failed to complete work order' });
    }
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

  // Calculate statistics
  const stats = {
    total: workOrders.length,
    pending: workOrders.filter(wo => wo.status === 'pending').length,
    in_progress: workOrders.filter(wo => wo.status === 'in_progress').length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
  };

  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <PageHeader
              title="My Work Orders"
              description="View and manage your assigned work orders"
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

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Work Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading your work orders...</span>
                </div>
              ) : workOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No work orders assigned to you</p>
                  <p className="text-sm text-gray-400">Check back later or contact your supervisor</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>WO #</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Manufacturing Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo) => {
                      const StatusIcon = getStatusIcon(wo.status);
                      return (
                        <TableRow key={wo.id}>
                          <TableCell className="font-medium">
                            WO-{wo.id.toString().padStart(4, '0')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{wo.component.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Component ID: {wo.component.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              MO-{wo.manufacturing_order_id.toString().padStart(4, '0')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(wo.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {wo.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(wo.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(wo.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {wo.status !== 'completed' ? (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteWorkOrder(wo.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}