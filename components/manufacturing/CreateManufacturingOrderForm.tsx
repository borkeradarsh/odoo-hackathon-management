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
  CheckCircle,
  Users,
  Clock
} from 'lucide-react';

import { Product, Operator } from '@/types';
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
      productId: 0, // Set to 0 initially, will trigger validation if submitted
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
      // Get raw values from the form data (ensuring proper type conversion)
      const rawProductId = data.productId.toString();
      const rawQuantity = data.quantity.toString();
      const assigneeId = data.assigneeId && data.assigneeId !== 'unassigned' ? data.assigneeId : undefined;

      // Create the payload with CORRECT data types
      const payload = {
        product_id: parseInt(rawProductId, 10),
        quantity: parseInt(rawQuantity, 10),
        assignee_id: assigneeId,
      };

      // Validate converted values
      if (isNaN(payload.product_id) || isNaN(payload.quantity)) {
        throw new Error('Invalid product ID or quantity');
      }

      if (payload.product_id <= 0 || payload.quantity <= 0) {
        throw new Error('Product ID and quantity must be greater than 0');
      }

      // Send the validated payload
      const response = await fetch('/api/manufacturing-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // This correctly handles the error
        const errorData = await response.json();
        console.error("Failed to create MO. Server responded with:", errorData);
        throw new Error(errorData.error || 'Failed to create manufacturing order');
      }

      // It was successful!
      const result = await response.json();
      console.log("Successfully created MO:", result);
      
      // Success toast
      toast.success(
        'Manufacturing Order created successfully!',
        {
          description: `MO #${result.new_mo_id} for ${payload.quantity} units created successfully.`,
        }
      );
      
      // Reset form and close dialog
      reset();
      onOpenChange(false);
      onSuccess(); // Trigger the data refresh for your orders list
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
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Factory className="h-5 w-5 text-blue-600" />
            </div>
            Create Manufacturing Order
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new manufacturing order to produce finished goods from raw materials. 
            This will generate work orders for all required components.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 mt-6">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-blue-500" />
                    Product to Manufacture
                    <span className="text-red-500 text-xs">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value?.toString() || ""} 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : 0)}
                      disabled={isLoadingProducts}
                    >
                      <SelectTrigger className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400">
                        <SelectValue 
                          placeholder="Choose a finished product to manufacture..." 
                          className="text-gray-500"
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {isLoadingProducts ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="ml-2 text-sm text-gray-600">Loading products...</span>
                          </div>
                        ) : finishedProducts.length === 0 ? (
                          <div className="text-center py-6">
                            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No finished products available</p>
                          </div>
                        ) : (
                          finishedProducts
                            .filter(product => product.id && product.id.toString().trim() !== '')
                            .map((product) => (
                              <SelectItem 
                                key={product.id} 
                                value={product.id.toString()}
                                className="py-3 cursor-pointer hover:bg-gray-50"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium text-gray-900">{product.name}</span>
                                    <span className="text-xs text-gray-500">
                                      Current stock: {product.stock_on_hand} units
                                    </span>
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-xs ${
                                    product.stock_on_hand > 10 
                                      ? 'bg-green-100 text-green-700' 
                                      : product.stock_on_hand > 0 
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {product.stock_on_hand > 10 ? 'In Stock' : 
                                     product.stock_on_hand > 0 ? 'Low Stock' : 'Out of Stock'}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Hash className="h-4 w-4 text-green-500" />
                    Quantity to Produce
                    <span className="text-red-500 text-xs">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter production quantity..."
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="h-12 pl-4 pr-16 text-lg transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        units
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Operator Assignment */}
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Users className="h-4 w-4 text-purple-500" />
                    Assign to Operator
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Optional</span>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value || "unassigned"} 
                      onValueChange={field.onChange}
                      disabled={isLoadingOperators}
                    >
                      <SelectTrigger className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400">
                        <SelectValue placeholder="Choose an operator or assign later..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Assign later</span>
                          </div>
                        </SelectItem>
                        {isLoadingOperators ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                            <span className="ml-2 text-sm text-gray-600">Loading operators...</span>
                          </div>
                        ) : operators.length === 0 ? (
                          <div className="text-center py-6">
                            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No operators available</p>
                          </div>
                        ) : (
                          operators
                            .filter(operator => operator.id && operator.id.trim() !== '')
                            .map((operator) => (
                              <SelectItem 
                                key={operator.id} 
                                value={operator.id}
                                className="py-3 cursor-pointer hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Users className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <span className="font-medium">{operator.full_name}</span>
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Info box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">Process Overview</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Manufacturing order will be created with draft status
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Work orders will be auto-generated for each component
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Track progress on the manufacturing dashboard
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 h-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting || finishedProducts.length === 0}
                className="px-6 py-2.5 h-auto bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Manufacturing Order
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