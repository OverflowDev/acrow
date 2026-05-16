'use client'

import { Check } from 'lucide-react'
import { ListingStatus } from '@/types'

const STEPS = [
  { label: 'Listed',      sub: 'Seller created listing'      },
  { label: 'Funded',      sub: 'Buyer deposited to vault'    },
  { label: 'Confirming',  sub: 'Awaiting buyer confirmation' },
  { label: 'Settled',     sub: 'Funds released'              },
]

function getStep(status: ListingStatus): number {
  switch (status) {
    case ListingStatus.OPEN:      return 0
    case ListingStatus.LOCKED:    return 1
    case ListingStatus.DISPUTED:  return 1   // frozen at locked step
    case ListingStatus.COMPLETED: return 3
    case ListingStatus.CANCELLED: return -1
    default:                      return 0
  }
}

interface EscrowStepperProps {
  status: ListingStatus
}

export function EscrowStepper({ status }: EscrowStepperProps) {
  const currentStep = getStep(status)
  const isCancelled = status === ListingStatus.CANCELLED
  const isDisputed  = status === ListingStatus.DISPUTED

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-700/30 border border-slate-700 rounded-lg text-sm text-slate-500">
        <span className="w-2 h-2 bg-slate-600 rounded-full" />
        This listing was cancelled by the seller.
      </div>
    )
  }

  if (isDisputed) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Dispute in progress — arbitrator is reviewing
        </div>
        <ProgressBar steps={STEPS} currentStep={1} isDisputed />
      </div>
    )
  }

  return <ProgressBar steps={STEPS} currentStep={currentStep} />
}

function ProgressBar({
  steps,
  currentStep,
  isDisputed = false,
}: {
  steps:       typeof STEPS
  currentStep: number
  isDisputed?: boolean
}) {
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const done    = i < currentStep || (i === 3 && currentStep === 3)
        const active  = i === currentStep && currentStep < 3
        const last    = i === steps.length - 1

        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            {/* Connector + dot row */}
            <div className="flex items-center w-full">
              {/* Left line */}
              <div className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : done ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              {/* Circle */}
              <div className={[
                'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : active
                    ? isDisputed
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-600 text-slate-600',
              ].join(' ')}>
                {done ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>
              {/* Right line */}
              <div className={`h-0.5 flex-1 ${last ? 'invisible' : done ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            </div>

            {/* Label */}
            <div className="mt-2 text-center px-1">
              <p className={`text-xs font-semibold ${done || active ? 'text-slate-200' : 'text-slate-600'}`}>
                {step.label}
              </p>
              <p className="text-xs text-slate-600 hidden sm:block mt-0.5">{step.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
