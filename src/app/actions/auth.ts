'use server'

import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { RegisterSchema } from '@/lib/validations/auth'
import type { ApiResponse } from '@/types'

type RegisterState = ApiResponse<{ email: string }> | undefined

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    return { ok: false, error: firstError }
  }

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { ok: false, error: 'Ya existe una cuenta con ese email.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await db.user.create({
    data: { name, email, passwordHash, emailVerified: new Date() },
    select: { id: true },
  })

  return { ok: true, data: { email } }
}

export async function verifyEmailAction(
  token: string,
): Promise<ApiResponse<{ name: string }>> {
  const record = await db.verificationToken.findUnique({ where: { token } })

  if (!record || record.expires < new Date()) {
    return { ok: false, error: 'Token inválido o expirado.' }
  }

  const user = await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
    select: { name: true },
  })

  await db.verificationToken.delete({ where: { token } })

  return { ok: true, data: { name: user.name } }
}
