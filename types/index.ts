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
  id: string
  name: string
  sku: string
  description: string | null
  unit_of_measure: string
  cost_price: number
  selling_price: number | null
  current_stock: number
  minimum_stock: number
  created_at: string
  updated_at: string
  created_by: string
}

// Bill of Materials (BOM)
export interface BOM {
  id: string
  product_id: string
  version: string
  is_active: boolean
  quantity: number
  created_at: string
  updated_at: string
  created_by: string
  // Relations
  product?: Product
  bom_lines?: BOMLine[]
}

// BOM Line (Components needed for a product)
export interface BOMLine {
  id: string
  bom_id: string
  component_id: string
  quantity_needed: number
  created_at: string
  // Relations
  bom?: BOM
  component?: Product
}

// Manufacturing Order
export interface ManufacturingOrder {
  id: string
  product_id: string
  bom_id: string
  quantity_to_produce: number
  quantity_produced: number
  status: ManufacturingOrderStatus
  scheduled_start_date: string | null
  actual_start_date: string | null
  scheduled_end_date: string | null
  actual_end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  // Relations
  product?: Product
  bom?: BOM
  work_orders?: WorkOrder[]
  creator?: UserProfile
}

// Work Order (Individual tasks within a Manufacturing Order)
export interface WorkOrder {
  id: string
  manufacturing_order_id: string
  sequence: number
  name: string
  description: string | null
  status: WorkOrderStatus
  estimated_duration_minutes: number | null
  actual_duration_minutes: number | null
  assigned_to: string | null
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relations
  manufacturing_order?: ManufacturingOrder
  assigned_user?: UserProfile
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
  unit_of_measure: string
  cost_price: number
  selling_price?: number
  current_stock: number
  minimum_stock: number
}

export interface CreateBOMForm {
  product_id: string
  version: string
  quantity: number
  bom_lines: CreateBOMLineForm[]
}

export interface CreateBOMLineForm {
  component_id: string
  quantity_needed: number
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
      bom_lines: {
        Row: BOMLine
        Insert: Omit<BOMLine, 'id' | 'created_at'>
        Update: Partial<Omit<BOMLine, 'id' | 'created_at'>>
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