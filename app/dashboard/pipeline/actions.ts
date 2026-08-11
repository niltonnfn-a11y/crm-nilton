'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Stage } from '@/types/database'

export async function createDeal(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('deals').insert({
    user_id: user!.id,
    contact_id: formData.get('contact_id') as string,
    title: formData.get('title') as string,
    value: Number(formData.get('value')),
    stage: 'novo',
  })

  redirect('/dashboard/pipeline')
}

export async function moveDealStage(dealId: string, stage: Stage) {
  const supabase = await createClient()
  await supabase
    .from('deals')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', dealId)

  revalidatePath('/dashboard/pipeline')
  revalidatePath('/dashboard')
}
