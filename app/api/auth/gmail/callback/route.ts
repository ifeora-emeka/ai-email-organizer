import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=missing_code', request.url))
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${request.nextUrl.origin}/api/auth/gmail/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()

    // Get Gmail profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text())
      return NextResponse.redirect(new URL('/?error=profile_fetch_failed', request.url))
    }

    const profile = await profileResponse.json()

    // Check if Gmail account already exists
    const existingGmailAccount = await prisma.gmailAccount.findUnique({
      where: {
        userId_email: {
          userId: session.user.id,
          email: profile.email
        }
      }
    })

    if (existingGmailAccount) {
      // Update existing account
      await prisma.gmailAccount.update({
        where: { id: existingGmailAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingGmailAccount.refreshToken,
          scope: tokens.scope,
          name: profile.name || existingGmailAccount.name,
          isActive: true,
        }
      })
    } else {
      // Create new Gmail account
      await prisma.gmailAccount.create({
        data: {
          userId: session.user.id,
          email: profile.email,
          name: profile.name || null,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          scope: tokens.scope,
          isActive: true,
        }
      })
    }

    return NextResponse.redirect(new URL('/?gmail_connected=true', request.url))
  } catch (error) {
    console.error('Gmail OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url))
  }
}
