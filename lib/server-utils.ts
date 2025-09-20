import { cookies } from "next/headers";

// Returns the user ID from session/cookies (for API authentication)
export async function getUserIdFromSession() {
  // Example: using Supabase auth
  // You may need to adjust this for your auth setup
  const cookieStore = await cookies();
  const supabaseAccessToken = cookieStore.get('sb-access-token')?.value;
  if (!supabaseAccessToken) return null;
  // Decode JWT to get user ID (sub)
  const payload = JSON.parse(Buffer.from(supabaseAccessToken.split('.')[1], 'base64').toString());
  return payload.sub || null;
}
