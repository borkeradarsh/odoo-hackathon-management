'use server';

import { createServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const supabase = await createServer();
  
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Server logout error:', error);
      throw error;
    }
    
    console.log('Server logout successful');
  } catch (error) {
    console.error('Error during server logout:', error);
    // Continue with redirect even if there's an error
  }
  
  // Redirect to login page
  redirect('/auth/login');
}