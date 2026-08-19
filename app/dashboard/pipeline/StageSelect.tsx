'use client'

import { useTransition } from 'react'
import { moveDealStage } from './actions'
import { STAGES, type Stage } from '@/types/database'

export function StageSelect({ dealId, currentStage }: { dealId: string; currentStage: Stage }) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      defaultValue={currentStage}
      disabled={isPending}
      onChange={(e) => startTransition(() => moveDealStage(dealId, e.target.value as Stage))}
      className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"
    >
      {STAGES.map((stage) => (
        <option key={stage.value} value={stage.value}>
          {stage.label}
        </option>
      ))}
    </select>
  )
}
