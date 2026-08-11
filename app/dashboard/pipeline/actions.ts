'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
