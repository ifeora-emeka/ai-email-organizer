import { Request, Response } from 'express'
import { CategoryService } from '../../../lib/services/category.service'
import { AuthenticatedRequest } from '../../middleware/auth.middleware'
import { CreateCategoryData, UpdateCategoryData, CategoryParams, CategoryQuery } from './categories.dto'

export class CategoriesController {
  static async getCategories(req: AuthenticatedRequest & { query: CategoryQuery }, res: Response) {
    try {
      const userId = req.user!.id
      const { includeEmails = false } = req.query

      const categories = await CategoryService.getCategoriesByUserId(userId)
      
      const response = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        emailCount: (category as any)._count?.emails || 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }))

      return res.status(200).json({
        success: true,
        data: { categories: response },
        message: 'Categories retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching categories:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch categories'
      })
    }
  }

  static async getCategoryById(req: AuthenticatedRequest & { params: CategoryParams; query: CategoryQuery }, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params
      const { limit = 50, offset = 0, includeEmails = false } = req.query

      let category
      
      if (includeEmails) {
        category = await CategoryService.getCategoryWithEmails(id, limit, offset)
      } else {
        category = await CategoryService.getCategoryById(id)
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        })
      }

      if (category.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this category'
        })
      }

      const response = {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        emailCount: (category as any)._count?.emails || 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        ...(includeEmails && {
          emails: (category as any).emails?.map((email: any) => ({
            id: email.id,
            subject: email.subject,
            fromEmail: email.fromEmail,
            fromName: email.fromName,
            receivedAt: email.receivedAt,
            isRead: email.isRead,
            aiSummary: email.aiSummary,
            gmailAccount: email.gmailAccount
          }))
        })
      }

      return res.status(200).json({
        success: true,
        data: { category: response },
        message: 'Category retrieved successfully'
      })
    } catch (error) {
      console.error('Error fetching category:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch category'
      })
    }
  }

  static async createCategory(req: AuthenticatedRequest & { body: CreateCategoryData }, res: Response) {
    try {
      const userId = req.user!.id
      const { name, description, color } = req.body

      const category = await CategoryService.createCategory({
        userId,
        name,
        description,
        color
      })

      return res.status(201).json({
        success: true,
        data: { category },
        message: 'Category created successfully'
      })
    } catch (error: any) {
      console.error('Error creating category:', error)
      
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'Category with this name already exists'
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create category'
      })
    }
  }

  static async updateCategory(req: AuthenticatedRequest & { params: CategoryParams; body: UpdateCategoryData }, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params
      const updateData = req.body

      const existingCategory = await CategoryService.getCategoryById(id)
      
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        })
      }

      if (existingCategory.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this category'
        })
      }

      const category = await CategoryService.updateCategory(id, updateData)

      return res.status(200).json({
        success: true,
        data: { category },
        message: 'Category updated successfully'
      })
    } catch (error: any) {
      console.error('Error updating category:', error)
      
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'Category with this name already exists'
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update category'
      })
    }
  }

  static async deleteCategory(req: AuthenticatedRequest & { params: CategoryParams }, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params

      const existingCategory = await CategoryService.getCategoryById(id)
      
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        })
      }

      if (existingCategory.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this category'
        })
      }

      await CategoryService.deleteCategory(id)

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete category'
      })
    }
  }
}