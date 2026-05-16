'use client'

import { useState } from 'react'
import { X, Star, CheckCircle2, Loader2 } from 'lucide-react'
import { submitRating } from '@/lib/supabase'
import { StarPicker, ReputationBadge } from './ReputationBadge'

interface RatingModalProps {
  escrowId:     string
  myAddress:    string
  otherAddress: string
  otherRole:    'Seller' | 'Buyer'
  onClose:      () => void
}

export function RatingModal({ escrowId, myAddress, otherAddress, otherRole, onClose }: RatingModalProps) {
  const [score,   setScore]   = useState(0)
  const [comment, setComment] = useState('')
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async () => {
    if (score === 0) { setError('Please select a rating'); return }
    setLoading(true)
    setError(null)
    try {
      await submitRating(escrowId, myAddress, otherAddress, score, comment)
      setDone(true)
    } catch {
      setError('Failed to submit rating. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            Rate your {otherRole}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center space-y-3">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <p className="font-bold text-white">Rating submitted!</p>
            <p className="text-sm text-slate-400">Your feedback helps build trust in the community.</p>
            <button onClick={onClose} className="btn-primary w-full mt-2">Done</button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">
            {/* Other party info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 font-mono text-xs">
                {otherAddress.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{otherRole}</p>
                <p className="text-xs text-slate-500 font-mono">
                  {otherAddress.slice(0, 8)}…{otherAddress.slice(-6)}
                </p>
                <ReputationBadge address={otherAddress} size="sm" showTrades />
              </div>
            </div>

            {/* Star picker */}
            <div>
              <p className="text-sm text-slate-400 mb-3">How was your experience?</p>
              <StarPicker value={score} onChange={setScore} />
              {score > 0 && (
                <p className="text-xs text-slate-500 mt-1.5">
                  {['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'][score]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="label">Comment (optional)</label>
              <textarea
                className="input resize-none text-sm"
                rows={3}
                maxLength={300}
                placeholder="Share what made this trade great or difficult…"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <p className="text-xs text-slate-600 text-right mt-0.5">{comment.length}/300</p>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || score === 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit Rating'}
            </button>

            <button onClick={onClose} className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
