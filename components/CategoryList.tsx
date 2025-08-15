"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Plus, FolderOpen, Mail } from 'lucide-react'
import { Badge } from './ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"

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

const categoryColors = [
  "bg-blue-500",
  "bg-green-500", 
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-cyan-500"
]

export default function CategoryList() {
  const [categories, setCategories] = useState(mockCategories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  })

  const handleAddCategory = () => {
    if (newCategory.name.trim() && newCategory.description.trim()) {
      const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)]
      const newCat = {
        id: String(categories.length + 1),
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        emailCount: 0,
        color: randomColor
      }
      setCategories([...categories, newCat])
      setNewCategory({ name: "", description: "" })
      setIsDialogOpen(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setNewCategory(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categories</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new category to organize your emails. Give it a descriptive name and description.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Work, Personal, Shopping"
                    value={newCategory.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what types of emails belong in this category..."
                    value={newCategory.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCategory}
                  disabled={!newCategory.name.trim() || !newCategory.description.trim()}
                >
                  Add Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Organize your emails by category
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {categories.map((category) => (
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

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No categories yet</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="mt-2 gap-1">
                  <Plus className="h-3 w-3" />
                  Add Category
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}
