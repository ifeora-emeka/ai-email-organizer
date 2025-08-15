import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
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
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No authorization token provided'
            })
        }

        const token = authHeader.substring(7)

        try {
            const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any

            if (!decoded.sub) {
                return res.status(401).json({
                    error: 'Invalid token format'
                })
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.sub },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    image: true
                }
            })

            if (!user) {
                return res.status(401).json({
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
        } catch (authError) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            })
        }
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({
            error: 'Internal Server Error'
        })
    }
}

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next()
        }

        const token = authHeader.substring(7)

        try {
            const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any

            if (decoded.sub) {
                const user = await prisma.user.findUnique({
                    where: { id: decoded.sub },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true
                    }
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
        } catch (authError) {
            console.warn('Optional auth failed:', authError)
        }

        next()
    } catch (error) {
        console.error('Optional auth middleware error:', error)
        next()
    }
}
