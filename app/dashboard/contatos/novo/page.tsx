import { createContact } from '../actions'

export default function NewContactPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo contato</h1>
      <form action={createContact} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
          <input name="name" required className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
          <input name="phone" className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
          <input name="company" className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
          <textarea name="notes" rows={3} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Salvar
        </button>
      </form>
    </div>
  )
}
