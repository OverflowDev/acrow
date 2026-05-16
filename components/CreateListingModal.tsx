'use client'

import { useState, useCallback } from 'react'
import { X, Shield, Loader2, AlertCircle, Info } from 'lucide-react'
import { useCreateListing } from '@/hooks/useEscrowContract'
import { upsertListingMeta } from '@/lib/supabase'
import { useAccount } from 'wagmi'
import { useNativeSymbol } from '@/hooks/useNativeSymbol'

const CATEGORIES = ['General', 'Crypto', 'NFT', 'Whitelist', 'Service', 'Digital', 'Physical']

const COLLATERAL_PRESETS = [
  { label: 'None',  value: '0',    hint: 'Standard sale' },
  { label: '10%',   value: '',     hint: 'Recommended for NFT sales', pct: 0.1 },
  { label: '25%',   value: '',     hint: 'High-trust whitelist spots', pct: 0.25 },
  { label: 'Custom',value: 'custom', hint: '' },
]

interface CreateListingModalProps {
  onClose:    () => void
  onCreated?: () => void
}

export function CreateListingModal({ onClose, onCreated }: CreateListingModalProps) {
  const { address } = useAccount()
  const { createListing, isPending } = useCreateListing()
  const sym = useNativeSymbol()

  const [form, setForm] = useState({
    title:        '',
    description:  '',
    category:     'General',
    priceEth:     '',
    imageUrl:     '',
    collateralEth: '0',
  })
  const [collateralMode, setCollateralMode] = useState<'none' | 'pct' | 'custom'>('none')
  const [customCollateral, setCustomCollateral] = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [step,  setStep]    = useState<'form' | 'confirming' | 'done'>('form')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const price = parseFloat(form.priceEth) || 0

  const collateralEth = (() => {
    if (collateralMode === 'none')   return '0'
    if (collateralMode === 'custom') return customCollateral || '0'
    return (price * parseFloat(form.collateralEth || '0')).toFixed(6)
  })()

  const totalDeposit = price > 0
    ? (parseFloat(collateralEth) || 0)
    : 0

  const handleSubmit = useCallback(async () => {
    setError(null)
    if (!form.title.trim())    { setError('Title is required');        return }
    if (price <= 0)            { setError('Enter a valid price');      return }
    if (!address)              { setError('Connect your wallet first'); return }

    try {
      setStep('confirming')
      const itemId = crypto.randomUUID()

      await createListing(form.priceEth, collateralEth, itemId)

      await upsertListingMeta({
        id:             itemId,
        contract_id:    0,
        title:          form.title.trim(),
        description:    form.description.trim() || null,
        image_url:      form.imageUrl.trim() || null,
        category:       form.category,
        token_type:     'ETH',
        seller_address: address,
      })

      setStep('done')
      onCreated?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      setError(msg.includes('rejected') ? 'Transaction rejected in wallet.' : msg.slice(0, 150))
      setStep('form')
    }
  }, [form, address, createListing, collateralEth, price, onCreated])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" />
            <h2 className="font-bold text-white">Create Escrow Listing</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {step === 'done' ? (
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
              <Shield size={28} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Listing Created!</p>
              <p className="text-sm text-slate-400 mt-1">Your item is now live on the marketplace.</p>
            </div>
            <button onClick={onClose} className="btn-primary w-full">Back to Marketplace</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Basic info */}
            <div>
              <label className="label">Item Title *</label>
              <input className="input" placeholder="e.g. OG NFT Whitelist Spot — 1 ETH mint price" value={form.title} onChange={set('title')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Price ({sym}) *</label>
                <input className="input font-mono" type="number" step="0.0001" min="0" placeholder="0.0000" value={form.priceEth} onChange={set('priceEth')} />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="Describe what the buyer receives…" value={form.description} onChange={set('description')} />
            </div>

            <div>
              <label className="label">Image URL (optional)</label>
              <input className="input" placeholder="https://…" value={form.imageUrl} onChange={set('imageUrl')} />
            </div>

            {/* ─── Collateral Section ──────────────────────────────── */}
            <div className="border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Shield size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Seller Collateral</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For NFT / whitelist sales — lock ETH as proof of commitment.
                    Returned when buyer confirms, paid to buyer if dispute is won against you.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'None',    mode: 'none'   as const, hint: 'No collateral' },
                  { label: '10%',     mode: 'pct10'  as const, hint: 'Good for NFTs'  },
                  { label: '25%',     mode: 'pct25'  as const, hint: 'High-value WL'  },
                  { label: 'Custom',  mode: 'custom' as const, hint: 'Set manually'   },
                ].map(opt => (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => {
                      if (opt.mode === 'none')   { setCollateralMode('none');   setForm(f => ({ ...f, collateralEth: '0' })) }
                      if (opt.mode === 'pct10')  { setCollateralMode('pct');    setForm(f => ({ ...f, collateralEth: '0.1' })) }
                      if (opt.mode === 'pct25')  { setCollateralMode('pct');    setForm(f => ({ ...f, collateralEth: '0.25' })) }
                      if (opt.mode === 'custom') { setCollateralMode('custom') }
                    }}
                    className={[
                      'p-2 rounded-lg border text-xs text-left transition-colors',
                      (opt.mode === 'none'   && collateralMode === 'none') ||
                      (opt.mode === 'pct10'  && collateralMode === 'pct' && form.collateralEth === '0.1') ||
                      (opt.mode === 'pct25'  && collateralMode === 'pct' && form.collateralEth === '0.25') ||
                      (opt.mode === 'custom' && collateralMode === 'custom')
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600',
                    ].join(' ')}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-slate-500 text-xs">{opt.hint}</div>
                  </button>
                ))}
              </div>

              {collateralMode === 'custom' && (
                <div>
                  <label className="label">Custom collateral (ETH)</label>
                  <input
                    className="input font-mono"
                    type="number" step="0.001" min="0"
                    placeholder="0.000"
                    value={customCollateral}
                    onChange={e => setCustomCollateral(e.target.value)}
                  />
                </div>
              )}

              {parseFloat(collateralEth) > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <Info size={12} />
                  You will deposit <strong>{parseFloat(collateralEth).toFixed(6)} {sym}</strong> as collateral when creating this listing.
                </div>
              )}
            </div>

            {/* Price breakdown */}
            {price > 0 && (
              <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg text-sm space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Buyer pays</span>
                  <span className="font-mono text-white">{form.priceEth} {sym}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Platform fee (1%)</span>
                  <span className="font-mono">-{(price * 0.01).toFixed(6)} {sym}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>You receive</span>
                  <span className="font-mono">{(price * 0.99).toFixed(6)} {sym}</span>
                </div>
                {parseFloat(collateralEth) > 0 && (
                  <>
                    <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between text-amber-400 text-xs">
                      <span>Your collateral deposit (refunded on success)</span>
                      <span className="font-mono">{parseFloat(collateralEth).toFixed(6)} {sym}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>Your total {sym} sent today</span>
                      <span className="font-mono">{totalDeposit.toFixed(6)} {sym}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || step === 'confirming'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isPending || step === 'confirming' ? (
                <><Loader2 size={16} className="animate-spin" /> Confirm in wallet…</>
              ) : (
                `Create Listing${totalDeposit > 0 ? ` + Deposit ${totalDeposit.toFixed(4)} ${sym}` : ''}`
              )}
            </button>

            <p className="text-xs text-slate-600 text-center">
              Buyers only move funds when they click "Buy". Collateral is locked immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
