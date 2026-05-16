'use client'

import { useState, useMemo, useEffect } from 'react'
import { formatEther }                  from 'viem'
import { useAccount }                   from 'wagmi'
import { Plus, Search, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Navbar }               from '@/components/Navbar'
import { OrderCard }            from '@/components/OrderCard'
import { TransactionDetail }    from '@/components/TransactionDetail'
import { CreateListingModal }   from '@/components/CreateListingModal'
import { useListingCount, useListings } from '@/hooks/useEscrowContract'
import { fetchAllListingMeta }  from '@/lib/supabase'
import { IS_CONTRACT_DEPLOYED } from '@/lib/contract'
import { ListingStatus }        from '@/types'
import { useNativeSymbol }      from '@/hooks/useNativeSymbol'
import type { Listing, ListingMeta } from '@/types'

const PAGE_SIZE = 50n

export default function MarketplacePage() {
  const { address } = useAccount()
  const sym = useNativeSymbol()

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
    <div className="flex flex-col h-screen" style={{ background: '#060D1F' }}>
      <Navbar />

      {/* ── Setup banner ───────────────────────────────────────────────────── */}
      {!IS_CONTRACT_DEPLOYED && (
        <div className="px-4 py-2.5 border-b text-xs flex items-center gap-2 shrink-0"
          style={{ background: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.2)', color: '#ca8a04' }}
        >
          <span className="font-bold">SETUP REQUIRED</span>
          <span style={{ color: '#713f12' }}>·</span>
          Run{' '}
          <code className="px-1.5 py-0.5 font-mono text-xs" style={{ background: '#07101E', color: '#7BA4F8', border: '1px solid #142040' }}>npm run node</code>
          {' '}then{' '}
          <code className="px-1.5 py-0.5 font-mono text-xs" style={{ background: '#07101E', color: '#7BA4F8', border: '1px solid #142040' }}>npm run deploy:local</code>
          {' '}and set{' '}
          <code className="px-1.5 py-0.5 font-mono text-xs" style={{ background: '#07101E', color: '#7BA4F8', border: '1px solid #142040' }}>NEXT_PUBLIC_CONTRACT_ADDRESS</code>
        </div>
      )}

      {/* ── Terminal stats bar ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0 px-4 py-0 border-b overflow-x-auto shrink-0"
        style={{ background: '#04080F', borderColor: '#0E1B2E', height: '32px' }}
      >
        <span className="shrink-0 pr-4 mr-1 border-r" style={{ borderColor: '#0E1B2E', color: '#4F7CF5', fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '1rem', letterSpacing: '0.08em' }}>
          ⬡ ARCROW
        </span>
        <TermStat label="LISTINGS" value={count?.toString() ?? '—'} />
        <div className="w-px h-3 mx-3 shrink-0" style={{ background: '#0E1B2E' }} />
        <TermStat label="OPEN"   value={openCount.toString()}   active />
        <div className="w-px h-3 mx-3 shrink-0" style={{ background: '#0E1B2E' }} />
        <TermStat label="LOCKED" value={lockedCount.toString()} dim />
        <div className="w-px h-3 mx-3 shrink-0" style={{ background: '#0E1B2E' }} />
        <TermStat
          label="SETTLED"
          value={`${parseFloat(formatEther(totalVolume)).toFixed(3)} ${sym}`}
        />
        <Link
          href="/"
          className="ml-auto flex items-center gap-1 shrink-0 transition-colors"
          style={{ color: '#2A4570', fontFamily: 'var(--font-jb, monospace)', fontSize: '10px', letterSpacing: '0.14em' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#4F7CF5'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2A4570'}
        >
          <ArrowLeft size={10} /> LANDING
        </Link>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div
          className="w-full md:w-[380px] lg:w-[420px] flex flex-col shrink-0 border-r"
          style={{ background: '#0A1628', borderColor: '#0E1B2E' }}
        >
          {/* Tabs */}
          <div className="flex shrink-0 border-b" style={{ borderColor: '#0E1B2E' }}>
            <AppTab active={tab === 'market'} onClick={() => setTab('market')}>MARKETPLACE</AppTab>
            <AppTab active={tab === 'mine'}   onClick={() => setTab('mine')}>MY ESCROWS</AppTab>
          </div>

          {/* Search + filters */}
          <div className="p-3 space-y-2 shrink-0 border-b" style={{ borderColor: '#0E1B2E' }}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#2A4570' }} />
              <input
                className="input pl-8"
                placeholder="Search listings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 items-center">
              {(['all', 'open', 'locked'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1 text-xs font-medium transition-colors capitalize border"
                  style={{
                    fontFamily:    'var(--font-jb, monospace)',
                    letterSpacing: '0.1em',
                    fontSize:      '10px',
                    background:    statusFilter === s ? 'rgba(79,124,245,0.12)' : 'transparent',
                    color:         statusFilter === s ? '#4F7CF5' : '#2A4570',
                    borderColor:   statusFilter === s ? 'rgba(79,124,245,0.3)' : '#142040',
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
              <button
                onClick={refresh}
                className="ml-auto p-1.5 transition-colors"
                title="Refresh"
                style={{ color: '#2A4570' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#4F7CF5'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2A4570'}
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Create button */}
          <div className="p-3 shrink-0 border-b" style={{ borderColor: '#0E1B2E' }}>
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-white font-semibold transition-colors"
              style={{
                background:    '#4F7CF5',
                fontFamily:    'var(--font-jb, monospace)',
                fontSize:      '11px',
                letterSpacing: '0.12em',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#6B93F7'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#4F7CF5'}
            >
              <Plus size={14} /> CREATE LISTING
            </button>
          </div>

          {/* Listing cards */}
          <div className="flex-1 overflow-y-auto">
            {displayed.length === 0 ? (
              <EmptyList tab={tab} hasCount={!!count && count > 0n} />
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

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden" style={{ background: '#060D1F' }}>
          {selectedListing ? (
            <TransactionDetail listing={selectedListing} onRefresh={refresh} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>

      {showCreate && (
        <CreateListingModal onClose={() => { setShowCreate(false); refresh() }} />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AppTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 text-xs font-medium transition-colors border-b-2"
      style={{
        fontFamily:    'var(--font-jb, monospace)',
        letterSpacing: '0.14em',
        borderBottomColor: active ? '#4F7CF5' : 'transparent',
        color:         active ? '#4F7CF5' : '#3A5A8B',
        background:    'transparent',
      }}
    >
      {children}
    </button>
  )
}

function TermStat({ label, value, active, dim }: { label: string; value: string; active?: boolean; dim?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0" style={{ fontFamily: 'var(--font-jb, monospace)', fontSize: '10px', letterSpacing: '0.1em' }}>
      <span style={{ color: '#2A4570' }}>{label}:</span>
      <span style={{ color: active ? '#4F7CF5' : dim ? '#3A5A8B' : '#7BA4F8', fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function EmptyList({ tab, hasCount }: { tab: string; hasCount: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3" style={{ color: '#2A4570' }}>
      <div className="text-3xl" style={{ fontFamily: 'var(--font-bebas, sans-serif)', color: '#0E1B2E' }}>⬡</div>
      <p className="text-xs" style={{ fontFamily: 'var(--font-jb, monospace)', letterSpacing: '0.1em', color: '#2A4570' }}>
        {tab === 'mine'
          ? 'NO ESCROWS FOR YOUR WALLET'
          : hasCount
            ? 'NO LISTINGS MATCH FILTER'
            : 'VAULT IS EMPTY — LIST FIRST'}
      </p>
    </div>
  )
}

function EmptyDetail() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div
        className="flex items-center justify-center text-4xl"
        style={{ width: 72, height: 72, background: '#0A1628', border: '1px solid #142040', color: '#142040', fontFamily: 'var(--font-bebas, sans-serif)' }}
      >
        ⬡
      </div>
      <p className="text-xs" style={{ fontFamily: 'var(--font-jb, monospace)', letterSpacing: '0.14em', color: '#1B2E4A' }}>
        SELECT A LISTING TO VIEW DETAILS
      </p>
    </div>
  )
}
