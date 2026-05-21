'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { formatEther, verifyMessage }  from 'viem'
import { useAccount, useSignMessage }  from 'wagmi'
import {
  Shield, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2,
  Lock, TrendingUp, Loader2, User, ShoppingBag, Clock, Activity,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Navbar }            from '@/components/Navbar'
import {
  useListingCount, useListings, useArbitrator, useResolveDispute,
} from '@/hooks/useEscrowContract'
import { fetchAllListingMeta } from '@/lib/supabase'
import { CONTRACT_ADDRESS }    from '@/lib/contract'
import { ListingStatus }       from '@/types'
import { useNativeSymbol }     from '@/hooks/useNativeSymbol'
import type { Listing, ListingMeta } from '@/types'

const PAGE_SIZE = 50n

const BG    = '#05080F'
const BG2   = '#08101E'
const BG3   = '#0C1525'
const ARC   = '#2E57FF'
const BD    = 'rgba(255,255,255,0.06)'
const BD2   = 'rgba(46,87,255,0.2)'
const TXL   = '#EDE9F8'
const TXM   = '#6B6B99'
const JB    = 'var(--font-jb,monospace)'
const BB    = 'var(--font-bebas,sans-serif)'
const RED   = '#f87171'
const REDBG = 'rgba(239,68,68,0.08)'
const REDB  = 'rgba(239,68,68,0.2)'

const AUTH_KEY    = 'arb_session'
const AUTH_TTL_MS = 4 * 60 * 1000   // 4 min, server accepts 5

// ─── Auth session helpers ─────────────────────────────────────────────────────

interface ArbSession { address: string; signature: string; timestamp: number }

function loadSession(addr: string): ArbSession | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const s: ArbSession = JSON.parse(raw)
    if (s.address.toLowerCase() !== addr.toLowerCase()) return null
    if (Date.now() - s.timestamp * 1000 > AUTH_TTL_MS) { sessionStorage.removeItem(AUTH_KEY); return null }
    return s
  } catch { return null }
}

function saveSession(s: ArbSession) {
  try { sessionStorage.setItem(AUTH_KEY, JSON.stringify(s)) } catch {}
}

function clearSession() {
  try { sessionStorage.removeItem(AUTH_KEY) } catch {}
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function ArbitratorPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  const { data: arbitratorAddress, isLoading: arbLoading } = useArbitrator()

  // Once addresses are known, redirect anyone who is not the arbitrator immediately
  useEffect(() => {
    if (arbLoading) return
    if (!arbitratorAddress) return
    // Wallet connected but not the arbitrator → bounce
    if (isConnected && address &&
        address.toLowerCase() !== (arbitratorAddress as string).toLowerCase()) {
      clearSession()
      router.replace('/app')
    }
  }, [address, arbitratorAddress, arbLoading, isConnected, router])

  // Also clear session when wallet disconnects
  useEffect(() => {
    if (!isConnected) clearSession()
  }, [isConnected])

  // While the arbitrator address is still loading, render nothing at all
  if (arbLoading || !arbitratorAddress) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:BG }}>
        <Navbar />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Loader2 size={20} style={{ color:TXM, animation:'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  // Not connected yet — show generic locked screen (don't hint this is the arb panel)
  if (!isConnected || !address) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:BG }}>
        <Navbar />
        <LockedScreen reason="CONNECT_WALLET" />
      </div>
    )
  }

  // Definitely not the arbitrator — render nothing (redirect fires above)
  if (address.toLowerCase() !== (arbitratorAddress as string).toLowerCase()) return null

  // Confirmed arbitrator wallet — render the signature gate then the dashboard
  return (
    <SignatureGate address={address} arbitratorAddress={arbitratorAddress as string}>
      <Dashboard address={address} arbitratorAddress={arbitratorAddress as string} />
    </SignatureGate>
  )
}

// ─── Signature gate ───────────────────────────────────────────────────────────

