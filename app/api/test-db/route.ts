import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServer();
    
    // Test database connection and table structure
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database test failed:', error);
      return NextResponse.json({
        status: 'error',
        message: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }
    
    // Try to get table schema info
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'products')
      .eq('table_schema', 'public');
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      sampleData: data,
      schema: schemaData,
      schemaError: schemaError?.message
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}