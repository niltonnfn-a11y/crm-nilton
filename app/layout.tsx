import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Sistema de CRM pessoal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}
