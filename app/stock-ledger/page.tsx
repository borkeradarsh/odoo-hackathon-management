'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package } from 'lucide-react';

interface StockLedgerEntry {
  id: string;
  product_id: string;
  quantity_change: number;
  transaction_type: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  product_name: string;
}

export default function StockLedgerPage() {
  const [ledgerData, setLedgerData] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockLedger = async () => {
      try {
        const response = await fetch('/api/stock-ledger');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch stock ledger');
        }

        setLedgerData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStockLedger();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getQuantityColor = (change: number) => {
    if (change > 0) return 'text-green-600 font-semibold';
    if (change < 0) return 'text-red-600 font-semibold';
    return 'text-gray-600';
  };

  const getQuantityPrefix = (change: number) => {
    return change > 0 ? '+' : '';
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'in':
      case 'purchase':
      case 'production':
        return 'default';
      case 'out':
      case 'sale':
      case 'consumption':
        return 'destructive';
      case 'adjustment':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Sidebar>
        <PageHeader 
          title="Stock Ledger" 
          description="Complete audit trail of all inventory movements and transactions"
        />
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading stock ledger...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-600 mb-2">Error loading stock ledger</div>
                <div className="text-sm text-gray-600">{error}</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Package className="h-6 w-6 mr-2" />
                <div>
                  <CardTitle>Inventory Movements</CardTitle>
                  <CardDescription>
                    Track all stock changes with complete audit trail
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ledgerData.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="text-gray-600">No stock movements recorded yet</div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead className="text-right">Quantity Change</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerData.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(entry.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.product_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTransactionBadgeVariant(entry.transaction_type)}>
                              {entry.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right ${getQuantityColor(entry.quantity_change)}`}>
                            {getQuantityPrefix(entry.quantity_change)}{entry.quantity_change}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {entry.reference_id || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Sidebar>
    </ProtectedRoute>
  );
}