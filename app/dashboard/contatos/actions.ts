'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createContact(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('contacts').insert({
    user_id: user!.id,
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || null,
    company: (formData.get('company') as string) || null,
    notes: (formData.get('notes') as string) || null,
  })

  redirect('/dashboard/contatos')
}

export async function updateContact(id: string, formData: FormData) {
  const supabase = await createClient()

  await supabase
    .from('contacts')
    .update({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || null,
      company: (formData.get('company') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)

  redirect('/dashboard/contatos')
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  await supabase.from('contacts').delete().eq('id', id)
  redirect('/dashboard/contatos')
}
