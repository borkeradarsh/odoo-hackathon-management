"use client";

import { useState, useEffect } from 'react';
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

import { Product, Operator } from '@/types';
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
  assigneeId: z.string().optional(),
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
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);

  const form = useForm<ManufacturingOrderFormData>({
    resolver: zodResolver(manufacturingOrderSchema),
    defaultValues: {
      productId: 0,
      quantity: 1,
      assigneeId: 'unassigned',
    },
  });

  const { handleSubmit, formState: { isValid }, reset } = form;

  // Fetch operators on component mount
  useEffect(() => {
    if (open) {
      fetchOperators();
    }
  }, [open]);

  const fetchOperators = async () => {
    setIsLoadingOperators(true);
    try {
      const response = await fetch('/api/operators');
      if (response.ok) {
        const data = await response.json();
        const operatorsData = data.data || [];
        console.log("Checking operators data for Select:", operatorsData);
        setOperators(operatorsData);
      } else {
        toast.error('Failed to load operators');
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast.error('Failed to load operators');
    } finally {
      setIsLoadingOperators(false);
    }
  };

  const handleDialogChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  const handleFormSubmit = async (data: ManufacturingOrderFormData) => {
    setIsSubmitting(true);
    try {
      // Ensure data types are correct before sending
      const payload = {
        product_id: parseInt(data.productId.toString(), 10),
        quantity: parseInt(data.quantity.toString(), 10),
        assignee_id: data.assigneeId && data.assigneeId !== 'unassigned' ? data.assigneeId : undefined,
      };

      // Validate converted values
      if (isNaN(payload.product_id) || isNaN(payload.quantity)) {
        throw new Error('Invalid product ID or quantity');
      }

      if (payload.product_id <= 0 || payload.quantity <= 0) {
        throw new Error('Product ID and quantity must be greater than 0');
      }

      const response = await manufacturingOrderApi.createManufacturingOrder(payload);
      
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

  // Alternative FormData-based submit handler for Server Actions compatibility
  // Usage: If converting to Server Actions, replace the current form submission with:
  // <form action={handleFormDataSubmit}>
  //   <input name="product_id" value={selectedProductId} />
  //   <input name="quantity" value={quantity} />
  //   <input name="operator_id" value={selectedOperatorId} />
  // </form>
  const handleFormDataSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Convert FormData values to proper types
      const payload = {
        product_id: parseInt(formData.get('product_id') as string, 10),
        quantity: parseInt(formData.get('quantity') as string, 10),
        operator_id: formData.get('operator_id') as string,
      };

      // Validate converted values
      if (!payload.product_id || !payload.quantity) {
        throw new Error('Product ID and quantity are required');
      }

      if (payload.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // Send the payload with correct data types
      const response = await fetch('/api/manufacturing-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: payload.product_id,
          quantity: payload.quantity,
          assignee_id: payload.operator_id && payload.operator_id !== 'unassigned' ? payload.operator_id : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success toast
        toast.success(
          'Manufacturing Order created successfully!',
          {
            description: `MO #${data.data?.moId} for ${payload.quantity} units with ${data.data?.workOrdersCreated} work orders created.`,
          }
        );
        
        // Reset form and close dialog
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        throw new Error(data.error || 'Failed to create manufacturing order');
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

  // For debugging: log the FormData handler availability
  if (typeof window !== 'undefined') {
    (globalThis as typeof globalThis & { createMOFormDataHandler: typeof handleFormDataSubmit }).createMOFormDataHandler = handleFormDataSubmit;
  }

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
                          finishedProducts
                            .filter(product => product.id && product.id.toString().trim() !== '') // Filter out invalid IDs
                            .map((product) => (
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

            {/* Operator Assignment */}
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-purple-500" />
                    Assign to Operator
                    <span className="text-sm text-muted-foreground">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value || "unassigned"} 
                      onValueChange={field.onChange}
                      disabled={isLoadingOperators}
                    >
                      <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-purple-500">
                        <SelectValue placeholder="Select an operator..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">Assign later</span>
                        </SelectItem>
                        {isLoadingOperators ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2">Loading operators...</span>
                          </div>
                        ) : operators.length === 0 ? (
                          <div className="text-center py-2 text-muted-foreground">
                            No operators available
                          </div>
                        ) : (
                          operators
                            .filter(operator => operator.id && operator.id.trim() !== '') // Filter out invalid IDs
                            .map((operator) => (
                              <SelectItem key={operator.id} value={operator.id}>
                                {operator.full_name}
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