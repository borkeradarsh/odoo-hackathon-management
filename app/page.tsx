import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to login page - the auth system will handle redirecting to dashboard if already authenticated
  redirect('/login')
}