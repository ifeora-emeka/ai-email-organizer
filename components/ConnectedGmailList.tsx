"use client";

import React from "react";
import { Button } from "./ui/button";
import { Mail, Plus, Loader2 } from "lucide-react";
import { useApiMutation } from "@/lib/hooks";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { GmailAccount } from "@/lib/hooks/use-auth";
import EachGmailAccount from "./EachGmailAccount";

export default function ConnectedGmailList() {
    const { state, updateState } = useAppContext();
    const router = useRouter();

    const { mutate: connectGmailAccount, isPending } = useApiMutation({
        mutationFn: async (currentUrl: string) => {
            const response = await api.post("/gmail-accounts", {
                redirect_uri: currentUrl,
            });
            return response.data;
        },
        onSuccess: (data) => {
            console.log("This is the data", data?.data?.oauthUrl);
            router.push(data.data.oauthUrl);
        },
        onError: (error) => {
            console.log("This is the error", error);
            toast.error(error.response?.data?.message || "An error occurred");
        },
    });

    const getInitials = (name: string, email: string) => {
        if (name && name.trim()) {
            return name
                .trim()
                .split(' ')
                .map(part => part.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        
        return email
            .split('@')[0]
            .slice(0, 2)
            .toUpperCase();
    };

    const handleConnectAccount = () => {
        connectGmailAccount(window.location.href);
    };

    const toggleAccountStatus = (id: string) => {
        const updatedAccounts = state.gmailAccounts.map((account) =>
            account.id === id
                ? { ...account, isActive: !account.isActive }
                : account
        );
        updateState({ gmailAccounts: updatedAccounts });
    };

    const formatLastSync = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return "Just now";
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };


    return (
        <div className='h-full flex flex-col select-none'>
            <div className='p-4 border-b border-border/50'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-lg font-semibold text-foreground'>
                        Accounts
                    </h2>
                    <Button
                        size='sm'
                        className='gap-2'
                        onClick={handleConnectAccount}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                            <Plus className='h-4 w-4' />
                        )}
                        Connect
                    </Button>
                </div>
                <p className='text-sm text-muted-foreground mt-1'>
                    Manage connected accounts
                </p>
            </div>

            <div className='flex-1 overflow-y-auto'>
                <div className='p-2 space-y-2'>
                    {state.gmailAccounts?.map((account: GmailAccount) => (
                        <EachGmailAccount
                            key={account.id}
                            account={account}
                            getInitials={getInitials}
                            formatLastSync={formatLastSync}
                        />
                    ))}

                    {(!state.gmailAccounts || state.gmailAccounts.length === 0) && (
                        <div className='text-center py-8 text-muted-foreground'>
                            <Mail className='h-12 w-12 mx-auto mb-3 opacity-30' />
                            <p className='text-sm mb-1'>
                                No accounts connected
                            </p>
                            <p className='text-xs'>
                                Connect your first account to start
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