function SignatureGate({
  address, arbitratorAddress, children,
}: {
  address: string; arbitratorAddress: string; children: React.ReactNode
}) {
  const { signMessageAsync } = useSignMessage()
  const [session,    setSession]    = useState<ArbSession | null>(null)
  const [unlocking,  setUnlocking]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const checked = useRef(false)

  // Restore cached session on mount (runs only once per address)
  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const cached = loadSession(address)
    if (cached) setSession(cached)
  }, [address])

  const unlock = useCallback(async () => {
    setUnlocking(true)
    setError(null)
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const message   = `scrow:arbitrator:${arbitratorAddress.toLowerCase()}:${timestamp}`
      const signature = await signMessageAsync({ message })

      // Verify the signature matches THIS wallet — can't be forged without the private key
      const valid = await verifyMessage({
        address:   address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!valid) throw new Error('Signature mismatch — verification failed.')

      const s: ArbSession = { address: address.toLowerCase(), signature, timestamp }
      saveSession(s)
      setSession(s)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.toLowerCase().includes('mismatch')) {
        setError('Verification failed. Wrong wallet?')
      } else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('denied')) {
        setError('Signature rejected.')
      } else {
        setError('Could not verify wallet. Try again.')
      }
    } finally {
      setUnlocking(false)
    }
  }, [address, arbitratorAddress, signMessageAsync])

  if (!session) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:BG }}>
        <Navbar />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:380, display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:'2.5rem 2rem', border:`1px solid ${BD2}`, background:BG2 }}>
            {/* Icon */}
            <div style={{ width:52, height:52, background:'rgba(46,87,255,0.08)', border:`1px solid ${BD2}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Shield size={22} style={{ color:ARC }} />
            </div>

            {/* Text */}
            <div style={{ textAlign:'center' }}>
              <p style={{ fontFamily:JB, fontSize:11, fontWeight:700, letterSpacing:'0.18em', color:TXL, marginBottom:8 }}>
                RESTRICTED ACCESS
              </p>
              <p style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.06em', color:TXM, lineHeight:1.8 }}>
                This panel requires cryptographic proof of wallet ownership.
                Sign the challenge below — your private key never leaves your wallet.
              </p>
            </div>

            {/* Wallet */}
            <div style={{ width:'100%', padding:'0.5rem 0.75rem', background:BG3, border:`1px solid ${BD}`, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', animation:'pulse-led 1.8s ease-in-out infinite', flexShrink:0 }} />
              <span style={{ fontFamily:JB, fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {address.slice(0,10)}…{address.slice(-8)}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ width:'100%', display:'flex', alignItems:'center', gap:6, padding:'0.5rem 0.75rem', background:REDBG, border:`1px solid ${REDB}`, fontFamily:JB, fontSize:9, color:RED, letterSpacing:'0.08em' }}>
                <AlertTriangle size={11} />{error}
              </div>
            )}

            {/* Sign button */}
            <button
              onClick={unlock}
              disabled={unlocking}
              style={{
                width:'100%', padding:'0.75rem', background: unlocking ? 'rgba(46,87,255,0.5)' : ARC,
                border:'none', cursor: unlocking ? 'not-allowed' : 'pointer',
                color:'#fff', fontFamily:JB, fontSize:10, fontWeight:700, letterSpacing:'0.16em',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background .18s',
              }}
              onMouseEnter={e => { if (!unlocking) (e.currentTarget as HTMLElement).style.background = '#4B6DFF' }}
              onMouseLeave={e => { if (!unlocking) (e.currentTarget as HTMLElement).style.background = ARC }}
            >
              {unlocking
                ? <><Loader2 size={14} style={{ animation:'spin 0.7s linear infinite' }} /> VERIFYING…</>
                : <><Shield size={14} /> SIGN TO ENTER</>}
            </button>

            <Link href="/app" style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.12em', color:TXM, textDecoration:'none' }}>
              ← Back to marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// ─── Dashboard (only mounts after signature gate passes) ──────────────────────

function Dashboard({ address, arbitratorAddress }: { address: string; arbitratorAddress: string }) {
  const sym = useNativeSymbol()
  const router = useRouter()
  const { resolveDispute, isPending: resolving } = useResolveDispute()

  const [refreshing,     setRefreshing]     = useState(false)
  const [metaMap,        setMetaMap]        = useState<Record<string, ListingMeta>>({})
  const [txResults,      setTxResults]      = useState<Record<string, { hash?: string; error?: string }>>({})
  const [resolveTarget,  setResolveTarget]  = useState<{ id: bigint; favor: 'buyer' | 'seller' } | null>(null)

  const { data: count,  refetch: refetchCount }    = useListingCount()
  const from = count && count > 0n ? (count > PAGE_SIZE ? count - PAGE_SIZE + 1n : 1n) : 1n
  const to   = count && count > 0n ? count : 1n
  const { data: raw,   refetch: refetchListings }  = useListings(from, to, !!count && count > 0n)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchCount(), refetchListings()])
    setRefreshing(false)
  }, [refetchCount, refetchListings])

  const listings = useMemo<Listing[]>(() => {
    if (!raw) return []
    return [...raw].reverse().map(l => ({
      ...l, status: l.status as ListingStatus, meta: metaMap[l.itemId] ?? null, reputation: null,
    }))
  }, [raw, metaMap])

  useEffect(() => {
    if (!raw || raw.length === 0) return
    const ids = raw.map(l => l.itemId).filter(Boolean)
    fetchAllListingMeta(ids).then(metas => {
      const map: Record<string, ListingMeta> = {}
      metas.forEach(m => { map[m.id] = m })
      setMetaMap(map)
    })
  }, [raw])

  // Stats
  const openCount   = listings.filter(l => l.status === ListingStatus.OPEN).length
  const lockedCount = listings.filter(l => l.status === ListingStatus.LOCKED).length
  const disputed    = listings.filter(l => l.status === ListingStatus.DISPUTED)
  const completed   = listings.filter(l => l.status === ListingStatus.COMPLETED)
  const cancelled   = listings.filter(l => l.status === ListingStatus.CANCELLED).length
  const volume      = completed.reduce((a, l) => a + l.price, 0n)
  const fees        = completed.reduce((a, l) => a + (l.price * 100n / 10_000n), 0n)
  const avgPrice    = completed.length > 0 ? volume / BigInt(completed.length) : 0n

  const resolve = async (listingId: bigint, favorBuyer: boolean) => {
    const key = listingId.toString()
    setTxResults(p => ({ ...p, [key]: {} }))
    setResolveTarget(null)
    try {
      const hash = await resolveDispute(listingId, favorBuyer)
      setTxResults(p => ({ ...p, [key]: { hash } }))
      refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed'
      setTxResults(p => ({ ...p, [key]: { error: msg.includes('rejected') ? 'Rejected.' : msg.slice(0, 120) } }))
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:BG }}>
      <Navbar />

      {/* Page header */}
      <div style={{ padding:'0 1.25rem', height:44, display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${BD}`, background:BG2, flexShrink:0 }}>
        <Link href="/app" style={{ display:'flex', alignItems:'center', gap:6, fontFamily:JB, fontSize:9, letterSpacing:'0.14em', color:TXM, textDecoration:'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = TXL}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = TXM}
        >
          <ArrowLeft size={11} /> MARKETPLACE
        </Link>
        <span style={{ color:BD, fontSize:10 }}>|</span>
        <Shield size={11} style={{ color:ARC }} />
        <span style={{ fontFamily:JB, fontSize:10, fontWeight:700, letterSpacing:'0.18em', color:TXL }}>ARBITRATOR PANEL</span>
        {disputed.length > 0 && (
          <span style={{ fontFamily:JB, fontSize:8, fontWeight:700, letterSpacing:'0.12em', color:RED, border:`1px solid ${REDB}`, background:REDBG, padding:'2px 8px' }}>
            {disputed.length} PENDING
          </span>
        )}
        <button
          onClick={refresh}
          style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color: refreshing ? ARC : TXM, display:'flex', alignItems:'center', gap:4, fontFamily:JB, fontSize:9, letterSpacing:'0.12em', padding:4 }}
        >
          <RefreshCw size={11} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
          REFRESH
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'1.5rem 1.25rem', display:'flex', flexDirection:'column', gap:'1.5rem', maxWidth:1100, width:'100%', margin:'0 auto' }}>

        {/* Identity */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0.875rem 1rem', background:BG2, border:`1px solid ${BD2}` }}>
          <div style={{ width:36, height:36, background:'rgba(46,87,255,0.1)', border:`1px solid ${BD2}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Shield size={16} style={{ color:ARC }} />
          </div>
          <div>
            <p style={{ fontFamily:JB, fontSize:8, letterSpacing:'0.18em', color:TXM, marginBottom:2 }}>ARBITRATOR WALLET · VERIFIED</p>
            <p style={{ fontFamily:JB, fontSize:11, color:TXL, letterSpacing:'0.06em' }}>{address}</p>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <p style={{ fontFamily:JB, fontSize:8, letterSpacing:'0.16em', color:TXM, marginBottom:2 }}>CONTRACT</p>
            <p style={{ fontFamily:JB, fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em' }}>
              {CONTRACT_ADDRESS.slice(0,10)}…{CONTRACT_ADDRESS.slice(-6)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div>
          <SectionLabel icon={<Activity size={11}/>}>PLATFORM OVERVIEW</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:1, background:BD }}>
            <StatCard label="TOTAL LISTINGS"   value={listings.length.toString()}    color={TXL} />
            <StatCard label="OPEN"             value={openCount.toString()}           color={ARC} />
            <StatCard label="LOCKED / ACTIVE"  value={lockedCount.toString()}         color="rgba(123,164,248,0.8)" />
            <StatCard label="DISPUTES PENDING" value={disputed.length.toString()}     color={disputed.length > 0 ? RED : TXM} urgent={disputed.length > 0} />
            <StatCard label="COMPLETED"        value={completed.length.toString()}    color="#4ade80" />
            <StatCard label="CANCELLED"        value={cancelled.toString()}           color={TXM} />
            <StatCard label="TOTAL VOLUME"     value={`${parseFloat(formatEther(volume)).toFixed(4)} ${sym}`}  color={TXL} />
            <StatCard label="EST. FEES EARNED" value={`${parseFloat(formatEther(fees)).toFixed(4)} ${sym}`}   color="#facc15" />
            <StatCard label="AVG TRADE SIZE"   value={completed.length > 0 ? `${parseFloat(formatEther(avgPrice)).toFixed(4)} ${sym}` : '—'} color={TXM} />
          </div>
        </div>

        {/* Pending disputes */}
        <div>
          <SectionLabel icon={<AlertTriangle size={11}/>} accent={RED}>
            DISPUTES AWAITING RESOLUTION
            {disputed.length > 0 && (
              <span style={{ marginLeft:8, fontFamily:JB, fontSize:8, color:RED, border:`1px solid ${REDB}`, background:REDBG, padding:'1px 7px' }}>
                {disputed.length}
              </span>
            )}
          </SectionLabel>

          {disputed.length === 0 ? (
            <div style={{ padding:'2.5rem', background:BG2, border:`1px solid ${BD}`, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <CheckCircle2 size={24} style={{ color:'rgba(74,222,128,0.4)' }} />
              <p style={{ fontFamily:JB, fontSize:10, letterSpacing:'0.14em', color:TXM }}>NO PENDING DISPUTES</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              {disputed.map(l => (
                <DisputeRow
                  key={l.id.toString()}
                  listing={l}
                  sym={sym}
                  txResult={txResults[l.id.toString()]}
                  resolveTarget={resolveTarget}
                  onSetTarget={setResolveTarget}
                  onResolve={resolve}
                  resolving={resolving}
                />
              ))}
            </div>
          )}
        </div>

        {/* All listings table */}
        <div>
          <SectionLabel icon={<TrendingUp size={11}/>}>ALL LISTINGS</SectionLabel>
          <div style={{ border:`1px solid ${BD}`, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 110px 110px 110px 80px', background:BG3, borderBottom:`1px solid ${BD}`, padding:'0.5rem 0.875rem' }}>
              {['#','ITEM','STATUS','PRICE','COLLATERAL','AGE'].map(h => (
                <span key={h} style={{ fontFamily:JB, fontSize:8, letterSpacing:'0.16em', color:TXM }}>{h}</span>
              ))}
            </div>
            {listings.length === 0
              ? <div style={{ padding:'2rem', textAlign:'center', fontFamily:JB, fontSize:10, letterSpacing:'0.12em', color:TXM }}>NO LISTINGS</div>
              : listings.map(l => <ListingRow key={l.id.toString()} listing={l} sym={sym} />)
            }
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Generic locked screen (shown when wallet not connected) ──────────────────

function LockedScreen({ reason }: { reason: string }) {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <Lock size={24} style={{ color:'rgba(255,255,255,0.08)' }} />
      <p style={{ fontFamily:JB, fontSize:10, letterSpacing:'0.14em', color:TXM }}>
        {reason === 'CONNECT_WALLET' ? 'CONNECT WALLET TO CONTINUE' : 'ACCESS DENIED'}
      </p>
      <Link href="/app" style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.12em', color:TXM, textDecoration:'none', marginTop:8 }}>
        ← Back to marketplace
      </Link>
    </div>
  )
}

// ─── Dispute Row ──────────────────────────────────────────────────────────────

function DisputeRow({
  listing, sym, txResult, resolveTarget, resolving, onSetTarget, onResolve,
}: {
  listing:       Listing
  sym:           string
  txResult?:     { hash?: string; error?: string }
  resolveTarget: { id: bigint; favor: 'buyer' | 'seller' } | null
  resolving:     boolean
  onSetTarget:   (t: { id: bigint; favor: 'buyer' | 'seller' } | null) => void
  onResolve:     (id: bigint, favorBuyer: boolean) => void
}) {
  const title    = listing.meta?.title ?? `Listing #${listing.id}`
  const priceEth = parseFloat(formatEther(listing.price)).toFixed(4)
  const colEth   = listing.collateral > 0n ? parseFloat(formatEther(listing.collateral)).toFixed(4) : null
  const age      = listing.lockedAt > 0n ? timeAgo(Number(listing.lockedAt)) : '—'
  const key      = listing.id.toString()
  const isTarget = resolveTarget?.id === listing.id

  return (
    <div style={{ background:REDBG, border:`1px solid ${REDB}`, padding:'1rem', marginBottom:1 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:'0.75rem' }}>
        <span style={{ fontFamily:JB, fontSize:9, color:TXM, letterSpacing:'0.1em', flexShrink:0 }}>#{key.padStart(4,'0')}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:JB, fontSize:11, fontWeight:700, color:TXL, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</p>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <AddrChip label="SELLER" addr={listing.seller} />
            <AddrChip label="BUYER"  addr={listing.buyer} />
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ fontFamily:JB, fontSize:12, fontWeight:700, color:RED }}>{priceEth} {sym}</p>
          {colEth && <p style={{ fontFamily:JB, fontSize:9, color:'rgba(248,113,113,0.6)' }}>+{colEth} collateral</p>}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:'0.875rem' }}>
        <Clock size={10} style={{ color:TXM }} />
        <span style={{ fontFamily:JB, fontSize:8.5, letterSpacing:'0.1em', color:TXM }}>LOCKED {age}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:'0.875rem' }}>
        <PayoutCard
          label="IF FAVOR BUYER"
          lines={[
            `Buyer gets: ${priceEth}${colEth ? ` + ${colEth}` : ''} ${sym}`,
            'Seller loses collateral (penalty)',
          ]}
          color="#4ade80"
        />
        <PayoutCard
          label="IF FAVOR SELLER"
          lines={[
            `Seller gets: ${(parseFloat(priceEth)*0.99).toFixed(4)}${colEth ? ` + ${colEth}` : ''} ${sym}`,
            'Platform fee: 1% deducted',
          ]}
          color="#60a5fa"
        />
      </div>

      {txResult?.hash && (
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0.4rem 0.75rem', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', marginBottom:'0.5rem', fontFamily:JB, fontSize:9, color:'#4ade80', letterSpacing:'0.06em' }}>
          <CheckCircle2 size={11} /> RESOLVED · {txResult.hash.slice(0,14)}…
        </div>
      )}
      {txResult?.error && (
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0.4rem 0.75rem', background:REDBG, border:`1px solid ${REDB}`, marginBottom:'0.5rem', fontFamily:JB, fontSize:9, color:RED, letterSpacing:'0.06em' }}>
          <AlertTriangle size={11} /> {txResult.error}
        </div>
      )}

      {!isTarget ? (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => onSetTarget({ id: listing.id, favor: 'buyer' })}
            style={{ flex:1, padding:'0.5rem', background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.12em', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.22)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.12)'}
          >
            <ShoppingBag size={12}/> FAVOR BUYER
          </button>
          <button onClick={() => onSetTarget({ id: listing.id, favor: 'seller' })}
            style={{ flex:1, padding:'0.5rem', background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.3)', color:'#60a5fa', fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.12em', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.22)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.12)'}
          >
            <User size={12}/> FAVOR SELLER
          </button>
          <Link href="/app"
            style={{ padding:'0.5rem 0.875rem', background:'transparent', border:`1px solid ${BD}`, color:TXM, fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.12em', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, textDecoration:'none' }}
          >
            CHAT
          </Link>
        </div>
      ) : (
        <div style={{ padding:'0.875rem', background: resolveTarget?.favor === 'buyer' ? 'rgba(74,222,128,0.06)' : 'rgba(96,165,250,0.06)', border:`1px solid ${resolveTarget?.favor === 'buyer' ? 'rgba(74,222,128,0.25)' : 'rgba(96,165,250,0.25)'}` }}>
          <p style={{ fontFamily:JB, fontSize:10, fontWeight:700, color:TXL, marginBottom:6 }}>
            Confirm: favor {resolveTarget?.favor}?
          </p>
          <p style={{ fontFamily:JB, fontSize:9, color:TXM, marginBottom:12, lineHeight:1.6 }}>
            This is <strong style={{ color:TXL }}>final and on-chain</strong>. Funds will be released atomically.
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => onResolve(listing.id, resolveTarget!.favor === 'buyer')}
              disabled={resolving}
              style={{ flex:1, padding:'0.5rem', background: resolveTarget?.favor === 'buyer' ? 'rgba(74,222,128,0.2)' : 'rgba(96,165,250,0.2)', border:`1px solid ${resolveTarget?.favor === 'buyer' ? 'rgba(74,222,128,0.4)' : 'rgba(96,165,250,0.4)'}`, color: resolveTarget?.favor === 'buyer' ? '#4ade80' : '#60a5fa', fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.12em', cursor: resolving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: resolving ? 0.5 : 1 }}
            >
              {resolving ? <><Loader2 size={12} style={{ animation:'spin 0.7s linear infinite' }}/> SUBMITTING…</> : `YES — FAVOR ${resolveTarget?.favor?.toUpperCase()}`}
            </button>
            <button onClick={() => onSetTarget(null)}
              style={{ padding:'0.5rem 1rem', background:'transparent', border:`1px solid ${BD}`, color:TXM, fontFamily:JB, fontSize:9, letterSpacing:'0.12em', cursor:'pointer' }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Listing table row ────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ListingStatus, string> = {
  [ListingStatus.OPEN]:      ARC,
  [ListingStatus.LOCKED]:    'rgba(123,164,248,0.8)',
  [ListingStatus.COMPLETED]: '#4ade80',
  [ListingStatus.DISPUTED]:  RED,
  [ListingStatus.CANCELLED]: TXM,
}
const STATUS_LABEL: Record<ListingStatus, string> = {
  [ListingStatus.OPEN]:      'OPEN',
  [ListingStatus.LOCKED]:    'LOCKED',
  [ListingStatus.COMPLETED]: 'COMPLETED',
  [ListingStatus.DISPUTED]:  'DISPUTED',
  [ListingStatus.CANCELLED]: 'CANCELLED',
}

function ListingRow({ listing, sym }: { listing: Listing; sym: string }) {
  const title    = listing.meta?.title ?? `Listing #${listing.id}`
  const priceEth = parseFloat(formatEther(listing.price)).toFixed(4)
  const colEth   = listing.collateral > 0n ? `${parseFloat(formatEther(listing.collateral)).toFixed(4)} ${sym}` : '—'
  const age      = timeAgo(Number(listing.createdAt))
  const color    = STATUS_COLOR[listing.status]

  return (
    <div
      style={{ display:'grid', gridTemplateColumns:'60px 1fr 110px 110px 110px 80px', borderBottom:`1px solid ${BD}`, padding:'0.625rem 0.875rem', background: listing.status === ListingStatus.DISPUTED ? REDBG : 'transparent', transition:'background .15s' }}
      onMouseEnter={e => { if (listing.status !== ListingStatus.DISPUTED) (e.currentTarget as HTMLElement).style.background = BG2 }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = listing.status === ListingStatus.DISPUTED ? REDBG : 'transparent' }}
    >
      <span style={{ fontFamily:JB, fontSize:9, color:TXM, letterSpacing:'0.1em', alignSelf:'center' }}>#{listing.id.toString().padStart(4,'0')}</span>
      <div style={{ minWidth:0, alignSelf:'center' }}>
        <p style={{ fontFamily:JB, fontSize:10, color:TXL, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{title}</p>
        <p style={{ fontFamily:JB, fontSize:8, color:TXM }}>{listing.seller.slice(0,8)}…{listing.seller.slice(-4)}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center' }}>
        <span style={{ fontFamily:JB, fontSize:8, fontWeight:700, letterSpacing:'0.12em', color, border:`1px solid ${color}22`, background:`${color}11`, padding:'2px 7px' }}>
          {STATUS_LABEL[listing.status]}
        </span>
      </div>
      <span style={{ fontFamily:JB, fontSize:10, color:TXL, alignSelf:'center' }}>{priceEth} {sym}</span>
      <span style={{ fontFamily:JB, fontSize:10, color:'rgba(250,204,21,0.7)', alignSelf:'center' }}>{colEth}</span>
      <span style={{ fontFamily:JB, fontSize:9, color:TXM, alignSelf:'center' }}>{age}</span>
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, urgent }: { label: string; value: string; color: string; urgent?: boolean }) {
  return (
    <div style={{ padding:'1rem', background: urgent ? REDBG : BG2, display:'flex', flexDirection:'column', gap:6, border: urgent ? `1px solid ${REDB}` : `1px solid ${BD}` }}>
      <span style={{ fontFamily:JB, fontSize:8, letterSpacing:'0.18em', color: urgent ? RED : TXM }}>{label}</span>
      <span style={{ fontFamily:BB, fontSize:'1.75rem', color, lineHeight:1 }}>{value}</span>
      {urgent && <span style={{ fontFamily:JB, fontSize:8, color:RED, letterSpacing:'0.1em' }}>NEEDS ACTION</span>}
    </div>
  )
}

function SectionLabel({ children, icon, accent }: { children: React.ReactNode; icon?: React.ReactNode; accent?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.5rem' }}>
      {icon && <span style={{ color: accent ?? TXM }}>{icon}</span>}
      <span style={{ fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.2em', color: accent ?? TXM }}>{children}</span>
      <div style={{ flex:1, height:1, background:BD, marginLeft:4 }} />
    </div>
  )
}

function AddrChip({ label, addr }: { label: string; addr: string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:JB, fontSize:8.5, letterSpacing:'0.1em', color:TXM }}>
      <span style={{ color:'rgba(255,255,255,0.2)' }}>{label}</span>
      <span style={{ color:TXL }}>{addr.slice(0,8)}…{addr.slice(-4)}</span>
    </span>
  )
}

function PayoutCard({ label, lines, color }: { label: string; lines: string[]; color: string }) {
  return (
    <div style={{ padding:'0.625rem 0.75rem', background:`${color}08`, border:`1px solid ${color}22` }}>
      <p style={{ fontFamily:JB, fontSize:8, fontWeight:700, letterSpacing:'0.16em', color, marginBottom:5 }}>{label}</p>
      {lines.map((l, i) => (
        <p key={i} style={{ fontFamily:JB, fontSize:8.5, color: i === 0 ? TXL : TXM, lineHeight:1.6 }}>{l}</p>
      ))}
    </div>
  )
}

function timeAgo(ts: number): string {
  if (!ts) return '—'
  const d = Math.floor(Date.now() / 1000) - ts
  if (d < 60)    return `${d}s ago`
  if (d < 3600)  return `${Math.floor(d/60)}m ago`
  if (d < 86400) return `${Math.floor(d/3600)}h ago`
  return `${Math.floor(d/86400)}d ago`
}
