'use client'

import { useState, useMemo, useEffect } from 'react'
import { formatEther }                  from 'viem'
import { useAccount }                   from 'wagmi'
import { Plus, Search, RefreshCw, ArrowLeft, TrendingUp, Lock, Circle } from 'lucide-react'
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

// Design tokens matching Scrow landing page
const BG   = '#05080F'
const BG2  = '#08101E'
const BG3  = '#0C1525'
const ARC  = '#2E57FF'
const BD   = 'rgba(255,255,255,0.06)'
const BD2  = 'rgba(46,87,255,0.2)'
const TXL  = '#EDE9F8'
const TXM  = '#6B6B99'
const TXD  = 'rgba(255,255,255,0.18)'
const JB   = 'var(--font-jb,monospace)'
const BB   = 'var(--font-bebas,sans-serif)'

export default function MarketplacePage() {
  const { address } = useAccount()
  const sym = useNativeSymbol()

  const [tab, setTab]                   = useState<'market' | 'mine'>('market')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'locked' | 'completed'>('open')
  const [refreshing, setRefreshing]     = useState(false)
  const [selectedId, setSelectedId]     = useState<bigint | null>(null)
  const [showDetail, setShowDetail]     = useState(false)
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

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchCount(), refetchListings()])
    setRefreshing(false)
  }

  const displayed = useMemo(() => {
    let list = onChainListings
    if (tab === 'mine') {
      if (!address) return []
      list = list.filter(
        (l) =>
          l.seller.toLowerCase() === address.toLowerCase() ||
          l.buyer.toLowerCase()  === address.toLowerCase(),
      )
    }
    if (statusFilter === 'open')      list = list.filter((l) => l.status === ListingStatus.OPEN)
    if (statusFilter === 'locked')    list = list.filter((l) => l.status === ListingStatus.LOCKED)
    if (statusFilter === 'completed') list = list.filter((l) => l.status === ListingStatus.COMPLETED)
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
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:BG }}>
      <Navbar />

      {/* ── Setup banner */}
      {!IS_CONTRACT_DEPLOYED && (
        <div style={{ padding:'0.625rem 1.25rem', borderBottom:`1px solid rgba(234,179,8,0.18)`, background:'rgba(234,179,8,0.05)', display:'flex', alignItems:'center', gap:'0.625rem', flexShrink:0, flexWrap:'wrap' }}>
          <span style={{ fontFamily:JB, fontSize:9.5, fontWeight:700, letterSpacing:'0.18em', color:'#ca8a04' }}>SETUP REQUIRED</span>
          <span style={{ color:'rgba(234,179,8,0.3)' }}>·</span>
          <span style={{ fontFamily:JB, fontSize:9.5, color:'rgba(234,179,8,0.5)', letterSpacing:'0.06em' }}>
            Run <code style={{ color:'#7BA4F8', background:'rgba(123,164,248,0.08)', padding:'1px 6px', border:'1px solid rgba(123,164,248,0.15)' }}>npm run node</code>
            {' '}then <code style={{ color:'#7BA4F8', background:'rgba(123,164,248,0.08)', padding:'1px 6px', border:'1px solid rgba(123,164,248,0.15)' }}>npm run deploy:local</code>
            {' '}and set <code style={{ color:'#7BA4F8', background:'rgba(123,164,248,0.08)', padding:'1px 6px', border:'1px solid rgba(123,164,248,0.15)' }}>NEXT_PUBLIC_CONTRACT_ADDRESS</code>
          </span>
        </div>
      )}

      {/* ── Stats bar */}
      <div style={{ display:'flex', alignItems:'center', padding:'0 1rem', borderBottom:`1px solid ${BD}`, background:BG, height:36, flexShrink:0, overflow:'hidden', gap:0 }}>
        <StatChip label="TOTAL"  value={count?.toString() ?? '—'} color={TXL} />
        <Divider />
        <StatChip label="OPEN"   value={openCount.toString()} color={ARC} />
        <Divider />
        <StatChip label="LOCKED" value={lockedCount.toString()} color={'rgba(123,164,248,0.7)'} />
        <Divider />
        <StatChip label="VOLUME" value={`${parseFloat(formatEther(totalVolume)).toFixed(2)} ${sym}`} color={TXL} />
        <Link
          href="/"
          style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, fontFamily:JB, fontSize:9, letterSpacing:'0.16em', color:TXM, textDecoration:'none', transition:'color .2s', flexShrink:0 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = TXL}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = TXM}
        >
          <ArrowLeft size={9} /> BACK
        </Link>
      </div>

      {/* ── Main layout */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── Left panel */}
        <div style={{ width:'100%', maxWidth:400, display:'flex', flexDirection:'column', flexShrink:0, borderRight:`1px solid ${BD}`, background:BG2 }}>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
            <TabBtn active={tab === 'market'} onClick={() => { setTab('market') }} icon={<TrendingUp size={11} />}>MARKETPLACE</TabBtn>
            <TabBtn active={tab === 'mine'}   onClick={() => { setTab('mine'); setStatusFilter('all') }} icon={<Lock size={11} />}>MY ESCROWS</TabBtn>
          </div>

          {/* Search */}
          <div style={{ padding:'0.75rem', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <Search size={12} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:TXM, pointerEvents:'none' }} />
              <input
                style={{
                  width:'100%', background:BG3, border:`1px solid ${BD}`, color:TXL,
                  fontFamily:JB, fontSize:11, letterSpacing:'0.06em',
                  padding:'0.5rem 0.75rem 0.5rem 2rem', outline:'none',
                }}
                placeholder="Search listings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={e => (e.currentTarget.style.borderColor = BD2)}
                onBlur={e  => (e.currentTarget.style.borderColor = BD)}
              />
            </div>
          </div>

          {/* Filters */}
          <div style={{ padding:'0.625rem 0.75rem', borderBottom:`1px solid ${BD}`, display:'flex', gap:6, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
            {(['all','open','locked','completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  fontFamily:JB, fontSize:9, letterSpacing:'0.14em', padding:'4px 10px',
                  border:`1px solid ${statusFilter === f ? BD2 : BD}`,
                  background: statusFilter === f ? 'rgba(46,87,255,0.1)' : 'transparent',
                  color: statusFilter === f ? ARC : TXM,
                  cursor:'pointer', transition:'all .18s',
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
            <button
              onClick={refresh}
              title="Refresh"
              style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color: refreshing ? ARC : TXM, display:'flex', alignItems:'center', padding:4, transition:'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = ARC}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = refreshing ? ARC : TXM}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* Create button */}
          <div style={{ padding:'0.75rem', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'0.625rem', background:ARC, color:'#fff', border:'none', cursor:'pointer',
                fontFamily:JB, fontSize:10.5, fontWeight:700, letterSpacing:'0.14em',
                transition:'background .18s, transform .1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4B6DFF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ARC }}
            >
              <Plus size={13} /> CREATE LISTING
            </button>
          </div>

          {/* Count badge */}
          {displayed.length > 0 && (
            <div style={{ padding:'0.5rem 0.75rem', borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.12em', color:TXM }}>
                {displayed.length} LISTING{displayed.length !== 1 ? 'S' : ''}
              </span>
              {statusFilter !== 'all' && (
                <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.1em', color:ARC, border:`1px solid ${BD2}`, padding:'1px 7px', background:'rgba(46,87,255,0.06)' }}>
                  {statusFilter.toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* Listing cards */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {displayed.length === 0 ? (
              <EmptyList tab={tab} hasCount={!!count && count > 0n} connected={!!address} />
            ) : (
              displayed.map((l) => (
                <OrderCard
                  key={l.id.toString()}
                  listing={l}
                  isSelected={l.id === selectedId}
                  onSelect={() => { setSelectedId(l.id); if (window.innerWidth < 768) setShowDetail(true) }}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right panel */}
        <div className="hidden md:flex" style={{ flex:1, flexDirection:'column', overflow:'hidden', background:BG }}>
          {selectedListing ? (
            <TransactionDetail listing={selectedListing} onRefresh={refresh} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>

      {/* ── Mobile detail overlay */}
      {showDetail && selectedListing && (
        <div className="md:hidden" style={{ position:'fixed', inset:0, zIndex:50, background:BG, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.75rem 1rem', borderBottom:`1px solid rgba(255,255,255,0.07)`, flexShrink:0, background:'#08101E' }}>
            <button
              onClick={() => setShowDetail(false)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#6B6B99', display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-jb,monospace)', fontSize:10, letterSpacing:'0.14em', padding:0 }}
            >
              ← BACK
            </button>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            <TransactionDetail listing={selectedListing} onRefresh={() => { refresh(); setShowDetail(false) }} />
          </div>
        </div>
      )}

      {showCreate && (
        <CreateListingModal onClose={() => { setShowCreate(false); refresh() }} />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex:1, padding:'0.75rem 0.5rem',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        fontFamily:JB, fontSize:9.5, letterSpacing:'0.14em',
        borderTop:'none', borderLeft:'none', borderRight:'none',
        borderBottom:`2px solid ${active ? ARC : 'transparent'}`,
        color: active ? ARC : TXM,
        background:'transparent', cursor:'pointer',
        transition:'color .2s, border-color .2s',
      }}
    >
      {icon}{children}
    </button>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, padding:'0 0.75rem' }}>
      <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.12em', color:TXM }}>{label}</span>
      <span style={{ fontFamily:JB, fontSize:9.5, fontWeight:700, letterSpacing:'0.08em', color: color ?? TXD }}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ width:1, height:12, background:BD, flexShrink:0 }} />
}

function EmptyList({ tab, hasCount, connected }: { tab: string; hasCount: boolean; connected: boolean }) {
  let msg = 'VAULT IS EMPTY — CREATE A LISTING'
  if (tab === 'mine') msg = connected ? 'NO ESCROWS FOR YOUR WALLET' : 'CONNECT WALLET TO VIEW YOUR ESCROWS'
  else if (hasCount)  msg = 'NO LISTINGS MATCH FILTER'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:12 }}>
      <span style={{ fontFamily:BB, fontSize:'3rem', color:'rgba(46,87,255,0.08)', lineHeight:1 }}>⬡</span>
      <p style={{ fontFamily:JB, fontSize:9.5, letterSpacing:'0.14em', color:TXM, textAlign:'center', padding:'0 1rem' }}>{msg}</p>
    </div>
  )
}

function EmptyDetail() {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:64, height:64, border:`1px solid rgba(46,87,255,0.12)`, background:'rgba(46,87,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BB, fontSize:'2rem', color:'rgba(46,87,255,0.2)' }}>⬡</div>
      <p style={{ fontFamily:JB, fontSize:9.5, letterSpacing:'0.16em', color:'rgba(255,255,255,0.1)' }}>SELECT A LISTING TO VIEW DETAILS</p>
    </div>
  )
}
