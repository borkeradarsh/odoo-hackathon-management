import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getMyWorkOrders(operatorId: number) {
  // Fetch all work orders for the logged-in operator
  const { data, error } = await supabase
    .from("work_orders")
    .select("*, manufacturing_orders(product_id, quantity_to_produce), products(name)")
    .eq("operator_id", operatorId)
    .order("status", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}
