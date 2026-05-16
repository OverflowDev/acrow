import { createClient } from '@supabase/supabase-js'
import type { ListingMeta, Profile, Message, Rating, Reputation } from '@/types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = url && key ? createClient(url, key) : null

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function fetchListingMeta(itemId: string): Promise<ListingMeta | null> {
  if (!supabase) return null
  const { data } = await supabase.from('listings').select('*').eq('id', itemId).single()
  return data as ListingMeta | null
}

export async function fetchAllListingMeta(itemIds: string[]): Promise<ListingMeta[]> {
  if (!supabase || itemIds.length === 0) return []
  const { data } = await supabase.from('listings').select('*').in('id', itemIds)
  return (data as ListingMeta[]) ?? []
}

export async function upsertListingMeta(meta: Omit<ListingMeta, 'created_at'>): Promise<void> {
  if (!supabase) return
  await supabase.from('listings').upsert(meta)
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function fetchProfile(address: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles').select('*').eq('address', address.toLowerCase()).single()
  return data as Profile | null
}

export async function upsertProfile(profile: Partial<Profile> & { address: string }): Promise<void> {
  if (!supabase) return
  await supabase.from('profiles').upsert({ ...profile, address: profile.address.toLowerCase() })
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function fetchMessages(escrowId: string): Promise<Message[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: true })
  return (data as Message[]) ?? []
}

export async function sendMessage(
  escrowId: string,
  senderAddress: string,
  content: string,
): Promise<Message | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('messages')
    .insert({
      escrow_id:      escrowId,
      sender_address: senderAddress.toLowerCase(),
      content:        content.trim(),
    })
    .select()
    .single()
  if (error) throw error
  return data as Message
}

export function subscribeToMessages(
  escrowId: string,
  onMessage: (msg: Message) => void,
) {
  if (!supabase) return { unsubscribe: () => {} }

  const channel = supabase
    .channel(`escrow-chat-${escrowId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `escrow_id=eq.${escrowId}` },
      (payload) => onMessage(payload.new as Message),
    )
    .subscribe()

  return { unsubscribe: () => supabase.removeChannel(channel) }
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export async function fetchRatingsForAddress(address: string): Promise<Rating[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('rated_address', address.toLowerCase())
    .order('created_at', { ascending: false })
  return (data as Rating[]) ?? []
}

export async function fetchMyRatingForEscrow(
  escrowId: string,
  raterAddress: string,
): Promise<Rating | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('escrow_id', escrowId)
    .eq('rater_address', raterAddress.toLowerCase())
    .single()
  return data as Rating | null
}

export async function submitRating(
  escrowId: string,
  raterAddress: string,
  ratedAddress: string,
  score: number,
  comment: string,
): Promise<void> {
  if (!supabase) return
  await supabase.from('ratings').upsert({
    escrow_id:     escrowId,
    rater_address: raterAddress.toLowerCase(),
    rated_address: ratedAddress.toLowerCase(),
    score,
    comment: comment.trim() || null,
  })
}

// ─── Reputation ───────────────────────────────────────────────────────────────

export async function fetchReputation(address: string): Promise<Reputation | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('reputation')
    .select('*')
    .eq('address', address.toLowerCase())
    .single()
  return data as Reputation | null
}

export async function fetchReputationBatch(addresses: string[]): Promise<Reputation[]> {
  if (!supabase || addresses.length === 0) return []
  const { data } = await supabase
    .from('reputation')
    .select('*')
    .in('address', addresses.map(a => a.toLowerCase()))
  return (data as Reputation[]) ?? []
}
