import { z } from 'zod'

export const EmailParamsDto = z.object({
  id: z.string().cuid('Invalid email ID format')
})

export const EmailQueryDto = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
  categoryId: z.string().cuid('Invalid category ID format').optional(),
  isRead: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  isArchived: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['receivedAt', 'subject', 'fromEmail']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional()
})

export const UpdateEmailDto = z.object({
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  categoryId: z.string().cuid('Invalid category ID format').nullable().optional()
})

export const BulkUpdateEmailDto = z.object({
  emailIds: z.array(z.string().cuid('Invalid email ID format')).min(1, 'At least one email ID is required'),
  updates: UpdateEmailDto
})

export type EmailParams = z.infer<typeof EmailParamsDto>
export type EmailQuery = z.infer<typeof EmailQueryDto>
export type UpdateEmailData = z.infer<typeof UpdateEmailDto>
export type BulkUpdateEmailData = z.infer<typeof BulkUpdateEmailDto>