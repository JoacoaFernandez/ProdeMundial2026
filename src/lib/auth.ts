import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
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

// JWT augmentation through @auth/core
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

        if (!user || !user.emailVerified) return null

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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
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
