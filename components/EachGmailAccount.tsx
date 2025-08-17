"use client";

import React from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Mail } from 'lucide-react';

interface GmailAccount {
    id: string;
    email: string;
    name?: string;
    isActive: boolean;
    lastSync: Date;
    emailCount?: number;
}

interface EachGmailAccountProps {
    account: GmailAccount;
    getInitials: (name: string, email: string) => string;
    formatLastSync: (date: Date) => string;
}

export default function EachGmailAccount({ 
    account, 
    getInitials, 
    formatLastSync 
}: EachGmailAccountProps) {
    return (
        <div 
            className='flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors'
            data-testid={`gmail-account-${account.id}`}
        >
            <div className='flex items-center gap-3 flex-1 min-w-0'>
                <Avatar className="h-8 w-8" data-testid="gmail-account-avatar">
                    <AvatarFallback className="text-xs font-medium" data-testid="gmail-account-initials">
                        {getInitials(account.name || '', account.email)}
                    </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                        <p 
                            className='font-medium text-foreground truncate text-sm'
                            data-testid="gmail-account-name"
                        >
                            {account.name}
                        </p>
                    </div>
                    <p 
                        className='text-xs text-muted-foreground truncate'
                        data-testid="gmail-account-email"
                    >
                        {account.email}
                    </p>
                    <div className='flex items-center gap-3 mt-1'>
                        <span 
                            className='text-xs text-muted-foreground flex items-center gap-1'
                            data-testid="gmail-account-email-count"
                        >
                            <Mail className='h-3 w-3' />
                            {account.emailCount}
                        </span>
                        <span 
                            className='text-xs text-muted-foreground'
                            data-testid="gmail-account-last-sync"
                        >
                            {formatLastSync(account.lastSync)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
