"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Package,
  Warehouse,
  Hash,
  TrendingDown,
  Loader2,
  Save
} from 'lucide-react';

import { Product } from '@/types';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Zod schema for product validation
const productSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(255, 'Product name must not exceed 255 characters')
    .trim(),
  type: z.enum(['Raw Material', 'Finished Good'], {
    message: 'Product type is required',
  }),
  stock_on_hand: z.number()
    .min(0, 'Stock on hand cannot be negative')
    .int('Stock on hand must be a whole number'),
  min_stock_level: z.number()
    .min(0, 'Minimum stock level cannot be negative')
    .int('Minimum stock level must be a whole number'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: Product | null;
  title?: string;
}

export function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  initialData = null,
  title
}: ProductFormProps) {
  const isEditing = !!initialData;
  const defaultTitle = isEditing ? 'Edit Product' : 'Create New Product';

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'Raw Material',
      stock_on_hand: initialData?.stock_on_hand || 0,
      min_stock_level: initialData?.min_stock_level || 10,
    },
  });

  // Reset form when initialData changes (for editing)
  useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name || '',
        type: initialData.type || 'Raw Material',
        stock_on_hand: initialData.stock_on_hand || 0,
        min_stock_level: initialData.min_stock_level || 10,
      });
    } else if (open && !initialData) {
      // Reset to default values for new product
      form.reset({
        name: '',
        type: 'Raw Material',
        stock_on_hand: 0,
        min_stock_level: 10,
      });
    }
  }, [open, initialData, form]);

  const { handleSubmit, formState: { isSubmitting, isValid } } = form;

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      // Create a clean copy of the data to avoid any circular references
      const cleanData = {
        name: data.name,
        type: data.type,
        stock_on_hand: Number(data.stock_on_hand),
        min_stock_level: Number(data.min_stock_level),
      };
      
      console.log('Submitting clean data:', cleanData);
      await onSubmit(cleanData);
      
      // Success toast
      toast.success(
        isEditing 
          ? 'Product updated successfully!' 
          : 'Product created successfully!',
        {
          description: `${data.name} has been saved.`,
        }
      );
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error toast
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      toast.error('Failed to save product', {
        description: errorMessage,
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title || defaultTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Modify the details for "${initialData?.name}". Current stock: ${initialData?.stock_on_hand || 0}` 
              : 'Enter the details for the new product.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Two-column grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        Product Name
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={isEditing ? "Update product name" : "e.g., Steel Bolts M8x20"}
                          {...field}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Product Type - RadioGroup */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-green-500" />
                        Product Type
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <RadioGroupItem value="Raw Material" id="raw-material" />
                            <Label htmlFor="raw-material" className="cursor-pointer flex-1">
                              <div>
                                <div className="font-medium">Raw Material</div>
                                <div className="text-sm text-gray-500">
                                  Materials used in manufacturing process
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <RadioGroupItem value="Finished Good" id="finished-good" />
                            <Label htmlFor="finished-good" className="cursor-pointer flex-1">
                              <div>
                                <div className="font-medium">Finished Good</div>
                                <div className="text-sm text-gray-500">
                                  Completed products ready for sale
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Stock on Hand */}
              <FormField
                control={form.control}
                name="stock_on_hand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-purple-500" />
                      Stock on Hand
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={isEditing ? "Current stock quantity" : "0"}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Minimum Stock Level */}
              <FormField
                control={form.control}
                name="min_stock_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      Minimum Stock Level
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={isEditing ? "Minimum stock threshold" : "10"}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={!isValid || isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Product
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