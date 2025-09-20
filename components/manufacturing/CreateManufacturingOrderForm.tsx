"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Factory,
  Package,
  Hash,
  Loader2,
  Save,
  CheckCircle
} from 'lucide-react';

import { Product } from '@/types';
import { manufacturingOrderApi } from '@/lib/api/manufacturing-orders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Zod schema for manufacturing order validation
const manufacturingOrderSchema = z.object({
  productId: z.number({
    message: 'Product is required',
  }).min(1, 'Please select a product'),
  quantity: z.number()
    .min(1, 'Quantity must be at least 1')
    .int('Quantity must be a whole number'),
});

type ManufacturingOrderFormData = z.infer<typeof manufacturingOrderSchema>;

interface CreateManufacturingOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: Product[];
  isLoadingProducts?: boolean;
}

export function CreateManufacturingOrderForm({
  open,
  onOpenChange,
  onSuccess,
  products,
  isLoadingProducts = false
}: CreateManufacturingOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManufacturingOrderFormData>({
    resolver: zodResolver(manufacturingOrderSchema),
    defaultValues: {
      productId: 0,
      quantity: 1,
    },
  });

  const { handleSubmit, formState: { isValid }, reset } = form;

  const handleDialogChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  const handleFormSubmit = async (data: ManufacturingOrderFormData) => {
    setIsSubmitting(true);
    try {
      const response = await manufacturingOrderApi.createManufacturingOrder({
        productId: data.productId,
        quantity: data.quantity,
      });
      
      if (response.success) {
        // Success toast
        toast.success(
          'Manufacturing Order created successfully!',
          {
            description: `MO #${response.data?.moId} for ${data.quantity} units with ${response.data?.workOrdersCreated} work orders created.`,
          }
        );
        
        // Reset form and close dialog
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        throw new Error(response.error || 'Failed to create manufacturing order');
      }
    } catch (error) {
      // Error toast
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      toast.error(
        'Failed to create Manufacturing Order',
        {
          description: errorMessage,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products to only show finished goods (since we can only manufacture finished goods)
  const finishedProducts = products.filter(product => product.type === 'Finished Good');

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Create Manufacturing Order
          </DialogTitle>
          <DialogDescription>
            Create a new manufacturing order to produce finished goods from raw materials.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    Product to Manufacture
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value?.toString() || ""} 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : 0)}
                      disabled={isLoadingProducts}
                    >
                      <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select a finished product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingProducts ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2">Loading products...</span>
                          </div>
                        ) : finishedProducts.length === 0 ? (
                          <div className="text-center py-2 text-muted-foreground">
                            No finished products available
                          </div>
                        ) : (
                          finishedProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{product.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  Stock: {product.stock_on_hand}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-green-500" />
                    Quantity to Produce
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter quantity..."
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="transition-all duration-200 focus:ring-2 focus:ring-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">What happens next:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Manufacturing order will be created</li>
                    <li>• Work orders will be auto-generated for each component</li>
                    <li>• You can track progress on the manufacturing dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting || finishedProducts.length === 0}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create MO
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}