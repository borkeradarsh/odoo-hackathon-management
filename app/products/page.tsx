"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductForm } from '@/components/products/ProductForm';
import { Product } from '@/types';
import { productApi } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';

// Form data type for product creation/update
type ProductFormData = {
  name: string;
  type: 'Raw Material' | 'Finished Good';
  stock_on_hand: number;
  min_stock_level: number;
};

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

export default function ProductsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products using SWR with proper revalidation
  const { 
    data: productsData, 
    error, 
    isLoading 
  } = useSWR('/api/products', fetcher, {
    revalidateOnFocus: true,       // Refresh when tab becomes active
    revalidateOnReconnect: true,   // Refresh on network reconnect
    refreshInterval: 0,            // No automatic polling
    dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  });

  const products: Product[] = productsData?.products || [];

  // Handle form submission for create/update
  const handleFormSubmit = async (formData: ProductFormData) => {
    try {
      console.log('Form data being submitted:', formData);
      
      if (editingProduct) {
        // Update existing product
        await productApi.updateProduct(editingProduct.id.toString(), formData);
      } else {
        // Create new product
        await productApi.createProduct(formData);
      }
      
      // Refresh the data
      mutate('/api/products');
      
      // Reset form state
      setEditingProduct(null);
      setFormOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error; // Re-throw so the form can handle it
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await productApi.deleteProduct(productToDelete.id.toString());
      alert('Product deleted successfully!');
      
      // Refresh the data
      mutate('/api/products');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error deleting product: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Handle edit button click
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Handle create new product
  const handleCreateNew = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  // Handle form dialog close
  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  // Get stock status badge
  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (current <= minimum) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load products. Please try again.</p>
          <Button 
            onClick={() => mutate('/api/products')} 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Sidebar>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 drop-shadow-lg">Products</h1>
            <p className="text-sidebar-accent-foreground">
              Manage your product inventory and information.
            </p>
          </div>
          <Button onClick={handleCreateNew} className="rounded-full bg-sidebar-primary text-sidebar-primary-foreground px-6 py-2 shadow border-none">
            <Plus className="mr-2 h-4 w-4" />
            Create New Product
          </Button>
        </div>

        <div className="bg-sidebar-accent border border-sidebar-border rounded-2xl shadow-xl">
          <div className="px-6 pt-6 pb-2 border-b border-sidebar-border">
            <h2 className="text-xl font-bold text-slate-800 ">Product List</h2>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-sidebar-ring" />
                <span className="ml-2 text-sidebar-primary-foreground">Loading products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sidebar-accent-foreground">No products found.</p>
                <Button 
                  onClick={handleCreateNew}
                  className="mt-4 rounded-full bg-sidebar-primary text-sidebar-primary-foreground px-6 py-2 shadow border-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Product
                </Button>
              </div>
            ) : (
              <Table className="bg-sidebar rounded-xl border border-sidebar-border shadow">
                <TableHeader>
                  <TableRow className="bg-sidebar-accent">
                    <TableHead className="text-sidebar-primary font-bold">Name</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Type</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Stock on Hand</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Min Stock Level</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Status</TableHead>
                    <TableHead className="text-right text-sidebar-primary font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="bg-sidebar-accent hover:bg-sidebar-ring/20 rounded-lg">
                      <TableCell className="font-semibold text-md px-4 text-slate-800">{product.name}</TableCell>
                      <TableCell className="text-sidebar-primary-foreground">
                        <Badge variant={product.type === 'Raw Material' ? 'secondary' : 'default'}>
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-800">{product.stock_on_hand}</TableCell>
                      <TableCell className="text-slate-800">{product.min_stock_level}</TableCell>
                      <TableCell>
                        {getStockStatus(product.stock_on_hand, product.min_stock_level)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="rounded-full bg-sidebar-ring text-sidebar-primary-foreground border-none shadow"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                            className="rounded-full bg-destructive text-white border-none shadow"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Product Form Dialog */}
        <ProductForm
          initialData={editingProduct}
          open={formOpen}
          onOpenChange={handleFormClose}
          onSubmit={handleFormSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-sidebar-accent border-sidebar-border rounded-2xl shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sidebar-primary-foreground">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sidebar-accent-foreground">
                This action cannot be undone. This will permanently delete the product
                &ldquo;{productToDelete?.name}&rdquo; and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} className="rounded-full bg-sidebar-ring text-sidebar-primary-foreground px-6 py-2 shadow border-none">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full bg-destructive text-white px-6 py-2 shadow border-none"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Product'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Sidebar>
  );
}