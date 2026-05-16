// ─── Contract Types ───────────────────────────────────────────────────────────

export enum ListingStatus {
  OPEN      = 0,
  LOCKED    = 1,
  COMPLETED = 2,
  DISPUTED  = 3,
  CANCELLED = 4,
}

export interface OnChainListing {
  id:              bigint
  seller:          `0x${string}`
  buyer:           `0x${string}`
  price:           bigint
  collateral:      bigint
  createdAt:       bigint
  lockedAt:        bigint
  status:          ListingStatus
  itemId:          string
  sellerConfirmed: boolean
  buyerConfirmed:  boolean
}

// ─── Supabase / Off-chain Metadata ───────────────────────────────────────────

export interface ListingMeta {
  id:             string
  contract_id:    number
  title:          string
  description:    string | null
  image_url:      string | null
  category:       string
  token_type:     string
  seller_address: string
  created_at:     string
}

export interface Profile {
  address:      string
  display_name: string | null
  bio:          string | null
  rating:       number
  total_trades: number
  created_at:   string
}

export interface Message {
  id:              string
  escrow_id:       string   // listing id as string
  sender_address:  string
  content:         string
  created_at:      string
}

export interface Rating {
  id:            string
  escrow_id:     string
  rater_address: string
  rated_address: string
  score:         number    // 1–5
  comment:       string | null
  created_at:    string
}

export interface Reputation {
  address:          string
  avg_rating:       number
  total_trades:     number
  successful_trades: number
  total_ratings:    number
}

// ─── Merged UI Listing ────────────────────────────────────────────────────────

export interface Listing extends OnChainListing {
  meta:       ListingMeta | null
  reputation: Reputation  | null  // seller's reputation
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<ListingStatus, string> = {
  [ListingStatus.OPEN]:      'Open',
  [ListingStatus.LOCKED]:    'Locked',
  [ListingStatus.COMPLETED]: 'Completed',
  [ListingStatus.DISPUTED]:  'Disputed',
  [ListingStatus.CANCELLED]: 'Cancelled',
}

export const STATUS_COLOR: Record<ListingStatus, string> = {
  [ListingStatus.OPEN]:      'text-[#4F7CF5] bg-[#4F7CF5]/10 border-[#4F7CF5]/30',
  [ListingStatus.LOCKED]:    'text-[#7BA4F8] bg-[#4F7CF5]/08 border-[#4F7CF5]/20',
  [ListingStatus.COMPLETED]: 'text-[#3A5A8B] bg-[#0E1B2E] border-[#142040]',
  [ListingStatus.DISPUTED]:  'text-red-400 bg-red-500/10 border-red-500/30',
  [ListingStatus.CANCELLED]: 'text-[#2A4570] bg-[#07101E] border-[#0E1B2E]',
}
