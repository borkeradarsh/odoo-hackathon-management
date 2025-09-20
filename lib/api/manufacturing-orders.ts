import { ManufacturingOrder } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_SITE_URL || ''
  : 'http://localhost:3000';

export interface CreateManufacturingOrderRequest {
  productId: number;
  quantity: number;
}

export interface CreateManufacturingOrderResponse {
  success: boolean;
  data?: {
    moId: number;
    productId: number;
    bomId: number;
    quantityToProduce: number;
    workOrdersCreated: number;
    status: string;
    createdAt: string;
  };
  error?: string;
  code?: string;
}

export interface GetManufacturingOrdersResponse {
  success: boolean;
  data: ManufacturingOrder[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Manufacturing Order API Functions
export const manufacturingOrderApi = {
  // Get all manufacturing orders
  async getManufacturingOrders(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetManufacturingOrdersResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const response = await fetch(`${API_BASE_URL}/api/manufacturing-orders?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch manufacturing orders');
    }

    return response.json();
  },

  // Create a new manufacturing order
  async createManufacturingOrder(data: CreateManufacturingOrderRequest): Promise<CreateManufacturingOrderResponse> {
    const response = await fetch(`${API_BASE_URL}/api/manufacturing-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create manufacturing order');
    }

    return response.json();
  },

  // Get a specific manufacturing order by ID
  async getManufacturingOrder(id: number): Promise<{ manufacturing_order: ManufacturingOrder }> {
    const response = await fetch(`${API_BASE_URL}/api/manufacturing-orders/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch manufacturing order');
    }

    return response.json();
  },
};