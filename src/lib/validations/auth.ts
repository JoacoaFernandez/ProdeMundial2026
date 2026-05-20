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

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
