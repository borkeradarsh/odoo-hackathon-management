# API Functions Documentation

This documentation covers the server-side API functions for managing Products and Bills of Material (BOMs) in the Manufacturing Management Application.

## Overview

The API layer provides secure, server-side functions for:
- **Product Management**: CRUD operations for products
- **BOM Management**: Creating and managing Bills of Material with transactional support

All functions use the Supabase server-side client and include proper authentication, error handling, and data validation.

## API Routes

### Product API (`/api/products`)

#### GET `/api/products`
Fetches all products from the database.

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sku": "PRODUCT-SKU",
      "description": "Product description",
      "unit_of_measure": "piece",
      "cost_price": 10.50,
      "selling_price": 15.00,
      "current_stock": 100,
      "minimum_stock": 10,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "created_by": "user-uuid"
    }
  ]
}
```

#### POST `/api/products`
Creates a new product.

**Request Body:**
```json
{
  "name": "Steel Bolt M8x20",
  "sku": "BOLT-M8-20",
  "description": "High-strength steel bolt",
  "unit_of_measure": "piece",
  "cost_price": 0.25,
  "selling_price": 0.50,
  "current_stock": 1000,
  "minimum_stock": 100
}
```

**Response:**
```json
{
  "product": {
    "id": "uuid",
    // ... product data
  }
}
```

#### PUT `/api/products/[id]`
Updates an existing product.

**Request Body:** Partial product data to update.

#### DELETE `/api/products/[id]`
Deletes a product (if not referenced by other records).

### BOM API (`/api/boms`)

#### GET `/api/boms`
Fetches all BOMs with product and component information.

**Response:**
```json
{
  "boms": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "version": "1.0",
      "is_active": true,
      "quantity": 1,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "created_by": "user-uuid",
      "product": {
        "id": "uuid",
        "name": "Finished Product",
        "sku": "FINISHED-001"
      },
      "bom_lines": [
        {
          "id": "uuid",
          "bom_id": "uuid",
          "component_id": "uuid",
          "quantity_needed": 2,
          "created_at": "2025-01-01T00:00:00Z",
          "component": {
            "id": "uuid",
            "name": "Component",
            "sku": "COMP-001",
            "unit_of_measure": "piece"
          }
        }
      ]
    }
  ]
}
```

#### POST `/api/boms`
Creates a new BOM with components (transactional operation).

**Request Body:**
```json
{
  "product_id": "uuid",
  "version": "1.0",
  "is_active": true,
  "quantity": 1,
  "items": [
    {
      "product_id": "component-uuid-1",
      "quantity": 2
    },
    {
      "product_id": "component-uuid-2",
      "quantity": 1
    }
  ]
}
```

The function performs the following operations atomically:
1. Creates a new BOM record
2. Creates BOM line records for each component
3. If any step fails, rolls back the entire transaction

#### GET `/api/boms/[id]`
Fetches a single BOM with all details.

#### PUT `/api/boms/[id]`
Updates basic BOM fields (version, is_active, quantity).

#### DELETE `/api/boms/[id]`
Deletes a BOM and all its components.

## Client-Side API Functions

### Product Functions

```typescript
import { productApi } from '@/lib/api';

// Get all products
const { products } = await productApi.getProducts();

// Create a product
const { product } = await productApi.createProduct({
  name: 'Steel Bolt',
  sku: 'BOLT-001',
  // ... other fields
});

// Update a product
const { product } = await productApi.updateProduct('product-id', {
  current_stock: 95,
  selling_price: 12.00
});

// Delete a product
const { message } = await productApi.deleteProduct('product-id');
```

### BOM Functions

```typescript
import { bomApi, CreateBomRequest } from '@/lib/api';

// Get all BOMs
const { boms } = await bomApi.getBoms();

// Create a BOM
const bomData: CreateBomRequest = {
  product_id: 'finished-product-id',
  version: '1.0',
  is_active: true,
  quantity: 1,
  items: [
    { product_id: 'component-1-id', quantity: 2 },
    { product_id: 'component-2-id', quantity: 1 }
  ]
};
const { bom } = await bomApi.createBom(bomData);

// Get a specific BOM
const { bom } = await bomApi.getBom('bom-id');

// Update a BOM
const { bom } = await bomApi.updateBom('bom-id', {
  version: '1.1',
  is_active: false
});

// Delete a BOM
const { message } = await bomApi.deleteBom('bom-id');
```

## Error Handling

All API functions include comprehensive error handling:

- **Authentication errors** (401): User not authenticated
- **Validation errors** (400): Missing or invalid data
- **Not found errors** (404): Resource doesn't exist
- **Conflict errors** (409): Unique constraint violations or foreign key dependencies
- **Server errors** (500): Database or unexpected errors

Example error response:
```json
{
  "error": "Missing required field: name"
}
```

## Security Features

- **Authentication**: All write operations require authenticated users
- **Authorization**: Uses Supabase Row Level Security (RLS)
- **Data Validation**: Server-side validation of all input data
- **SQL Injection Protection**: Parameterized queries via Supabase
- **Transaction Support**: Atomic operations for complex data creation

## Database Schema Assumptions

The API functions assume the following database structure:

### `products` table:
- `id` (UUID, primary key)
- `name` (text, required)
- `sku` (text, unique, required)
- `description` (text, optional)
- `unit_of_measure` (text, required)
- `cost_price` (numeric, required)
- `selling_price` (numeric, optional)
- `current_stock` (numeric, default 0)
- `minimum_stock` (numeric, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (UUID, foreign key to users)

### `boms` table:
- `id` (UUID, primary key)
- `product_id` (UUID, foreign key to products)
- `version` (text, default '1.0')
- `is_active` (boolean, default true)
- `quantity` (numeric, default 1)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (UUID, foreign key to users)

### `bom_lines` table:
- `id` (UUID, primary key)
- `bom_id` (UUID, foreign key to boms)
- `component_id` (UUID, foreign key to products)
- `quantity_needed` (numeric, required)
- `created_at` (timestamp)

## Usage Examples

See `/lib/api/examples.ts` for complete usage examples including:
- Creating products and BOMs
- Complete workflow demonstrations
- Error handling patterns