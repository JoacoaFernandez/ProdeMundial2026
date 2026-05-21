'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined)

  if (state?.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold">Revisá tu email</h1>
          <p className="mt-3 text-muted-foreground">
            Si existe una cuenta para <strong className="text-foreground">{state.data.email}</strong>,
            te mandamos un link para resetear tu contraseña.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
            Volver al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">¿Olvidaste tu contraseña?</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresá tu email y te mandamos un link para resetearla.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-input bg-input/30 px-4 py-3.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>

          {state && !state.ok && (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
