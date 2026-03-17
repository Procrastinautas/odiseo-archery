import type { Metadata } from 'next'
import { Outfit, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
})

const sourceSans3 = Source_Sans_3({
  variable: '--font-source-sans-3',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Odiseo Archery',
  description: 'Tu plataforma de arquería',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${outfit.variable} ${sourceSans3.variable}`}>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
