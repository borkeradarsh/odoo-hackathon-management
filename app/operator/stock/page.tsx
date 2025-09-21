'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Package,
  TrendingUp,
  TrendingDown,
  Search,
  Loader2,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Types
interface Product {
  id: number;
  name: string;
  type: 'Raw Material' | 'Finished Good';
  stock_on_hand: number;
  min_stock_level: number;
  created_at: string;
}

// Fetcher function for SWR with cache-busting
const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
  }
}).then((res) => res.json());

export default function OperatorStockPage() {
  // State for UI interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Use SWR with disabled automatic re-fetching
  const { 
    data, 
    isLoading,
    mutate 
  } = useSWR('/api/products', fetcher, {
    revalidateOnFocus: true,       // Refresh when tab becomes active
    revalidateOnReconnect: true,   // Refresh on network reconnect
    refreshInterval: 0,            // No automatic polling
    dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  });

  const products: Product[] = data?.data || [
    // Static products for demo
    {
      id: 1,
      name: "Wooden Legs",
      type: "Raw Material",
      stock_on_hand: 45,
      min_stock_level: 20,
      created_at: "2025-09-21T00:00:00Z"
    },
    {
      id: 2,
      name: "Wooden Planks",
      type: "Raw Material", 
      stock_on_hand: 8,
      min_stock_level: 15,
      created_at: "2025-09-21T00:00:00Z"
    },
    {
      id: 3,
      name: "Chair",
      type: "Finished Good",
      stock_on_hand: 0,
      min_stock_level: 5,
      created_at: "2025-09-21T00:00:00Z"
    },
    {
      id: 4,
      name: "Table",
      type: "Finished Good",
      stock_on_hand: 12,
      min_stock_level: 8,
      created_at: "2025-09-21T00:00:00Z"
    },
    {
      id: 5,
      name: "Wood Screws",
      type: "Raw Material",
      stock_on_hand: 3,
      min_stock_level: 50,
      created_at: "2025-09-21T00:00:00Z"
    },
    {
      id: 6,
      name: "Wood Glue",
      type: "Raw Material",
      stock_on_hand: 25,
      min_stock_level: 10,
      created_at: "2025-09-21T00:00:00Z"
    }
  ];
  const loading = isLoading;

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const refreshProducts = async () => {
    try {
      await mutate();
      setAlert({ type: 'success', message: 'Stock information refreshed' });
    } catch (error) {
      console.error('Error refreshing products:', error);
      setAlert({ type: 'error', message: 'Failed to refresh stock information' });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_on_hand <= 0) {
      return {
        status: 'Out of Stock',
        color: 'bg-red-100 text-red-700',
        icon: AlertTriangle
      };
    } else if (product.stock_on_hand <= product.min_stock_level) {
      return {
        status: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-700',
        icon: TrendingDown
      };
    } else {
      return {
        status: 'Healthy',
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle
      };
    }
  };

  // Calculate statistics
  const stats = {
    total: products.length,
    rawMaterials: products.filter(p => p.type === 'Raw Material').length,
    finishedGoods: products.filter(p => p.type === 'Finished Good').length,
    lowStock: products.filter(p => p.stock_on_hand <= p.min_stock_level && p.stock_on_hand > 0).length,
    outOfStock: products.filter(p => p.stock_on_hand <= 0).length,
  };

  return (
    <ProtectedRoute allowedRoles={['operator', 'admin']}>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <PageHeader
              title="Stock Information"
              description="View current inventory levels and stock status (Read-only)"
            />
            <Button 
              onClick={refreshProducts}
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

          {/* Info Alert */}
          <Alert className="border-blue-500 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              This is a read-only view. You can check stock levels but cannot modify inventory.
              Report low stock or discrepancies to your supervisor.
            </AlertDescription>
          </Alert>

          {/* Alert */}
          {alert && (
            <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.rawMaterials}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finished Goods</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.finishedGoods}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading stock information...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'No products match your search' : 'No products found'}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity on Hand</TableHead>
                      <TableHead>Min. Level</TableHead>
                      <TableHead>Stock Status</TableHead>
                      <TableHead>Stock Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      const StatusIcon = stockStatus.icon;
                      
                      return (
                        <TableRow key={product.id} className={product.stock_on_hand <= 0 ? 'bg-red-50' : product.stock_on_hand <= product.min_stock_level ? 'bg-yellow-50' : ''}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                product.stock_on_hand <= 0 ? 'bg-red-500' : 
                                product.stock_on_hand <= product.min_stock_level ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {product.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={product.type === 'Raw Material' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-green-200 text-green-700 bg-green-50'}
                            >
                              {product.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className={`text-2xl font-bold ${
                                product.stock_on_hand <= 0 ? 'text-red-600' : 
                                product.stock_on_hand <= product.min_stock_level ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {product.stock_on_hand}
                              </span>
                              <span className="text-sm text-gray-500">units</span>
                            </div>
                            {product.stock_on_hand <= 0 && (
                              <div className="text-xs text-red-500 font-medium mt-1">
                                URGENT: Restock needed!
                              </div>
                            )}
                            {product.stock_on_hand > 0 && product.stock_on_hand <= product.min_stock_level && (
                              <div className="text-xs text-yellow-600 font-medium mt-1">
                                {product.min_stock_level - product.stock_on_hand + 1} units to reorder
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{product.min_stock_level}</span>
                              <span className="text-sm text-gray-500">units</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {stockStatus.status}
                            </Badge>
                            {product.stock_on_hand <= 0 && (
                              <Badge variant="destructive" className="ml-2">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                CRITICAL
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              {/* Stock progress bar */}
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    product.stock_on_hand <= 0 ? 'bg-red-500' : 
                                    product.stock_on_hand <= product.min_stock_level ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, (product.stock_on_hand / (product.min_stock_level * 2)) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {product.stock_on_hand <= 0 ? 'Empty' : 
                                 product.stock_on_hand <= product.min_stock_level ? 'Low' : 'Healthy'}
                              </span>
                            </div>
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