
import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import CategoryList from '../CategoryList';
import ConnectedGmailList from '../ConnectedGmailList';
import { Skeleton } from '../ui/skeleton';

type Props = {
    heading?: string;
    onBack?: () => void;
    children: any;
    isLoading?: boolean;
}

const AppLayoutSkeleton = () => (
    <div className='min-h-screen w-full bg-background flex items-center justify-center'>
        <div className='w-full max-w-7xl h-[calc(100vh-2rem)] bg-background border border-border/50 shadow-lg rounded-xl overflow-hidden'>
            <div className='h-full grid grid-cols-12'>
                <div className='col-span-3 border-r border-border flex flex-col'>
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex-1 p-2 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <Skeleton className="w-3 h-3 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-20 mb-1" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                                <Skeleton className="h-5 w-8" />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className='col-span-6 flex flex-col h-full'>
                    <header className='border-b border-border h-14 flex gap-3 items-center px-4 bg-card backdrop-blur-sm flex-shrink-0'>
                        <Skeleton className="h-6 w-40" />
                    </header>
                    <main className='flex-1 overflow-y-auto bg-card/70 p-6 min-h-0'>
                        <div className="space-y-4">
                            <div className="mb-4">
                                <Skeleton className="h-8 w-32 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-4 border border-border/50 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-5 w-16" />
                                                    <Skeleton className="h-5 w-12" />
                                                </div>
                                                <Skeleton className="h-5 w-3/4 mb-2" />
                                                <Skeleton className="h-4 w-full mb-1" />
                                                <Skeleton className="h-4 w-2/3" />
                                                <div className="flex items-center gap-4 mt-3">
                                                    <Skeleton className="h-3 w-16" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </div>
                                            <Skeleton className="w-2 h-2 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
                
                <div className='col-span-3 border-l border-border bg-card flex flex-col'>
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex-1 p-4 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 border border-border/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-5 w-12" />
                                </div>
                                <Skeleton className="h-3 w-24 mb-2" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
)

export default function AppLayout({ heading, onBack, children, isLoading = false }: Props) {
    if (isLoading) {
        return <AppLayoutSkeleton />
    }

    return (
        <div className='min-h-screen w-full bg-background flex items-center justify-center p-4'>
            <div className='w-full max-w-7xl h-[calc(100vh-2rem)] bg-background border border-border/50 shadow-lg rounded-xl overflow-hidden'>
                <div className='h-full grid grid-cols-12'>

                    <div className='col-span-3 border-r border-border bg-card flex flex-col'>
                        <CategoryList />
                    </div>
                    
                    <div className='col-span-6 flex flex-col h-full'>
                        <header className='border-b border-border h-14 flex gap-3 items-center px-4 bg-card backdrop-blur-sm flex-shrink-0'>
                            {onBack && (
                                <Button size='sm' variant='ghost' onClick={onBack} className='h-8 w-8 p-0'>
                                    <ArrowLeft className='h-4 w-4' />
                                </Button>
                            )}
                            <h1 className='text-lg font-semibold text-foreground'>
                                {heading || "Email Organizer"}
                            </h1>
                        </header>
                        <main className='overflow-auto bg-card/70 h-[calc(100dvh-6rem)]'>
                            {children}
                        </main>
                    </div>
                    
                    <div className='col-span-3 border-l border-border bg-card flex flex-col'>
                        <ConnectedGmailList />
                    </div>
                </div>
            </div>
        </div>
    )
}
