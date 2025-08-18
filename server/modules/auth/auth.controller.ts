import { Request, Response } from 'express';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';
import { GoogleSignInData } from './auth.dto';
import { google } from "googleapis";
import crypto from 'crypto';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'https://ai-email-organizer-1.onrender.com/api/v1/gmail-accounts/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

export class AuthController
{
  static async getSession(req: Request, res: Response)
  {
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token'
      });

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No session found'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          }
        }
      });
    } catch (error) {
      console.error('Session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session'
      });
    }
  }



  static async getDependencies(req: AuthenticatedRequest, res: Response)
  {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      const categories = await prisma.category.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      });

      const gmailAccounts = await prisma.gmailAccount.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      });

      const emailCounts = await prisma.email.groupBy({
        by: ['categoryId', 'gmailAccountId'],
        where: { 
          gmailAccount: {
            userId: user.id
          }
        },
        _count: true
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          },
          categories: categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            color: category.color,
            emailCount: emailCounts.filter(count => count.categoryId === category.id).reduce((sum, count) => sum + count._count, 0)
          })),
          gmailAccounts: gmailAccounts.map(account => ({
            id: account.id,
            email: account.email,
            name: account.name || account.email,
            isActive: account.isActive,
            lastSync: account.lastSync,
            emailCount: emailCounts.filter(count => count.gmailAccountId === account.id).reduce((sum, count) => sum + count._count, 0)
          }))
        }
      });
    } catch (error) {
      console.error('Dependencies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dependencies'
      });
    }
  }

  static async googleSignIn(req: Request & { body: GoogleSignInData; }, res: Response)
  {
    try {
      const { googleId, email, name, image } = req.body;

      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: googleId,
            email,
            name,
            image,
            emailVerified: new Date()
          }
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name,
            image
          }
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sign in with Google'
      });
    }
  }
}
