import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  //@ts-ignore
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    error: '/auth/error',
  },
  callbacks: {
    // Remove the custom signIn callback - let PrismaAdapter handle user creation
    async session({ session, token })
    {
      // For JWT sessions
      if (session?.user && token) {
        session.user.id = token.sub || '';
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, account, user })
    {
      // This callback is less relevant when using database sessions with PrismaAdapter
      if (user) {
        token.sub = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    }
  },
  // If you prefer JWT sessions, use this instead:
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === 'development'
};

export default NextAuth(authOptions);
