import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string
    accessToken?: string
    refreshToken?: string
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email", 
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify"
          ].join(" "),
          access_type: "offline",
          prompt: "consent"
        }
      }
    })
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      if (account?.provider === "google" && profile) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email as string }
          })

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                id: user.id || crypto.randomUUID(),
                email: profile.email as string,
                name: profile.name as string || null,
                image: (profile as any).picture as string || null,
                emailVerified: (profile as any).email_verified ? new Date() : null
              }
            })

            if (account.access_token) {
              await prisma.account.create({
                data: {
                  userId: newUser.id,
                  type: account.type || 'oauth',
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token
                }
              })
            }
          } else {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId
                }
              },
              update: {
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token
              },
              create: {
                userId: existingUser.id,
                type: account.type || 'oauth',
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token
              }
            })
          }
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })
        
        if (user) {
          session.user.id = user.id
          session.user.name = user.name || undefined
          session.user.image = user.image || undefined
        }
      }
      return session
    },
    jwt: async ({ user, token, account }) => {
      if (user) {
        token.uid = user.id
      }
      
      if (account?.provider === "google") {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      
      return token
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt"
  }
})
