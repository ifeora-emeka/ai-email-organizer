import { Request, Response } from 'express'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../lib/prisma'
import { GoogleSignInData } from './auth.dto'

export class AuthController {
  static async getSession(req: Request, res: Response) {
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token'
      })

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No session found'
        })
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub }
      })

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        })
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
      })
    } catch (error) {
      console.error('Session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get session'
      })
    }
  }

  static async googleSignIn(req: Request & { body: GoogleSignInData }, res: Response) {
    try {
      const { googleId, email, name, image } = req.body

      let user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: googleId,
            email,
            name,
            image,
            emailVerified: new Date()
          }
        })
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name,
            image
          }
        })
      }

      res.json({
        success: true,
        data: { user }
      })
    } catch (error) {
      console.error('Google sign-in error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to sign in with Google'
      })
    }
  }
}