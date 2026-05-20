import { verifyEmailAction } from '@/app/actions/auth'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>No se encontró el token de verificación.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Volver al registro
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = await verifyEmailAction(token)

  if (!result.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Error de verificación</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Registrarse de nuevo
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>¡Email verificado!</CardTitle>
          <CardDescription>
            Bienvenido/a, {result.data.name}. Tu cuenta está activa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Iniciar sesión
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
