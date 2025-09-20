'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw 
} from 'lucide-react';

// Types
interface Product {
  id: number;
  name: string;
}

interface ManufacturingOrder {
  id: number;
  quantity_to_produce: number;
  status: string;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
  };
  bom: {
    id: number;
    name: string;
  };
}

export default function ManufacturingOrdersPage() {
  // State for products list
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // State for manufacturing orders list
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>([]);
  const [loadingMOs, setLoadingMOs] = useState(true);

  // State for create form
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // State for alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
    fetchManufacturingOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setAlert({ type: 'error', message: 'Failed to load products' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchManufacturingOrders = async () => {
    try {
      setLoadingMOs(true);
      const response = await fetch('/api/manufacturing-orders');
      if (response.ok) {
        const data = await response.json();
        setManufacturingOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching manufacturing orders:', error);
      setAlert({ type: 'error', message: 'Failed to load manufacturing orders' });
    } finally {
      setLoadingMOs(false);
    }
  };

  const handleCreateMO = async () => {
    if (!selectedProductId || !quantity) {
      setAlert({ type: 'error', message: 'Please select a product and enter a quantity' });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      setAlert({ type: 'error', message: 'Quantity must be greater than 0' });
      return;
    }

    try {
      setCreating(true);
      setAlert(null);

      const response = await fetch('/api/manufacturing-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: parseInt(selectedProductId),
          quantity: quantityNum,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAlert({ 
          type: 'success', 
          message: `Manufacturing Order created successfully! MO #${data.data.moId} with ${data.data.workOrdersCreated} work orders.`
        });
        
        // Reset form
        setSelectedProductId('');
        setQuantity('');
        setShowCreateForm(false);
        
        // Refresh the list
        fetchManufacturingOrders();
      } else {
        setAlert({ 
          type: 'error', 
          message: data.error || 'Failed to create manufacturing order' 
        });
      }
    } catch (error) {
      console.error('Error creating manufacturing order:', error);
      setAlert({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
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
      case 'in progress':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'pending':
        return AlertCircle;
      default:
        return Package;
    }
  };

  return (
    <ProtectedRoute>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <PageHeader
              title="Manufacturing Orders"
              description="Create and manage manufacturing orders"
            />
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create MO</span>
            </Button>
          </div>

          {/* Alert */}
          {alert && (
            <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Manufacturing Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product">Product</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product to manufacture" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingProducts ? (
                          <SelectItem value="loading" disabled>
                            Loading products...
                          </SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="no-products" disabled>
                            No products available
                          </SelectItem>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity to Produce</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateMO}
                    disabled={creating || !selectedProductId || !quantity}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Manufacturing Order
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manufacturing Orders List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Manufacturing Orders</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchManufacturingOrders}
                  disabled={loadingMOs}
                >
                  {loadingMOs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMOs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading manufacturing orders...</span>
                </div>
              ) : manufacturingOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No manufacturing orders found</p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first Manufacturing Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {manufacturingOrders.map((mo) => {
                    const StatusIcon = getStatusIcon(mo.status);
                    return (
                      <div 
                        key={mo.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <StatusIcon className="h-5 w-5 text-gray-600" />
                          <div>
                            <h3 className="font-semibold">MO #{mo.id}</h3>
                            <p className="text-sm text-gray-600">
                              {mo.product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Quantity: {mo.quantity_to_produce} units
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(mo.status)}>
                            {mo.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(mo.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}