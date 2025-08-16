
"use client"

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Folder } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import { useCategories } from '@/lib/hooks'
import LoadingPage from './loader'

export default function HomePage() {
  const { data: session } = useSession()
  const { data: categories = [], isLoading } = useCategories()

  if (isLoading) {
    return <LoadingPage />
  }

  const handleCreateCategory = () => {
    console.log('Create category')
  }

  const handleCategoryClick = (categoryId: string) => {
    console.log('Category clicked:', categoryId)
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email Organizer</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || session?.user?.email}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreateCategory}>
            <CardContent className="flex flex-col items-center justify-center h-32 space-y-2">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Add Category</span>
            </CardContent>
          </Card>

          {categories.map((category) => (
            <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategoryClick(category.id)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Folder className="h-5 w-5" style={{ color: category.color }} />
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {category.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{category.emailCount || 0} emails</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first category to start organizing emails with AI
              </p>
              <Button onClick={handleCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
