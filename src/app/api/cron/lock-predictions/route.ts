import { NextResponse } from 'next/server'

// El lock se valida server-side en cada POST de predicción comparando now() con match.lockAt.
// Este endpoint existe para que Vercel lo invoque y eventualmente enviar emails de recordatorio.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
