import { Product } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_SITE_URL || ''
  : 'http://localhost:3000';

// Product API Functions
export const productApi = {
  // Get all products
  async getProducts(): Promise<{ products: Product[] }> {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch products');
    }

    return response.json();
  },

  // Create a new product
  async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<{ product: Product }> {
    // Create a clean copy of the data to avoid circular references
    const cleanData = {
      name: productData.name,
      type: productData.type,
      stock_on_hand: Number(productData.stock_on_hand),
      min_stock_level: Number(productData.min_stock_level),
    };
    
    console.log('API: Sending clean data:', cleanData);
    
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }

    return response.json();
  },

  // Update a product
  async updateProduct(productId: string, productData: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<{ product: Product }> {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }

    return response.json();
  },

  // Delete a product
  async deleteProduct(productId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }

    return response.json();
  },
};