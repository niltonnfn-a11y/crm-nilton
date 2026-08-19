import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateContact, deleteContact } from '../actions'

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: contact } = await supabase.from('contacts').select('*').eq('id', id).single()

  if (!contact) notFound()

  const updateContactWithId = updateContact.bind(null, id)
  const deleteContactWithId = deleteContact.bind(null, id)

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar contato</h1>
      <form action={updateContactWithId} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
          <input
            name="name"
            defaultValue={contact.name}
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
          <input
            name="email"
            type="email"
            defaultValue={contact.email}
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
          <input
            name="phone"
            defaultValue={contact.phone ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
          <input
            name="company"
            defaultValue={contact.company ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
          <textarea
            name="notes"
            defaultValue={contact.notes ?? ''}
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Salvar
        </button>
      </form>
      <form action={deleteContactWithId} className="mt-4">
        <button type="submit" className="text-sm text-red-600 hover:text-red-800">
          Excluir contato
        </button>
      </form>
    </div>
  )
}
