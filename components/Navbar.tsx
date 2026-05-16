'use client'

import Link from 'next/link'
import { Shield, BarChart3 } from 'lucide-react'
import { WalletButton } from './WalletButton'
import { useListingCount } from '@/hooks/useEscrowContract'
import { CONTRACT_ADDRESS } from '@/lib/contract'

export function Navbar() {
  const { data: count } = useListingCount()

  return (
    <nav className="sticky top-0 z-50 h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center px-4 gap-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 flex items-center justify-center text-lg" style={{ background: 'rgba(79,124,245,0.12)', border: '1px solid rgba(79,124,245,0.3)', color: '#4F7CF5', fontFamily: 'var(--font-bebas, sans-serif)' }}>
          ⬡
        </div>
        <span className="hidden sm:block text-sm" style={{ fontFamily: 'var(--font-bebas, sans-serif)', letterSpacing: '0.12em', color: '#E4EAF8' }}>ARCROW</span>
      </Link>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 ml-2">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={12} className="text-emerald-500" />
          <span>Contract:</span>
          <span className="font-mono text-slate-400">
            {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
          </span>
        </div>
        {count !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-emerald-500 font-semibold">{count.toString()}</span>
            <span>listings</span>
          </div>
        )}
      </div>

      {/* Vault indicator */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Vault Active
      </div>

      <div className="ml-auto">
        <WalletButton />
      </div>
    </nav>
  )
}
