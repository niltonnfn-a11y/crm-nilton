export type Stage =
  | 'novo'
  | 'em_contato'
  | 'proposta_enviada'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

export interface Contact {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  notes: string | null
  created_at: string
}

export interface Deal {
  id: string
  user_id: string
  contact_id: string
  title: string
  value: number
  stage: Stage
  created_at: string
  updated_at: string
}

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'proposta_enviada', label: 'Proposta enviada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'perdido', label: 'Perdido' },
]
