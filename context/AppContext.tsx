'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Category as ApiCategory, GmailAccount as ApiGmailAccount } from '@/lib/hooks/use-auth'

interface AppState {
  user?: {
    id: string
    email: string
    name?: string
    image?: string
  }
  categories: ApiCategory[]
  activeCategory: string | null
  activeCategoryId: string | null
  gmailAccounts: ApiGmailAccount[]
}

interface AppContextType {
  state: AppState
  updateState: (partialState: Partial<AppState>) => void
  setActiveCategory: (category: string | null, categoryId?: string | null) => void
  activeCategory: string | null
  activeCategoryId: string | null
  categories: ApiCategory[]
  gmailAccounts: ApiGmailAccount[]
}

const defaultState: AppState = {
  categories: [],
  activeCategory: null,
  activeCategoryId: null,
  gmailAccounts: []
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppContextProviderProps {
  children: ReactNode
  initialData?: Partial<AppState>
}

export function AppContextProvider({ children, initialData }: AppContextProviderProps) {
  const [state, setState] = useState<AppState>(() => {
    if (initialData) {
      return {
        categories: initialData.categories || [],
        activeCategory: initialData.activeCategory || null,
        activeCategoryId: initialData.activeCategoryId || null,
        gmailAccounts: initialData.gmailAccounts || [],
        user: initialData.user
      }
    }
    return defaultState
  })

  useEffect(() => {
    if (initialData) {
      const newState = {
        categories: initialData.categories || [],
        activeCategory: initialData.activeCategory || null,
        activeCategoryId: initialData.activeCategoryId || null,
        gmailAccounts: initialData.gmailAccounts || [],
        user: initialData.user
      }
      
      if (newState.categories.length > 0 && !newState.activeCategory) {
        const firstCategory = newState.categories[0]
        newState.activeCategory = firstCategory.name
        newState.activeCategoryId = firstCategory.id
      }
      
      setState(newState)
    }
  }, [initialData])

  const updateState = (partialState: Partial<AppState>) => {
    setState(prevState => ({
      ...prevState,
      ...partialState
    }))
  }

  const setActiveCategory = (category: string | null, categoryId?: string | null) => {
    updateState({ 
      activeCategory: category,
      activeCategoryId: categoryId || null
    })
  }

  console.log('APP STATE:::', state)
  console.log('INITIAL DATA IN CONTEXT:::', initialData)

  const value: AppContextType = {
    state,
    updateState,
    setActiveCategory,
    activeCategory: state.activeCategory,
    activeCategoryId: state.activeCategoryId,
    categories: state.categories,
    gmailAccounts: state.gmailAccounts
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider')
  }
  return context
}