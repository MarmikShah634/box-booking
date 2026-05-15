import { redirect } from 'next/navigation'

// /owner redirects to the dashboard group page
export default function OwnerPage() {
  redirect('/owner/dashboard')
}
