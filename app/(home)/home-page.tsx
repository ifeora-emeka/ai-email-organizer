"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    Paperclip,
    ArrowLeft,
    Star,
    Archive,
    Trash2,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useEmails, type Email } from "@/lib/hooks/use-emails";
import {
    useGmailAccounts,
    useStartPolling,
    type GmailAccount,
} from "@/lib/hooks";
import EmailListSkeleton from "@/components/EmailListSkeleton";

export default function HomePage() {
    const { data: session } = useSession();
    const { activeCategory, activeCategoryId, categories } = useAppContext();
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [pollingStarted, setPollingStarted] = useState(false);

    const { data: emailsResponse, isLoading: emailsLoading } = useEmails({
        categoryId: activeCategoryId || undefined,
        limit: 50,
        sortBy: "receivedAt",
        sortOrder: "desc",
    });

    console.log("emailsResponse:::", emailsResponse);

    const { data: gmailAccountsData } = useGmailAccounts();
    const startPolling = useStartPolling();

    const emails = emailsResponse || [];
    const gmailAccounts: GmailAccount[] =
        (gmailAccountsData as GmailAccount[]) || [];

    console.log("GMAIL ACCOUNTS:::", gmailAccounts);

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

    const getCategoryColor = (category: string) => {
        const categoryData = categories.find((c) => c.name === category);
        if (categoryData?.color) {
            const colorClass = categoryData.color.startsWith("bg-")
                ? categoryData.color
                : `bg-${categoryData.color}`;
            return `${colorClass}/10 text-${categoryData.color.replace(
                "bg-",
                ""
            )}-700 border-${categoryData.color.replace("bg-", "")}-500/20`;
        }
        return "bg-muted text-muted-foreground border-border";
    };

    if (selectedEmail) {
        return (
            <>
                <div className='h-full flex flex-col'>
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

                    <div className='flex-1 overflow-y-auto'>
                        <div className='p-6'>
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
                                    <div className='flex items-center gap-2'>
                                        <Button variant='ghost' size='sm'>
                                            <Star className='h-4 w-4' />
                                        </Button>
                                        <Button variant='ghost' size='sm'>
                                            <Archive className='h-4 w-4' />
                                        </Button>
                                        <Button variant='ghost' size='sm'>
                                            <Trash2 className='h-4 w-4' />
                                        </Button>
                                    </div>
                                </div>

                                <div className='flex items-center gap-2 mb-6'>
                                    <Badge
                                        className={`text-xs px-2 py-1 ${getCategoryColor(
                                            selectedEmail.category
                                        )}`}
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
                                    <Badge
                                        variant='secondary'
                                        className='text-xs'
                                    >
                                        AI Confidence:{" "}
                                        {Math.round(
                                            selectedEmail.aiConfidence * 100
                                        )}
                                        %
                                    </Badge>
                                </div>

                                <div className='bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6'>
                                    <h3 className='text-sm font-medium text-primary mb-2'>
                                        AI Summary
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
                </div>
            </>
        );
    }

    return (
        <>
            <div className='h-full flex flex-col'>
                <div className='flex-shrink-0 p-6 border-b border-border/50'>
                    <div className='mb-4'>
                        <div className='flex items-center gap-3 mb-1'>
                            <h1 className='text-2xl font-bold text-foreground'>
                                {activeCategory
                                    ? `${activeCategory}`
                                    : "AI Email Organizer"}
                            </h1>
                            {pollingStarted && gmailAccounts.length > 0 && (
                                <Badge
                                    variant='secondary'
                                    className='text-xs bg-green-500/10 text-green-700 border-green-500/20'
                                >
                                    <div className='w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse'></div>
                                    Polling Active
                                </Badge>
                            )}
                        </div>
                        <p className='text-sm text-muted-foreground'>
                            {activeCategory
                                ? `Showing ${emails.length} emails in ${activeCategory} category`
                                : `Welcome back, ${
                                      session?.user?.name ||
                                      session?.user?.email
                                  }.`}
                        </p>
                    </div>
                </div>

                <div className='flex-1 overflow-y-auto'>
                    {!activeCategory ? (
                        <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
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
                        <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
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
                        <div className='divide-y  h-full overflow-y-auto divide-border/50'>
                            {emails?.map((email) => (
                                <div
                                    key={email.id}
                                    className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                                        !email.isRead
                                            ? "bg-primary/5 border-l-2 border-l-primary"
                                            : ""
                                    }`}
                                    onClick={() => handleEmailClick(email)}
                                >
                                    <div className='flex items-start justify-between gap-4'>
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span
                                                    className={`font-medium text-foreground text-sm ${
                                                        !email.isRead
                                                            ? "font-semibold"
                                                            : ""
                                                    }`}
                                                >
                                                    {email.fromName}
                                                </span>
                                                <Badge
                                                    className={`text-xs px-2 py-1 ${getCategoryColor(
                                                        email.category
                                                    )}`}
                                                >
                                                    {email.category}
                                                </Badge>
                                                <Badge
                                                    className={`text-xs px-2 py-1 ${getPriorityColor(
                                                        email.priority
                                                    )}`}
                                                >
                                                    {email.priority}
                                                </Badge>
                                            </div>

                                            <h3
                                                className={`text-sm text-foreground mb-2 ${
                                                    !email.isRead
                                                        ? "font-semibold"
                                                        : ""
                                                }`}
                                            >
                                                {email.subject}
                                            </h3>

                                            <p className='text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3'>
                                                {email.aiSummary}
                                            </p>

                                            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                                                <div className='flex items-center gap-1'>
                                                    <Clock className='h-3 w-3' />
                                                    <span>
                                                        {formatTimeAgo(
                                                            email.receivedAt
                                                        )}
                                                    </span>
                                                </div>
                                                {email.hasAttachments && (
                                                    <div className='flex items-center gap-1'>
                                                        <Paperclip className='h-3 w-3' />
                                                        <span>Attachment</span>
                                                    </div>
                                                )}
                                                <div className='flex items-center gap-1'>
                                                    <span>
                                                        AI:{" "}
                                                        {Math.round(
                                                            email.aiConfidence *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            {!email.isRead && (
                                                <div className='w-2 h-2 bg-primary rounded-full'></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
