import { z } from 'zod'

export const GoogleAuthDto = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  idToken: z.string().min(1, 'ID token is required'),
  scope: z.string().optional()
})

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export const LogoutDto = z.object({
  token: z.string().min(1, 'Token is required')
})

export type GoogleAuthData = z.infer<typeof GoogleAuthDto>
export type RefreshTokenData = z.infer<typeof RefreshTokenDto>
export type LogoutData = z.infer<typeof LogoutDto>
