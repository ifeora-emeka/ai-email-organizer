"use client";

import React from 'react';
import { Checkbox } from './ui/checkbox';
import { Clock, Paperclip, UserIcon } from 'lucide-react';
import { Email } from '@/lib/hooks/use-emails';

interface EachEmailProps {
    email: Email;
    isSelected: boolean;
    onSelect: (emailId: string, isSelected: boolean) => void;
    onClick: (email: Email) => void;
    formatTimeAgo: (dateString: string) => string;
}

export default function EachEmail({ 
    email, 
    isSelected, 
    onSelect, 
    onClick, 
    formatTimeAgo 
}: EachEmailProps) {
    return (
        <div
            className={`p-4 hover:bg-accent/50 transition-colors ${
                !email.isRead
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : ""
            } ${
                isSelected
                    ? "bg-primary/10"
                    : ""
            }`}
            data-testid={`email-${email.id}`}
        >
            <div className='flex items-start gap-4'>
                <div className='flex items-center pt-1'>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                            onSelect(email.id, checked as boolean)
                        }
                        className='h-4 w-4'
                        data-testid="email-checkbox"
                    />
                </div>

                <div
                    className='flex-1 min-w-0 cursor-pointer'
                    onClick={() => onClick(email)}
                    data-testid="email-content"
                    role="button"
                >
                    <div className='flex items-center gap-2 mb-2'>
                        <span
                            className={`font-medium text-foreground text-sm ${
                                !email.isRead ? "font-semibold" : ""
                            }`}
                            data-testid="email-from-name"
                        >
                            {email.fromName}
                        </span>
                    </div>

                    <h3
                        className={`text-sm text-foreground mb-2 ${
                            !email.isRead ? "font-semibold" : ""
                        }`}
                        data-testid="email-subject"
                    >
                        {email.subject}
                    </h3>

                    <p 
                        className='text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3'
                        data-testid="email-ai-summary"
                    >
                        {email.aiSummary}
                    </p>

                    <div className='flex items-center justify-between gap-4 text-xs text-muted-foreground'>
                        <div className="flex items-center gap-2" data-testid="email-metadata">
                            <div className='flex items-center gap-1' data-testid="email-time">
                                <Clock className='h-3 w-3' />
                                <span>
                                    {formatTimeAgo(email.receivedAt)}
                                </span>
                            </div>
                            {email.hasAttachments && (
                                <div 
                                    className='flex items-center gap-1'
                                    data-testid="email-attachments"
                                >
                                    <Paperclip className='h-3 w-3' />
                                    <span>Attachment</span>
                                </div>
                            )}
                            <div className='flex items-center gap-1' data-testid="email-ai-confidence">
                                <span>
                                    AI: {Math.round(email.aiConfidence * 100)}%
                                </span>
                            </div>
                        </div>
                        <span 
                            className='text-xs text-muted-foreground flex gap-2 items-center'
                            data-testid="email-gmail-account"
                        >
                            <UserIcon className='h-5 w-5' /> 
                            {email.gmailAccount?.name || email.gmailAccount?.email}
                        </span>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    {!email.isRead && (
                        <div 
                            className='w-2 h-2 bg-primary rounded-full'
                            data-testid="email-unread-indicator"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}