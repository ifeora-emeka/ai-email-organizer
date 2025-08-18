import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from '../query-keys';
import { useMutationWithToast } from './use-mutation-with-toast';
import { toast } from 'sonner';

export const useUnsubscribe = () =>
{
    const queryClient = useQueryClient();

    const unsubscribeMutation = useMutationWithToast({
        mutationFn: ({ emailId }: { emailId: string; }) =>
            api.post(`/emails/${emailId}/unsubscribe`),
        onSuccess: () =>
        {
            toast.success('Unsubscribed from email', {
                duration: 5000,
                position: 'top-right',
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.emails.all });
        },
        onError: (error) =>
        {
            console.error('Failed to unsubscribe from email:', error);
            toast.error('Failed to unsubscribe from email', {
                description: error instanceof Error ? error.message : 'Unknown error',
                duration: 5000,
                position: 'top-right',
            });
        },
    });

    const bulkUnsubscribeMutation = useMutationWithToast({
        mutationFn: ({ emailIds }: { emailIds: string[]; }) =>
            api.post('/emails/bulk-unsubscribe', { emailIds }),
        onSuccess: (response) =>
        {
            const data = response?.data as any;
            console.log('Bulk unsubscribe response:', data);

            if (!data) {
                toast.error('Invalid response from bulk unsubscribe operation', {
                    duration: 5000,
                    position: 'top-right',
                });
                return;
            }

            const { success = 0, failed = 0, results = [], message } = data;

            if (success > 0 && failed === 0) {
                toast.success(`Successfully unsubscribed from ${success} email${success > 1 ? 's' : ''}`, {
                    duration: 5000,
                    position: 'top-right',
                });
            } else if (success > 0 && failed > 0) {
                toast.success(`Unsubscribed from ${success} email${success > 1 ? 's' : ''}`, {
                    description: `${failed} email${failed > 1 ? 's' : ''} failed to unsubscribe`,
                    duration: 7000,
                    position: 'top-right',
                });
            } else if (success === 0 && failed > 0) {
                const failureReasons = results
                    ?.filter((result: any) => !result.success)
                    ?.map((result: any) => result.message || 'Unknown error')
                    ?.slice(0, 3); // Show first 3 reasons

                const description = failureReasons?.length
                    ? `Reasons: ${failureReasons.join(', ')}${failureReasons.length < failed ? '...' : ''}`
                    : 'No unsubscribe links found or other errors occurred';

                toast.success(`Unsubscribed from ${failed} email${failed > 1 ? 's' : ''}`, {
                    description,
                    duration: 8000,
                    position: 'top-right',
                });
            } else {
                // Fallback
                toast.info(message || 'Bulk unsubscribe operation completed', {
                    duration: 5000,
                    position: 'top-right',
                });
            }

            queryClient.invalidateQueries({ queryKey: queryKeys.emails.all });
        },
        onError: (error) =>
        {
            console.error('Failed to unsubscribe from emails:', error);
            toast.error('Failed to unsubscribe from emails', {
                description: error instanceof Error ? error.message : 'Unknown error',
                duration: 5000,
                position: 'top-right',
            });
        },
    });

    const retryFailedMutation = useMutationWithToast({
        mutationFn: () => api.post('/emails/retry-failed-unsubscribes'),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: queryKeys.emails.all });
        },
    });

    return {
        unsubscribe: unsubscribeMutation,
        bulkUnsubscribe: bulkUnsubscribeMutation,
        retryFailed: retryFailedMutation,
    };
};

export const useUnsubscribeStatus = (emailId: string) =>
{
    return useQuery({
        queryKey: [ 'unsubscribe-status', emailId ],
        queryFn: () => api.get(`/emails/${emailId}/unsubscribe-status`).then(res => res.data),
        enabled: !!emailId,
    });
};
