'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { registerAction } from '@/app/actions/auth'
import { RegisterSchema, type RegisterInput } from '@/lib/validations/auth'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  if (state?.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold">¡Revisá tu email!</h1>
          <p className="mt-3 text-muted-foreground">
            Enviamos un link de verificación a{' '}
            <strong className="text-foreground">{state.data.email}</strong>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Una vez verificado podés iniciar sesión.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Crear cuenta</h1>
          <p className="mt-2 text-muted-foreground">Registrate para jugar</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nombre</label>
            <input
              placeholder="Tu nombre"
              autoComplete="name"
              {...form.register('name')}
              name="name"
              className="w-full rounded-2xl border border-input bg-input/30 px-4 py-3.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...form.register('email')}
              name="email"
              className="w-full rounded-2xl border border-input bg-input/30 px-4 py-3.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                autoComplete="new-password"
                {...form.register('password')}
                name="password"
                className="w-full rounded-2xl border border-input bg-input/30 px-4 py-3.5 pr-12 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          {state && !state.ok && (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Al registrarte, aceptás nuestros{' '}
          <Link href="/terms" className="underline hover:text-foreground">Términos y Condiciones</Link>
          {' '}y la{' '}
          <Link href="/privacy" className="underline hover:text-foreground">Política de Privacidad</Link>
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
