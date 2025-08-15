import { prisma } from '../prisma'
import { Category } from '@prisma/client'

export interface CreateCategoryData {
  userId: string
  name: string
  description: string
  color: string
}

export class CategoryService {
  static async createCategory(data: CreateCategoryData): Promise<Category> {
    return await prisma.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        color: data.color
      }
    })
  }

  static async getCategoriesByUserId(userId: string): Promise<Category[]> {
    return await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { emails: true }
        }
      }
    })
  }

  static async getCategoryById(id: string): Promise<Category | null> {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { emails: true }
        }
      }
    })
  }

  static async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return await prisma.category.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  static async deleteCategory(id: string): Promise<void> {
    await prisma.category.delete({
      where: { id }
    })
  }

  static async getCategoryWithEmails(id: string, limit: number = 50, offset: number = 0) {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        emails: {
          orderBy: { receivedAt: 'desc' },
          take: limit,
          skip: offset,
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
  }
}
