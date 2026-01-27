// app/user/page.jsx
// app/user/page.jsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardOverview from '@/components/user/DashboardOverview'

export default async function UserPage() {
  const session = await auth()
  
  // ✅ Only redirect if NOT authenticated
  if (!session) {
    redirect('/sign-in?role=user')
  }
  
  // ✅ Don't redirect if authenticated - just render
  return <DashboardOverview />
}