'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp } from 'lucide-react'
import { fetchReputation } from '@/lib/supabase'
import type { Reputation } from '@/types'

interface ReputationBadgeProps {
  address:   string
  size?:     'sm' | 'md'
  showTrades?: boolean
}

export function ReputationBadge({ address, size = 'sm', showTrades = false }: ReputationBadgeProps) {
  const [rep, setRep] = useState<Reputation | null>(null)

  useEffect(() => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return
    fetchReputation(address).then(setRep)
  }, [address])

  if (!rep || rep.total_ratings === 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-slate-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        <Star size={size === 'sm' ? 11 : 13} />
        New
      </span>
    )
  }

  const stars = Math.round(rep.avg_rating)

  return (
    <span className={`inline-flex items-center gap-1.5 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star
            key={i}
            size={size === 'sm' ? 10 : 12}
            className={i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
          />
        ))}
      </span>
      <span className="text-slate-300 font-semibold">{rep.avg_rating.toFixed(1)}</span>
      {showTrades && (
        <span className="text-slate-500 flex items-center gap-0.5">
          <TrendingUp size={10} />
          {rep.total_trades} trades
        </span>
      )}
    </span>
  )
}

// Inline star picker for rating input
interface StarPickerProps {
  value:    number
  onChange: (score: number) => void
}

export function StarPicker({ value, onChange }: StarPickerProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={
              i <= (hover || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-600'
            }
          />
        </button>
      ))}
    </div>
  )
}
