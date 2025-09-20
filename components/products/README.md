# Products CRUD Interface - Usage Examples

This document provides examples of how to use the complete CRUD (Create, Read, Update, Delete) interface for Products.

## Features Overview

✅ **Display Products**: View all products in a responsive table  
✅ **Create Products**: Add new products with comprehensive form validation  
✅ **Update Products**: Edit existing product information  
✅ **Delete Products**: Remove products with confirmation dialog  
✅ **Stock Status**: Visual indicators for stock levels  
✅ **Real-time Updates**: Automatic list refresh after operations  
✅ **Error Handling**: User-friendly error messages  
✅ **Loading States**: Smooth UI with loading indicators  

## Navigation

To access the Products page:
1. Navigate to `/products` or click "Products" in the sidebar
2. The page will automatically load and display all products

## Creating a New Product

1. Click the **"Create New Product"** button (top-right of the page)
2. Fill in the product form:
   - **Product Name**: Required (e.g., "Steel Bolt M8x20")
   - **SKU**: Required, unique identifier (e.g., "BOLT-M8-20")
   - **Description**: Optional description
   - **Unit of Measure**: Required (e.g., "piece", "kg", "liter")
   - **Cost Price**: Required, must be positive
   - **Selling Price**: Optional
   - **Current Stock**: Optional, defaults to 0
   - **Minimum Stock**: Optional, defaults to 0

3. Click **"Create Product"** to save
4. The product list will automatically refresh to show the new product

### Example Product Data:
```
Name: Steel Bolt M8x20
SKU: BOLT-M8-20
Description: High-strength steel bolt for manufacturing
Unit of Measure: piece
Cost Price: 0.25
Selling Price: 0.50
Current Stock: 1000
Minimum Stock: 100
```

## Viewing Products

The products table displays:
- **Name**: Product name
- **SKU**: Stock Keeping Unit
- **Unit**: Unit of measure
- **Cost Price**: Purchase cost
- **Selling Price**: Selling price (or "N/A" if not set)
- **Stock**: Current stock quantity
- **Status**: Stock status badge:
  - 🔴 **Out of Stock**: Current stock = 0
  - 🟡 **Low Stock**: Current stock ≤ minimum stock
  - 🟢 **In Stock**: Current stock > minimum stock
- **Actions**: Edit and Delete buttons

## Editing a Product

1. Click the **Edit** button (pencil icon) for any product in the table
2. The form will open pre-filled with current product data
3. Modify any fields as needed
4. Click **"Update Product"** to save changes
5. The table will refresh to show updated information

## Deleting a Product

1. Click the **Delete** button (trash icon) for any product
2. A confirmation dialog will appear asking "Are you sure?"
3. Click **"Delete Product"** to confirm or **"Cancel"** to abort
4. If confirmed, the product will be removed and the table updated

**Note**: Deletion may fail if the product is referenced by other records (BOMs, Manufacturing Orders, etc.)

## Loading States

- **Initial Load**: Shows spinner with "Loading products..." message
- **Form Submission**: Button shows "Saving..." with disabled state
- **Delete Operation**: Button shows "Deleting..." with spinner

## Error Handling

The interface handles various error scenarios:

### Network Errors
- If the API is unreachable, shows error message with retry button

### Validation Errors
- Missing required fields are highlighted in red
- Form won't submit until all required fields are filled

### Business Logic Errors
- **Duplicate SKU**: Shows "Product SKU already exists" error
- **Delete Constraints**: Shows "Cannot delete product: it is referenced by other records"
- **Invalid Data**: Shows specific validation error messages

### Example Error Messages:
```
✅ Success: "Product created successfully!"
❌ Error: "Product SKU already exists"
❌ Error: "Missing required field: name"
❌ Error: "Cannot delete product: it is referenced by other records"
```

## Data Validation

### Client-Side Validation (Zod Schema):
- **Name**: Required, minimum 1 character
- **SKU**: Required, minimum 1 character
- **Unit of Measure**: Required, minimum 1 character
- **Cost Price**: Required, must be ≥ 0
- **Selling Price**: Optional, must be ≥ 0 if provided
- **Stock Values**: Must be ≥ 0

### Server-Side Validation:
- Authentication required for all write operations
- Additional business rule validation
- Database constraint validation

## Technical Implementation

### Technologies Used:
- **SWR**: Data fetching with automatic caching and revalidation
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation
- **shadcn/ui**: Consistent UI components
- **Lucide Icons**: Beautiful, consistent icons

### Key Components:
- `ProductForm`: Reusable form component for create/edit
- `ProductsPage`: Main page with table and CRUD operations
- `Table`, `Dialog`, `AlertDialog`: shadcn/ui components

### Data Flow:
1. **Fetch**: SWR automatically fetches and caches product data
2. **Create/Update**: Form submission calls API, then triggers revalidation
3. **Delete**: Confirmation → API call → automatic list refresh
4. **Error Handling**: All operations include try/catch with user feedback

## Best Practices Implemented

1. **User Experience**:
   - Immediate feedback for all actions
   - Loading states prevent multiple submissions
   - Confirmation dialogs for destructive actions
   - Clear error messages

2. **Data Integrity**:
   - Form validation on both client and server
   - Automatic data refresh after mutations
   - Optimistic UI updates where appropriate

3. **Code Quality**:
   - TypeScript for type safety
   - Reusable components
   - Consistent error handling
   - Clean separation of concerns

## Next Steps

After products are working:
1. Implement similar CRUD interfaces for BOMs
2. Add advanced filtering and search
3. Implement bulk operations
4. Add export/import functionality