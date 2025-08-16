
import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import CategoryList from '../CategoryList';
import ConnectedGmailList from '../ConnectedGmailList';

type Props = {
    heading?: string;
    onBack?: () => void;
    children: any;
}

export default function AppLayout({ heading, onBack, children }: Props) {
    return (
        <div className='min-h-screen w-full bg-background flex items-center justify-center p-4'>
            <div className='w-full max-w-7xl h-[calc(100vh-2rem)] bg-background border border-border/50 shadow-lg rounded-xl overflow-hidden'>
                <div className='h-full grid grid-cols-12'>

                    <div className='col-span-3 border-r border-border bg-card flex flex-col'>
                        <CategoryList />
                    </div>
                    
                    <div className='col-span-6 flex flex-col'>
                        <header className='border-b border-border h-14 flex gap-3 items-center px-4 bg-card backdrop-blur-sm'>
                            {onBack && (
                                <Button size='sm' variant='ghost' onClick={onBack} className='h-8 w-8 p-0'>
                                    <ArrowLeft className='h-4 w-4' />
                                </Button>
                            )}
                            <h1 className='text-lg font-semibold text-foreground'>
                                {heading || "Email Organizer"}
                            </h1>
                        </header>
                        <main className='flex-1 overflow-y-auto bg-card/70'>
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
