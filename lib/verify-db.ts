// Database verification script
import { createServer } from '@/lib/supabase/server';

export async function verifyProductsTable() {
  try {
    const supabase = await createServer();
    
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Table check failed:', error);
      return { exists: false, error: error.message };
    }
    
    console.log('Products table exists and is accessible');
    return { exists: true, sampleData: data };
  } catch (error) {
    console.error('Verification failed:', error);
    return { exists: false, error: 'Connection failed' };
  }
}