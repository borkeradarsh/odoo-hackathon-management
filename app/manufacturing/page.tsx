"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Factory, Package, Clock, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateManufacturingOrderForm } from '@/components/manufacturing/CreateManufacturingOrderForm';
import { Product, ManufacturingOrder } from '@/types';
import { Sidebar } from '@/components/layout/sidebar';

// Fetcher function for SWR with cache-busting
const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
  }
}).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
});

export default function ManufacturingOrdersPage() {
  const [formOpen, setFormOpen] = useState(false);

  // Fetch manufacturing orders using SWR with proper revalidation
  const { 
    data: manufacturingOrdersData, 
    error: moError, 
    isLoading: moLoading 
  } = useSWR('/api/manufacturing-orders', fetcher, {
    revalidateOnFocus: true,       // Refresh when tab becomes active
    revalidateOnReconnect: true,   // Refresh on network reconnect
    refreshInterval: 0,            // No automatic polling
    dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  });

  // Fetch products for the form
  const { 
    data: productsData, 
    error: productsError, 
    isLoading: productsLoading 
  } = useSWR('/api/products', fetcher, {
    revalidateOnFocus: true,       // Refresh when tab becomes active
    revalidateOnReconnect: true,   // Refresh on network reconnect
    refreshInterval: 0,            // No automatic polling
    dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  });

  const manufacturingOrders: ManufacturingOrder[] = manufacturingOrdersData?.data || [];
  const products: Product[] = productsData?.products || [];

  // Handle form success
  const handleFormSuccess = () => {
    // Refresh the manufacturing orders data
    mutate('/api/manufacturing-orders');
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle errors
  if (moError || productsError) {
    return (
      <Sidebar>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">Failed to load data. Please try again.</p>
              <Button 
                onClick={() => {
                  mutate('/api/manufacturing-orders');
                  mutate('/api/products');
                }} 
                className="mt-4"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6 space-y-6 overflow-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manufacturing Orders</h1>
            <p className="text-muted-foreground">
              Create and manage production orders for finished goods.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Manufacturing Order
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className='bg-emerald-200'> 
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{manufacturingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                In Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {manufacturingOrders.filter(mo => mo.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {manufacturingOrders.filter(mo => mo.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Draft
              </CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {manufacturingOrders.filter(mo => mo.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manufacturing Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {moLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading manufacturing orders...</span>
              </div>
            ) : manufacturingOrders.length === 0 ? (
              <div className="text-center py-8">
                <Factory className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground mt-2">No manufacturing orders found.</p>
                <Button 
                  onClick={() => setFormOpen(true)}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Manufacturing Order
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MO #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Work Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manufacturingOrders.map((mo) => (
                    <TableRow key={mo.id}>
                      <TableCell className="font-medium">
                        MO-{mo.id.toString().padStart(4, '0')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{mo.product?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {mo.product?.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{mo.quantity_to_produce}</TableCell>
                      <TableCell>
                        {getStatusBadge(mo.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(mo.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {mo.work_orders?.length || 0} WOs
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Manufacturing Order Form */}
        <CreateManufacturingOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handleFormSuccess}
          products={products}
          isLoadingProducts={productsLoading}
        />
      </div>
    </Sidebar>
  );
}