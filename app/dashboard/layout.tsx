import Link from 'next/link'
import { logout } from './actions'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex gap-6">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            Visão geral
          </Link>
          <Link href="/dashboard/contatos" className="text-slate-600">
            Contatos
          </Link>
          <Link href="/dashboard/pipeline" className="text-slate-600">
            Pipeline
          </Link>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-slate-600 hover:text-slate-900">
            Sair
          </button>
        </form>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
