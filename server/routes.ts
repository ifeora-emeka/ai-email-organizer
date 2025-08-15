import { Router } from 'express'
import { authRouter } from './modules/auth/auth.route'
import { categoriesRouter } from './modules/categories/categories.route'
import { gmailAccountsRouter } from './modules/gmail-accounts/gmail-accounts.route'

export const apiRoutes = Router()

apiRoutes.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    service: 'ai-email-organizer'
  })
})

apiRoutes.get('/ping', (req, res) => {
  res.status(200).send('pong')
})

apiRoutes.use('/auth', authRouter)
apiRoutes.use('/categories', categoriesRouter)
apiRoutes.use('/gmail-accounts', gmailAccountsRouter)
