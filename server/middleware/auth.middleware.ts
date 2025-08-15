import { Request, Response, NextFunction } from 'express'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'

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
        const session = await getServerSession(req, res, authOptions)

        if (!session?.user) {
            return res.status(401).json({
                error: 'Authentication required'
            })
        }

        req.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image
        }

        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({
            error: 'Internal Server Error'
        })
    }
}

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const session = await getServerSession(req, res, authOptions)

        if (session?.user) {
            req.user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                image: session.user.image
            }
        }

        next()
    } catch (error) {
        console.error('Optional auth middleware error:', error)
        next()
    }
}
