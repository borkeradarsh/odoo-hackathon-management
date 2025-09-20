import { BOM } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_SITE_URL || ''
  : 'http://localhost:3000';

// BOM Data Types for API
export interface CreateBomRequest {
  name: string;
  product_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface BomWithRelations extends Omit<BOM, 'product' | 'bom_items'> {
  product: {
    id: string;
    name: string;
  };
  bom_items: Array<{
    id: string;
    bom_id: string;
    product_id: string; // CORRECTED: from component_id to product_id
    quantity: number; // CORRECTED: from quantity_needed to quantity
    component: {
      id: string;
      name: string;
    };
  }>;
}

// BOM API Functions
export const bomApi = {
  // Get all BOMs with product and component information
  async getBoms(): Promise<{ boms: BomWithRelations[] }> {
    const response = await fetch(`${API_BASE_URL}/api/boms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch BOMs');
    }

    return response.json();
  },

  // Get a single BOM with all details
  async getBom(bomId: string): Promise<{ bom: BomWithRelations }> {
    const response = await fetch(`${API_BASE_URL}/api/boms/${bomId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch BOM');
    }

    return response.json();
  },

  // Create a new BOM with components (transactional)
  async createBom(bomData: CreateBomRequest): Promise<{ bom: BomWithRelations }> {
    const response = await fetch(`${API_BASE_URL}/api/boms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bomData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create BOM');
    }

    return response.json();
  },

  // Update a BOM (basic fields only)
  async updateBom(bomId: string, bomData: { version?: string }): Promise<{ bom: BomWithRelations }> {
    const response = await fetch(`${API_BASE_URL}/api/boms/${bomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bomData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update BOM');
    }

    return response.json();
  },

  // Delete a BOM and all its components
  async deleteBom(bomId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/boms/${bomId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete BOM');
    }

    return response.json();
  },
};