import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createClient();
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Create response that clears cookies
    const response = NextResponse.json({ success: true });
    
    // Clear auth cookies
    response.cookies.delete('sb-auth-token');
    response.cookies.delete('supabase-auth-token');
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}