'use client'

import { Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { LoginSchema, type LoginInput } from '@/lib/validations/auth'

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-6">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginInput) {
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email o contraseña incorrectos.')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Bienvenido</h1>
          <p className="mt-2 text-muted-foreground">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Ingresa tu email"
              autoComplete="email"
              {...form.register('email')}
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
                autoComplete="current-password"
                {...form.register('password')}
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

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {form.formState.isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">O continúa con</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex w-full items-center justify-center rounded-2xl border border-input bg-input/30 py-3.5 hover:bg-input/50 disabled:opacity-60"
        >
          <GoogleIcon />
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Al iniciar sesión, aceptás nuestros{' '}
          <Link href="/terms" className="underline hover:text-foreground">Términos y Condiciones</Link>
          {' '}y la{' '}
          <Link href="/privacy" className="underline hover:text-foreground">Política de Privacidad</Link>
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
