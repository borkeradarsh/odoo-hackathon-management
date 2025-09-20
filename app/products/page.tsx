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
import ProductForm from '@/components/products/product-form';
import { Product } from '@/types';
import { productApi } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';

// Form data type for product creation/update
type ProductFormData = {
  name: string;
  sku: string;
  description?: string | null;
  cost_price: number;
  selling_price?: number | null;
  current_stock?: number;
  minimum_stock?: number;
};

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products using SWR
  const { 
    data: productsData, 
    error, 
    isLoading 
  } = useSWR('/api/products', fetcher);

  const products: Product[] = productsData?.products || [];

  // Handle form submission for create/update
  const handleFormSubmit = async (formData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // Transform form data to match API expectations
      const apiData = {
        ...formData,
        description: formData.description || null,
        selling_price: formData.selling_price || null,
        current_stock: formData.current_stock || 0,
        minimum_stock: formData.minimum_stock || 0,
      };

      if (editingProduct) {
        // Update existing product
        await productApi.updateProduct(editingProduct.id, apiData);
        alert('Product updated successfully!');
      } else {
        // Create new product
        await productApi.createProduct(apiData);
        alert('Product created successfully!');
      }
      
      // Refresh the data
      mutate('/api/products');
      
      // Reset form state
      setEditingProduct(null);
      setFormOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await productApi.deleteProduct(productToDelete.id);
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
            <h1 className="text-3xl font-extrabold tracking-tight text-sidebar-primary-foreground drop-shadow-lg">Products</h1>
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
            <h2 className="text-xl font-bold text-sidebar-primary-foreground">Product List</h2>
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
                    <TableHead className="text-sidebar-primary font-bold">SKU</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Cost Price</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Selling Price</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Stock</TableHead>
                    <TableHead className="text-sidebar-primary font-bold">Status</TableHead>
                    <TableHead className="text-right text-sidebar-primary font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="bg-sidebar-accent hover:bg-sidebar-ring/20 rounded-lg">
                      <TableCell className="font-semibold text-sidebar-primary-foreground">{product.name}</TableCell>
                      <TableCell className="text-sidebar-primary-foreground">{product.sku}</TableCell>
                      <TableCell className="text-sidebar-primary-foreground">${product.cost_price.toFixed(2)}</TableCell>
                      <TableCell className="text-sidebar-primary-foreground">
                        {product.selling_price 
                          ? `$${product.selling_price.toFixed(2)}` 
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-sidebar-primary-foreground">{product.current_stock}</TableCell>
                      <TableCell>
                        {getStockStatus(product.current_stock, product.minimum_stock)}
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
          product={editingProduct}
          open={formOpen}
          onOpenChange={handleFormClose}
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
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