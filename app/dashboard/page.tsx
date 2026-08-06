import { createClient } from '@/lib/supabase/server'
import { STAGES } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: contactsCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  const { data: deals } = await supabase.from('deals').select('stage')

  const dealsByStage = STAGES.map((stage) => ({
    ...stage,
    count: deals?.filter((d) => d.stage === stage.value).length ?? 0,
  }))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Visão geral</h1>
      <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Total de contatos</p>
        <p className="text-3xl font-bold text-slate-900">{contactsCount ?? 0}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {dealsByStage.map((stage) => (
          <div key={stage.value} className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{stage.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stage.count}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
