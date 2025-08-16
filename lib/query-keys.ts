export const queryKeys = {
  auth: {
    session: [ 'auth', 'session' ] as const,
    profile: [ 'auth', 'profile' ] as const,
    dependencies: [ 'auth', 'dependencies' ] as const,
  },
  categories: {
    all: [ 'categories' ] as const,
    list: (filters?: any) => [ 'categories', 'list', filters ] as const,
    detail: (id: string) => [ 'categories', 'detail', id ] as const,
    emails: (id: string, filters?: any) => [ 'categories', id, 'emails', filters ] as const,
  },
  emails: {
    all: [ 'emails' ] as const,
    list: (filters?: any) => [ 'emails', 'list', filters ] as const,
    detail: (id: string) => [ 'emails', 'detail', id ] as const,
    byCategory: (categoryId: string, filters?: any) => [ 'emails', 'category', categoryId, filters ] as const,
  },
  gmail: {
    accounts: [ 'gmail', 'accounts' ] as const,
    account: (id: string) => [ 'gmail', 'account', id ] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
