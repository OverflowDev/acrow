'use client'

import { useState, useEffect }  from 'react'
import { formatEther }           from 'viem'
import { useAccount }            from 'wagmi'
import {
  Shield, User, ShoppingBag, CheckCircle2, AlertTriangle,
  XCircle, Loader2, Lock, Clock, Package, Star,
} from 'lucide-react'
import { EscrowStepper }        from './EscrowStepper'
import { ChatPanel }            from './ChatPanel'
import { RatingModal }          from './RatingModal'
import { ReputationBadge }      from './ReputationBadge'
import {
  useDepositFunds, useConfirmDelivery, useConfirmReceipt,
  useInitiateDispute, useCancelListing, useResolveDispute, useArbitrator,
} from '@/hooks/useEscrowContract'
import { fetchMyRatingForEscrow } from '@/lib/supabase'
import { ListingStatus }        from '@/types'
import type { Listing }         from '@/types'
import { CONTRACT_ADDRESS }     from '@/lib/contract'
import { useNativeSymbol }      from '@/hooks/useNativeSymbol'

interface TransactionDetailProps {
  listing:    Listing
  onRefresh?: () => void
}

export function TransactionDetail({ listing, onRefresh }: TransactionDetailProps) {
  const { address } = useAccount()
  const sym = useNativeSymbol()

  const { depositFunds,    isPending: depositing }  = useDepositFunds()
  const { confirmDelivery, isPending: delivering }  = useConfirmDelivery()
  const { confirmReceipt,  isPending: confirming }  = useConfirmReceipt()
  const { initiateDispute, isPending: disputing }   = useInitiateDispute()
  const { cancelListing,   isPending: cancelling }  = useCancelListing()
  const { resolveDispute,  isPending: resolving }   = useResolveDispute()
  const { data: arbitratorAddress }                 = useArbitrator()

  const isArbitrator = !!address && !!arbitratorAddress &&
    address.toLowerCase() === (arbitratorAddress as string).toLowerCase()

  const [txHash,         setTxHash]         = useState<string | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [confirmDialog,  setConfirmDialog]  = useState(false)
  const [showRating,     setShowRating]     = useState(false)
  const [alreadyRated,   setAlreadyRated]   = useState(false)

  const isSeller    = address?.toLowerCase() === listing.seller.toLowerCase()
  const isBuyer     = address?.toLowerCase() === listing.buyer.toLowerCase()
  const isParty     = isSeller || isBuyer
  const status      = listing.status as ListingStatus
  const priceEth    = parseFloat(formatEther(listing.price)).toFixed(6)
  const collateralEth = listing.collateral > 0n
    ? parseFloat(formatEther(listing.collateral)).toFixed(6)
    : null
  const title       = listing.meta?.title ?? `Listing #${listing.id}`
  const escrowId    = listing.id.toString()

  // Check if current user already rated for this escrow
  useEffect(() => {
    if (!address || status !== ListingStatus.COMPLETED || !isParty) return
    fetchMyRatingForEscrow(escrowId, address).then(r => setAlreadyRated(!!r))
  }, [address, status, isParty, escrowId])

  const exec = async (fn: () => Promise<`0x${string}`>) => {
    setError(null); setTxHash(null)
    try {
      const hash = await fn()
      setTxHash(hash)
      onRefresh?.()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed'
      setError(msg.includes('rejected') ? 'Rejected in wallet.' : msg.slice(0, 150))
    }
  }

  const rateTarget   = isSeller ? listing.buyer  : listing.seller
  const rateRole     = isSeller ? 'Buyer' : 'Seller'

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-500 mb-1">ESCROW #{listing.id.toString().padStart(6,'0')}</p>
            <h2 className="text-lg font-bold text-white leading-tight truncate">{title}</h2>
            {listing.meta?.description && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{listing.meta.description}</p>
            )}
          </div>
          {listing.meta?.image_url && (
            <img src={listing.meta.image_url} alt={title}
              className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />
          )}
        </div>

        {/* Vault */}
        <div className="p-4 bg-slate-900/60 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Escrow Vault</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-white font-mono">{priceEth} {sym}</p>
              {collateralEth && (
                <p className="text-xs text-amber-400 mt-0.5 font-mono">
                  + {collateralEth} {sym} collateral
                </p>
              )}
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                {CONTRACT_ADDRESS.slice(0,10)}…{CONTRACT_ADDRESS.slice(-8)}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Progress */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Progress</p>
          <EscrowStepper status={status} />
        </div>

        {/* Dual-confirm indicators (when LOCKED) */}
        {status === ListingStatus.LOCKED && (
          <div className="grid grid-cols-2 gap-2">
            <ConfirmChip
              label="Seller Confirmed Delivery"
              done={listing.sellerConfirmed}
              icon={<Package size={12} />}
            />
            <ConfirmChip
              label="Buyer Confirmed Receipt"
              done={listing.buyerConfirmed}
              icon={<CheckCircle2 size={12} />}
            />
          </div>
        )}

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3">
          <PartyCard role="Seller" address={listing.seller} isYou={isSeller} icon={<User size={13} />} />
          <PartyCard
            role="Buyer"
            address={listing.buyer === '0x0000000000000000000000000000000000000000' ? undefined : listing.buyer}
            isYou={isBuyer}
            icon={<ShoppingBag size={13} />}
          />
        </div>

        {/* Fee / collateral info */}
        <div className="text-xs text-slate-600 flex justify-between">
          <span>Fee: 1% | Seller receives: {(parseFloat(priceEth)*0.99).toFixed(5)} {sym}</span>
          {collateralEth && <span className="text-amber-600">Collateral: {collateralEth} {sym}</span>}
        </div>

        {/* ─── Action Panel ─────────────────────────────────────────────────── */}
        <ActionPanel
          status={status}
          isSeller={isSeller}
          isBuyer={isBuyer}
          isConnected={!!address}
          isArbitrator={isArbitrator}
          sellerConfirmed={listing.sellerConfirmed}
          buyerConfirmed={listing.buyerConfirmed}
          hasCollateral={!!collateralEth}
          confirmDialog={confirmDialog}
          delivering={delivering}
          depositing={depositing}
          confirming={confirming}
          disputing={disputing}
          cancelling={cancelling}
          resolving={resolving}
          onBuy={()                  => exec(() => depositFunds(listing.id, listing.price))}
          onDelivered={()            => exec(() => confirmDelivery(listing.id))}
          onConfirm={()              => setConfirmDialog(true)}
          onConfirmFinal={() => { setConfirmDialog(false); exec(() => confirmReceipt(listing.id)) }}
          onConfirmCancel={()        => setConfirmDialog(false)}
          onDispute={()              => exec(() => initiateDispute(listing.id))}
          onCancel={()               => exec(() => cancelListing(listing.id))}
          onResolveFavorBuyer={()    => exec(() => resolveDispute(listing.id, true))}
          onResolveFavorSeller={()   => exec(() => resolveDispute(listing.id, false))}
        />

        {/* Tx hash */}
        {txHash && (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
            <CheckCircle2 size={13} />
            <span className="font-mono truncate">{txHash}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Rating prompt (COMPLETED) */}
        {status === ListingStatus.COMPLETED && isParty && !alreadyRated && address && (
          <button
            onClick={() => setShowRating(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 rounded-xl text-sm text-yellow-400 font-semibold transition-colors"
          >
            <Star size={15} />
            Rate your {rateRole}
          </button>
        )}

        {/* Timestamps */}
        <div className="space-y-1 text-xs text-slate-600">
          <TimeRow label="Created" ts={listing.createdAt} />
          {listing.lockedAt > 0n && <TimeRow label="Funded" ts={listing.lockedAt} />}
        </div>

        {/* ─── Chat Panel ───────────────────────────────────────────────────── */}
        {(isParty || isArbitrator) && (status === ListingStatus.LOCKED || status === ListingStatus.DISPUTED || status === ListingStatus.COMPLETED) && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {isArbitrator && !isParty ? 'Dispute Chat — Buyer, Seller & Arbitrator' : 'Chat & Negotiation'}
            </p>
            <ChatPanel
              escrowId={escrowId}
              seller={listing.seller}
              buyer={listing.buyer}
              arbitrator={arbitratorAddress as string | undefined}
            />
          </div>
        )}
      </div>

      {/* Rating modal */}
      {showRating && address && (
        <RatingModal
          escrowId={escrowId}
          myAddress={address}
          otherAddress={rateTarget}
          otherRole={rateRole as 'Seller' | 'Buyer'}
          onClose={() => { setShowRating(false); setAlreadyRated(true) }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, { label: string; cls: string }> = {
    [ListingStatus.OPEN]:      { label: 'Open',      cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
    [ListingStatus.LOCKED]:    { label: '🔒 Funded', cls: 'bg-blue-500/10 border-blue-500/30 text-blue-400'         },
    [ListingStatus.COMPLETED]: { label: 'Settled',   cls: 'bg-slate-500/10 border-slate-500/30 text-slate-400'      },
    [ListingStatus.DISPUTED]:  { label: 'Disputed',  cls: 'bg-red-500/10 border-red-500/30 text-red-400'            },
    [ListingStatus.CANCELLED]: { label: 'Cancelled', cls: 'bg-slate-700/20 border-slate-700 text-slate-600'         },
  }
  const { label, cls } = map[status]
  return (
    <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${cls}`}>{label}</span>
  )
}

function ConfirmChip({ label, done, icon }: { label: string; done: boolean; icon: React.ReactNode }) {
  return (
    <div className={[
      'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs',
      done
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-slate-800 border-slate-700 text-slate-600',
    ].join(' ')}>
      {done ? <CheckCircle2 size={12} /> : icon}
      <span className="truncate">{label}</span>
    </div>
  )
}

function PartyCard({ role, address, isYou, icon }: {
  role: string; address: string | undefined; isYou: boolean; icon: React.ReactNode
}) {
  return (
    <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg space-y-1">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
        {icon}
        <span>{role}</span>
        {isYou && <span className="ml-auto text-emerald-400 font-semibold text-xs">YOU</span>}
      </div>
      {address ? (
        <>
          <p className="font-mono text-xs text-slate-300 truncate">
            {address.slice(0,8)}…{address.slice(-6)}
          </p>
          <ReputationBadge address={address} size="sm" showTrades />
        </>
      ) : (
        <p className="text-xs text-slate-600 italic">No buyer yet</p>
      )}
    </div>
  )
}

function TimeRow({ label, ts }: { label: string; ts: bigint }) {
  return (
    <div className="flex items-center gap-1.5">
      <Clock size={11} />
      <span>{label}:</span>
      <span>{new Date(Number(ts) * 1000).toLocaleString()}</span>
    </div>
  )
}

// ─── Action Panel ─────────────────────────────────────────────────────────────

interface ActionPanelProps {
  status:               ListingStatus
  isSeller:             boolean
  isBuyer:              boolean
  isConnected:          boolean
  isArbitrator:         boolean
  sellerConfirmed:      boolean
  buyerConfirmed:       boolean
  hasCollateral:        boolean
  confirmDialog:        boolean
  delivering:           boolean
  depositing:           boolean
  confirming:           boolean
  disputing:            boolean
  cancelling:           boolean
  resolving:            boolean
  onBuy:                () => void
  onDelivered:          () => void
  onConfirm:            () => void
  onConfirmFinal:       () => void
  onConfirmCancel:      () => void
  onDispute:            () => void
  onCancel:             () => void
  onResolveFavorBuyer:  () => void
  onResolveFavorSeller: () => void
}

function ActionPanel(p: ActionPanelProps) {
  if (!p.isConnected) {
    return (
      <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-center text-sm text-slate-500">
        Connect your wallet to interact with this escrow
      </div>
    )
  }

  if (p.status === ListingStatus.OPEN) {
    return (
      <div className="space-y-2">
        {!p.isSeller && (
          <button onClick={p.onBuy} disabled={p.depositing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {p.depositing
              ? <><Loader2 size={16} className="animate-spin"/> Confirming…</>
              : <><ShoppingBag size={16}/> Buy & Deposit to Vault</>}
          </button>
        )}
        {p.isSeller && (
          <button onClick={p.onCancel} disabled={p.cancelling}
            className="btn-danger w-full flex items-center justify-center gap-2">
            {p.cancelling ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>}
            Cancel Listing
          </button>
        )}
      </div>
    )
  }

  if (p.status === ListingStatus.LOCKED) {
    if (p.confirmDialog) {
      return (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Release funds to seller?</p>
              <p className="text-xs text-slate-400 mt-1">
                This sends the price to the seller. Collateral is returned to the seller
                {p.sellerConfirmed ? ' (they confirmed delivery ✓).' : ' only if they have confirmed delivery.'}
                {' '}This <strong className="text-white">cannot be undone</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={p.onConfirmFinal} disabled={p.confirming}
              className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm">
              {p.confirming ? <><Loader2 size={13} className="animate-spin"/> Releasing…</> : 'Yes, Release Funds'}
            </button>
            <button onClick={p.onConfirmCancel} className="btn-ghost flex-1 text-sm">Cancel</button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {/* Seller: confirm delivery */}
        {p.isSeller && !p.sellerConfirmed && (
          <button onClick={p.onDelivered} disabled={p.delivering}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-semibold rounded-xl text-sm transition-colors">
            {p.delivering
              ? <><Loader2 size={15} className="animate-spin"/> Confirming…</>
              : <><Package size={15}/> I Have Delivered the Item</>}
          </button>
        )}
        {p.isSeller && p.sellerConfirmed && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
            <CheckCircle2 size={15}/>
            Delivery confirmed — waiting for buyer
          </div>
        )}

        {/* Buyer: confirm receipt */}
        {p.isBuyer && (
          <button onClick={p.onConfirm}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            <CheckCircle2 size={18}/>
            I RECEIVED THE ITEM — RELEASE FUNDS
          </button>
        )}

        {/* Collateral notice for buyer */}
        {p.isBuyer && p.hasCollateral && !p.sellerConfirmed && (
          <div className="flex items-start gap-1.5 text-xs text-amber-400 px-1">
            <AlertTriangle size={11} className="shrink-0 mt-0.5"/>
            <span>
              Seller hasn't confirmed delivery yet. If you release now,
              their collateral goes to you as compensation.
            </span>
          </div>
        )}

        {/* Dispute */}
        {(p.isBuyer || p.isSeller) && (
          <button onClick={p.onDispute} disabled={p.disputing}
            className="btn-danger w-full flex items-center justify-center gap-2 text-sm">
            {p.disputing ? <><Loader2 size={14} className="animate-spin"/> Opening…</> : <><AlertTriangle size={14}/> Open Dispute</>}
          </button>
        )}

        {!p.isBuyer && !p.isSeller && (
          <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-center text-sm text-slate-500">
            You are not a party to this escrow
          </div>
        )}
      </div>
    )
  }

  if (p.status === ListingStatus.COMPLETED) {
    return (
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
        <CheckCircle2 size={22} className="text-emerald-400 mx-auto"/>
        <p className="font-bold text-white text-sm">Transaction Complete</p>
        <p className="text-xs text-slate-400">Funds released to seller.</p>
      </div>
    )
  }

  if (p.status === ListingStatus.DISPUTED) {
    if (p.isArbitrator) {
      return (
        <div className="space-y-3">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-red-400 shrink-0"/>
              <p className="font-bold text-white text-sm">Arbitrator — Resolve Dispute</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Review the chat, evidence, and both parties&apos; claims, then issue a ruling.
              This action is <strong className="text-white">final and cannot be undone</strong>.
            </p>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl space-y-2 text-xs text-slate-400">
            <p><span className="text-emerald-400 font-semibold">Favor Buyer</span> — buyer gets full price refund + seller&apos;s collateral (seller failed to deliver)</p>
            <p><span className="text-blue-400 font-semibold">Favor Seller</span> — seller gets price (minus 1% fee) + collateral back (buyer raised false dispute)</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={p.onResolveFavorBuyer}
              disabled={p.resolving}
              className="flex items-center justify-center gap-2 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {p.resolving ? <Loader2 size={14} className="animate-spin"/> : <ShoppingBag size={14}/>}
              Favor Buyer
            </button>
            <button
              onClick={p.onResolveFavorSeller}
              disabled={p.resolving}
              className="flex items-center justify-center gap-2 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {p.resolving ? <Loader2 size={14} className="animate-spin"/> : <User size={14}/>}
              Favor Seller
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center space-y-1">
        <AlertTriangle size={22} className="text-red-400 mx-auto"/>
        <p className="font-bold text-white text-sm">Dispute In Progress</p>
        <p className="text-xs text-slate-400">Funds frozen. Arbitrator is reviewing — outcome will be posted here.</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-center text-sm text-slate-500">
      <XCircle size={18} className="mx-auto mb-1 text-slate-600"/>
      Listing cancelled.
    </div>
  )
}
