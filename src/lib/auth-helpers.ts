'use client'

import { supabase } from '@/lib/supabase'

export async function logActivity(
  action: string,
  details?: Record<string, any>
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    user_email: user.email,
    user_type: 'user',
    action,
    details: details ?? {},
  })
}

export async function logLogin(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('login_history').insert({
    user_id: user.id,
    email: user.email,
    user_agent: navigator.userAgent,
  })
}

export async function getCurrentUser(): Promise<{
  user: { id: string; email: string }
  profile: Record<string, any>
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user: { id: user.id, email: user.email! }, profile }
}

export async function getUserPurchases(userId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addPurchase(
  userId: string,
  item: {
    item_type: string
    item_id: string
    item_name: string
    item_slug: string
    download_url: string
    key_code?: string
  }
) {
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      item_type: item.item_type,
      item_id: item.item_id,
      item_name: item.item_name,
      item_slug: item.item_slug,
      download_url: item.download_url,
      key_code: item.key_code ?? null,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function isAuthenticated(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return !!session
}

export async function getLoginHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateUserProfile(
  userId: string,
  data: { full_name?: string; phone?: string; email?: string }
) {
  const { data: updated, error } = await supabase
    .from('user_profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return updated
}
