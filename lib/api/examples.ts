/**
 * API Testing Examples
 * 
 * This file demonstrates how to use the Product and BOM API functions.
 * These examples can be used in your frontend compo      // 3. Create BOM for the assembly
      const bom = await bomApi.createBom({
        product_id: assembly.product.id.toString(),
        version: '1.0',
        is_active: true,
        quantity: 1,
        items: [
          {
            product_id: bolt.product.id.toString(),
            quantity: 1,
          },
          {
            product_id: washer.product.id.toString(),
            quantity: 2,
          }
        ]
      });ing.
 */

import { productApi, bomApi, CreateBomRequest } from '@/lib/api';

// Example usage of Product API functions
export const productExamples = {
  // Fetch all products
  async getAllProducts() {
    try {
      const { products } = await productApi.getProducts();
      console.log('All products:', products);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Create a new product
  async createNewProduct() {
    try {
      const productData = {
        name: 'Steel Bolt M8x20',
        type: 'Raw Material' as const,
        stock_on_hand: 1000,
        min_stock_level: 100,
      };

      const { product } = await productApi.createProduct(productData);
      console.log('Created product:', product);
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update an existing product
  async updateExistingProduct(productId: string) {
    try {
      const updateData = {
        stock_on_hand: 950,
        min_stock_level: 150,
      };

      const { product } = await productApi.updateProduct(productId, updateData);
      console.log('Updated product:', product);
      return product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },
};

// Example usage of BOM API functions
export const bomExamples = {
  // Fetch all BOMs
  async getAllBoms() {
    try {
      const { boms } = await bomApi.getBoms();
      console.log('All BOMs:', boms);
      return boms;
    } catch (error) {
      console.error('Error fetching BOMs:', error);
      throw error;
    }
  },

  // Create a new BOM with components
  async createNewBom(productId: string, componentIds: string[]) {
    try {
      const bomData: CreateBomRequest = {
        name: 'BOM for Product Assembly', // Example name
        product_id: productId,
        items: [
          {
            product_id: componentIds[0],
            quantity: 4, // 4 bolts needed
          },
          {
            product_id: componentIds[1],
            quantity: 2, // 2 washers needed
          },
        ],
      };

      const { bom } = await bomApi.createBom(bomData);
      console.log('Created BOM:', bom);
      return bom;
    } catch (error) {
      console.error('Error creating BOM:', error);
      throw error;
    }
  },

  // Fetch a specific BOM
  async getBomDetails(bomId: string) {
    try {
      const { bom } = await bomApi.getBom(bomId);
      console.log('BOM details:', bom);
      return bom;
    } catch (error) {
      console.error('Error fetching BOM:', error);
      throw error;
    }
  },

  // Update a BOM
  async updateExistingBom(bomId: string) {
    try {
      const updateData = {
        version: '1.1',
        is_active: true,
      };

      const { bom } = await bomApi.updateBom(bomId, updateData);
      console.log('Updated BOM:', bom);
      return bom;
    } catch (error) {
      console.error('Error updating BOM:', error);
      throw error;
    }
  },
};

// Example of a complete workflow
export const workflowExample = {
  async createCompleteProductWithBom() {
    try {
      // 1. Create raw materials (components)
      const bolt = await productApi.createProduct({
        name: 'Steel Bolt M8x20',
        type: 'Raw Material' as const,
        stock_on_hand: 1000,
        min_stock_level: 100,
      });

      const washer = await productApi.createProduct({
        name: 'Steel Washer M8',
        type: 'Raw Material' as const,
        stock_on_hand: 2000,
        min_stock_level: 200,
      });

      // 2. Create finished product
      const assembly = await productApi.createProduct({
        name: 'Bolt Assembly M8',
        type: 'Finished Good' as const,
        stock_on_hand: 0,
        min_stock_level: 50,
      });

      // 3. Create BOM for the assembly
      const bom = await bomApi.createBom({
        name: assembly.product.name, // Use the assembly product name as BOM name
        product_id: assembly.product.id.toString(),
        items: [
          {
            product_id: bolt.product.id.toString(),
            quantity: 1,
          },
          {
            product_id: washer.product.id.toString(),
            quantity: 2,
          },
        ],
      });

      console.log('Complete workflow created:', {
        components: [bolt.product, washer.product],
        finishedProduct: assembly.product,
        bom: bom.bom,
      });

      return {
        components: [bolt.product, washer.product],
        finishedProduct: assembly.product,
        bom: bom.bom,
      };
    } catch (error) {
      console.error('Error in workflow:', error);
      throw error;
    }
  },
};