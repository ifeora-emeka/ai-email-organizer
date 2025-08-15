import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      name?: string
      image?: string
    }
    accessToken?: string
    refreshToken?: string
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
    uid?: string
    accessToken?: string
    refreshToken?: string
  }
}

export {}
