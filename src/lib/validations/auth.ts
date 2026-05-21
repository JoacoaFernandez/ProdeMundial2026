import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2, { error: 'El nombre debe tener al menos 2 caracteres.' }).trim(),
  email: z.email({ error: 'Ingresá un email válido.' }).trim(),
  password: z
    .string()
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres.' })
    .regex(/[a-zA-Z]/, { error: 'Debe contener al menos una letra.' })
    .regex(/[0-9]/, { error: 'Debe contener al menos un número.' })
    .trim(),
})

export const LoginSchema = z.object({
  email: z.email({ error: 'Ingresá un email válido.' }).trim(),
  password: z.string().min(1, { error: 'Ingresá tu contraseña.' }),
})

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: 'Ingresá un email válido.' }).trim(),
})

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres.' })
    .regex(/[a-zA-Z]/, { error: 'Debe contener al menos una letra.' })
    .regex(/[0-9]/, { error: 'Debe contener al menos un número.' })
    .trim(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
