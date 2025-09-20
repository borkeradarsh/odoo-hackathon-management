-- Enhanced Manufacturing Order Creation Function
-- This function creates a Manufacturing Order and all associated Work Orders in a single transaction
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.create_manufacturing_order(
  product_id_to_create INT,
  quantity_to_produce INT
)
RETURNS JSON -- Returns detailed information about the created MO
LANGUAGE plpgsql
SECURITY DEFINER -- Function runs with elevated privileges
AS $$
DECLARE
  selected_bom_id INT;
  new_mo_id INT;
  bom_item RECORD;
  component_quantity INT;
  work_order_count INT := 0;
  result JSON;
BEGIN
  -- Validate input parameters
  IF product_id_to_create IS NULL OR product_id_to_create <= 0 THEN
    RAISE EXCEPTION 'Invalid product_id_to_create: %', product_id_to_create;
  END IF;
  
  IF quantity_to_produce IS NULL OR quantity_to_produce <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity_to_produce: %', quantity_to_produce;
  END IF;

  -- Check if product exists
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = product_id_to_create) THEN
    RAISE EXCEPTION 'Product with ID % does not exist', product_id_to_create;
  END IF;

  -- Find the active BOM for the product
  SELECT id INTO selected_bom_id 
  FROM public.boms 
  WHERE product_id = product_id_to_create 
    AND is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF selected_bom_id IS NULL THEN
    RAISE EXCEPTION 'No active BOM found for product ID %', product_id_to_create;
  END IF;

  -- Create the Manufacturing Order
  INSERT INTO public.manufacturing_orders (
    product_id, 
    bom_id, 
    quantity_to_produce, 
    status,
    created_at,
    updated_at
  )
  VALUES (
    product_id_to_create, 
    selected_bom_id, 
    quantity_to_produce, 
    'In Progress',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_mo_id;

  -- Create Work Orders for each BOM component
  FOR bom_item IN 
    SELECT 
      bi.product_id as component_id,
      bi.quantity as component_base_quantity,
      p.name as component_name
    FROM public.bom_items bi
    JOIN public.products p ON bi.product_id = p.id
    WHERE bi.bom_id = selected_bom_id
  LOOP
    -- Calculate required quantity based on MO quantity
    component_quantity := bom_item.component_base_quantity * quantity_to_produce;
    
    -- Insert Work Order for this component
    INSERT INTO public.work_orders (
      mo_id, 
      product_id,
      name, 
      required_quantity,
      status,
      created_at,
      updated_at
    )
    VALUES (
      new_mo_id, 
      bom_item.component_id,
      'Process ' || bom_item.component_name,
      component_quantity,
      'Pending',
      NOW(),
      NOW()
    );
    
    work_order_count := work_order_count + 1;
  END LOOP;

  -- Return comprehensive result
  SELECT json_build_object(
    'success', true,
    'mo_id', new_mo_id,
    'product_id', product_id_to_create,
    'bom_id', selected_bom_id,
    'quantity_to_produce', quantity_to_produce,
    'work_orders_created', work_order_count,
    'status', 'In Progress',
    'created_at', NOW()
  ) INTO result;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_manufacturing_order(INT, INT) TO authenticated;

-- Example usage:
-- SELECT public.create_manufacturing_order(1, 10);