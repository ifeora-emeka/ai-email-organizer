import { z } from 'zod'

export const CreateGmailAccountDto = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  scope: z.string().optional()
})

export const UpdateGmailAccountDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  isActive: z.boolean().optional(),
  accessToken: z.string().min(1, 'Access token is required').optional(),
  refreshToken: z.string().optional(),
  scope: z.string().optional()
})

export const GmailAccountParamsDto = z.object({
  id: z.string().cuid('Invalid gmail account ID format')
})

export const GmailAccountQueryDto = z.object({
  includeStats: z.enum(['true', 'false']).transform(val => val === 'true').optional()
})

export type CreateGmailAccountData = z.infer<typeof CreateGmailAccountDto>
export type UpdateGmailAccountData = z.infer<typeof UpdateGmailAccountDto>
export type GmailAccountParams = z.infer<typeof GmailAccountParamsDto>
export type GmailAccountQuery = z.infer<typeof GmailAccountQueryDto>
