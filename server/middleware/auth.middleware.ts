import { Request, Response, NextFunction } from 'express'
import { prisma } from '../../lib/prisma'

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string
        email: string
        name?: string | null
        image?: string | null
    }
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userEmail = req.headers['x-user-email'] as string
        
        if (!userEmail) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            })
        }

        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            })
        }

        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
        }

        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        })
    }
}

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userEmail = req.headers['x-user-email'] as string
        
        if (userEmail) {
            const user = await prisma.user.findUnique({
                where: { email: userEmail }
            })

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image
                }
            }
        }

        next()
    } catch (error) {
        console.error('Optional auth middleware error:', error)
        next()
    }
}
