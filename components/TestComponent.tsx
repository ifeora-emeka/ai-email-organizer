'use client'

import { useSession } from 'next-auth/react'
import { useCategories } from '@/lib/hooks'

export default function TestComponent() {
  const { data: session } = useSession()
  const { data: categories, isLoading } = useCategories()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Test Component</h1>
      <p>Session: {session?.user?.email}</p>
      <p>Access Token: {session?.accessToken ? 'Present' : 'Missing'}</p>
      <p>Categories: {categories?.length || 0}</p>
    </div>
  )
}
