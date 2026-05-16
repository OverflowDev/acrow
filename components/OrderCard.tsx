'use client'

import { formatEther } from 'viem'
import { Clock, User, ShoppingBag } from 'lucide-react'
import type { Listing } from '@/types'
import { ListingStatus, STATUS_LABEL, STATUS_COLOR } from '@/types'
import { useNativeSymbol } from '@/hooks/useNativeSymbol'

interface OrderCardProps {
  listing:    Listing
  isSelected: boolean
  onSelect:   () => void
}

const CATEGORY_ICONS: Record<string, string> = {
  'Crypto':    '₿',
  'NFT':       '🖼',
  'Service':   '🛠',
  'Digital':   '💾',
  'Physical':  '📦',
  'General':   '🏷',
}

export function OrderCard({ listing, isSelected, onSelect }: OrderCardProps) {
  const priceEth = parseFloat(formatEther(listing.price)).toFixed(4)
  const sym      = useNativeSymbol()
  const title    = listing.meta?.title ?? `Listing #${listing.id.toString()}`
  const category = listing.meta?.category ?? 'General'
  const icon     = CATEGORY_ICONS[category] ?? '🏷'
  const age      = formatAge(listing.createdAt)

  return (
    <button
      onClick={onSelect}
      className={[
        'w-full text-left p-4 border-b border-slate-800 transition-all hover:bg-slate-800/50',
        isSelected ? 'bg-slate-800/80 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center text-base shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500">#{listing.id.toString().padStart(4, '0')}</span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500 font-mono">
                {listing.seller.slice(0, 6)}…{listing.seller.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-white">{priceEth} {sym}</p>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${STATUS_COLOR[listing.status as ListingStatus]}`}>
            {STATUS_LABEL[listing.status as ListingStatus]}
          </span>
        </div>
      </div>

      {/* Footer */}
      {listing.status === ListingStatus.OPEN && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Clock size={11} />
          <span>{age}</span>
        </div>
      )}
      {listing.status === ListingStatus.LOCKED && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
          <ShoppingBag size={11} />
          <span>Awaiting buyer confirmation</span>
        </div>
      )}
    </button>
  )
}

function formatAge(ts: bigint): string {
  const diff = Math.floor(Date.now() / 1000) - Number(ts)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
