'use client'

import { useActionState, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { resetPasswordAction } from '@/app/actions/auth'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, action, pending] = useActionState(resetPasswordAction, undefined)
  const [showPassword, setShowPassword] = useState(false)

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-destructive">Link inválido.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Solicitar nuevo link
        </Link>
      </div>
    )
  }

  if (state?.ok) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold">¡Contraseña actualizada!</h1>
        <p className="mt-3 text-muted-foreground">Ya podés iniciar sesión con tu nueva contraseña.</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          Ir al login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Nueva contraseña</h1>
        <p className="mt-2 text-muted-foreground">Elegí una contraseña nueva para tu cuenta.</p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label className="mb-1.5 block text-sm font-medium">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
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
        </div>

        {state && !state.ok && (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
