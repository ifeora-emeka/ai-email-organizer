import '@testing-library/jest-dom'

jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}))

jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(() => ({
    state: {
      categories: [],
      activeCategory: null,
      activeCategoryId: null,
      gmailAccounts: [],
    },
    updateState: jest.fn(),
    setActiveCategory: jest.fn(),
  })),
}))

jest.mock('@/lib/hooks', () => ({
  useApiMutation: jest.fn(),
  useCategories: jest.fn(),
  useGmailAccounts: jest.fn(),
  useStartPolling: jest.fn(),
}))

jest.mock('@/lib/hooks/use-emails', () => ({
  useEmails: jest.fn(),
  useDeleteEmail: jest.fn(),
  useBulkDeleteEmails: jest.fn(),
  useBulkUpdateEmails: jest.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), 
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
