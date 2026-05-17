'use client'

import { useState, useCallback } from 'react'
import { X, Shield, Loader2, AlertCircle, Info } from 'lucide-react'
import { useCreateListing } from '@/hooks/useEscrowContract'
import { upsertListingMeta } from '@/lib/supabase'
import { useAccount } from 'wagmi'
import { useNativeSymbol } from '@/hooks/useNativeSymbol'

const CATEGORIES = ['General', 'Crypto', 'NFT', 'Whitelist', 'Service', 'Digital', 'Physical']

const ARC  = '#2E57FF'
const BG   = '#05080F'
const BG2  = '#08101E'
const BG3  = '#0C1525'
const BD   = 'rgba(255,255,255,0.07)'
const BD2  = 'rgba(46,87,255,0.25)'
const TXL  = '#EDE9F8'
const TXM  = '#6B6B99'
const JB   = 'var(--font-jb,monospace)'
const BB   = 'var(--font-bebas,sans-serif)'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: BG3,
  border: `1px solid ${BD}`,
  color: TXL,
  fontFamily: JB,
  fontSize: 12,
  letterSpacing: '0.04em',
  padding: '0.5rem 0.75rem',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: JB,
  fontSize: 9,
  letterSpacing: '0.2em',
  color: TXM,
  display: 'block',
  marginBottom: 6,
}

interface CreateListingModalProps {
  onClose:    () => void
  onCreated?: () => void
}

