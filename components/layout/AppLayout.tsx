
import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import CategoryList from '../CategoryList';

type Props = {
    heading?: string;
    onBack?: () => void;
    children: any;
}

export default function AppLayout({ heading, onBack, children }: Props) {
    return (
        <div className='h-screen w-screen bg-background flex items-center justify-center'>
            <div className='2xl:w-[80rem] 2xl:h-[50rem] bg-card border shadow-md rounded-lg grid grid-cols-12'>
                <div className='col-span-4 border-r h-full'>
                    <CategoryList />
                </div>
                <div className='col-span-8'>
                    <header className='border-b h-12 flex gap-2 items-center px-2'>
                        {onBack && <Button size={'icon'} variant={'ghost'} onClick={onBack}>
                            <ArrowLeft />
                        </Button>}
                        <h3>{heading || "Email Organizer"}</h3>
                    </header>
                    <main className='flex-1 overflow-y-auto overflow-x-hidden'>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
