import type { Metadata } from 'next'
import { Anybody, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const anybody = Anybody({
  variable: '--font-anybody',
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'PRODE Mundial FIFA 2026',
  description: 'Pronosticá los partidos del Mundial 2026 y competí con tus amigos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${anybody.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
