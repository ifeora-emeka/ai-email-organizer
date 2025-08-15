import { Request, Response } from 'express'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { AuthenticatedRequest } from '../../middleware/auth.middleware'
import { GoogleAuthData, RefreshTokenData } from './auth.dto'

export class AuthController {
  static async getSession(req: Request, res: Response) {
    try {
      const session = await getServerSession(req, res, authOptions)

      if (!session?.user) {
        return res.status(401).json({
          success: false,
          error: 'No active session'
        })
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image
          },
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        },
        message: 'Session retrieved successfully'
      })
    } catch (error) {
      console.error('Error getting session:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to get session'
      })
    }
  }

  static async googleSignIn(req: Request & { body: GoogleAuthData }, res: Response) {
    try {
      // OAuth is handled by NextAuth, this endpoint is not needed
      return res.status(405).json({
        success: false,
        error: 'Use /api/auth/signin/google for Google authentication'
      })
    } catch (error) {
      console.error('Error with Google sign-in:', error)
      return res.status(500).json({
        success: false,
        error: 'Google sign-in failed'
      })
    }
  }

  static async signOut(req: AuthenticatedRequest, res: Response) {
    try {
      // Sign out is handled by NextAuth at /api/auth/signout
      return res.status(405).json({
        success: false,
        error: 'Use /api/auth/signout for signing out'
      })
    } catch (error) {
      console.error('Error signing out:', error)
      return res.status(500).json({
        success: false,
        error: 'Sign out failed'
      })
    }
  }

  static async refreshToken(req: Request & { body: RefreshTokenData }, res: Response) {
    try {
      const { refreshToken } = req.body

      return res.status(501).json({
        success: false,
        error: 'Token refresh not implemented yet'
      })
    } catch (error) {
      console.error('Error refreshing token:', error)
      return res.status(500).json({
        success: false,
        error: 'Token refresh failed'
      })
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!

      return res.status(200).json({
        success: true,
        data: { user },
        message: 'Profile retrieved successfully'
      })
    } catch (error) {
      console.error('Error getting profile:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      })
    }
  }
}