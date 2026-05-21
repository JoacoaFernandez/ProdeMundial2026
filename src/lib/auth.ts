import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { LoginSchema } from './validations/auth'
import type { Role } from '@/generated/prisma/enums'

declare module 'next-auth' {
  interface User {
    role: Role
  }
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            emailVerified: true,
          },
        })

        if (!user) return null
        if (!user.passwordHash) return null
        if (!user.emailVerified) return null

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        )
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email!
        const name = user.name ?? email.split('@')[0]

        let dbUser = await db.user.findUnique({
          where: { email },
          select: { id: true, role: true, emailVerified: true },
        })

        if (!dbUser) {
          dbUser = await db.user.create({
            data: { email, name, emailVerified: new Date(), passwordHash: null },
            select: { id: true, role: true, emailVerified: true },
          })
        } else if (!dbUser.emailVerified) {
          await db.user.update({
            where: { id: dbUser.id },
            data: { emailVerified: new Date() },
          })
        }

        user.id = dbUser.id
        user.role = dbUser.role
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      if (token.id && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        })
        if (dbUser) token.role = dbUser.role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
})
