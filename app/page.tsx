'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, Shield, Lock,
  CheckCircle, MessageSquare, Star, Scale,
  Package, Zap, ExternalLink,
} from 'lucide-react'

// ─── Static data ─────────────────────────────────────────────────────────────

const PHASES = ['LISTED', 'FUNDED', 'CONFIRMING', 'SETTLED'] as const

const STEPS = [
  {
    num: '01',
    label: 'Seller posts the offer',
    title: 'LOCK IT',
    desc: 'List your item and set a USDC price on Arc. Optionally lock collateral on-chain — your commitment, enforced in code.',
    Icon: Lock,
  },
  {
    num: '02',
    label: 'Buyer deposits USDC',
    title: 'FUND IT',
    desc: 'Buyer sends USDC into the smart contract vault. Sub-second finality on Arc. Funds are locked — not transferred, not trusted.',
    Icon: Package,
  },
  {
    num: '03',
    label: 'Both parties confirm',
    title: 'PROVE IT',
    desc: 'Seller signals delivery on-chain. Buyer confirms receipt. Two keys, one vault. No unilateral release, ever.',
    Icon: CheckCircle,
  },
  {
    num: '04',
    label: 'Contract releases payment',
    title: 'COLLECT',
    desc: 'USDC settles to seller. Collateral returned. 1% fee deducted. Atomic, irreversible, on-chain. No one can stop it.',
    Icon: Zap,
  },
]

const FEATURES = [
  { Icon: Shield,        title: 'Non-Custodial Vault',   desc: 'Your USDC lives in a smart contract, not on our servers. The code is the custodian — auditable and immutable.' },
  { Icon: Lock,          title: 'Seller Collateral',     desc: 'Sellers lock USDC collateral on-chain. Fails to deliver? Buyer gets it. Zero-faith, protocol-enforced accountability.' },
  { Icon: CheckCircle,   title: 'Dual Confirmation',     desc: 'Both counterparties must confirm on-chain. No unilateral fund release. The vault opens only when both agree.' },
  { Icon: MessageSquare, title: 'Realtime Negotiation',  desc: 'Live channel between buyer and seller, timestamped within the escrow. Clarify terms, amend, agree — never leave the deal.' },
  { Icon: Star,          title: 'Verifiable Reputation', desc: 'Ratings are tied to wallet addresses. Build a cross-deal trade history that lives on-chain and follows your address everywhere.' },
  { Icon: Scale,         title: 'Dispute Arbitration',   desc: 'File a formal dispute if delivery fails. Reviewed with full on-chain evidence, collateral at stake, and timestamped chat record.' },
]

const HERO_CHIPS = [
  { label: 'ARC NATIVE', pulse: true },
  { label: 'USDC SETTLEMENT', pulse: false },
  { label: '0.48s FINALITY', pulse: false },
  { label: 'MALACHITE BFT', pulse: false },
]

const INLINE_STATS = [
  { val: '0.48s',  lbl: 'FINALITY' },
  { val: '~$0.01', lbl: 'PER TX'   },
  { val: '1%',     lbl: 'PROTOCOL FEE' },
]

// ─── Counter hook ─────────────────────────────────────────────────────────────

