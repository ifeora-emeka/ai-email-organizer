import React from 'react'
import { Button } from './ui/button'
import { Plus, FolderOpen, Mail } from 'lucide-react'
import { Badge } from './ui/badge'

const mockCategories = [
  {
    id: "1",
    name: "Work",
    description: "Work-related emails and communications",
    emailCount: 45,
    color: "bg-blue-500"
  },
  {
    id: "2", 
    name: "Personal",
    description: "Personal emails and family communications",
    emailCount: 23,
    color: "bg-green-500"
  },
  {
    id: "3",
    name: "Shopping",
    description: "Shopping receipts and promotional emails",
    emailCount: 67,
    color: "bg-purple-500"
  },
  {
    id: "4",
    name: "News",
    description: "News alerts and newsletter subscriptions",
    emailCount: 34,
    color: "bg-orange-500"
  },
  {
    id: "5",
    name: "Social",
    description: "Social media notifications and updates",
    emailCount: 12,
    color: "bg-pink-500"
  }
]

export default function CategoryList() {
  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categories</h2>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Organize your emails by category
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {mockCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer group"
            >
              <div className={`w-3 h-3 rounded-full ${category.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{category.name}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {category.emailCount}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {category.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {mockCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No categories yet</p>
            <Button size="sm" className="mt-2 gap-1">
              <Plus className="h-3 w-3" />
              Add Category
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
