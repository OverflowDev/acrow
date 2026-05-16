'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Navbar }             from '@/components/Navbar'
import { TransactionDetail }  from '@/components/TransactionDetail'
import { EscrowStepper }      from '@/components/EscrowStepper'
import { useListing }         from '@/hooks/useEscrowContract'
import { fetchListingMeta }   from '@/lib/supabase'
import { ListingStatus }      from '@/types'
import type { Listing, ListingMeta } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EscrowDetailPage({ params }: PageProps) {
  const { id }    = use(params)
  const listingId = BigInt(id)

  const { data: raw, isLoading, error, refetch } = useListing(listingId)
  const [meta, setMeta]                          = useState<ListingMeta | null>(null)

  useEffect(() => {
    if (!raw?.itemId) return
    fetchListingMeta(raw.itemId).then(setMeta)
  }, [raw?.itemId])

  const listing: Listing | null = raw
    ? { ...raw, status: raw.status as ListingStatus, meta, reputation: null }
    : null

  return (
    <div className="flex flex-col h-screen bg-[#0F172A]">
      <Navbar />

      {/* Back nav */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Marketplace
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center h-full gap-3 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading escrow…
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full gap-3 text-red-400">
            <AlertTriangle size={20} />
            Failed to load escrow #{id}
          </div>
        )}

        {listing && (
          <TransactionDetail listing={listing} onRefresh={refetch} />
        )}
      </div>
    </div>
  )
}
