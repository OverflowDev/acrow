'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useListingCount } from '@/hooks/useEscrowContract'
import { CONTRACT_ADDRESS } from '@/lib/contract'
import { WalletButton } from './WalletButton'
import { useNativeSymbol } from '@/hooks/useNativeSymbol'

export function Navbar() {
  const { data: count } = useListingCount()
  const sym = useNativeSymbol()

  return (
    <nav
      className="sticky top-0 z-50 flex items-center shrink-0"
      style={{
        height: 56,
        padding: '0 1.25rem',
        gap: '1rem',
        background: '#04080F',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 shrink-0 no-underline"
        style={{ textDecoration: 'none' }}
      >
        <Image src="/logo.png" alt="Scrow" width={28} height={28} style={{ objectFit: 'contain' }} priority />
        <span
          style={{
            fontFamily: 'var(--font-bebas, sans-serif)',
            fontSize: '1.25rem',
            letterSpacing: '0.1em',
            color: '#EDE9F8',
          }}
        >
          Scrow
        </span>
      </Link>

      {/* Live indicator */}
      <div
        className="hidden sm:flex items-center gap-1.5"
        style={{
          fontFamily: 'var(--font-jb, monospace)',
          fontSize: 9,
          letterSpacing: '0.18em',
          color: '#2E57FF',
          border: '1px solid rgba(46,87,255,0.2)',
          background: 'rgba(46,87,255,0.06)',
          padding: '3px 10px',
        }}
      >
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#2E57FF',
            display: 'inline-block',
            animation: 'pulse-led 1.8s ease-in-out infinite',
          }}
        />
        LIVE · {sym}
      </div>

      {/* Contract address */}
      <div
        className="hidden md:flex items-center gap-1.5"
        style={{
          fontFamily: 'var(--font-jb, monospace)',
          fontSize: 9,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.18)',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>CONTRACT</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>
          {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
        </span>
      </div>

      {/* Listing count */}
      {count !== undefined && count > 0n && (
        <div
          className="hidden lg:flex items-center gap-1"
          style={{
            fontFamily: 'var(--font-jb, monospace)',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.18)',
          }}
        >
          <span style={{ color: '#2E57FF', fontWeight: 700 }}>{count.toString()}</span>
          <span>LISTINGS</span>
        </div>
      )}

      <div className="ml-auto">
        <WalletButton />
      </div>
    </nav>
  )
}
