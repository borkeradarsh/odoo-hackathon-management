-- Create Manufacturing Order Function
-- This function creates a manufacturing order and automatically generates work orders
-- for all components in the BOM

CREATE OR REPLACE FUNCTION public.create_manufacturing_order(
  product_id_to_create INT,
  quantity_to_produce INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  selected_bom_id INT;
  new_mo_id INT;
  bom_item RECORD;
  product_name_var TEXT;
  work_orders_count INT := 0;
  result JSON;
BEGIN
  -- Find the BOM for the product
  SELECT id INTO selected_bom_id 
  FROM public.boms 
  WHERE product_id = product_id_to_create 
    AND is_active = true 
  LIMIT 1;
  
  -- Check if BOM exists
  IF selected_bom_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active BOM found for product ID ' || product_id_to_create,
      'error_code', 'NO_BOM_FOUND'
    );
  END IF;

  -- Create the manufacturing order
  INSERT INTO public.manufacturing_orders (
    product_id, 
    bom_id, 
    quantity_to_produce, 
    status,
    created_at
  )
  VALUES (
    product_id_to_create, 
    selected_bom_id, 
    quantity_to_produce, 
    'draft',
    NOW()
  )
  RETURNING id INTO new_mo_id;

  -- Create work orders for each component in the BOM
  FOR bom_item IN 
    SELECT bi.product_id, bi.quantity 
    FROM public.bom_items bi 
    WHERE bi.bom_id = selected_bom_id 
  LOOP
    -- Get the product name for the work order
    SELECT name INTO product_name_var 
    FROM public.products 
    WHERE id = bom_item.product_id;
    
    -- Create work order for this component
    INSERT INTO public.work_orders (
      mo_id, 
      name, 
      status,
      quantity_required,
      created_at
    )
    VALUES (
      new_mo_id, 
      'Process ' || product_name_var, 
      'pending',
      bom_item.quantity * quantity_to_produce,
      NOW()
    );
    
    work_orders_count := work_orders_count + 1;
  END LOOP;
  
  -- Build and return success response
  RETURN json_build_object(
    'success', true,
    'mo_id', new_mo_id,
    'product_id', product_id_to_create,
    'bom_id', selected_bom_id,
    'quantity_to_produce', quantity_to_produce,
    'work_orders_created', work_orders_count,
    'status', 'draft',
    'created_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', 'DATABASE_ERROR'
    );
END;
$$;