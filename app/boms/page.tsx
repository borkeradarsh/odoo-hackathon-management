"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { bomApi, BomWithRelations } from '@/lib/api';

// Component item type for form state
interface ComponentItem {
  product_id: string;
  quantity: number;
  product?: Product;
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
});

export default function BomsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('1.0');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [items, setItems] = useState<ComponentItem[]>([]);
  
  // Component adding state
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [componentQuantity, setComponentQuantity] = useState(1);

  // Fetch BOMs using SWR
  const { 
    data: bomsData, 
    error: bomsError, 
    isLoading: bomsLoading 
  } = useSWR('/api/boms', fetcher);

  // Fetch products for dropdowns
  const { 
    data: productsData, 
    error: productsError, 
    isLoading: productsLoading 
  } = useSWR('/api/products', fetcher);

  const boms: BomWithRelations[] = bomsData?.boms || [];
  const products: Product[] = productsData?.products || [];

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedProductId || items.length === 0) {
      alert('Please select a finished product and add at least one component.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bomData = {
        product_id: selectedProductId,
        version: selectedVersion,
        quantity: selectedQuantity,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      await bomApi.createBom(bomData);
      alert('BOM created successfully!');
      
      // Refresh the data
      mutate('/api/boms');
      
      // Reset form
      resetForm();
      setFormOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error creating BOM: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add component to BOM
  const handleAddComponent = () => {
    if (!selectedComponentId || componentQuantity <= 0) {
      alert('Please select a component and enter a valid quantity.');
      return;
    }

    // Check if component already exists
    const existingIndex = items.findIndex(item => item.product_id === selectedComponentId);
    if (existingIndex >= 0) {
      // Update existing component quantity
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += componentQuantity;
      setItems(updatedItems);
    } else {
      // Add new component
      const selectedProduct = products.find(p => p.id === selectedComponentId);
      setItems([...items, {
        product_id: selectedComponentId,
        quantity: componentQuantity,
        product: selectedProduct
      }]);
    }

    // Reset component selection
    setSelectedComponentId('');
    setComponentQuantity(1);
  };

  // Remove component from BOM
  const handleRemoveComponent = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Reset form state
  const resetForm = () => {
    setSelectedProductId('');
    setSelectedVersion('1.0');
    setSelectedQuantity(1);
    setItems([]);
    setSelectedComponentId('');
    setComponentQuantity(1);
  };

  // Handle form close
  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (bomsError || productsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load data. Please try again.</p>
          <Button 
            onClick={() => {
              mutate('/api/boms');
              mutate('/api/products');
            }} 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills of Material</h1>
          <p className="text-muted-foreground">
            Manage product recipes and component requirements.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New BOM
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BOM List</CardTitle>
        </CardHeader>
        <CardContent>
          {bomsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading BOMs...</span>
            </div>
          ) : boms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No BOMs found.</p>
              <Button 
                onClick={() => setFormOpen(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First BOM
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Finished Product</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boms.map((bom) => (
                  <TableRow key={bom.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{bom.product?.name}</div>
                        <div className="text-sm text-muted-foreground">{bom.product?.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>{bom.version}</TableCell>
                    <TableCell>{bom.quantity}</TableCell>
                    <TableCell>{bom.bom_lines?.length || 0} components</TableCell>
                    <TableCell>
                      <Badge variant={bom.is_active ? "default" : "secondary"}>
                        {bom.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(bom.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create BOM Dialog */}
      <Dialog open={formOpen} onOpenChange={handleFormClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New BOM</DialogTitle>
            <DialogDescription>
              Define the components and quantities needed to produce a finished product.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic BOM Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="finished-product">Finished Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finished product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Loading products...</span>
                      </div>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  placeholder="e.g., 1.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Produce</Label>
              <Input
                id="quantity"
                type="number"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                min="1"
                placeholder="1"
              />
            </div>

            {/* Component Selection */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Add Components</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="component">Component</Label>
                    <Select value={selectedComponentId} onValueChange={setSelectedComponentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select component" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(product => product.id !== selectedProductId)
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="component-quantity">Quantity</Label>
                    <Input
                      id="component-quantity"
                      type="number"
                      value={componentQuantity}
                      onChange={(e) => setComponentQuantity(parseInt(e.target.value) || 1)}
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddComponent}
                  disabled={!selectedComponentId || componentQuantity <= 0}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
              </div>

              {/* Components List */}
              {items.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">BOM Components ({items.length})</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <span className="font-medium">{item.product?.name}</span>
                          <span className="text-muted-foreground ml-2">({item.product?.sku})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Qty: {item.quantity}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveComponent(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleFormClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedProductId || items.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating BOM...
                </>
              ) : (
                'Create BOM'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}