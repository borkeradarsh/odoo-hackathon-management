"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  cost_price: z.number().min(0, 'Cost price must be positive'),
  selling_price: z.number().min(0, 'Selling price must be positive').optional(),
  current_stock: z.number().min(0, 'Stock cannot be negative').optional(),
  minimum_stock: z.number().min(0, 'Minimum stock cannot be negative').optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function ProductForm(props: ProductFormProps) {
  const { product, open, onOpenChange, onSubmit, isLoading = false } = props;
  const isEditing = !!product;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      description: product?.description || '',
      cost_price: product?.cost_price ?? undefined,
      selling_price: product?.selling_price ?? undefined,
      current_stock: product?.current_stock ?? undefined,
      minimum_stock: product?.minimum_stock ?? undefined,
    },
  });

  useState(() => {
    if (open) {
      form.reset({
        name: product?.name || '',
        sku: product?.sku || '',
        description: product?.description || '',
        cost_price: product?.cost_price ?? undefined,
        selling_price: product?.selling_price ?? undefined,
        current_stock: product?.current_stock ?? undefined,
        minimum_stock: product?.minimum_stock ?? undefined,
      });
    }
  });

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-8">
  {/* <h1 className="text-2xl font-extrabold mb-6 text-teal-900 drop-shadow-lg">{isEditing ? 'Edit Product' : 'Add Product'}</h1> */}
      <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[600px] bg-sidebar-accent border-sidebar-border rounded-2xl shadow-xl text-teal-900">
          <DialogHeader>
            <DialogTitle className="text-teal-900 text-xl font-bold">
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </DialogTitle>
            <DialogDescription className="text-teal-700">
              {isEditing
                ? 'Update the product information below.'
                : 'Fill in the details to create a new product.'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="bg-sidebar rounded-xl p-4 shadow border border-sidebar-border">
                    <FormLabel className="text-teal-900 font-semibold">Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} className="bg-sidebar-accent text-teal-900 rounded-lg border-sidebar-border placeholder:text-teal-700" />
                    </FormControl>
                    <FormMessage className="text-red-700" />
                  </FormItem>
                )}
              />
              {/* SKU */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem className="bg-sidebar rounded-xl p-4 shadow border border-sidebar-border">
                    <FormLabel className="text-teal-900 font-semibold">SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} className="bg-sidebar-accent text-teal-900 rounded-lg border-sidebar-border placeholder:text-teal-700" />
                    </FormControl>
                    <FormMessage className="text-red-700" />
                  </FormItem>
                )}
              />
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="bg-sidebar rounded-xl p-4 shadow border border-sidebar-border">
                    <FormLabel className="text-teal-900 font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter product description (optional)" {...field} className="bg-sidebar-accent text-teal-900 rounded-lg border-sidebar-border placeholder:text-teal-700" />
                    </FormControl>
                    <FormMessage className="text-red-700" />
                  </FormItem>
                )}
              />
              {/* Cost Price */}
              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem className="bg-sidebar rounded-xl p-4 shadow border border-sidebar-border">
                    <FormLabel className="text-teal-900 font-semibold">Cost Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder=""
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        className="bg-sidebar-accent text-teal-900 rounded-lg border-sidebar-border placeholder:text-teal-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-700" />
                  </FormItem>
                )}
              />
              {/* Selling Price */}
              <FormField
                control={form.control}
                name="selling_price"
                render={({ field }) => (
                  <FormItem className="bg-sidebar rounded-xl p-4 shadow border border-sidebar-border">
                    <FormLabel className="text-teal-900 font-semibold">Selling Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder=""
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        className="bg-sidebar-accent text-teal-900 rounded-lg border-sidebar-border placeholder:text-teal-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-700" />
                  </FormItem>
                )}
              />
              {/* Current Stock */}
              <FormField
                control={form.control}
                name="current_stock"
                render={({ field }) => (
                  <FormItem className="bg-sidebar rounded-xl p-4 shadow border border-sidebar-border">
                    <FormLabel className="text-teal-900 font-semibold">Current Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder=""
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                        className="bg-sidebar-accent text-teal-900 rounded-lg border-sidebar-border placeholder:text-teal-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-700" />
                  </FormItem>
                )}
              />
              {/* Minimum Stock */}
              <FormField
                control={form.control}
                name="minimum_stock"
                render={({ field }) => (
                  <FormItem className="bg-sidebar rounded-xl p-4 shadow border border-sidebar-border">
                    <FormLabel className="text-teal-900 font-semibold">Minimum Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder=""
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                        className="bg-sidebar-accent text-teal-900 rounded-lg border-sidebar-border placeholder:text-teal-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-700" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="rounded-full bg-sidebar-ring text-sidebar-primary-foreground px-6 py-2 shadow border-none"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="rounded-full bg-sidebar-primary text-sidebar-primary-foreground px-6 py-2 shadow border-none">
                  {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}