export function CreateListingModal({ onClose, onCreated }: CreateListingModalProps) {
  const { address } = useAccount()
  const { createListing, isPending } = useCreateListing()
  const sym = useNativeSymbol()

  const [form, setForm] = useState({
    title:         '',
    description:   '',
    category:      'General',
    priceEth:      '',
    collateralEth: '0',
  })
  const [collateralMode, setCollateralMode] = useState<'none' | 'pct10' | 'pct25' | 'custom'>('none')
  const [customCollateral, setCustomCollateral] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [step,  setStep]  = useState<'form' | 'confirming' | 'done'>('form')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const price = parseFloat(form.priceEth) || 0

  const collateralEth = (() => {
    if (collateralMode === 'none')   return '0'
    if (collateralMode === 'pct10')  return (price * 0.10).toFixed(6)
    if (collateralMode === 'pct25')  return (price * 0.25).toFixed(6)
    if (collateralMode === 'custom') return customCollateral || '0'
    return '0'
  })()

  const handleSubmit = useCallback(async () => {
    setError(null)
    if (!form.title.trim()) { setError('Title is required');        return }
    if (price <= 0)         { setError('Enter a valid price');      return }
    if (!address)           { setError('Connect your wallet first'); return }

    try {
      setStep('confirming')
      const itemId = crypto.randomUUID()

      await createListing(form.priceEth, collateralEth, itemId)

      await upsertListingMeta({
        id:             itemId,
        contract_id:    0,
        title:          form.title.trim(),
        description:    form.description.trim() || null,
        image_url:      null,
        category:       form.category,
        token_type:     sym,
        seller_address: address,
      })

      setStep('done')
      onCreated?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      setError(msg.includes('rejected') ? 'Transaction rejected in wallet.' : msg.slice(0, 150))
      setStep('form')
    }
  }, [form, address, createListing, collateralEth, price, sym, onCreated])

  const collateralPresets = [
    { key: 'none'   as const, label: 'None',   hint: 'No collateral'   },
    { key: 'pct10'  as const, label: '10%',    hint: 'Good for NFTs'   },
    { key: 'pct25'  as const, label: '25%',    hint: 'Whitelist spots' },
    { key: 'custom' as const, label: 'Custom', hint: 'Set manually'    },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.8)', backdropFilter:'blur(6px)' }}>
      <div style={{ width:'100%', maxWidth:480, background:BG2, border:`1px solid ${BD}`, maxHeight:'90vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderBottom:`1px solid ${BD}`, position:'sticky', top:0, background:BG2, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:BB, fontSize:'1.375rem', color:ARC }}>⬡</span>
            <span style={{ fontFamily:BB, fontSize:'1.125rem', letterSpacing:'0.1em', color:TXL }}>NEW LISTING</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:TXM, padding:4, display:'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = TXL}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = TXM}
          >
            <X size={18} />
          </button>
        </div>

        {step === 'done' ? (
          <div style={{ padding:'3rem 1.25rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ width:64, height:64, border:`1px solid rgba(46,87,255,0.3)`, background:'rgba(46,87,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BB, fontSize:'2rem', color:ARC }}>⬡</div>
            <div>
              <p style={{ fontFamily:BB, fontSize:'1.5rem', color:TXL, letterSpacing:'0.06em' }}>LISTING CREATED</p>
              <p style={{ fontFamily:JB, fontSize:10, letterSpacing:'0.1em', color:TXM, marginTop:6 }}>Your item is now live on the marketplace.</p>
            </div>
            <button onClick={onClose} style={{ background:ARC, color:'#fff', border:'none', cursor:'pointer', fontFamily:JB, fontSize:10.5, fontWeight:700, letterSpacing:'0.14em', padding:'0.75rem 2rem', width:'100%', marginTop:8 }}>
              BACK TO MARKETPLACE
            </button>
          </div>
        ) : (
          <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:16 }}>

            {/* Title */}
            <div>
              <label style={labelStyle}>ITEM TITLE *</label>
              <input
                style={inputStyle}
                placeholder="OG NFT, Whitelist spot, Private deal, etc"
                value={form.title}
                onChange={set('title')}
                onFocus={e  => (e.currentTarget.style.borderColor = BD2)}
                onBlur={e   => (e.currentTarget.style.borderColor = BD)}
              />
            </div>

            {/* Category + Price */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={labelStyle}>CATEGORY</label>
                <select
                  style={{ ...inputStyle, cursor:'pointer' }}
                  value={form.category}
                  onChange={set('category')}
                >
                  {CATEGORIES.map(c => <option key={c} style={{ background:BG3, color:TXL }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>PRICE ({sym}) *</label>
                <input
                  style={{ ...inputStyle, fontFamily:JB }}
                  type="number" step="0.0001" min="0"
                  placeholder="0.0000"
                  value={form.priceEth}
                  onChange={set('priceEth')}
                  onFocus={e  => (e.currentTarget.style.borderColor = BD2)}
                  onBlur={e   => (e.currentTarget.style.borderColor = BD)}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea
                style={{ ...inputStyle, resize:'none', lineHeight:1.6 }}
                rows={3}
                placeholder="Describe exactly what the buyer receives — delivery method, timeline, proof…"
                value={form.description}
                onChange={set('description')}
                onFocus={e  => (e.currentTarget.style.borderColor = BD2)}
                onBlur={e   => (e.currentTarget.style.borderColor = BD)}
              />
            </div>

            {/* Collateral */}
            <div style={{ border:`1px solid rgba(46,87,255,0.15)`, background:'rgba(46,87,255,0.03)', padding:'1rem' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:12 }}>
                <Shield size={14} style={{ color:ARC, flexShrink:0, marginTop:1 }} />
                <div>
                  <p style={{ fontFamily:JB, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', color:TXL, marginBottom:3 }}>SELLER COLLATERAL</p>
                  <p style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.04em', color:TXM, lineHeight:1.6 }}>
                    Lock {sym} as proof of commitment. Returned when buyer confirms receipt.
                    Paid to buyer if they win a dispute.
                  </p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {collateralPresets.map(opt => {
                  const active = collateralMode === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setCollateralMode(opt.key)}
                      style={{
                        padding:'0.625rem 0.75rem', textAlign:'left', cursor:'pointer',
                        border:`1px solid ${active ? BD2 : BD}`,
                        background: active ? 'rgba(46,87,255,0.1)' : BG3,
                        transition:'all .18s',
                      }}
                    >
                      <div style={{ fontFamily:JB, fontSize:10, fontWeight:700, letterSpacing:'0.1em', color: active ? ARC : TXL }}>{opt.label}</div>
                      <div style={{ fontFamily:JB, fontSize:8.5, letterSpacing:'0.04em', color:TXM, marginTop:2 }}>{opt.hint}</div>
                    </button>
                  )
                })}
              </div>

              {collateralMode === 'custom' && (
                <div style={{ marginTop:10 }}>
                  <label style={labelStyle}>CUSTOM COLLATERAL ({sym})</label>
                  <input
                    style={{ ...inputStyle, fontFamily:JB }}
                    type="number" step="0.001" min="0"
                    placeholder="0.000"
                    value={customCollateral}
                    onChange={e => setCustomCollateral(e.target.value)}
                    onFocus={e  => (e.currentTarget.style.borderColor = BD2)}
                    onBlur={e   => (e.currentTarget.style.borderColor = BD)}
                  />
                </div>
              )}

              {parseFloat(collateralEth) > 0 && (
                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, fontFamily:JB, fontSize:9, letterSpacing:'0.08em', color:ARC, background:'rgba(46,87,255,0.06)', border:`1px solid rgba(46,87,255,0.18)`, padding:'6px 10px' }}>
                  <Info size={11} />
                  You deposit <strong style={{ marginLeft:3 }}>{parseFloat(collateralEth).toFixed(6)} {sym}</strong>&nbsp;now as collateral.
                </div>
              )}
            </div>

            {/* Price breakdown */}
            {price > 0 && (
              <div style={{ background:BG, border:`1px solid ${BD}`, padding:'0.875rem 1rem', display:'flex', flexDirection:'column', gap:8 }}>
                <Row label="Buyer pays"      value={`${form.priceEth} ${sym}`}               color={TXL} />
                <Row label="Platform fee 1%" value={`−${(price * 0.01).toFixed(6)} ${sym}`}  color={TXM} />
                <div style={{ height:1, background:BD, margin:'2px 0' }} />
                <Row label="You receive"     value={`${(price * 0.99).toFixed(6)} ${sym}`}   color={ARC} bold />
                {parseFloat(collateralEth) > 0 && (
                  <Row label="Your collateral (refunded on success)" value={`${parseFloat(collateralEth).toFixed(6)} ${sym}`} color='rgba(46,87,255,0.6)' />
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'0.75rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontFamily:JB, fontSize:10, color:'#f87171', lineHeight:1.5 }}>
                <AlertCircle size={13} style={{ flexShrink:0, marginTop:1 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isPending || step === 'confirming'}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'0.75rem', background: (isPending || step === 'confirming') ? 'rgba(46,87,255,0.5)' : ARC,
                color:'#fff', border:'none', cursor: (isPending || step === 'confirming') ? 'not-allowed' : 'pointer',
                fontFamily:JB, fontSize:11, fontWeight:700, letterSpacing:'0.14em',
                transition:'background .18s',
              }}
              onMouseEnter={e => { if (!isPending && step !== 'confirming') (e.currentTarget as HTMLElement).style.background = '#4B6DFF' }}
              onMouseLeave={e => { if (!isPending && step !== 'confirming') (e.currentTarget as HTMLElement).style.background = ARC }}
            >
              {isPending || step === 'confirming' ? (
                <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> CONFIRM IN WALLET…</>
              ) : (
                `CREATE LISTING${parseFloat(collateralEth) > 0 ? ` + DEPOSIT ${parseFloat(collateralEth).toFixed(4)} ${sym}` : ''}`
              )}
            </button>

            <p style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.06em', color:'rgba(255,255,255,0.12)', textAlign:'center' }}>
              Buyers fund the vault when they lock. Collateral is deposited immediately on creation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <span style={{ fontFamily:'var(--font-jb,monospace)', fontSize:9.5, letterSpacing:'0.06em', color:'#6B6B99' }}>{label}</span>
      <span style={{ fontFamily:'var(--font-jb,monospace)', fontSize:10.5, letterSpacing:'0.06em', color, fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  )
}
