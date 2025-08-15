import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

console.log('🔧 Auth config loading...')
console.log('🔧 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing')
console.log('🔧 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing')
console.log('🔧 NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Present' : 'Missing')
console.log('🔧 NEXTAUTH_URL:', process.env.NEXTAUTH_URL)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          prompt: "consent"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback triggered')
      console.log('🔐 Provider:', account?.provider)
      console.log('🔐 User email:', user?.email)
      
      if (account?.provider === "google" && profile) {
        console.log('✅ Google sign-in successful')
        return true
      }
      console.log('❌ Sign-in failed - invalid provider or missing profile')
      return false
    },
    async session({ session, token, user }) {
      console.log('🔐 Session callback triggered')
      
      if (session?.user) {
        session.user.id = user?.id || token?.sub || ''
        
        try {
          // Get access token from account
          const account = await prisma.account.findFirst({
            where: {
              userId: user?.id || token?.sub,
              provider: 'google'
            }
          })
          
          if (account) {
            session.accessToken = account.access_token || undefined
            session.refreshToken = account.refresh_token || undefined
            console.log('✅ Session tokens loaded from database')
          } else {
            console.log('⚠️ No account found for user')
          }
        } catch (error) {
          console.error('❌ Error loading account tokens:', error)
        }
      }
      return session
    },
    async jwt({ token, account, user }) {
      console.log('🔐 JWT callback triggered')
      
      if (account?.provider === "google") {
        console.log('✅ JWT updated with Google tokens')
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      
      if (user) {
        token.sub = user.id
      }
      
      return token
    }
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('❌ NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('⚠️ NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 NextAuth Debug:', code, metadata)
      }
    }
  }
}

export default NextAuth(authOptions)
