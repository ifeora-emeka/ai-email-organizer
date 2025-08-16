import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';

export interface GmailAccount
{
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    lastSync: Date;
    createdAt: Date;
    updatedAt: Date;
}

export function useGmailAccounts()
{
    return useQuery<GmailAccount[]>({
        queryKey: queryKeys.gmail.accounts,
        //@ts-ignore
        queryFn: async () =>
        {
            const response = await api.get<{ data: GmailAccount[]; }>('/gmail-accounts');
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useStartPolling()
{
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (gmailAccountId: string) =>
        {
            const response = await api.post(`/gmail-accounts/${gmailAccountId}/polling/start`);
            return response.data;
        },
        onSuccess: (data, gmailAccountId) =>
        {
            toast.success(`Started polling for Gmail account`);
            queryClient.invalidateQueries({ queryKey: queryKeys.gmail.accounts });
        },
        onError: (error: any) =>
        {
            toast.error(error.response?.data?.error || 'Failed to start polling');
        },
    });
}

export function useStopPolling()
{
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (gmailAccountId: string) =>
        {
            const response = await api.post(`/gmail-accounts/${gmailAccountId}/polling/stop`);
            return response.data;
        },
        onSuccess: (data, gmailAccountId) =>
        {
            toast.success(`Stopped polling for Gmail account`);
            queryClient.invalidateQueries({ queryKey: queryKeys.gmail.accounts });
        },
        onError: (error: any) =>
        {
            toast.error(error.response?.data?.error || 'Failed to stop polling');
        },
    });
}

export function useManualPoll()
{
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (gmailAccountId: string) =>
        {
            const response = await api.post(`/gmail-accounts/${gmailAccountId}/polling/manual`);
            return response.data;
        },
        onSuccess: (data, gmailAccountId) =>
        {
            toast.success(`Manual poll completed: ${data.data.processed} emails processed`);
            queryClient.invalidateQueries({ queryKey: queryKeys.emails.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.gmail.accounts });
        },
        onError: (error: any) =>
        {
            toast.error(error.response?.data?.error || 'Failed to perform manual poll');
        },
    });
}
