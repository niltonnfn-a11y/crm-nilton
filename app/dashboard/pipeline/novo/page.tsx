import { createClient } from '@/lib/supabase/server'
import { createDeal } from '../actions'

export default async function NewDealPage() {
  const supabase = await createClient()
  const { data: contacts } = await supabase.from('contacts').select('id, name').order('name')

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo negócio</h1>
      <form action={createDeal} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contato *</label>
          <select
            name="contact_id"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Selecione um contato</option>
            {contacts?.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
          <input name="title" required className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Valor (R$) *</label>
          <input
            name="value"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Salvar
        </button>
      </form>
    </div>
  )
}
