import { CategoryService, CreateCategoryData } from '../../lib/services/category.service'
import { testUser, testCategory, testEmail } from './setup'
import { prisma } from '../../lib/prisma'

jest.mock('../../lib/prisma')
const mockPrisma = prisma as any

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      const createData: CreateCategoryData = {
        userId: testUser.id,
        name: 'Test Category',
        description: 'Test description',
        color: 'bg-blue-500'
      }

      const expectedCategory = {
        ...testCategory,
        ...createData
      }

      mockPrisma.category.create.mockResolvedValue(expectedCategory)

      const result = await CategoryService.createCategory(createData)

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          name: createData.name,
          description: createData.description,
          color: createData.color
        }
      })
      expect(result).toEqual(expectedCategory)
    })

    it('should handle database errors during creation', async () => {
      const createData: CreateCategoryData = {
        userId: testUser.id,
        name: 'Test Category',
        description: 'Test description',
        color: 'bg-blue-500'
      }

      const dbError = new Error('Database constraint violation')
      mockPrisma.category.create.mockRejectedValue(dbError)

      await expect(CategoryService.createCategory(createData)).rejects.toThrow('Database constraint violation')
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: createData
      })
    })
  })

  describe('getCategoriesByUserId', () => {
    it('should return categories for a specific user', async () => {
      const mockCategories = [
        { ...testCategory, _count: { emails: 5 } },
        { ...testCategory, id: 'category-2', name: 'Work', _count: { emails: 10 } }
      ]

      mockPrisma.category.findMany.mockResolvedValue(mockCategories)

      const result = await CategoryService.getCategoriesByUserId(testUser.id)

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { emails: true }
          }
        }
      })
      expect(result).toEqual(mockCategories)
      expect(result).toHaveLength(2)
      expect(result[0]._count.emails).toBe(5)
      expect(result[1]._count.emails).toBe(10)
    })

    it('should return empty array when user has no categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([])

      const result = await CategoryService.getCategoriesByUserId('user-with-no-categories')

      expect(result).toEqual([])
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-with-no-categories' },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { emails: true }
          }
        }
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.category.findMany.mockRejectedValue(dbError)

      await expect(CategoryService.getCategoriesByUserId(testUser.id)).rejects.toThrow('Database connection failed')
    })
  })

  describe('getCategoryById', () => {
    it('should return category by ID with email count', async () => {
      const mockCategory = {
        ...testCategory,
        _count: { emails: 3 }
      }

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)

      const result = await CategoryService.getCategoryById(testCategory.id)

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: testCategory.id },
        include: {
          _count: {
            select: { emails: true }
          }
        }
      })
      expect(result).toEqual(mockCategory)
      expect(result?._count.emails).toBe(3)
    })

    it('should return null when category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)

      const result = await CategoryService.getCategoryById('non-existent-id')

      expect(result).toBeNull()
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          _count: {
            select: { emails: true }
          }
        }
      })
    })
  })

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Category Name',
        color: 'bg-green-500'
      }

      const updatedCategory = {
        ...testCategory,
        ...updateData,
        updatedAt: new Date()
      }

      mockPrisma.category.update.mockResolvedValue(updatedCategory)

      const result = await CategoryService.updateCategory(testCategory.id, updateData)

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: testCategory.id },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(updatedCategory)
      expect(result.name).toBe('Updated Category Name')
      expect(result.color).toBe('bg-green-500')
    })

    it('should handle partial updates', async () => {
      const updateData = {
        description: 'Updated description only'
      }

      const updatedCategory = {
        ...testCategory,
        description: updateData.description,
        updatedAt: new Date()
      }

      mockPrisma.category.update.mockResolvedValue(updatedCategory)

      const result = await CategoryService.updateCategory(testCategory.id, updateData)

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: testCategory.id },
        data: {
          description: 'Updated description only',
          updatedAt: expect.any(Date)
        }
      })
      expect(result.description).toBe('Updated description only')
    })

    it('should handle update errors', async () => {
      const updateData = { name: 'Updated Name' }
      const dbError = new Error('Category not found')
      mockPrisma.category.update.mockRejectedValue(dbError)

      await expect(CategoryService.updateCategory('non-existent-id', updateData)).rejects.toThrow('Category not found')
    })
  })

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockPrisma.category.delete.mockResolvedValue(testCategory)

      await CategoryService.deleteCategory(testCategory.id)

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: testCategory.id }
      })
    })

    it('should handle deletion errors', async () => {
      const dbError = new Error('Category not found or has dependencies')
      mockPrisma.category.delete.mockRejectedValue(dbError)

      await expect(CategoryService.deleteCategory('non-existent-id')).rejects.toThrow('Category not found or has dependencies')
    })
  })

  describe('getCategoryWithEmails', () => {
    it('should return category with paginated emails', async () => {
      const mockEmails = [
        {
          ...testEmail,
          gmailAccount: {
            email: 'test@gmail.com',
            name: 'Test Account'
          }
        }
      ]

      const mockCategoryWithEmails = {
        ...testCategory,
        emails: mockEmails,
        _count: { emails: 1 }
      }

      mockPrisma.category.findUnique.mockResolvedValue(mockCategoryWithEmails)

      const result = await CategoryService.getCategoryWithEmails(testCategory.id, 10, 0)

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: testCategory.id },
        include: {
          emails: {
            orderBy: { receivedAt: 'desc' },
            take: 10,
            skip: 0,
            include: {
              gmailAccount: {
                select: {
                  email: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: { emails: true }
          }
        }
      })

      expect(result).toEqual(mockCategoryWithEmails)
      expect(result?.emails).toHaveLength(1)
      expect(result?.emails[0].gmailAccount.email).toBe('test@gmail.com')
    })

    it('should use default pagination parameters', async () => {
      const mockCategoryWithEmails = {
        ...testCategory,
        emails: [],
        _count: { emails: 0 }
      }

      mockPrisma.category.findUnique.mockResolvedValue(mockCategoryWithEmails)

      await CategoryService.getCategoryWithEmails(testCategory.id)

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: testCategory.id },
        include: {
          emails: {
            orderBy: { receivedAt: 'desc' },
            take: 50, // default limit
            skip: 0,  // default offset
            include: {
              gmailAccount: {
                select: {
                  email: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: { emails: true }
          }
        }
      })
    })

    it('should return null when category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)

      const result = await CategoryService.getCategoryWithEmails('non-existent-id', 10, 0)

      expect(result).toBeNull()
    })

    it('should handle custom pagination parameters', async () => {
      const customLimit = 25
      const customOffset = 50

      mockPrisma.category.findUnique.mockResolvedValue({
        ...testCategory,
        emails: [],
        _count: { emails: 0 }
      })

      await CategoryService.getCategoryWithEmails(testCategory.id, customLimit, customOffset)

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: testCategory.id },
        include: {
          emails: {
            orderBy: { receivedAt: 'desc' },
            take: customLimit,
            skip: customOffset,
            include: {
              gmailAccount: {
                select: {
                  email: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: { emails: true }
          }
        }
      })
    })
  })

  describe('Error handling', () => {
    it('should propagate Prisma constraint violations correctly', async () => {
      const createData: CreateCategoryData = {
        userId: testUser.id,
        name: 'Duplicate Category',
        description: 'Test description',
        color: 'bg-blue-500'
      }

      const constraintError = new Error('Unique constraint failed') as any
      constraintError.code = 'P2002'
      constraintError.meta = { target: ['userId', 'name'] }

      mockPrisma.category.create.mockRejectedValue(constraintError)

      await expect(CategoryService.createCategory(createData)).rejects.toMatchObject({
        code: 'P2002',
        meta: { target: ['userId', 'name'] }
      })
    })

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout')
      mockPrisma.category.findMany.mockRejectedValue(timeoutError)

      await expect(CategoryService.getCategoriesByUserId(testUser.id)).rejects.toThrow('Request timeout')
    })
  })
})