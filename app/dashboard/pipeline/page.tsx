import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { STAGES, type Stage } from '@/types/database'

type DealWithContact = {
  id: string
  title: string
  value: number
  stage: Stage
  contacts: { name: string } | null
}

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('deals')
    .select('id, title, value, stage, contacts(name)')
    .order('created_at', { ascending: false })

  const deals = (data ?? []) as unknown as DealWithContact[]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Pipeline de vendas</h1>
        <Link
          href="/dashboard/pipeline/novo"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Novo negócio
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => (
          <div key={stage.value} className="rounded-lg bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">{stage.label}</h2>
            <div className="space-y-3">
              {deals
                .filter((deal) => deal.stage === stage.value)
                .map((deal) => (
                  <div key={deal.id} className="rounded border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">{deal.title}</p>
                    <p className="text-xs text-slate-500">{deal.contacts?.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(deal.value)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
