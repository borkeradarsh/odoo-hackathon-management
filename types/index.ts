// Database enums
export type AppRole = 'admin' | 'operator'
export type ManufacturingOrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type StockMovementType = 'in' | 'out' | 'internal'

// User Profile
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  app_role: AppRole
  created_at: string
  updated_at: string
}

// Product
export interface Product {
  id: number
  name: string
  type: 'Raw Material' | 'Finished Good'
  stock_on_hand: number
  created_at: string
  min_stock_level: number
}

// Bill of Materials (BOM)
export interface BOM {
  id: string
  product_id: string
  created_at: string
  // Relations
  product?: Product
  bom_items?: BOMLine[]
}

// BOM Line (Components needed for a product)
export interface BOMLine {
  id: string
  bom_id: string
  product_id: string // CORRECTED: from component_id to product_id
  quantity: number // CORRECTED: from quantity_needed to quantity
  // Relations
  bom?: BOM
  component?: Product
}

// Manufacturing Order
export interface ManufacturingOrder {
  id: number
  product_id: number
  bom_id: number
  quantity_to_produce: number
  status: ManufacturingOrderStatus
  created_at: string
  // Relations
  product?: Product
  bom?: BOM
  work_orders?: WorkOrder[]
}

// Work Order (Individual tasks within a Manufacturing Order)
export interface WorkOrder {
  id: number
  mo_id: number
  name: string
  status: WorkOrderStatus
  quantity_required?: number
  created_at: string
  // Relations
  manufacturing_order?: ManufacturingOrder
}

// Stock Ledger (Audit trail for inventory changes)
export interface StockLedger {
  id: string
  product_id: string
  movement_type: StockMovementType
  quantity_changed: number
  quantity_before: number
  quantity_after: number
  reference_type: string | null // 'manufacturing_order', 'manual_adjustment', etc.
  reference_id: string | null
  notes: string | null
  created_at: string
  created_by: string
  // Relations
  product?: Product
  creator?: UserProfile
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Form types for creating/updating entities
export interface CreateProductForm {
  name: string
  sku: string
  description?: string
  cost_price: number
  selling_price?: number
  current_stock: number
  minimum_stock: number
}

export interface CreateBOMForm {
  product_id: string
  version: string
  quantity: number
  bom_items: CreateBOMLineForm[]
}

export interface CreateBOMLineForm {
  product_id: string // CORRECTED: from component_id to product_id  
  quantity: number // CORRECTED: from quantity_needed to quantity
}

export interface CreateManufacturingOrderForm {
  product_id: string
  bom_id: string
  quantity_to_produce: number
  scheduled_start_date?: string
  scheduled_end_date?: string
  notes?: string
}

export interface CreateWorkOrderForm {
  name: string
  description?: string
  sequence: number
  estimated_duration_minutes?: number
  assigned_to?: string
}

// Dashboard statistics
export interface DashboardStats {
  total_products: number
  total_active_boms: number
  active_manufacturing_orders: number
  pending_work_orders: number
  low_stock_products: number
  completed_orders_this_month: number
}

// Supabase generated types (to be replaced with actual generated types)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      boms: {
        Row: BOM
        Insert: Omit<BOM, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BOM, 'id' | 'created_at' | 'updated_at'>>
      }
      bom_items: {
        Row: BOMLine
        Insert: Omit<BOMLine, 'id'>
        Update: Partial<Omit<BOMLine, 'id'>>
      }
      manufacturing_orders: {
        Row: ManufacturingOrder
        Insert: Omit<ManufacturingOrder, 'id' | 'created_at' | 'updated_at' | 'quantity_produced'>
        Update: Partial<Omit<ManufacturingOrder, 'id' | 'created_at' | 'updated_at'>>
      }
      work_orders: {
        Row: WorkOrder
        Insert: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>>
      }
      stock_ledger: {
        Row: StockLedger
        Insert: Omit<StockLedger, 'id' | 'created_at'>
        Update: never // Stock ledger entries should not be updated
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: AppRole
      manufacturing_order_status: ManufacturingOrderStatus
      work_order_status: WorkOrderStatus
      stock_movement_type: StockMovementType
    }
  }
}