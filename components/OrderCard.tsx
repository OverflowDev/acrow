'use client'

import { formatEther } from 'viem'
import { Clock, ShoppingBag } from 'lucide-react'
import type { Listing } from '@/types'
import { ListingStatus, STATUS_LABEL, STATUS_COLOR } from '@/types'
import { useNativeSymbol } from '@/hooks/useNativeSymbol'

interface OrderCardProps {
  listing:    Listing
  isSelected: boolean
  onSelect:   () => void
}

const CATEGORY_ICONS: Record<string, string> = {
  'Crypto':   '₿',
  'NFT':      '⬡',
  'Service':  '⚙',
  'Digital':  '◈',
  'Physical': '⬜',
  'General':  '◇',
}

export function OrderCard({ listing, isSelected, onSelect }: OrderCardProps) {
  const priceEth = parseFloat(formatEther(listing.price)).toFixed(4)
  const sym      = useNativeSymbol()
  const title    = listing.meta?.title ?? `Listing #${listing.id.toString()}`
  const category = listing.meta?.category ?? 'General'
  const icon     = CATEGORY_ICONS[category] ?? '◇'
  const age      = formatAge(listing.createdAt)

  return (
    <button
      onClick={onSelect}
      className="w-full text-left transition-all"
      style={{
        padding: '0.875rem 1rem',
        borderBottom: '1px solid #0E1B2E',
        borderLeft: `2px solid ${isSelected ? '#4F7CF5' : 'transparent'}`,
        background: isSelected ? 'rgba(79,124,245,0.06)' : 'transparent',
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(10,22,40,0.6)' }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 flex items-center justify-center text-base shrink-0"
            style={{ background: '#07101E', border: '1px solid #142040', color: '#3A5A8B', fontFamily: 'var(--font-jb, monospace)' }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#E4EAF8' }}>{title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono" style={{ color: '#2A4570' }}>#{listing.id.toString().padStart(4, '0')}</span>
              <span style={{ color: '#142040' }}>·</span>
              <span className="text-xs font-mono" style={{ color: '#2A4570' }}>
                {listing.seller.slice(0, 6)}…{listing.seller.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold" style={{ color: '#E4EAF8', fontFamily: 'var(--font-jb, monospace)' }}>
            {priceEth} {sym}
          </p>
          <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium border ${STATUS_COLOR[listing.status as ListingStatus]}`}
            style={{ fontFamily: 'var(--font-jb, monospace)', fontSize: '9px', letterSpacing: '0.1em' }}
          >
            {STATUS_LABEL[listing.status as ListingStatus].toUpperCase()}
          </span>
        </div>
      </div>

      {listing.status === ListingStatus.OPEN && (
        <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: '#2A4570', fontFamily: 'var(--font-jb, monospace)' }}>
          <Clock size={10} />
          <span>{age}</span>
        </div>
      )}
      {listing.status === ListingStatus.LOCKED && (
        <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: '#4F7CF5', fontFamily: 'var(--font-jb, monospace)' }}>
          <ShoppingBag size={10} />
          <span>AWAITING CONFIRMATION</span>
        </div>
      )}
    </button>
  )
}

function formatAge(ts: bigint): string {
  const diff = Math.floor(Date.now() / 1000) - Number(ts)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
