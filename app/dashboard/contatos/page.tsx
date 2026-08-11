import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false })

  if (q) {
    const escapedQ = q.replace(/[,()%_.*\\]/g, (c) => `\\${c}`)
    query = query.or(`name.ilike.%${escapedQ}%,email.ilike.%${escapedQ}%`)
  }

  const { data: contacts } = await query

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Contatos</h1>
        <Link
          href="/dashboard/contatos/novo"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Novo contato
        </Link>
      </div>
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou email"
          className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </form>
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact.id} className="border-b last:border-0">
                <td className="px-4 py-3">{contact.name}</td>
                <td className="px-4 py-3">{contact.email}</td>
                <td className="px-4 py-3">{contact.company}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/contatos/${contact.id}`}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {contacts?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum contato encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
