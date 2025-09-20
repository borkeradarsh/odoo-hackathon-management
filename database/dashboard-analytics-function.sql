-- Dashboard Analytics Database Function
-- This function should be created in your Supabase SQL Editor
-- It uses Common Table Expressions (CTEs) for optimal performance

CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH kpi_counts AS (
    SELECT
      (SELECT COUNT(*) FROM public.products) AS total_products,
      (SELECT COUNT(*) FROM public.boms WHERE is_active = true) AS active_boms,
      (SELECT COUNT(*) FROM public.manufacturing_orders WHERE status = 'in_progress') AS in_progress_mos,
      (SELECT COUNT(*) FROM public.work_orders WHERE status = 'pending') AS pending_wos,
      (SELECT COUNT(*) FROM public.products WHERE current_stock < minimum_stock) AS low_stock_items,
      (SELECT COUNT(*) FROM public.manufacturing_orders 
       WHERE status = 'completed' 
       AND actual_end_date >= date_trunc('month', NOW())) AS completed_this_month
  ),
  recent_mos AS (
    SELECT
      mo.id,
      p.name as product_name,
      mo.quantity_to_produce,
      mo.status
    FROM public.manufacturing_orders mo
    JOIN public.products p ON mo.product_id = p.id
    ORDER BY mo.created_at DESC
    LIMIT 3
  ),
  stock_alerts_data AS (
    SELECT
      p.id,
      p.name,
      p.current_stock as stock_on_hand,
      p.minimum_stock as min_stock_level
    FROM public.products p
    WHERE p.current_stock < p.minimum_stock
    ORDER BY (p.current_stock::decimal / NULLIF(p.minimum_stock, 0)) ASC -- Show most critical first
    LIMIT 3
  )
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpi_counts) FROM kpi_counts),
    'recentOrders', (SELECT json_agg(row_to_json(recent_mos)) FROM recent_mos),
    'stockAlerts', (SELECT json_agg(row_to_json(stock_alerts_data)) FROM stock_alerts_data)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_analytics() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_dashboard_analytics() IS 'Returns comprehensive dashboard analytics including KPIs, recent orders, and stock alerts using optimized CTEs';