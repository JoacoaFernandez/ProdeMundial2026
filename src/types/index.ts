import type { Role } from '@/generated/prisma/enums'

export type { Role }

export type SessionUser = {
  id: string
  email: string
  name: string
  role: Role
  emailVerified: Date | null
}

export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }
