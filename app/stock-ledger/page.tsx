'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, Filter, RefreshCw, Calendar, Search } from 'lucide-react';

// Enhanced interface for stock ledger entries
interface StockLedgerEntry {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: 'Work Order' | 'Manual Adjustment' | 'Purchase' | 'Sale' | 'Production' | 'Consumption';
  quantity_in: number | null;
  quantity_out: number | null;
  balance: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

// Supabase client (you would use your actual config)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Sample data for demo (moved outside component to avoid dependency issues)
const sampleData: StockLedgerEntry[] = [
  {
    id: '1',
    product_id: '1',
    product_name: 'Wooden Legs',
    movement_type: 'Purchase',
    quantity_in: 50,
    quantity_out: null,
    balance: 50,
    reference_id: 'PO-001',
    notes: 'Initial stock purchase',
    created_at: '2025-09-21T08:30:00Z'
  },
  {
    id: '2',
    product_id: '2',
    product_name: 'Wooden Planks',
    movement_type: 'Purchase',
    quantity_in: 30,
    quantity_out: null,
    balance: 30,
    reference_id: 'PO-002',
    notes: 'Weekly raw material order',
    created_at: '2025-09-21T09:15:00Z'
  },
  {
    id: '3',
    product_id: '1',
    product_name: 'Wooden Legs',
    movement_type: 'Work Order',
    quantity_in: null,
    quantity_out: 4,
    balance: 46,
    reference_id: 'WO-030',
    notes: 'Used in chair production',
    created_at: '2025-09-21T10:45:00Z'
  },
  {
    id: '4',
    product_id: '2',
    product_name: 'Wooden Planks',
    movement_type: 'Work Order',
    quantity_in: null,
    quantity_out: 1,
    balance: 29,
    reference_id: 'WO-030',
    notes: 'Used in chair production',
    created_at: '2025-09-21T10:45:00Z'
  },
  {
    id: '5',
    product_id: '3',
    product_name: 'Chair',
    movement_type: 'Production',
    quantity_in: 1,
    quantity_out: null,
    balance: 1,
    reference_id: 'MO-018',
    notes: 'Chair production completed',
    created_at: '2025-09-21T11:30:00Z'
  },
  {
    id: '6',
    product_id: '5',
    product_name: 'Wood Screws',
    movement_type: 'Purchase',
    quantity_in: 100,
    quantity_out: null,
    balance: 100,
    reference_id: 'PO-003',
    notes: 'Bulk hardware order',
    created_at: '2025-09-21T14:20:00Z'
  },
  {
    id: '7',
    product_id: '1',
    product_name: 'Wooden Legs',
    movement_type: 'Work Order',
    quantity_in: null,
    quantity_out: 4,
    balance: 42,
    reference_id: 'WO-029',
    notes: 'Used in table production',
    created_at: '2025-09-21T15:00:00Z'
  },
  {
    id: '8',
    product_id: '4',
    product_name: 'Table',
    movement_type: 'Production',
    quantity_in: 1,
    quantity_out: null,
    balance: 1,
    reference_id: 'MO-017',
    notes: 'Table production completed',
    created_at: '2025-09-21T16:15:00Z'
  },
  {
    id: '9',
    product_id: '6',
    product_name: 'Wood Glue',
    movement_type: 'Manual Adjustment',
    quantity_in: null,
    quantity_out: 5,
    balance: 20,
    reference_id: 'ADJ-001',
    notes: 'Damaged bottles discarded',
    created_at: '2025-09-21T17:30:00Z'
  }
];

export default function StockLedgerPage() {
  // State management
  const [ledgerData, setLedgerData] = useState<StockLedgerEntry[]>([]);
  const [filteredData, setFilteredData] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [productFilter, setProductFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch stock ledger data
  const fetchStockLedger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For demo, use sample data. Replace with actual Supabase query:
      /*
      const { data, error } = await supabase
        .from('stock_ledger')
        .select(`
          *,
          products (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      */

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLedgerData(sampleData);
      setFilteredData(sampleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock ledger');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    fetchStockLedger();

    // Real-time subscription for new entries
    const subscription = supabase
      .channel('stock_ledger_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'stock_ledger' },
        (payload) => {
          console.log('Stock ledger change received:', payload);
          // Refresh data when changes occur
          fetchStockLedger();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchStockLedger]);

  // Apply filters
  useEffect(() => {
    let filtered = [...ledgerData];

    // Product name filter
    if (productFilter) {
      filtered = filtered.filter(entry => 
        entry.product_name.toLowerCase().includes(productFilter.toLowerCase())
      );
    }

    // Movement type filter
    if (movementTypeFilter && movementTypeFilter !== 'all') {
      filtered = filtered.filter(entry => 
        entry.movement_type === movementTypeFilter
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.movement_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(entry => 
        new Date(entry.created_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(entry => 
        new Date(entry.created_at) <= new Date(endDate + 'T23:59:59')
      );
    }

    setFilteredData(filtered);
  }, [ledgerData, productFilter, movementTypeFilter, searchTerm, startDate, endDate]);

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuantityColor = (quantityIn: number | null, quantityOut: number | null) => {
    if (quantityIn && quantityIn > 0) return 'text-green-600 font-semibold';
    if (quantityOut && quantityOut > 0) return 'text-red-600 font-semibold';
    return 'text-gray-500';
  };

  const getMovementBadgeVariant = (type: string) => {
    switch (type) {
      case 'Purchase':
      case 'Production':
        return 'default';
      case 'Work Order':
      case 'Consumption':
        return 'destructive';
      case 'Manual Adjustment':
        return 'secondary';
      case 'Sale':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const clearFilters = () => {
    setProductFilter('');
    setMovementTypeFilter('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const movementTypes = [
    'Work Order',
    'Manual Adjustment', 
    'Purchase',
    'Sale',
    'Production',
    'Consumption'
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Sidebar>
        <div className="space-y-6">
          <PageHeader 
            title="Stock Ledger" 
            description="Complete audit trail of all inventory movements and transactions"
          />
          
          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search products, references..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Product Filter */}
                <div className="space-y-2">
                  <Label htmlFor="product">Product Name</Label>
                  <Input
                    id="product"
                    placeholder="Filter by product..."
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                  />
                </div>

                {/* Movement Type Filter */}
                <div className="space-y-2">
                  <Label htmlFor="movement">Movement Type</Label>
                  <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {movementTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    Clear Filters
                  </Button>
                  <Button onClick={fetchStockLedger} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {ledgerData.length} entries
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stock Ledger Table */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading stock ledger...</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-600 mb-2">Error loading stock ledger</div>
                  <div className="text-sm text-gray-600">{error}</div>
                  <Button onClick={fetchStockLedger} className="mt-4" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-6 w-6 mr-2" />
                    <div>
                      <CardTitle>Inventory Movements</CardTitle>
                      <CardDescription>
                        Real-time tracking of all stock changes with complete audit trail
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    Live Updates
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <div className="text-gray-600">
                      {ledgerData.length === 0 
                        ? "No stock movements recorded yet" 
                        : "No entries match your filters"}
                    </div>
                    {ledgerData.length > 0 && (
                      <Button onClick={clearFilters} className="mt-2" variant="outline">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Movement Type</TableHead>
                          <TableHead className="text-center">Qty In</TableHead>
                          <TableHead className="text-center">Qty Out</TableHead>
                          <TableHead className="text-center">Balance</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-mono text-sm">
                              {formatDate(entry.created_at)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {entry.product_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getMovementBadgeVariant(entry.movement_type)}>
                                {entry.movement_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={getQuantityColor(entry.quantity_in, null)}>
                                {entry.quantity_in || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={getQuantityColor(null, entry.quantity_out)}>
                                {entry.quantity_out || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {entry.balance}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {entry.reference_id || '-'}
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">
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
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}