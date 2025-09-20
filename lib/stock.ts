import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getProductsWithStock() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, type, stock_on_hand, min_stock_level")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}
