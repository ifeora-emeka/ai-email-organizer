"use client";

import React from 'react';
import { Badge } from './ui/badge';

interface Category {
    id: string;
    name: string;
    description: string;
    color: string;
    emailCount?: number;
}

interface EachCategoryProps {
    category: Category;
    isActive: boolean;
    emailCount: number;
    onClick: (categoryName: string, categoryId: string) => void;
}

export default function EachCategory({ 
    category, 
    isActive, 
    emailCount, 
    onClick 
}: EachCategoryProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(category.name, category.id);
        }
    };

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer group transition-colors ${
                isActive ? 'bg-accent border border-primary/20' : ''
            }`}
            onClick={() => onClick(category.name, category.id)}
            onKeyDown={handleKeyDown}
            data-testid={`category-${category.id}`}
            role="button"
            aria-pressed={isActive}
            tabIndex={0}
        >
            <div 
                className={`w-3 h-3 rounded-full ${category.color}`}
                data-testid="category-color-indicator"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 
                        className="font-medium text-foreground truncate"
                        data-testid="category-name"
                    >
                        {category.name}
                    </h3>
                    {emailCount > 0 && (
                        <Badge 
                            variant="secondary" 
                            className="ml-2 text-xs"
                            data-testid="category-email-count"
                        >
                            {emailCount}
                        </Badge>
                    )}
                </div>
                <p 
                    className="text-xs text-muted-foreground truncate mt-1"
                    data-testid="category-description"
                >
                    {category.description}
                </p>
            </div>
        </div>
    );
}