'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidate() {
  revalidatePath('/profile')
  revalidatePath('/profile/edit')
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function updateProfile(data: { name?: string; picture_url?: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
  if (error) throw new Error(error.message)
  revalidate()
}

// ─── Bows ────────────────────────────────────────────────────────────────────

export async function addBow(data: {
  hand: 'left' | 'right'
  type: 'recurve' | 'compound' | 'barebow'
  draw_weight?: number | null
  notes?: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: bow, error } = await supabase
    .from('bows')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ user_id: user.id, ...data } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidate()
  return bow
}

export async function updateBow(
  id: string,
  data: {
    hand?: 'left' | 'right'
    type?: 'recurve' | 'compound' | 'barebow'
    draw_weight?: number | null
    notes?: string | null
  },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('bows')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(data as any)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidate()
}

export async function deleteBow(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('bows')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidate()
}

// ─── Scope Marks ─────────────────────────────────────────────────────────────

export async function addScopeMark(data: {
  bow_id: string
  distance: number
  mark_value: string
  notes?: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Verify bow ownership before inserting
  const { data: bow } = await supabase
    .from('bows')
    .select('id')
    .eq('id', data.bow_id)
    .eq('user_id', user.id)
    .single()

  if (!bow) throw new Error('Arco no encontrado')

  const { data: mark, error } = await supabase
    .from('scope_marks')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidate()
  return mark
}

export async function deleteScopeMark(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // RLS policy enforces ownership via bow relationship
  const { error } = await supabase.from('scope_marks').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidate()
}

// ─── Arrows ──────────────────────────────────────────────────────────────────

export async function addArrow(data: {
  brand: string
  diameter_mm?: number | null
  fletchings?: string | null
  shaft_material?: string | null
  point_type?: string | null
  notes?: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: arrow, error } = await supabase
    .from('arrows')
    .insert({ user_id: user.id, ...data })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidate()
  return arrow
}

export async function updateArrow(
  id: string,
  data: {
    brand?: string
    diameter_mm?: number | null
    fletchings?: string | null
    shaft_material?: string | null
    point_type?: string | null
    notes?: string | null
  },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('arrows')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidate()
}

export async function deleteArrow(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('arrows')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidate()
}
