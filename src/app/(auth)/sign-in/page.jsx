import { cookies } from 'next/headers'
import SignInClient from './SignInClient'

export default async function SignInPage() {
  // Get CSRF token from cookies on the server
  const cookieStore = await cookies()
  const csrfToken = cookieStore.get('authjs.csrf-token')?.value ?? ''
  
  return <SignInClient csrfToken={csrfToken} />
}
