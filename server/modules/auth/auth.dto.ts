import { z } from 'zod'

export const GoogleSignInDto = z.object({
  googleId: z.string().min(1, 'Google ID is required'),
  email: z.string().email('Valid email is required'),
  name: z.string().optional(),
  image: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional()
})

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export const LogoutDto = z.object({
  token: z.string().min(1, 'Token is required')
})

export type GoogleSignInData = z.infer<typeof GoogleSignInDto>
export type RefreshTokenData = z.infer<typeof RefreshTokenDto>
export type LogoutData = z.infer<typeof LogoutDto>
