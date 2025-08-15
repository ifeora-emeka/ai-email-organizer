

"use client"

import { Button } from "@/components/ui/button"
import { FolderOpen, Plus, Mail, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter, useParams } from "next/navigation"

const mockCategories = [
  {
    id: "1",
    name: "Work",
    description: "Work-related emails and communications",
    emailCount: 45,
    color: "bg-blue-500",
    lastEmail: "2 hours ago"
  },
  {
    id: "2", 
    name: "Personal",
    description: "Personal emails and family communications",
    emailCount: 23,
    color: "bg-green-500",
    lastEmail: "1 day ago"
  },
  {
    id: "3",
    name: "Shopping",
    description: "Shopping receipts and promotional emails",
    emailCount: 67,
    color: "bg-purple-500",
    lastEmail: "3 hours ago"
  },
  {
    id: "4",
    name: "News",
    description: "News alerts and newsletter subscriptions",
    emailCount: 34,
    color: "bg-orange-500",
    lastEmail: "5 hours ago"
  },
  {
    id: "5",
    name: "Social",
    description: "Social media notifications and updates",
    emailCount: 12,
    color: "bg-pink-500",
    lastEmail: "1 week ago"
  }
]

export default function CategoryListPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.user_id as string

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/${userId}/${categoryId}`)
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Email Categories</h1>
          <p className="text-muted-foreground">
            Browse and manage your organized email categories
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Categories
          </h2>
          <p className="text-sm text-muted-foreground">
            Click on a category to view emails
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {mockCategories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockCategories.map((category) => (
            <div
              key={category.id}
              className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full ${category.color} mt-1`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <Badge variant="secondary">
                      {category.emailCount}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>Last email: {category.lastEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No categories yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first category to start organizing emails
          </p>
          <Button className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      )}
    </div>
  )
}
