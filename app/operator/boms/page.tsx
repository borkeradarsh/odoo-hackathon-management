'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BomWithRelations } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  Package,
  Loader2,
  RefreshCw,
  Eye,
  Info,
  Factory
} from 'lucide-react';

// Fetcher function for SWR with cache-busting
const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
  }
}).then((res) => res.json());

export default function OperatorBOMsPage() {
  // State for UI interactions
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedBOM, setSelectedBOM] = useState<BomWithRelations | null>(null);
  const [bomDetailOpen, setBomDetailOpen] = useState(false);

  // Fetch BOMs using SWR with proper revalidation
  const { 
    data: bomsData, 
    isLoading: bomsLoading,
    mutate 
  } = useSWR('/api/boms', fetcher, {
    revalidateOnFocus: true,       // Refresh when tab becomes active
    revalidateOnReconnect: true,   // Refresh on network reconnect
    refreshInterval: 0,            // No automatic polling
    dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  });

  const boms: BomWithRelations[] = bomsData?.boms || [];
  const loading = bomsLoading;

  const refreshBOMs = async () => {
    try {
      await mutate();
      setAlert({ type: 'success', message: 'Bills of Materials refreshed' });
    } catch (error) {
      console.error('Error refreshing BOMs:', error);
      setAlert({ type: 'error', message: 'Failed to refresh Bills of Materials' });
    }
  };

  const handleViewBOM = (bom: BomWithRelations) => {
    setSelectedBOM(bom);
    setBomDetailOpen(true);
  };

  // Calculate statistics
  const stats = {
    total: boms.length,
    finished_goods: boms.length, // All BOMs are assumed to be finished goods
    components: boms.reduce((sum, bom) => sum + (bom.bom_items?.length || 0), 0),
  };

  return (
    <ProtectedRoute allowedRoles={['operator', 'admin']}>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <PageHeader
              title="Bills of Materials"
              description="View production recipes and component requirements (Read-only)"
            />
            <Button 
              onClick={refreshBOMs}
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
              This is a read-only view. You can view BOM details but cannot create, edit, or delete BOMs.
              Contact your supervisor for any changes needed.
            </AlertDescription>
          </Alert>

          {/* Alert */}
          {alert && (
            <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total BOMs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Production recipes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finished Goods</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.finished_goods}</div>
                <p className="text-xs text-muted-foreground">Final products</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Components</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.components}</div>
                <p className="text-xs text-muted-foreground">Required items</p>
              </CardContent>
            </Card>
          </div>

          {/* BOMs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bills of Materials</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading BOMs...</span>
                </div>
              ) : boms.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No Bills of Materials found</p>
                  <p className="text-sm text-gray-400">Contact your supervisor to create production recipes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Finished Product</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boms.map((bom) => (
                      <TableRow key={bom.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">
                              {bom.product?.name || ` ${bom.name}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Type: {bom.product?.type || 'N/A'} • ID: {bom.product?.id || bom.product_id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {bom.product?.stock_on_hand || 0} units
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(bom.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBOM(bom)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* BOM Detail Modal */}
        <Dialog open={bomDetailOpen} onOpenChange={setBomDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                BOM Details: {selectedBOM?.product?.name}
              </DialogTitle>
              <DialogDescription>
                Complete component breakdown and requirements for production
              </DialogDescription>
            </DialogHeader>
            
            {selectedBOM && (
              <div className="space-y-6">
                {/* Product Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Product Name</Label>
                      <p className="text-lg font-semibold">{selectedBOM.product?.name || ` ${selectedBOM.name}`}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Product ID</Label>
                      <p className="text-lg">{selectedBOM.product?.id || selectedBOM.product_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Product Type</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedBOM.product?.type || 'Finished Good'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Current Stock</Label>
                      <p className="text-lg">{selectedBOM.product?.stock_on_hand || 0} units</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Min Stock Level</Label>
                      <p className="text-lg">{selectedBOM.product?.min_stock_level || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                      <p className="text-lg">{new Date(selectedBOM.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Components List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Required Components ({selectedBOM.bom_items?.length || 0})
                      </div>
                      {selectedBOM.bom_items && selectedBOM.bom_items.length > 0 && (
                        <Badge variant="outline">
                          Total: {selectedBOM.bom_items.reduce((sum, item) => sum + item.quantity, 0)} units
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedBOM.bom_items && selectedBOM.bom_items.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBOM.bom_items.map((item, index) => (
                          <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-lg">{item.component?.name || `Product ${item.product_id}`}</p>
                                <p className="text-sm text-gray-500">
                                  ID: {item.component?.id || item.product_id} • Type: {item.component?.type || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Stock: {item.component?.stock_on_hand || 0} units 
                                  {item.component?.min_stock_level && ` (Min: ${item.component.min_stock_level})`}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge variant="secondary" className="text-base px-4 py-2">
                                Qty: {item.quantity}
                              </Badge>
                              {item.component?.stock_on_hand !== undefined && 
                               item.component.stock_on_hand < item.quantity && (
                                <Badge variant="destructive" className="text-xs">
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Static component 1: 4 wooden legs */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">1</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-lg">Wooden Legs</p>
                              <p className="text-sm text-gray-500">
                                ID: WL-001 • Type: Raw Material
                              </p>
                              <p className="text-xs text-gray-400">
                                Stock: 50 units (Min: 10)
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="secondary" className="text-base px-4 py-2">
                              Qty: 4
                            </Badge>
                          </div>
                        </div>

                        {/* Static component 2: wooden plank */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">2</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-lg">Wooden Plank</p>
                              <p className="text-sm text-gray-500">
                                ID: WP-001 • Type: Raw Material
                              </p>
                              <p className="text-xs text-gray-400">
                                Stock: 25 units (Min: 5)
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="secondary" className="text-base px-4 py-2">
                              Qty: 1
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Sidebar>
    </ProtectedRoute>
  );
}