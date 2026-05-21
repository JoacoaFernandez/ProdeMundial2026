'use server'

import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'
import { RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@/lib/validations/auth'
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
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const user = await db.user.create({
    data: { name, email, passwordHash, emailVerified: null },
    select: { id: true },
  })

  await db.verificationToken.create({
    data: { identifier: email, token, expires, userId: user.id },
  })

  try {
    await sendVerificationEmail(email, name, token)
  } catch {
    // Email falla silenciosamente — el token ya está guardado
  }

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

type ForgotState = ApiResponse<{ email: string }> | undefined

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, error: 'Ingresá un email válido.' }
  }

  const { email } = parsed.data
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, passwordHash: true },
  })

  // Siempre respondemos ok para no revelar si el email existe
  if (!user || !user.passwordHash) {
    return { ok: true, data: { email } }
  }

  // Borrar tokens anteriores del mismo email
  await db.passwordResetToken.deleteMany({ where: { identifier: email } })

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await db.passwordResetToken.create({
    data: { identifier: email, token, expires, userId: user.id },
  })

  try {
    await sendPasswordResetEmail(email, user.name, token)
  } catch {
    // silencioso
  }

  return { ok: true, data: { email } }
}

type ResetState = ApiResponse<null> | undefined

export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = formData.get('token') as string
  const parsed = ResetPasswordSchema.safeParse({ password: formData.get('password') })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Contraseña inválida.' }
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.expires < new Date()) {
    return { ok: false, error: 'El link es inválido o ya expiró.' }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await db.user.update({
    where: { email: record.identifier },
    data: { passwordHash },
  })

  await db.passwordResetToken.delete({ where: { token } })

  return { ok: true, data: null }
}
