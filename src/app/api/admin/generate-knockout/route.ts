import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  generateR32,
  generateR16,
  generateQF,
  generateSF,
  generateFinalAndThird,
} from '@/lib/generate-knockout'

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 })
  }

  const { round } = await request.json() as { round: string }

  let result
  if (round === 'R32') result = await generateR32()
  else if (round === 'R16') result = await generateR16()
  else if (round === 'QF') result = await generateQF()
  else if (round === 'SF') result = await generateSF()
  else if (round === 'FINAL') result = await generateFinalAndThird()
  else return NextResponse.json({ ok: false, error: 'Ronda inválida' }, { status: 400 })

  return NextResponse.json({ ok: true, round, ...result })
}
