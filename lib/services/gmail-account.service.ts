import { prisma } from '../prisma'
import { User, GmailAccount } from '@prisma/client'

export interface CreateGmailAccountData {
  userId: string
  email: string
  name?: string
  accessToken: string
  refreshToken?: string
  scope?: string
}

export class GmailAccountService {
  static async createGmailAccount(data: CreateGmailAccountData): Promise<GmailAccount> {
    return await prisma.gmailAccount.create({
      data: {
        userId: data.userId,
        email: data.email,
        name: data.name,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        scope: data.scope,
        isActive: true,
        lastSync: new Date()
      }
    })
  }

  static async getGmailAccountsByUserId(userId: string): Promise<GmailAccount[]> {
    return await prisma.gmailAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getGmailAccountById(id: string): Promise<GmailAccount | null> {
    return await prisma.gmailAccount.findUnique({
      where: { id }
    })
  }

  static async updateGmailAccount(id: string, data: Partial<GmailAccount>): Promise<GmailAccount> {
    return await prisma.gmailAccount.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  static async deleteGmailAccount(id: string): Promise<void> {
    await prisma.gmailAccount.delete({
      where: { id }
    })
  }

  static async updateLastSync(id: string): Promise<GmailAccount> {
    return await prisma.gmailAccount.update({
      where: { id },
      data: {
        lastSync: new Date(),
        updatedAt: new Date()
      }
    })
  }

  static async setActiveStatus(id: string, isActive: boolean): Promise<GmailAccount> {
    return await prisma.gmailAccount.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date()
      }
    })
  }
}
