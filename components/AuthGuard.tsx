'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import Login from './Login'
import AppLayout from './layout/AppLayout'
import { Skeleton } from './ui/skeleton'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return <Login />
  }

  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}
