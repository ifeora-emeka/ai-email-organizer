import { useApiQuery, useApiMutation } from './use-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useMutationWithToast } from '@/lib/hooks/use-mutation-with-toast';
import { ApiError } from '@/lib/types';

export interface Email
{
  id: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmails: string[];
  receivedAt: string;
  aiSummary: string;
  body: string;
  hasAttachments: boolean;
  isRead: boolean;
  isArchived: boolean;
  category: string;
  categoryId: string | null;
  aiConfidence: number;
  priority: 'high' | 'medium' | 'low';
  gmailAccount?: {
    id: string;
    email: string;
    name?: string;
  };
  attachments?: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
}

export interface EmailsResponse
{
  data: Email[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmailQuery
{
  categoryId?: string;
  isRead?: boolean;
  isArchived?: boolean;
  search?: string;
  sortBy?: 'receivedAt' | 'subject' | 'fromEmail';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UpdateEmailData
{
  isRead?: boolean;
  isArchived?: boolean;
  categoryId?: string | null;
}

export interface BulkUpdateEmailData
{
  emailIds: string[];
  updates: UpdateEmailData;
}

export interface BulkDeleteEmailData
{
  emailIds: string[];
}

export function useEmails(query: EmailQuery = {}, options: { polling?: boolean; pollingInterval?: number; } = {})
{
  const { polling = true, pollingInterval = 5000 } = options;

  const queryParams = new URLSearchParams();

  Object.entries(query).forEach(([ key, value ]) =>
  {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const url = `/emails${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return useApiQuery<EmailsResponse>({
    url,
    queryKey: [ ...queryKeys.emails.list(query) ],
    // enabled: true,
    refetchInterval: polling ? pollingInterval : false,
    refetchIntervalInBackground: polling,
    staleTime: polling ? 0 : 5 * 60 * 1000,
  });
}

export function useEmailById(emailId: string, enabled = true)
{
  return useApiQuery<Email>({
    url: `/emails/${emailId}`,
    queryKey: [ ...queryKeys.emails.detail(emailId) ],
    enabled: enabled && !!emailId
  });
}

export function useUpdateEmail()
{
  return useApiMutation<Email, ApiError, { id: string; data: UpdateEmailData; }>({
    mutationFn: async ({ id, data }) =>
    {
      const response = await api.put(`/emails/${id}`, data);
      return response.data.data;
    }
  });
}

export function useBulkUpdateEmails()
{
  return useApiMutation<{ updatedCount: number; emailIds: string[]; }, ApiError, BulkUpdateEmailData>({
    mutationFn: async (data) =>
    {
      const response = await api.put('/emails/bulk', data);
      return response.data.data;
    }
  });
}

export function useDeleteEmail()
{
  return useApiMutation<{ id: string; }, ApiError, string>({
    mutationFn: async (emailId) =>
    {
      const response = await api.delete(`/emails/${emailId}`);
      return response.data.data;
    }
  });
}

export function useMarkEmailAsRead()
{
  const updateEmail = useUpdateEmail();

  return useApiMutation<Email, ApiError, { id: string; isRead: boolean; }>({
    mutationFn: async ({ id, isRead }) =>
    {
      return updateEmail.mutateAsync({ id, data: { isRead } });
    }
  });
}

export function useArchiveEmail()
{
  const updateEmail = useUpdateEmail();

  return useApiMutation<Email, ApiError, { id: string; isArchived: boolean; }>({
    mutationFn: async ({ id, isArchived }) =>
    {
      return updateEmail.mutateAsync({ id, data: { isArchived } });
    }
  });
}

export function useCategorizeEmail()
{
  const updateEmail = useUpdateEmail();

  return useApiMutation<Email, ApiError, { id: string; categoryId: string | null; }>({
    mutationFn: async ({ id, categoryId }) =>
    {
      return updateEmail.mutateAsync({ id, data: { categoryId } });
    }
  });
}

export function useBulkDeleteEmails()
{
  return useApiMutation<{ deletedCount: number; emailIds: string[]; }, ApiError, BulkDeleteEmailData>({
    mutationFn: async (data) =>
    {
      const response = await api.deleteWithData('/emails/bulk', data);
      return response.data.data;
    }
  });
}
