import type { Metadata } from 'next'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import '@fontsource/newsreader/latin-500.css'
import '@fontsource/newsreader/latin-600.css'
import '@fontsource/newsreader/latin-600-italic.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agenda — Turnos',
  description: 'Mostrador de turnos de la secretaría',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
