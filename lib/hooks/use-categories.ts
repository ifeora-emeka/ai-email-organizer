import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export interface Category {
  id: string
  name: string
  description: string
  color: string
  userId: string
  emailCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryData {
  name: string
  description: string
  color: string
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  color?: string
}

export function useCategories() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      const response = await api.get<Category[]>('/categories')
      return response.data.data
    },
    enabled: !!session?.user,
  })
}

export function useCategory(id: string) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: async () => {
      const response = await api.get<Category>(`/categories/${id}`)
      return response.data.data
    },
    enabled: !!session?.user && !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      const response = await api.post<Category>('/categories', data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      toast.success(`Category "${data.name}" created successfully`)
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryData }) => {
      const response = await api.put<Category>(`/categories/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(data.id) })
      toast.success(`Category "${data.name}" updated successfully`)
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) })
      toast.success('Category deleted successfully')
    },
  })
}
