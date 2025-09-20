"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Edit, Trash2, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
import { Sidebar } from '@/components/layout/sidebar';

// Component item type for form state
interface ComponentItem {
  product_id: number;
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
  const [editingBom, setEditingBom] = useState<BomWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which BOM is being deleted
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bomToDelete, setBomToDelete] = useState<string | null>(null);
  
  // Form state
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [items, setItems] = useState<ComponentItem[]>([]);
  
  // Component adding state
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [componentQuantity, setComponentQuantity] = useState(1);

  // Helper function to show notifications
  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    setNotification({ type, title, message });
    // Auto-hide after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

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
      showNotification('error', 'Validation Error', 'Please select a finished product and add at least one component.');
      return;
    }

    // Find the selected product to get its name
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      showNotification('error', 'Product Error', 'Selected product not found.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bomData = {
        name: selectedProduct.name, // Use the selected product's name as BOM name
        product_id: selectedProductId!.toString(),
        items: items.map(item => ({
          product_id: item.product_id.toString(),
          quantity: item.quantity
        }))
      };

      if (editingBom) {
        // For now, show a message that editing is not fully implemented
        showNotification('error', 'Edit Not Available', 'BOM editing is not yet fully implemented. You can delete and recreate the BOM instead.');
        setFormOpen(false);
        setEditingBom(null);
        resetForm();
        return;
      } else {
        // Create new BOM
        await bomApi.createBom(bomData);
        showNotification('success', 'Success', 'BOM created successfully!');
      }
      
      // Refresh the data
      mutate('/api/boms');
      
      // Reset form
      resetForm();
      setEditingBom(null);
      setFormOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showNotification('error', 'Error', `Error creating BOM: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add component to BOM
  const handleAddComponent = () => {
    if (!selectedComponentId || componentQuantity <= 0) {
      showNotification('error', 'Validation Error', 'Please select a component and enter a valid quantity.');
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
    setSelectedComponentId(null);
    setComponentQuantity(1);
  };

  // Remove component from BOM
  const handleRemoveComponent = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Reset form state
  const resetForm = () => {
    setSelectedProductId(null);
    setItems([]);
    setSelectedComponentId(null);
    setComponentQuantity(1);
  };

  // Handle form close
  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      resetForm();
      setEditingBom(null); // Clear editing state when closing
    }
  };

  // Handle edit BOM
  const handleEditBom = (bom: BomWithRelations) => {
    setEditingBom(bom);
    setSelectedProductId(parseInt(bom.product.id));
    
    // Convert BOM items to component items for editing
    const componentItems: ComponentItem[] = bom.bom_items.map(item => ({
      product_id: parseInt(item.product_id),
      quantity: item.quantity,
      // Create a partial Product object with available data
      product: {
        id: parseInt(item.component.id),
        name: item.component.name,
        type: 'Raw Material', // Default value
        stock_on_hand: 0, // Default value
        created_at: '', // Default value
        min_stock_level: 0 // Default value
      } as Product
    }));
    setItems(componentItems);
    
    setFormOpen(true);
  };

  // Handle delete BOM (triggered by the delete button to open confirmation)
  const handleDeleteBomClick = (bomId: string) => {
    setBomToDelete(bomId);
    setDeleteConfirmOpen(true);
  };

  // Handle confirmed delete BOM
  const handleConfirmDelete = async () => {
    if (!bomToDelete) return;

    setIsDeleting(bomToDelete);
    try {
      await bomApi.deleteBom(bomToDelete);
      
      // Refresh the data
      mutate('/api/boms');
      
      showNotification('success', 'Success', 'BOM deleted successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showNotification('error', 'Error', `Error deleting BOM: ${errorMessage}`);
    } finally {
      setIsDeleting(null);
      setBomToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  if (bomsError || productsError) {
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
                  mutate('/api/boms');
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
                        <div>{bom.product?.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {bom.product?.id}</div>
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
                      {new Date(bom.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditBom(bom)}
                          disabled={isSubmitting}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteBomClick(bom.id)}
                          disabled={isDeleting === bom.id}
                        >
                          {isDeleting === bom.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
            <DialogTitle>{editingBom ? 'Edit BOM' : 'Create New BOM'}</DialogTitle>
            <DialogDescription>
              {editingBom ? 'View and modify the BOM details.' : 'Define the components and quantities needed to produce a finished product.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic BOM Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="finished-product">Finished Product</Label>
                <Select 
                  value={selectedProductId?.toString() || ""} 
                  onValueChange={(value) => setSelectedProductId(value ? parseInt(value) : null)}
                  disabled={editingBom !== null} // Disable when editing
                >
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
                      products
                        .filter(product => product.type === 'Finished Good')
                        .filter(product => product.id && product.id.toString().trim() !== '') // Filter out invalid IDs
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Component Selection */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Add Components</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="component">Component (Raw Materials)</Label>
                    <Select 
                      value={selectedComponentId?.toString() || ""} 
                      onValueChange={(value) => setSelectedComponentId(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select component" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(product => 
                            product.id !== selectedProductId && 
                            product.type === 'Raw Material'
                          )
                          .filter(product => product.id && product.id.toString().trim() !== '') // Filter out invalid IDs
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
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
                  {editingBom ? 'Updating BOM...' : 'Creating BOM...'}
                </>
              ) : (
                editingBom ? 'Update BOM' : 'Create BOM'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the BOM and all its component relationships.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBomToDelete(null);
              setDeleteConfirmOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete BOM
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Alert */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{notification.title}</AlertTitle>
            <AlertDescription className="flex items-start justify-between">
              <span>{notification.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotification(null)}
                className="ml-2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      </div>
    </Sidebar>
  );
}