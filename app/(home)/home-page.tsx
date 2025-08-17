"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    Paperclip,
    ArrowLeft,
    SparkleIcon,
    Trash2,
    UserX,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import {
    useEmails,
    type Email,
    useBulkUpdateEmails,
    useDeleteEmail,
    useBulkDeleteEmails,
} from "@/lib/hooks/use-emails";
import { useUnsubscribe } from "@/lib/hooks/use-unsubscribe";
import {
    useGmailAccounts,
    useStartPolling,
    type GmailAccount,
} from "@/lib/hooks";
import EmailListSkeleton from "@/components/EmailListSkeleton";
import EachEmail from "@/components/EachEmail";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function HomePage() {
    const { data: session } = useSession();
    const { activeCategory, activeCategoryId } = useAppContext();
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
    const [pollingStarted, setPollingStarted] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);

    const queryClient = useQueryClient();

    const { data: emailsResponse, isLoading: emailsLoading } = useEmails(
        {
            categoryId: activeCategoryId || undefined,
            limit: 50,
            sortBy: "receivedAt",
            sortOrder: "desc",
        },
        {
            polling: true,
            pollingInterval: 10000,
        }
    );

    const { data: gmailAccountsData } = useGmailAccounts();
    const startPolling = useStartPolling();
    const bulkDeleteEmails = useBulkDeleteEmails();
    const { bulkUnsubscribe } = useUnsubscribe();

    const emails = Array.isArray(emailsResponse)
        ? emailsResponse
        : emailsResponse?.data || [];

    const gmailAccounts: GmailAccount[] =
        (gmailAccountsData as GmailAccount[]) || [];

    useEffect(() => {
        if (gmailAccounts.length > 0 && !pollingStarted && session?.user) {
            console.log(
                "Starting polling for connected Gmail accounts:",
                gmailAccounts.length
            );

            gmailAccounts.forEach((account: GmailAccount) => {
                if (account.isActive) {
                    startPolling.mutate(account.id);
                }
            });

            setPollingStarted(true);
        }
    }, [gmailAccounts, pollingStarted, session?.user, startPolling]);

    useEffect(() => {
        console.log(emails);
    }, [emails]);

    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
    };

    const handleBackToList = () => {
        setSelectedEmail(null);
    };

    const handleEmailSelect = (emailId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedEmailIds((prev) => [...prev, emailId]);
        } else {
            setSelectedEmailIds((prev) => prev.filter((id) => id !== emailId));
        }
    };

    const handleSelectAll = () => {
        if (selectedEmailIds.length === emails.length) {
            setSelectedEmailIds([]);
        } else {
            setSelectedEmailIds(emails.map((email) => email.id));
        }
    };

    const handleBulkDelete = async () => {
        setShowDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
        try {
            await bulkDeleteEmails.mutateAsync({ emailIds: selectedEmailIds });

            queryClient.invalidateQueries({ queryKey: queryKeys.emails.all });
            queryClient.invalidateQueries({
                queryKey: queryKeys.emails.list(),
            });
            if (activeCategoryId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.emails.byCategory(activeCategoryId),
                });
            }

            queryClient.invalidateQueries({
                queryKey: queryKeys.auth.dependencies,
            });

            setSelectedEmailIds([]);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error("Failed to delete emails:", error);
            setShowDeleteConfirm(false);
        }
    };

    const handleBulkUnsubscribe = async () => {
        try {
            toast.info("Unsubscribing from emails...", {
                duration: 5000,
                position: "top-right",
            });
            await bulkUnsubscribe.mutate({ emailIds: selectedEmailIds });
            setSelectedEmailIds([]);
        } catch (error) {
            console.error("Failed to unsubscribe from emails:", error);
            toast.error("Failed to unsubscribe from emails", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
                duration: 5000,
                position: "top-right",
            });
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return "Just now";
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-destructive/10 text-destructive border-destructive/20";
            case "medium":
                return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
            case "low":
                return "bg-green-500/10 text-green-700 border-green-500/20";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    if (selectedEmail) {
        return (
            <div className='flex flex-col min-h-full'>
                <div className='flex-shrink-0 p-4 border-b border-border/50'>
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleBackToList}
                        className='flex items-center gap-2 text-muted-foreground hover:text-foreground'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        Back to emails
                    </Button>
                </div>

                <div className='flex-1 p-6'>
                    <div className='mb-6'>
                        <div className='flex items-start justify-between mb-4'>
                            <div className='flex-1'>
                                <h1 className='text-xl font-semibold text-foreground mb-3'>
                                    {selectedEmail.subject}
                                </h1>
                                <div className='flex items-center gap-3 mb-3'>
                                    <span className='text-sm font-medium text-foreground'>
                                        {selectedEmail.fromName}
                                    </span>
                                    <span className='text-sm text-muted-foreground'>
                                        &lt;{selectedEmail.fromEmail}
                                        &gt;
                                    </span>
                                </div>
                                <div className='flex items-center gap-2 text-sm text-muted-foreground mb-4'>
                                    <Clock className='h-4 w-4' />
                                    <span>
                                        {formatTimeAgo(
                                            selectedEmail.receivedAt
                                        )}
                                    </span>
                                    {selectedEmail.hasAttachments && (
                                        <>
                                            <span>•</span>
                                            <Paperclip className='h-4 w-4' />
                                            <span>Has attachments</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                        </div>

                        <div className='flex items-center gap-2 mb-6'>
                            <Badge
                                className={`text-xs px-2 py-1 bg-muted text-muted-foreground border-border`}
                            >
                                {selectedEmail.category}
                            </Badge>
                            <Badge
                                className={`text-xs px-2 py-1 ${getPriorityColor(
                                    selectedEmail.priority
                                )}`}
                            >
                                {selectedEmail.priority} priority
                            </Badge>
                            <Badge variant='secondary' className='text-xs'>
                                AI Confidence:{" "}
                                {Math.round(selectedEmail.aiConfidence * 100)}%
                            </Badge>
                        </div>

                        <div className='bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6'>
                            <h3 className='text-sm font-medium text-primary mb-2 flex items-center'>
                                <SparkleIcon className='h-4 w-4 mr-2' /> AI
                                Summary
                            </h3>
                            <p className='text-sm text-primary/80'>
                                {selectedEmail.aiSummary}
                            </p>
                        </div>
                    </div>

                    <div className='prose prose-sm max-w-none'>
                        <div className='whitespace-pre-wrap text-foreground leading-relaxed'>
                            {selectedEmail.body}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className='flex flex-col min-h-full'>
                <div className='flex-shrink-0 p-6 border-b border-border/50'>
                    <div className='mb-4'>
                        <div className='flex items-center gap-3 mb-1'>
                            <h1 className='text-2xl font-bold text-foreground'>
                                {activeCategory
                                    ? `${activeCategory}`
                                    : "AI Email Organizer"}
                            </h1>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                            {activeCategory
                                ? `Showing ${emails.length} emails in ${activeCategory} category`
                                : `Welcome back, ${session?.user?.name ||
                                session?.user?.email
                                }.`}
                        </p>
                    </div>
                </div>

                <div className='flex-1'>
                    {!activeCategory ? (
                        <div className='flex flex-col items-center justify-center min-h-96 p-8 text-center'>
                            <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4'>
                                <svg
                                    className='w-8 h-8 text-primary'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
                                    />
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='m7 12 4 4 4-4'
                                    />
                                </svg>
                            </div>
                            <h2 className='text-xl font-semibold text-foreground mb-2'>
                                Select a Category
                            </h2>
                            <p className='text-muted-foreground max-w-md'>
                                Choose a category from the sidebar to view your
                                organized emails. Each category contains emails
                                automatically sorted by AI based on their
                                content.
                            </p>
                        </div>
                    ) : emailsLoading ? (
                        <div className='p-4'>
                            <EmailListSkeleton />
                        </div>
                    ) : emails.length === 0 ? (
                        <div className='flex flex-col items-center justify-center min-h-96 p-8 text-center'>
                            <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
                                <svg
                                    className='w-8 h-8 text-muted-foreground'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                                    />
                                </svg>
                            </div>
                            <h2 className='text-xl font-semibold text-foreground mb-2'>
                                No Emails Found
                            </h2>
                            <p className='text-muted-foreground'>
                                There are no emails in the {activeCategory}{" "}
                                category yet.
                            </p>
                        </div>
                    ) : (
                        <div className='relative'>
                            {selectedEmailIds.length > 0 && (
                                <div className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4'>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-4'>
                                            <span className='text-sm font-medium'>
                                                {selectedEmailIds.length} email
                                                {selectedEmailIds.length > 1
                                                    ? "s"
                                                    : ""}{" "}
                                                selected
                                            </span>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={handleSelectAll}
                                            >
                                                {selectedEmailIds.length ===
                                                    emails.length
                                                    ? "Deselect All"
                                                    : "Select All"}
                                            </Button>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={handleBulkUnsubscribe}
                                                className='flex items-center gap-2'
                                            >
                                                <UserX className='h-4 w-4' />
                                                Unsubscribe
                                            </Button>
                                            <Button
                                                variant='destructive'
                                                size='sm'
                                                onClick={handleBulkDelete}
                                                className='flex items-center gap-2'
                                            >
                                                <Trash2 className='h-4 w-4' />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className='divide-y divide-border/50'>
                                {emails?.map((email) => (
                                    <EachEmail
                                        key={email.id}
                                        email={email}
                                        isSelected={selectedEmailIds.includes(email.id)}
                                        onSelect={handleEmailSelect}
                                        onClick={handleEmailClick}
                                        formatTimeAgo={formatTimeAgo}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Selected Emails
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            {selectedEmailIds.length} email
                            {selectedEmailIds.length > 1 ? "s" : ""}? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={bulkDeleteEmails.isPending}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            disabled={bulkDeleteEmails.isPending}
                        >
                            {bulkDeleteEmails.isPending
                                ? "Deleting..."
                                : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
