import { CategoriesController } from '../../server/modules/categories/categories.controller'
import { CreateCategoryDto, UpdateCategoryDto, CategoryParamsDto, CategoryQueryDto } from '../../server/modules/categories/categories.dto'
import { CategoryService, CategoryWithCount, CategoryWithEmails } from '../../lib/services/category.service'
import { createMockRequest, createMockResponse, testUser, testCategory } from './setup'

// Mock CategoryService
jest.mock('../../lib/services/category.service')
const mockCategoryService = CategoryService as jest.Mocked<typeof CategoryService>

describe('CategoriesController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCategories', () => {
    it('should return categories for authenticated user', async () => {
      const req = createMockRequest({ 
        user: testUser,
        query: { includeEmails: 'false' }
      })
      const res = createMockResponse()

      const mockCategories: CategoryWithCount[] = [
        { ...testCategory, _count: { emails: 5 } }
      ]

      mockCategoryService.getCategoriesByUserId.mockResolvedValue(mockCategories)

      await CategoriesController.getCategories(req as any, res as any)

      expect(mockCategoryService.getCategoriesByUserId).toHaveBeenCalledWith(testUser.id)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          categories: [{
            id: testCategory.id,
            name: testCategory.name,
            description: testCategory.description,
            color: testCategory.color,
            emailCount: 5,
            createdAt: testCategory.createdAt,
            updatedAt: testCategory.updatedAt
          }]
        },
        message: 'Categories retrieved successfully'
      })
    })

    it('should handle service errors', async () => {
      const req = createMockRequest({ user: testUser })
      const res = createMockResponse()

      mockCategoryService.getCategoriesByUserId.mockRejectedValue(new Error('Service error'))

      await CategoriesController.getCategories(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch categories'
      })
    })
  })

  describe('getCategoryById', () => {
    it('should return category by ID without emails', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: testCategory.id },
        query: { includeEmails: false }
      })
      const res = createMockResponse()

      const mockCategory: CategoryWithCount = { ...testCategory, _count: { emails: 3 } }
      mockCategoryService.getCategoryById.mockResolvedValue(mockCategory)

      await CategoriesController.getCategoryById(req as any, res as any)

      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith(testCategory.id)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          category: {
            id: testCategory.id,
            name: testCategory.name,
            description: testCategory.description,
            color: testCategory.color,
            emailCount: 3,
            createdAt: testCategory.createdAt,
            updatedAt: testCategory.updatedAt
          }
        },
        message: 'Category retrieved successfully'
      })
    })

    it('should return category with emails when includeEmails is true', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: testCategory.id },
        query: { includeEmails: 'true', limit: '10', offset: '0' }
      })
      const res = createMockResponse()

      const mockEmails = [{
        id: 'email-1',
        subject: 'Test Email',
        fromEmail: 'sender@example.com',
        fromName: 'Sender',
        receivedAt: new Date(),
        isRead: false,
        aiSummary: 'Test summary',
        gmailAccount: { email: 'test@gmail.com' }
      }]

      const mockCategory: CategoryWithEmails = {
        ...testCategory,
        _count: { emails: 1 },
        emails: mockEmails
      }

      mockCategoryService.getCategoryWithEmails.mockResolvedValue(mockCategory)

      await CategoriesController.getCategoryById(req as any, res as any)

      expect(mockCategoryService.getCategoryWithEmails).toHaveBeenCalledWith(testCategory.id, "10", "0")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          category: {
            id: testCategory.id,
            name: testCategory.name,
            description: testCategory.description,
            color: testCategory.color,
            emailCount: 1,
            createdAt: testCategory.createdAt,
            updatedAt: testCategory.updatedAt,
            emails: mockEmails
          }
        },
        message: 'Category retrieved successfully'
      })
    })

    it('should return 404 when category not found', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: 'non-existent-id' },
        query: {}
      })
      const res = createMockResponse()

      mockCategoryService.getCategoryById.mockResolvedValue(null)

      await CategoriesController.getCategoryById(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category not found'
      })
    })

    it('should return 403 when user tries to access category from another user', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: testCategory.id },
        query: {}
      })
      const res = createMockResponse()

      const otherUserCategory: CategoryWithCount = { ...testCategory, userId: 'other-user-id', _count: { emails: 0 } }
      mockCategoryService.getCategoryById.mockResolvedValue(otherUserCategory)

      await CategoriesController.getCategoryById(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied to this category'
      })
    })
  })

  describe('createCategory', () => {
    it('should create new category successfully', async () => {
      const newCategoryData = {
        name: 'New Category',
        description: 'New category description',
        color: 'bg-green-500'
      }
      const req = createMockRequest({
        user: testUser,
        body: newCategoryData
      })
      const res = createMockResponse()

      const createdCategory = {
        ...testCategory,
        ...newCategoryData,
        id: 'new-category-id'
      }

      mockCategoryService.createCategory.mockResolvedValue(createdCategory)

      await CategoriesController.createCategory(req as any, res as any)

      expect(mockCategoryService.createCategory).toHaveBeenCalledWith({
        userId: testUser.id,
        ...newCategoryData
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { category: createdCategory },
        message: 'Category created successfully'
      })
    })

    it('should return 409 when category name already exists', async () => {
      const newCategoryData = {
        name: 'Existing Category',
        description: 'Description',
        color: 'bg-blue-500'
      }
      const req = createMockRequest({
        user: testUser,
        body: newCategoryData
      })
      const res = createMockResponse()

      const duplicateError = new Error('Duplicate key') as any
      duplicateError.code = 'P2002'
      mockCategoryService.createCategory.mockRejectedValue(duplicateError)

      await CategoriesController.createCategory(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category with this name already exists'
      })
    })
  })

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Category',
        color: 'bg-purple-500'
      }
      const req = createMockRequest({
        user: testUser,
        params: { id: testCategory.id },
        body: updateData
      })
      const res = createMockResponse()

      const updatedCategory = { ...testCategory, ...updateData }

      const testCategoryWithCount: CategoryWithCount = { ...testCategory, _count: { emails: 0 } }
      mockCategoryService.getCategoryById.mockResolvedValue(testCategoryWithCount)
      mockCategoryService.updateCategory.mockResolvedValue(updatedCategory)

      await CategoriesController.updateCategory(req as any, res as any)

      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith(testCategory.id)
      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(testCategory.id, updateData)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { category: updatedCategory },
        message: 'Category updated successfully'
      })
    })

    it('should return 404 when updating non-existent category', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: 'non-existent-id' },
        body: { name: 'Updated Name' }
      })
      const res = createMockResponse()

      mockCategoryService.getCategoryById.mockResolvedValue(null)

      await CategoriesController.updateCategory(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category not found'
      })
    })
  })

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: testCategory.id }
      })
      const res = createMockResponse()

      const testCategoryWithCount: CategoryWithCount = { ...testCategory, _count: { emails: 0 } }
      mockCategoryService.getCategoryById.mockResolvedValue(testCategoryWithCount)
      mockCategoryService.deleteCategory.mockResolvedValue(undefined)

      await CategoriesController.deleteCategory(req as any, res as any)

      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith(testCategory.id)
      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith(testCategory.id)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category deleted successfully'
      })
    })

    it('should return 404 when deleting non-existent category', async () => {
      const req = createMockRequest({
        user: testUser,
        params: { id: 'non-existent-id' }
      })
      const res = createMockResponse()

      mockCategoryService.getCategoryById.mockResolvedValue(null)

      await CategoriesController.deleteCategory(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category not found'
      })
    })
  })

  describe('DTO Validations', () => {
    describe('CreateCategoryDto', () => {
      it('should validate correct category data', () => {
        const validData = {
          name: 'Test Category',
          description: 'Test description',
          color: 'bg-blue-500'
        }

        const result = CreateCategoryDto.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should reject invalid color format', () => {
        const invalidData = {
          name: 'Test Category',
          description: 'Test description',
          color: 'invalid-color'
        }

        const result = CreateCategoryDto.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['color'],
              message: 'Invalid color format'
            })
          )
        }
      })

      it('should reject missing required fields', () => {
        const invalidData = {
          name: 'Test Category'
          // Missing description and color
        }

        const result = CreateCategoryDto.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      })

      it('should reject name that is too long', () => {
        const invalidData = {
          name: 'A'.repeat(101), // Too long
          description: 'Test description',
          color: 'bg-blue-500'
        }

        const result = CreateCategoryDto.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['name'],
              message: 'Category name too long'
            })
          )
        }
      })
    })

    describe('CategoryParamsDto', () => {
      it('should validate correct CUID', () => {
        const validData = { id: 'cl9ebqhxk00008ci13z4dg6ot' }

        const result = CategoryParamsDto.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject invalid CUID format', () => {
        const invalidData = { id: 'invalid-id' }

        const result = CategoryParamsDto.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['id'],
              message: 'Invalid category ID format'
            })
          )
        }
      })
    })

    describe('CategoryQueryDto', () => {
      it('should validate and transform query parameters', () => {
        const validData = {
          limit: '25',
          offset: '10',
          includeEmails: 'true'
        }

        const result = CategoryQueryDto.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual({
            limit: 25,
            offset: 10,
            includeEmails: true
          })
        }
      })

      it('should reject invalid limit value', () => {
        const invalidData = {
          limit: '0' // Below minimum
        }

        const result = CategoryQueryDto.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject non-numeric limit', () => {
        const invalidData = {
          limit: 'abc'
        }

        const result = CategoryQueryDto.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })
  })
})