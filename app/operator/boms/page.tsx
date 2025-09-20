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
  FileText,
  Package,
  Loader2,
  RefreshCw,
  Eye,
  Info
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
  product_id: string;
  created_at: string;
  product?: {
    id: number;
    name: string;
    type: string;
  };
  bom_items?: BOMLine[];
}

export default function OperatorBOMsPage() {
  // State for BOMs list
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedBOM, setExpandedBOM] = useState<string | null>(null);

  // Fetch BOMs on mount
  useEffect(() => {
    fetchBOMs();
  }, []);

  const fetchBOMs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/boms');
      if (response.ok) {
        const data = await response.json();
        setBoms(data.data || []);
      } else {
        setAlert({ type: 'error', message: 'Failed to load Bills of Materials' });
      }
    } catch (error) {
      console.error('Error fetching BOMs:', error);
      setAlert({ type: 'error', message: 'Failed to load Bills of Materials' });
    } finally {
      setLoading(false);
    }
  };

  const toggleBOMExpansion = (bomId: string) => {
    setExpandedBOM(expandedBOM === bomId ? null : bomId);
  };

  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <PageHeader
              title="Bills of Materials"
              description="View production recipes and component requirements (Read-only)"
            />
            <Button 
              onClick={fetchBOMs}
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

          {/* Statistics Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total BOMs Available</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boms.length}</div>
              <p className="text-xs text-muted-foreground">
                Production recipes in system
              </p>
            </CardContent>
          </Card>

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
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Product Type</TableHead>
                      <TableHead>Components</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boms.map((bom) => (
                      <>
                        <TableRow key={bom.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{bom.product?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {bom.product?.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {bom.product?.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {bom.bom_items?.length || 0} items
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(bom.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBOMExpansion(bom.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {expandedBOM === bom.id ? 'Hide' : 'View'} Details
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded BOM Details */}
                        {expandedBOM === bom.id && bom.bom_items && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-gray-50">
                              <div className="py-4">
                                <h4 className="font-medium mb-3 flex items-center">
                                  <Package className="h-4 w-4 mr-2" />
                                  Required Components
                                </h4>
                                <div className="grid gap-2">
                                  {bom.bom_items.map((item) => (
                                    <div 
                                      key={item.id} 
                                      className="flex items-center justify-between p-3 bg-white rounded border"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <Package className="h-4 w-4 text-gray-500" />
                                        <div>
                                          <span className="font-medium">{item.component?.name}</span>
                                          <span className="text-sm text-gray-500 ml-2">
                                            (ID: {item.component?.id})
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <Badge variant="outline">
                                          Qty: {item.quantity}
                                        </Badge>
                                        <Badge 
                                          className={
                                            (item.component?.stock_on_hand || 0) >= item.quantity
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-red-100 text-red-700'
                                          }
                                        >
                                          Stock: {item.component?.stock_on_hand}
                                        </Badge>
                                        <Badge variant="secondary">
                                          {item.component?.type}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
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