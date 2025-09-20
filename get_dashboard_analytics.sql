-- in get_dashboard_analytics.sql
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    WITH kpi_counts AS (
      -- This part remains the same, but will now be much faster due to the indexes
      SELECT
        (SELECT COUNT(*) FROM public.products) AS total_products,
        (SELECT COUNT(*) FROM public.boms) AS active_boms,
        (SELECT COUNT(*) FROM public.manufacturing_orders WHERE status = 'In Progress') AS in_progress_mos,
        (SELECT COUNT(*) FROM public.work_orders WHERE status = 'Pending') AS pending_wos,
        (SELECT COUNT(*) FROM public.products WHERE stock_on_hand < min_stock_level) AS low_stock_items,
        (SELECT COUNT(*) FROM public.manufacturing_orders WHERE status = 'Done' AND completed_at >= date_trunc('month', NOW())) AS completed_this_month
    ),
    recent_mos AS (
      SELECT mo.id, p.name as product_name, mo.quantity_to_produce, mo.status
      FROM public.manufacturing_orders mo JOIN public.products p ON mo.product_id = p.id
      ORDER BY mo.created_at DESC LIMIT 3
    ),
    stock_alerts_data AS (
      SELECT p.id, p.name, p.stock_on_hand, p.min_stock_level
      FROM public.products p WHERE p.stock_on_hand < p.min_stock_level
      ORDER BY (p.stock_on_hand::decimal / p.min_stock_level) ASC LIMIT 3
    )
    SELECT
      json_build_object(
        'kpis', (SELECT row_to_json(kpi_counts) FROM kpi_counts),
        'recentOrders', (SELECT COALESCE(json_agg(row_to_json(recent_mos)), '[]'::json) FROM recent_mos),
        'stockAlerts', (SELECT COALESCE(json_agg(row_to_json(stock_alerts_data)), '[]'::json) FROM stock_alerts_data)
      )
  );
END;
$$;