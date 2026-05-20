'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/app/actions/auth'
import { RegisterSchema, type RegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  if (state?.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>¡Revisá tu email!</CardTitle>
            <CardDescription>
              Enviamos un link de verificación a{' '}
              <strong>{state.data.email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Una vez verificado tu email podés iniciar sesión.
            </p>
            <Link href="/login" className="mt-4 inline-block underline underline-offset-4 text-sm">
              Ir al login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>PRODE Mundial FIFA 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form action={action} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu nombre"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {state && !state.ok && (
                <p className="text-sm font-medium text-destructive">{state.error}</p>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Iniciá sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
