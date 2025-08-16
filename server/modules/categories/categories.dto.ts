import { z } from 'zod'

export const CreateCategoryDto = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().min(1, 'Category description is required').max(500, 'Description too long'),
  color: z.string().regex(/^bg-(blue|green|purple|orange|pink|indigo|red|yellow|teal|cyan|gray|slate)-500$/, 'Invalid color format')
})

export const UpdateCategoryDto = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long').optional(),
  description: z.string().min(1, 'Category description is required').max(500, 'Description too long').optional(),
  color: z.string().regex(/^bg-(blue|green|purple|orange|pink|indigo|red|yellow|teal|cyan|gray|slate)-500$/, 'Invalid color format').optional()
})

export const CategoryParamsDto = z.object({
  id: z.string().cuid('Invalid category ID format')
})

export const CategoryQueryDto = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
  includeEmails: z.enum(['true', 'false']).transform(val => val === 'true').optional()
})

export type CreateCategoryData = z.infer<typeof CreateCategoryDto>
export type UpdateCategoryData = z.infer<typeof UpdateCategoryDto>
export type CategoryParams = z.infer<typeof CategoryParamsDto>
export type CategoryQuery = z.infer<typeof CategoryQueryDto>