'use client'

import { useState, useMemo, useEffect } from 'react'
import { formatEther }                  from 'viem'
import { useAccount }                   from 'wagmi'
import { Plus, Search, Inbox, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Navbar }               from '@/components/Navbar'
import { OrderCard }            from '@/components/OrderCard'
import { TransactionDetail }    from '@/components/TransactionDetail'
import { CreateListingModal }   from '@/components/CreateListingModal'
import { useListingCount, useListings } from '@/hooks/useEscrowContract'
import { fetchAllListingMeta }  from '@/lib/supabase'
import { IS_CONTRACT_DEPLOYED } from '@/lib/contract'
import { ListingStatus }        from '@/types'
import type { Listing, ListingMeta } from '@/types'

const PAGE_SIZE = 50n

export default function MarketplacePage() {
  const { address } = useAccount()
  const [tab, setTab]                   = useState<'market' | 'mine'>('market')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'locked'>('open')
  const [selectedId, setSelectedId]     = useState<bigint | null>(null)
  const [showCreate, setShowCreate]     = useState(false)
  const [metaMap, setMetaMap]           = useState<Record<string, ListingMeta>>({})

  const { data: count, refetch: refetchCount } = useListingCount()
  const from = count && count > 0n ? (count > PAGE_SIZE ? count - PAGE_SIZE + 1n : 1n) : 1n
  const to   = count && count > 0n ? count : 1n

  const { data: raw, refetch: refetchListings } = useListings(from, to, !!count && count > 0n)

  const onChainListings = useMemo<Listing[]>(() => {
    if (!raw) return []
    return [...raw].reverse().map((l) => ({
      ...l,
      status:     l.status as ListingStatus,
      meta:       metaMap[l.itemId] ?? null,
      reputation: null,
    }))
  }, [raw, metaMap])

  useEffect(() => {
    if (!raw || raw.length === 0) return
    const ids = raw.map((l) => l.itemId).filter(Boolean)
    fetchAllListingMeta(ids).then((metas) => {
      const map: Record<string, ListingMeta> = {}
      metas.forEach((m) => { map[m.id] = m })
      setMetaMap(map)
    })
  }, [raw])

  useEffect(() => {
    if (onChainListings.length > 0 && selectedId === null) {
      setSelectedId(onChainListings[0].id)
    }
  }, [onChainListings, selectedId])

  const refresh = () => { refetchCount(); refetchListings() }

  const displayed = useMemo(() => {
    let list = onChainListings

    if (tab === 'mine' && address) {
      list = list.filter(
        (l) =>
          l.seller.toLowerCase() === address.toLowerCase() ||
          l.buyer.toLowerCase()  === address.toLowerCase(),
      )
    }

    if (statusFilter === 'open')   list = list.filter((l) => l.status === ListingStatus.OPEN)
    if (statusFilter === 'locked') list = list.filter((l) => l.status === ListingStatus.LOCKED)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.meta?.title?.toLowerCase().includes(q) ||
          l.seller.toLowerCase().includes(q) ||
          l.id.toString().includes(q),
      )
    }

    return list
  }, [onChainListings, tab, address, statusFilter, search])

  const selectedListing = onChainListings.find((l) => l.id === selectedId) ?? null

  const openCount   = onChainListings.filter((l) => l.status === ListingStatus.OPEN).length
  const lockedCount = onChainListings.filter((l) => l.status === ListingStatus.LOCKED).length
  const totalVolume = onChainListings
    .filter((l) => l.status === ListingStatus.COMPLETED)
    .reduce((acc, l) => acc + l.price, 0n)

  return (
    <div className="flex flex-col h-screen bg-[#0F172A]">
      <Navbar />

      {!IS_CONTRACT_DEPLOYED && (
        <div className="px-4 py-2.5 bg-yellow-500/10 border-b border-yellow-500/30 text-xs text-yellow-400 flex items-center gap-2 shrink-0">
          <span className="font-bold">Setup required:</span>
          Run <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono">npm run node</code> then
          <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono">npm run deploy:local</code>
          and add <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono">NEXT_PUBLIC_CONTRACT_ADDRESS</code> to <code className="bg-slate-800 px-1 py-0.5 rounded font-mono">.env.local</code>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-6 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-500 overflow-x-auto shrink-0">
        <StatChip label="Total Listings" value={count?.toString() ?? '0'} />
        <StatChip label="Open"           value={openCount.toString()}   color="text-emerald-400" />
        <StatChip label="Locked"         value={lockedCount.toString()} color="text-blue-400" />
        <StatChip
          label="Volume Settled"
          value={`${parseFloat(formatEther(totalVolume)).toFixed(3)} ETH`}
          color="text-slate-300"
        />
        <Link
          href="/"
          className="ml-auto flex items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors shrink-0"
        >
          <ArrowLeft size={12} /> Landing
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-slate-800 shrink-0">

          <div className="flex border-b border-slate-800 shrink-0">
            <TabBtn active={tab === 'market'} onClick={() => setTab('market')}>Marketplace</TabBtn>
            <TabBtn active={tab === 'mine'}   onClick={() => setTab('mine')}>My Escrows</TabBtn>
          </div>

          <div className="p-3 space-y-2 border-b border-slate-800 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input pl-8 text-sm"
                placeholder="Search listings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'open', 'locked'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={[
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                    statusFilter === s
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={refresh}
                className="ml-auto p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-slate-800 shrink-0">
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} /> Create Escrow Listing
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {displayed.length === 0 ? (
              <EmptyState tab={tab} hasCount={!!count && count > 0n} />
            ) : (
              displayed.map((l) => (
                <OrderCard
                  key={l.id.toString()}
                  listing={l}
                  isSelected={l.id === selectedId}
                  onSelect={() => setSelectedId(l.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden">
          {selectedListing ? (
            <TransactionDetail listing={selectedListing} onRefresh={refresh} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                <Inbox size={28} />
              </div>
              <p className="text-sm">Select a listing to view details</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateListingModal
          onClose={() => { setShowCreate(false); refresh() }}
        />
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
        active
          ? 'border-emerald-500 text-emerald-400'
          : 'border-transparent text-slate-500 hover:text-slate-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function StatChip({ label, value, color = 'text-slate-400' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span>{label}:</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function EmptyState({ tab, hasCount }: { tab: string; hasCount: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-sm gap-2">
      <Inbox size={32} />
      {tab === 'mine'
        ? <p>No escrows involving your wallet</p>
        : hasCount
          ? <p>No listings match your filter</p>
          : <p>No listings yet — be the first!</p>
      }
    </div>
  )
}
