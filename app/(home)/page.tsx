'use client'

import React from 'react'
import HomePage from './home-page'
import { AppContextProvider } from '@/context/AppContext'
import AppLayout from '@/components/layout/AppLayout'
import { useAppDependencies } from '@/lib/hooks/use-auth'

export default function Page() {
  const { data: dependencies, isLoading, error } = useAppDependencies()

  if (error && !dependencies) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Failed to load app data</h1>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  const initialData = dependencies ? {
    user: dependencies.user,
    categories: dependencies.categories,
    gmailAccounts: dependencies.gmailAccounts.map(account => ({
      ...account,
      name: account.name || account.email,
      lastSync: new Date(account.lastSync)
    })),
    activeCategory: null,
    activeCategoryId: null
  } : undefined

  return (
    <AppContextProvider initialData={initialData}>
      <AppLayout isLoading={isLoading}>
        <HomePage />
      </AppLayout>
    </AppContextProvider>
  )
}
