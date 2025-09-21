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

// Types
interface BOMLine {
  id: string;
  product_id: string;
  quantity: number;
  component?: {
    id: number;
    name: string;
    type: string;
    stock_on_hand: number;
  };
}

interface BOM {
  id: string;
  name: string;
  product_id: string;
  created_at: string;
  product?: {
    id: number;
    name: string;
    type: string;
  };
  bom_items?: BOMLine[];
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OperatorBOMsPage() {
  // State for UI interactions
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [bomDetailOpen, setBomDetailOpen] = useState(false);

  // Use SWR with disabled automatic re-fetching
  const { 
    data, 
    isLoading,
    mutate 
  } = useSWR('/api/boms', fetcher, {
    revalidateOnFocus: false,      // Prevents re-fetching when you focus the tab
    revalidateOnReconnect: false,  // Prevents re-fetching on network reconnect
  });

  const boms: BOM[] = data?.boms || [];
  const loading = isLoading;

  const refreshBOMs = async () => {
    try {
      await mutate();
      setAlert({ type: 'success', message: 'Bills of Materials refreshed' });
    } catch (error) {
      console.error('Error refreshing BOMs:', error);
      setAlert({ type: 'error', message: 'Failed to refresh Bills of Materials' });
    }
  };

  const handleViewBOM = (bom: BOM) => {
    setSelectedBOM(bom);
    setBomDetailOpen(true);
  };

  const getStockBadgeColor = (stockLevel: number) => {
    if (stockLevel > 50) return 'bg-green-100 text-green-700';
    if (stockLevel > 10) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Calculate statistics
  const stats = {
    total: boms.length,
    finished_goods: boms.filter(bom => bom.product?.type === 'Finished Good').length || boms.length, // Since product data is null, show total as finished goods
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
                      <TableHead>Components</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boms.map((bom) => (
                      <TableRow key={bom.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{bom.product?.name || bom.name || 'Unknown Product'}</div>
                            <div className="text-sm text-muted-foreground">ID: {bom.product?.id || bom.product_id || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {bom.bom_items?.length || 0} components
                            </div>
                            {bom.bom_items && bom.bom_items.length > 0 && (
                              <div className="space-y-0.5">
                                {bom.bom_items.slice(0, 3).map((item, index) => (
                                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                    <span className="truncate max-w-[120px]" title={item.component?.name || `Product ${item.product_id}`}>
                                      {item.component?.name || `Product ${item.product_id}`}
                                    </span>
                                    <span className="text-blue-600 font-medium">
                                      ({item.quantity})
                                    </span>
                                  </div>
                                ))}
                                {bom.bom_items.length > 3 && (
                                  <div className="text-xs text-muted-foreground italic">
                                    +{bom.bom_items.length - 3} more...
                                  </div>
                                )}
                              </div>
                            )}
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
                BOM Details: {selectedBOM?.product?.name || selectedBOM?.name}
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
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Product Name</Label>
                      <p className="text-lg font-semibold">{selectedBOM.product?.name || selectedBOM.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Product ID</Label>
                      <p className="text-lg">{selectedBOM.product?.id || selectedBOM.product_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Product Type</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedBOM.product?.type || 'Unknown'}
                      </Badge>
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
                    <CardTitle className="text-lg flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Required Components ({selectedBOM.bom_items?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedBOM.bom_items && selectedBOM.bom_items.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBOM.bom_items.map((item, index) => (
                          <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{item.component?.name || `Product ${item.product_id}`}</p>
                                <p className="text-sm text-gray-500">
                                  ID: {item.component?.id || item.product_id} • Type: {item.component?.type || 'Unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className="text-lg px-3 py-1">
                                Qty: {item.quantity}
                              </Badge>
                              <Badge 
                                className={getStockBadgeColor(item.component?.stock_on_hand || 0)}
                              >
                                Stock: {item.component?.stock_on_hand || 0}
                              </Badge>
                              {(item.component?.stock_on_hand || 0) >= item.quantity ? (
                                <Badge className="bg-green-100 text-green-700">✓ Available</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700">⚠ Shortage</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No components defined for this BOM</p>
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