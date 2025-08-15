import { Request, Response } from 'express'
import { auth, signIn, signOut } from '../../../lib/auth'
import { AuthenticatedRequest } from '../../middleware/auth.middleware'
import { GoogleAuthData, RefreshTokenData } from './auth.dto'

export class AuthController {
  static async getSession(req: Request, res: Response) {
    try {
      const session = await auth()

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
          }
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
      const { accessToken, refreshToken, idToken, scope } = req.body

      const result = await signIn('google', {
        accessToken,
        refreshToken,
        idToken,
        scope,
        redirect: false
      })

      if (!result) {
        return res.status(401).json({
          success: false,
          error: 'Google authentication failed'
        })
      }

      return res.status(200).json({
        success: true,
        data: { 
          sessionToken: result,
          redirectUrl: '/'
        },
        message: 'Google sign-in successful'
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
      await signOut({ redirect: false })

      return res.status(200).json({
        success: true,
        message: 'Signed out successfully'
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