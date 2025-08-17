"use client"

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Plus, FolderOpen, Check, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { useAppContext } from '@/context/AppContext'
import { useCreateCategory } from '@/lib/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import EachCategory from './EachCategory'
import { cn } from '@/lib/utils'

const categoryColors = [
  { name: 'Blue', value: 'bg-blue-500', preview: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500', preview: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500', preview: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500', preview: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500', preview: 'bg-pink-500' },
  { name: 'Indigo', value: 'bg-indigo-500', preview: 'bg-indigo-500' },
  { name: 'Red', value: 'bg-red-500', preview: 'bg-red-500' },
  { name: 'Yellow', value: 'bg-yellow-500', preview: 'bg-yellow-500' },
  { name: 'Teal', value: 'bg-teal-500', preview: 'bg-teal-500' },
  { name: 'Cyan', value: 'bg-cyan-500', preview: 'bg-cyan-500' },
  { name: 'Gray', value: 'bg-gray-500', preview: 'bg-gray-500' },
  { name: 'Slate', value: 'bg-slate-500', preview: 'bg-slate-500' }
]

export default function CategoryList() {
  const { state, updateState, setActiveCategory } = useAppContext()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: ""
  })
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    color: ""
  })

  const createCategoryMutation = useCreateCategory()

  useEffect(() => {
    if (formData.color === "" && categoryColors.length > 0) {
      const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)]
      setFormData(prev => ({ ...prev, color: randomColor.value }))
    }
  }, [isDialogOpen])

  const validateForm = () => {
    const newErrors = {
      name: "",
      description: "",
      color: ""
    }

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required"
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Category name must be 100 characters or less"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.trim().length > 500) {
      newErrors.description = "Description must be 500 characters or less"
    }

    if (!formData.color) {
      newErrors.color = "Please select a color"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== "")
  }

  const handleCreateCategory = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const newCategory = await createCategoryMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      })

      updateState({
        categories: [...state.categories, {
          ...newCategory,
          emailCount: newCategory.emailCount || 0
        }]
      })

      setActiveCategory(newCategory.name, newCategory.id)

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.dependencies })

      setFormData({ name: "", description: "", color: "" })
      setErrors({ name: "", description: "", color: "" })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleCategoryClick = (categoryName: string, categoryId: string) => {
    if (state.activeCategory === categoryName) {
      setActiveCategory(null, null)
    } else {
      setActiveCategory(categoryName, categoryId)
    }
  }

  const getCategoryEmailCount = (categoryName: string) => {
    const category = state.categories.find(cat => cat.name === categoryName)
    return category?.emailCount || 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="h-full flex flex-col select-none">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Categories</h2>
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
                  Create a new category to organize your emails. Give it a descriptive name, description, and choose a color.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Work, Personal, Shopping"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what types of emails belong in this category..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className={cn(errors.description && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => handleInputChange("color", value)}
                  >
                    <SelectTrigger className={cn("w-full", errors.color && "border-red-500 focus-visible:ring-red-500")}>
                      <SelectValue placeholder="Choose a color">
                        {formData.color && (
                          <div className="flex items-center gap-2">
                            <div className={cn("w-4 h-4 rounded-full", formData.color)} />
                            {categoryColors.find(c => c.value === formData.color)?.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categoryColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-4 h-4 rounded-full", color.preview)} />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.color && (
                    <p className="text-sm text-red-500">{errors.color}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setFormData({ name: "", description: "", color: "" })
                    setErrors({ name: "", description: "", color: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? "Creating..." : "Add Category"}
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
          {state.categories.map((category) => (
            <EachCategory
              key={category.id}
              category={category}
              isActive={state.activeCategory === category.name}
              emailCount={getCategoryEmailCount(category.name)}
              onClick={handleCategoryClick}
            />
          ))}
        </div>

        {state.categories.length === 0 && (
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