function useCounter(target: number, ms = 1800, active = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let t0: number
    const raf = (now: number) => {
      if (!t0) t0 = now
      const p = Math.min((now - t0) / ms, 1)
      setVal(Math.floor((1 - (1 - p) ** 3) * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, ms, active])
  return val
}

// ─── Landing page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [phase,       setPhase]       = useState(0)
  const [statsOn,     setStatsOn]     = useState(false)
  const [cursorPos,   setCursorPos]   = useState({ x: -100, y: -100 })
  const [cursorLarge, setCursorLarge] = useState(false)

  const c1 = useCounter(10,  1400, statsOn)
  const c2 = useCounter(380, 1900, statsOn)
  const c3 = useCounter(5,   1200, statsOn)

  useEffect(() => {
    const move = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    const on  = () => setCursorLarge(true)
    const off = () => setCursorLarge(false)
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', on)
      el.addEventListener('mouseleave', off)
    })
  })

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % 4), 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('lp-in-view')
        if ((e.target as HTMLElement).dataset.stats) setStatsOn(true)
      })
    }, { threshold: 0.15 })
    document.querySelectorAll('[data-lp-animate]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      {/* ── cursor ring ────────────────────────────────────────────────────── */}
      <div
        className="lp-cursor"
        style={{
          left:       cursorPos.x - 11,
          top:        cursorPos.y - 11,
          transform:  cursorLarge ? 'scale(2.2)' : 'scale(1)',
          transition: 'left 0.08s linear, top 0.08s linear, transform 0.2s ease',
        }}
      />

      <div className="lp-root">

        {/* ── ANNOUNCEMENT BAR ─────────────────────────────────────────────── */}
        <div className="lp-announce">
          <span className="lp-announce-dot" />
          <span className="lp-announce-text">
            ARCROW IS LIVE ON ARC TESTNET · CHAIN 5042002 · USDC NATIVE GAS · 0.48s FINALITY
          </span>
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-announce-link"
          >
            GET TESTNET USDC <ExternalLink size={9} />
          </a>
        </div>

        {/* ── NAV ──────────────────────────────────────────────────────────── */}
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">
            <span className="lp-logo-hex">⬡</span>
            <span className="lp-logo-text">ARCROW</span>
          </Link>
          <div className="lp-nav-links">
            <a href="#how">PROTOCOL</a>
            <a href="#features">FEATURES</a>
            <a href="#stats">STATS</a>
          </div>
          <Link href="/app" className="lp-nav-cta">
            LAUNCH APP <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        </nav>

        {/* ── HERO — 2-column grid, left text + right vault ────────────────── */}
        <section className="lp-hero">
          <div className="lp-grid-bg" aria-hidden />

          {/* Left column */}
          <div className="lp-hero-left">
            {/* Chip row */}
            <div className="lp-hero-chips">
              {HERO_CHIPS.map((c, i) => (
                <span key={i} className="lp-chip">
                  {c.pulse && <span className="lp-chip-dot" />}
                  {c.label}
                </span>
              ))}
            </div>

            {/* Headline — 2-line phrase */}
            <div className="lp-hero-headline">
              <div className="lp-word-row">
                <span className="lp-word" style={{ animationDelay: '0.04s' }}>
                  THE DEAL IS
                </span>
              </div>
              <div className="lp-word-row">
                <span className="lp-word lp-word-blue" style={{ animationDelay: '0.17s' }}>
                  IN THE CODE.
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <p className="lp-hero-sub">
              Trustless P2P escrow on Arc Network. USDC locked in a smart contract vault,
              released on dual confirmation. Sub-second finality. No lawyers. No middlemen.
            </p>

            {/* CTA row */}
            <div className="lp-hero-cta-row">
              <Link href="/app" className="lp-btn-primary">
                LAUNCH APP <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a href="#how" className="lp-btn-ghost-nav">
                HOW IT WORKS
              </a>
            </div>

            {/* Mini stats row */}
            <div className="lp-hero-inline-stats" style={{ marginTop: '1.5rem' }}>
              {INLINE_STATS.map((s, i) => (
                <div key={i} className="lp-hero-inline-stat">
                  <span className="lp-hero-inline-val">{s.val}</span>
                  <span className="lp-hero-inline-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — vault */}
          <div className="lp-hero-right">
            <WideVault phase={phase} phases={PHASES} />
          </div>
        </section>

        {/* ── SCROLLING BAND ───────────────────────────────────────────────── */}
        <div className="lp-band" id="how">
          <div className="lp-band-track">
            {Array(14).fill(null).map((_, i) => (
              <span key={i} className="lp-band-item">
                ARCROW PROTOCOL <span className="lp-band-dot">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section className="lp-how">
          <div className="lp-section-wrap">
            <div className="lp-section-head" data-lp-animate>
              <span className="lp-section-tag">[PROTOCOL]</span>
              <h2 className="lp-section-title">HOW IT WORKS</h2>
              <p className="lp-section-sub">Four steps. Zero trust required. Fully on-chain on Arc.</p>
            </div>
            <div className="lp-steps-grid">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="lp-step"
                  data-lp-animate
                  style={{ transitionDelay: `${i * 0.09}s` }}
                >
                  <div className="lp-step-num">{s.num}</div>
                  <div className="lp-step-icon"><s.Icon size={20} /></div>
                  <div className="lp-step-label">{s.label}</div>
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="lp-step-connector" aria-hidden>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────────── */}
        <section className="lp-features" id="features">
          <div className="lp-section-wrap">
            <div className="lp-section-head" data-lp-animate>
              <span className="lp-section-tag">[FEATURES]</span>
              <h2 className="lp-section-title">BUILT DIFFERENT</h2>
              <p className="lp-section-sub">Every edge case handled. Every incentive aligned.</p>
            </div>
            <div className="lp-features-grid">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="lp-feature-card"
                  data-lp-animate
                  style={{ transitionDelay: `${i * 0.075}s` }}
                >
                  <div className="lp-feature-icon"><f.Icon size={22} /></div>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────────────────────── */}
        <section className="lp-stats" id="stats">
          <div className="lp-stats-grid" data-lp-animate data-stats="true">
            <div className="lp-stat-block">
              <div className="lp-stat-num">{c1}</div>
              <div className="lp-stat-lbl">DEALS LOCKED<br/>ON CHAIN</div>
            </div>
            <div className="lp-stat-block">
              <div className="lp-stat-num">${c2}</div>
              <div className="lp-stat-lbl">USDC MOVED<br/>THROUGH ESCROW</div>
            </div>
            <div className="lp-stat-block">
              <div className="lp-stat-num">{c3}</div>
              <div className="lp-stat-lbl">DEALS SETTLED<br/>IN FULL</div>
            </div>
            <div className="lp-stat-block">
              <div className="lp-stat-num">1%</div>
              <div className="lp-stat-lbl">PROTOCOL FEE.<br/>{"THAT'S IT."}</div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="lp-cta">
          <div className="lp-cta-bg" aria-hidden>ARCROW</div>
          <div className="lp-cta-content" data-lp-animate>
            <span className="lp-section-tag">[READY?]</span>
            <h2 className="lp-cta-title">
              LOCK YOUR<br />
              <span className="lp-cta-blue">FIRST DEAL.</span>
            </h2>
            <p className="lp-cta-sub">
              Connect your wallet. List or browse. Trade without trust.
            </p>
            <Link href="/app" className="lp-btn-primary lp-btn-xl">
              OPEN THE APP <ArrowUpRight size={20} strokeWidth={2.5} />
            </Link>
            <div className="lp-chains">
              <span className="lp-chains-label">DEPLOYED ON</span>
              <span className="lp-chain-badge">ARC TESTNET</span>
              <span className="lp-chain-sep">·</span>
              <span className="lp-chain-badge">CHAIN 5042002</span>
              <span className="lp-chain-sep">·</span>
              <span className="lp-chain-badge">USDC NATIVE</span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-footer-logo">ARCROW</div>
          <div className="lp-footer-links">
            <a href="#">Docs</a>
            <a href="#">GitHub</a>
            <a href="#">Discord</a>
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              ArcScan ↗
            </a>
          </div>
          <div className="lp-footer-copy">
            © 2026 ARCROW Protocol · Built natively on Arc Network
          </div>
        </footer>

      </div>
    </>
  )
}

// ─── Wide Vault — horizontal B→⬡→S layout ────────────────────────────────────

function WideVault({
  phase,
  phases,
}: {
  phase: number
  phases: readonly string[]
}) {
  const leftActive  = phase >= 1
  const rightActive = phase >= 3
  const vaultLocked = phase >= 1

  const leftLabel  = phase === 0 ? 'PENDING' : phase === 1 ? '0.50 USDC →' : '✓ FUNDED'
  const rightLabel = phase < 3   ? 'PENDING' : '0.495 USDC →'
  const vaultState = ['OPEN', 'LOCKED', 'CONFIRMING', 'SETTLED'][phase]

  return (
    <div className="wv-card">

      {/* macOS terminal chrome */}
      <div className="wv-header">
        <span className="wv-dot wv-dot-r" />
        <span className="wv-dot wv-dot-y" />
        <span className="wv-dot wv-dot-g" />
        <span className="wv-header-title">ARCROW ESCROW VAULT · 0x4a2f…e391</span>
        <div className="wv-live-badge">
          <span className="wv-live-dot" />
          LIVE
        </div>
      </div>

      {/* Status bar */}
      <div className="wv-status">
        <span className="wv-status-led" />
        STATUS:&nbsp;<span className="wv-status-phase">{phases[phase]}</span>
      </div>

      {/* Horizontal flow: Buyer → Vault → Seller */}
      <div className="wv-flow">
        <div className="wv-node">
          <div className="wv-node-icon">B</div>
          <div className="wv-node-lbl">BUYER</div>
          <div className="wv-node-addr">0xBu…yer</div>
        </div>

        <div className="wv-conn">
          <div className={`wv-conn-line${leftActive ? ' active' : ''}`} />
          <div className={`wv-conn-lbl${leftActive ? ' active' : ''}`}>{leftLabel}</div>
        </div>

        <div className="wv-vault-icon-wrap">
          <div className="wv-vault-icon">⬡</div>
          <div className="wv-vault-lbl">VAULT</div>
          <div className={`wv-vault-state${vaultLocked ? ' locked' : ''}`}>{vaultState}</div>
        </div>

        <div className="wv-conn">
          <div className={`wv-conn-line${rightActive ? ' active' : ''}`} />
          <div className={`wv-conn-lbl${rightActive ? ' active' : ''}`}>{rightLabel}</div>
        </div>

        <div className="wv-node">
          <div className="wv-node-icon">S</div>
          <div className="wv-node-lbl">SELLER</div>
          <div className="wv-node-addr">0xSe…ler</div>
        </div>
      </div>

      {/* 4-column breakdown grid */}
      <div className="wv-breakdown">
        <div className="wv-breakdown-col">
          <span className="wv-breakdown-lbl">PRICE</span>
          <span className="wv-breakdown-val">0.5000 USDC</span>
        </div>
        <div className="wv-breakdown-col">
          <span className="wv-breakdown-lbl">COLLATERAL</span>
          <span className="wv-breakdown-val">0.0500 USDC</span>
        </div>
        <div className="wv-breakdown-col">
          <span className="wv-breakdown-lbl">PROTOCOL FEE (1%)</span>
          <span className="wv-breakdown-val">0.0050 USDC</span>
        </div>
        <div className="wv-breakdown-col">
          <span className="wv-breakdown-lbl">SELLER RECEIVES</span>
          <span className="wv-breakdown-val">0.4950 USDC</span>
        </div>
      </div>

      {/* Phase indicator dots */}
      <div className="wv-phases">
        {phases.map((_, i) => (
          <div
            key={i}
            className={`wv-phase-dot${i === phase ? ' on' : ''}`}
            title={phases[i]}
          />
        ))}
      </div>

    </div>
  )
}
