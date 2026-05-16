'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, Shield, Lock, CheckCircle,
  MessageSquare, Star, Scale, Package, Zap,
} from 'lucide-react'

// ─── Design tokens — cream/editorial, nothing like the old terminal page ──────
const CREAM = '#F5F2ED'
const DARK  = '#09080C'
const ARC   = '#2E57FF'
const TXT   = '#0B0916'
const TXM   = '#706C8A'
const TXL   = '#EDE9F8'
const TXL2  = '#6B6B99'
const EL    = 'rgba(11,9,22,0.08)'
const ED    = 'rgba(255,255,255,0.07)'
const JB    = 'var(--font-jb,monospace)'
const BB    = 'var(--font-bebas,sans-serif)'
const SP    = 'var(--font-space,system-ui,sans-serif)'

// ─── Data ─────────────────────────────────────────────────────────────────────
const PHASES = ['LISTED','FUNDED','CONFIRMING','SETTLED'] as const

const STEPS = [
  { n:'01', title:'LOCK IT',  sub:'Seller posts the offer',      Icon:Lock,         desc:'List your item and set a USDC price on Arc. Optionally lock collateral on-chain — your commitment, enforced in code.' },
  { n:'02', title:'FUND IT',  sub:'Buyer deposits USDC',         Icon:Package,      desc:'Buyer sends USDC into the smart contract vault. Sub-second finality on Arc. Funds are locked — not transferred, not trusted.' },
  { n:'03', title:'PROVE IT', sub:'Both parties confirm',        Icon:CheckCircle,  desc:'Seller signals delivery on-chain. Buyer confirms receipt. Two keys, one vault. No unilateral release, ever.' },
  { n:'04', title:'COLLECT',  sub:'Contract releases payment',   Icon:Zap,          desc:'USDC settles to seller. Collateral returned. 1% fee deducted. Atomic, irreversible, on-chain. No one can stop it.' },
]

const FEATS = [
  { Icon:Shield,        title:'Non-Custodial Vault',   desc:'Your USDC lives in a smart contract, not on our servers. The code is the custodian — auditable and immutable.' },
  { Icon:Lock,          title:'Seller Collateral',     desc:'Sellers lock USDC collateral on-chain. Fails to deliver? Buyer gets it. Zero-faith, protocol-enforced accountability.' },
  { Icon:CheckCircle,   title:'Dual Confirmation',     desc:'Both counterparties must confirm on-chain. No unilateral fund release. The vault opens only when both agree.' },
  { Icon:MessageSquare, title:'Realtime Negotiation',  desc:'Live channel between buyer and seller, timestamped within the escrow. Clarify terms, amend, agree — never leave the deal.' },
  { Icon:Star,          title:'Verifiable Reputation', desc:'Ratings are tied to wallet addresses. Build a cross-deal trade history that lives on-chain and follows your address everywhere.' },
  { Icon:Scale,         title:'Dispute Arbitration',   desc:'File a formal dispute if delivery fails. Reviewed with full on-chain evidence, collateral at stake, and timestamped chat record.' },
]

// ─── Counter hook ─────────────────────────────────────────────────────────────
function useCounter(target: number, ms = 1800, active = false) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!active) return
    let t0: number
    const f = (ts: number) => {
      if (!t0) t0 = ts
      const p = Math.min((ts - t0) / ms, 1)
      setV(Math.floor((1 - (1 - p) ** 3) * target))
      if (p < 1) requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  }, [target, ms, active])
  return v
}

const s = (el: EventTarget, o: Record<string, string>) =>
  Object.assign((el as HTMLElement).style, o)

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [phase,   setPhase]   = useState(0)
  const [statsOn, setStatsOn] = useState(false)
  const dot      = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const c1 = useCounter(10,  1400, statsOn)
  const c2 = useCounter(380, 1900, statsOn)
  const c3 = useCounter(5,   1200, statsOn)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dot.current) { dot.current.style.left = `${e.clientX}px`; dot.current.style.top = `${e.clientY}px` }
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % 4), 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true) }, { threshold: 0.2 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <div ref={dot} style={{ position:'fixed', width:8, height:8, background:ARC, borderRadius:'50%', pointerEvents:'none', zIndex:9999, transform:'translate(-50%,-50%)', transition:'left .05s linear,top .05s linear' }} />

      <div style={{ background:CREAM, color:TXT, fontFamily:SP, overflowX:'clip', cursor:'none' }}>

        {/* ══════════════════════════════════════ NAV */}
        <nav style={{ height:64, display:'flex', alignItems:'center', padding:'0 3rem', gap:'2rem', borderBottom:`1px solid ${EL}`, background:CREAM, position:'sticky', top:0, zIndex:100, backdropFilter:'blur(8px)' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', flexShrink:0 }}>
            <span style={{ fontSize:'1.25rem', color:ARC, fontFamily:BB }}>⬡</span>
            <span style={{ fontFamily:BB, fontSize:'1.25rem', letterSpacing:'0.12em', color:TXT }}>ARCROW</span>
          </Link>
          <div style={{ display:'flex', gap:'2rem', margin:'0 auto' }}>
            {[['PROTOCOL','#protocol'],['FEATURES','#features'],['STATS','#stats']].map(([l,h]) => (
              <a key={l} href={h} style={{ fontSize:'0.8125rem', fontWeight:500, color:TXM, textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={e => s(e.currentTarget,{color:TXT})} onMouseLeave={e => s(e.currentTarget,{color:TXM})}>{l}</a>
            ))}
          </div>
          <Link href="/app" style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', background:TXT, color:CREAM, textDecoration:'none', fontSize:'0.8125rem', fontWeight:600, padding:'0.5rem 1.25rem', letterSpacing:'0.04em', transition:'background .2s,transform .12s', flexShrink:0 }}
            onMouseEnter={e => s(e.currentTarget,{background:ARC,transform:'translateY(-1px)'})}
            onMouseLeave={e => s(e.currentTarget,{background:TXT,transform:'translateY(0)'})}
          >
            Launch App <ArrowRight size={13} />
          </Link>
        </nav>

        {/* ══════════════════════════════════════ HERO */}
        <section style={{ minHeight:'calc(100vh - 64px)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'5rem 3rem 3.5rem', position:'relative', overflow:'hidden' }}>
          {/* Watermark hex */}
          <div aria-hidden style={{ position:'absolute', right:'-4rem', top:'50%', transform:'translateY(-55%)', fontSize:'50vw', color:EL, fontFamily:BB, lineHeight:1, pointerEvents:'none', userSelect:'none' }}>⬡</div>

          {/* Live badge */}
          <div style={{ position:'relative', zIndex:1 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.22em', color:ARC, border:`1px solid rgba(46,87,255,0.18)`, background:'rgba(46,87,255,0.06)', padding:'5px 12px' }}>
              <span style={{ width:4, height:4, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.8s ease-in-out infinite' }} />
              LIVE ON ARC TESTNET · CHAIN 5042002
            </span>
          </div>

          {/* Headline */}
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontFamily:JB, fontSize:10, letterSpacing:'0.22em', color:TXM, marginBottom:'1.75rem', textTransform:'uppercase' }}>The deal is</div>
            <div style={{ overflow:'hidden', lineHeight:0.88 }}>
              <div style={{ fontFamily:BB, fontSize:'clamp(4.5rem,9.5vw,12rem)', letterSpacing:'-0.01em', color:TXT, animation:'word-rise .8s cubic-bezier(.22,1,.36,1) both', animationDelay:'0.05s' }}>ZERO TRUST.</div>
            </div>
            <div style={{ overflow:'hidden', lineHeight:0.88, marginTop:'0.1rem' }}>
              <div style={{ fontFamily:BB, fontSize:'clamp(4.5rem,9.5vw,12rem)', letterSpacing:'-0.01em', color:ARC, animation:'word-rise .8s cubic-bezier(.22,1,.36,1) both', animationDelay:'0.22s' }}>FULL RECEIPT.</div>
            </div>
            <p style={{ marginTop:'2.5rem', fontSize:'1.0625rem', lineHeight:1.75, color:TXM, maxWidth:500 }}>
              Trustless P2P escrow on Arc Network. USDC locked in a smart contract, released only when both parties confirm on-chain. Sub-second finality. No lawyers. No middlemen.
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginTop:'2.5rem', flexWrap:'wrap' }}>
              <Link href="/app" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:ARC, color:'#fff', textDecoration:'none', fontSize:'0.875rem', fontWeight:700, letterSpacing:'0.05em', padding:'0.9rem 2rem', transition:'all .2s', whiteSpace:'nowrap' }}
                onMouseEnter={e => s(e.currentTarget,{background:'#4B6DFF',boxShadow:'0 8px 32px rgba(46,87,255,0.35)',transform:'translateY(-2px)'})}
                onMouseLeave={e => s(e.currentTarget,{background:ARC,boxShadow:'none',transform:'translateY(0)'})}
              >
                Launch App <ArrowRight size={15} />
              </Link>
              <a href="#protocol" style={{ display:'inline-flex', alignItems:'center', fontSize:'0.875rem', fontWeight:600, color:TXM, textDecoration:'none', border:`1px solid ${EL}`, padding:'0.9rem 1.5rem', transition:'color .2s,border-color .2s' }}
                onMouseEnter={e => s(e.currentTarget,{color:TXT,borderColor:'rgba(11,9,22,0.2)'})}
                onMouseLeave={e => s(e.currentTarget,{color:TXM,borderColor:EL})}
              >
                How it works
              </a>
            </div>
          </div>

          {/* Bottom stat strip */}
          <div style={{ position:'relative', zIndex:1, display:'flex', paddingTop:'2.5rem', borderTop:`1px solid ${EL}`, gap:0, flexWrap:'wrap' }}>
            {[{v:'0.48s',l:'Finality on Arc'},{v:'~$0.01',l:'Per transaction'},{v:'1%',l:'Protocol fee'},{v:'USDC',l:'Native gas token'}].map((st,i) => (
              <div key={i} style={{ paddingRight:'3rem', marginRight:'3rem', borderRight:i<3?`1px solid ${EL}`:'none', marginBottom:'0.5rem' }}>
                <div style={{ fontFamily:BB, fontSize:'2rem', color:TXT, lineHeight:1 }}>{st.v}</div>
                <div style={{ fontSize:'0.75rem', color:TXM, marginTop:'0.25rem' }}>{st.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════ MARQUEE */}
        <div style={{ overflow:'hidden', background:DARK, borderTop:`1px solid ${ED}`, borderBottom:`1px solid ${ED}`, padding:'1.125rem 0' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'band-scroll 30s linear infinite' }}>
            {Array(14).fill(null).map((_,i) => (
              <span key={i} style={{ fontFamily:BB, fontSize:'0.9375rem', letterSpacing:'0.3em', color:TXL2, padding:'0 2.5rem', display:'inline-flex', alignItems:'center', gap:'2.5rem' }}>
                ARC NATIVE ESCROW <span style={{ color:ARC, fontSize:'0.6em' }}>⬡</span>
              </span>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════ HOW IT WORKS */}
        <section id="protocol" style={{ padding:'8rem 3rem', background:CREAM }}>
          <div style={{ maxWidth:1400, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'5rem', gap:'2rem', flexWrap:'wrap' }}>
              <div>
                <Eyebrow dark>PROTOCOL</Eyebrow>
                <h2 style={{ fontFamily:BB, fontSize:'clamp(3rem,6vw,6rem)', color:TXT, lineHeight:0.93, margin:0, letterSpacing:'0.01em' }}>HOW IT<br />WORKS</h2>
              </div>
              <p style={{ fontSize:'1rem', color:TXM, maxWidth:380, lineHeight:1.75, paddingBottom:'0.25rem' }}>Four atomic steps. Zero trust required. Every action recorded permanently on-chain.</p>
            </div>

            <StepsCarousel />
          </div>
        </section>

        {/* ══════════════════════════════════════ VAULT SECTION */}
        <div style={{ background:DARK, padding:'8rem 3rem', borderTop:`1px solid ${ED}` }}>
          <div style={{ maxWidth:1400, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6rem', alignItems:'center' }}>
            <div>
              <Eyebrow>THE VAULT</Eyebrow>
              <h2 style={{ fontFamily:BB, fontSize:'clamp(2.75rem,5vw,5.5rem)', color:TXL, lineHeight:0.93, margin:'0 0 2rem', letterSpacing:'0.01em' }}>
                WHERE YOUR<br /><span style={{ color:ARC }}>USDC LIVES.</span>
              </h2>
              <p style={{ fontSize:'1rem', lineHeight:1.8, color:TXL2, marginBottom:'2.5rem', maxWidth:400 }}>
                A smart contract holds your USDC in escrow. Neither party has unilateral access. The contract releases funds atomically when both confirm delivery.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {[['Non-custodial','No server holds your funds'],['Auditable','Open-source and verifiable on ArcScan'],['Atomic','Release is all-or-nothing, no partial'],['Immutable','No admin key, no upgrade backdoor']].map(([k,v],i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.875rem' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:ARC, flexShrink:0, marginTop:'0.4rem' }} />
                    <span style={{ fontSize:'0.875rem', color:TXL2, lineHeight:1.5 }}><strong style={{ color:TXL, fontWeight:600 }}>{k}</strong> — {v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height:540, position:'relative', border:`1px solid ${ED}` }}>
              <div aria-hidden style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(transparent,rgba(46,87,255,0.1),transparent)', animation:'scanline 8s linear infinite', pointerEvents:'none', zIndex:10 }} />
              <Vault phase={phase} phases={PHASES} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════ FEATURES (scroll-pinned) */}
        <FeaturesScrollSection />

        {/* ══════════════════════════════════════ STATS */}
        <div id="stats" ref={statsRef} style={{ background:DARK, padding:'8rem 3rem', borderTop:`1px solid ${ED}` }}>
          <div style={{ maxWidth:1400, margin:'0 auto' }}>
            <Eyebrow>STATS</Eyebrow>
            <h2 style={{ fontFamily:BB, fontSize:'clamp(3rem,6vw,6rem)', color:TXL, lineHeight:0.93, margin:'0 0 5rem', letterSpacing:'0.01em' }}>BY THE<br />NUMBERS</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:`1px solid ${ED}` }}>
              {[{n:c1.toString(),l:'Deals locked\non chain'},{n:`$${c2}`,l:'USDC moved\nthrough escrow'},{n:c3.toString(),l:'Deals settled\nin full'},{n:'1%',l:"Protocol fee.\nThat's it."}].map((st,i) => (
                <div key={i} style={{ paddingTop:'3.5rem', paddingBottom:'3.5rem', paddingRight:'2rem', paddingLeft:i>0?'2rem':'0', borderRight:i<3?`1px solid ${ED}`:'none' }}>
                  <div style={{ fontFamily:BB, fontSize:'clamp(4rem,7vw,7rem)', color:ARC, lineHeight:0.88, letterSpacing:'-0.01em', marginBottom:'1.25rem' }}>{st.n}</div>
                  <div style={{ fontSize:'0.8125rem', color:TXL2, lineHeight:1.6, whiteSpace:'pre-line' }}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════ CTA */}
        <div style={{ background:CREAM, padding:'10rem 3rem', borderTop:`1px solid ${EL}`, position:'relative', overflow:'hidden' }}>
          <div aria-hidden style={{ position:'absolute', right:'-5rem', bottom:'-6rem', fontSize:'45vw', color:EL, fontFamily:BB, lineHeight:1, pointerEvents:'none', userSelect:'none' }}>⬡</div>
          <div style={{ maxWidth:900, position:'relative', zIndex:1 }}>
            <Eyebrow dark>READY TO TRADE</Eyebrow>
            <h2 style={{ fontFamily:BB, fontSize:'clamp(4rem,9vw,11rem)', color:TXT, lineHeight:0.88, margin:'0 0 2.5rem', letterSpacing:'-0.01em' }}>
              LOCK YOUR<br /><span style={{ color:ARC }}>FIRST DEAL.</span>
            </h2>
            <p style={{ fontSize:'1.125rem', color:TXM, marginBottom:'3rem', maxWidth:460, lineHeight:1.75 }}>
              Connect your wallet. List or browse. Trade without trust, without permission, without middlemen.
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
              <Link href="/app" style={{ display:'inline-flex', alignItems:'center', gap:'0.625rem', background:TXT, color:CREAM, textDecoration:'none', fontSize:'0.9375rem', fontWeight:700, letterSpacing:'0.04em', padding:'1rem 2.5rem', transition:'all .2s', whiteSpace:'nowrap' }}
                onMouseEnter={e => s(e.currentTarget,{background:ARC,transform:'translateY(-2px)',boxShadow:'0 8px 32px rgba(46,87,255,0.3)'})}
                onMouseLeave={e => s(e.currentTarget,{background:TXT,transform:'translateY(0)',boxShadow:'none'})}
              >
                Open the App <ArrowUpRight size={18} />
              </Link>
              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                {['ARC TESTNET','CHAIN 5042002','USDC NATIVE'].map((t,i) => (
                  <span key={i} style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.14em', color:TXM, border:`1px solid ${EL}`, padding:'4px 10px' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════ FOOTER */}
        <footer style={{ background:DARK, padding:'2.5rem 3rem', borderTop:`1px solid ${ED}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ fontFamily:BB, fontSize:'1.125rem', letterSpacing:'0.14em', color:'rgba(255,255,255,0.18)' }}>ARCROW</div>
          <div style={{ display:'flex', gap:'2rem' }}>
            {[{l:'Docs',h:'#'},{l:'GitHub',h:'#'},{l:'Discord',h:'#'},{l:'ArcScan ↗',h:'https://testnet.arcscan.app'}].map((lk,i) => (
              <a key={i} href={lk.h} target={lk.h.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
                style={{ fontSize:'0.8125rem', color:TXL2, textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={e => s(e.currentTarget,{color:TXL})} onMouseLeave={e => s(e.currentTarget,{color:TXL2})}>{lk.l}</a>
            ))}
          </div>
          <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.1)', fontFamily:JB, letterSpacing:'0.06em' }}>© 2026 ARCROW Protocol · Arc Network</div>
        </footer>

      </div>
    </>
  )
}

// ─── Features — scroll-pinned sticky section ──────────────────────────────────
function FeaturesScrollSection() {
  const [idx, setIdx]     = useState(0)
  const outer             = useRef<HTMLDivElement>(null)
  const TOTAL             = FEATS.length
  // outer height = (TOTAL + 1) × 100vh  →  sticky pin range = TOTAL × 100vh
  // each feature occupies exactly 100vh of scroll range

  useEffect(() => {
    const onScroll = () => {
      if (!outer.current) return
      const { top, height } = outer.current.getBoundingClientRect()
      const range = height - window.innerHeight
      if (range <= 0) return
      const prog = Math.max(0, Math.min(1, -top / range))
      setIdx(Math.min(TOTAL - 1, Math.floor(prog * TOTAL)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [TOTAL])

  const feat = FEATS[idx]

  return (
    <div
      id="features"
      ref={outer}
      style={{ height:`${(TOTAL + 1) * 100}vh`, position:'relative', background:CREAM }}
    >
      {/* Sticky viewport panel */}
      <div style={{
        position:'sticky', top:0, height:'100vh', overflow:'hidden',
        display:'grid', gridTemplateColumns:'1fr 1fr',
        borderTop:`1px solid ${EL}`,
      }}>

        {/* ── Left: heading + scrollable feature list + progress ── */}
        <div style={{
          borderRight:`1px solid ${EL}`, padding:'4.5rem 4rem',
          display:'flex', flexDirection:'column', justifyContent:'space-between', overflow:'hidden',
        }}>
          <div>
            <Eyebrow dark>FEATURES</Eyebrow>
            <h2 style={{ fontFamily:BB, fontSize:'clamp(2.5rem,4.5vw,5rem)', color:TXT, lineHeight:0.93, margin:'0 0 2.5rem', letterSpacing:'0.01em' }}>
              BUILT<br />DIFFERENT
            </h2>
          </div>

          {/* Feature list — each item is always visible, active one highlighted */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            {FEATS.map((f, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:'1rem',
                padding:'0.875rem 0',
                borderBottom:i < FEATS.length - 1 ? `1px solid ${EL}` : 'none',
                opacity:i === idx ? 1 : 0.38,
                transition:'opacity .4s ease',
              }}>
                <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.22em', color:i===idx?ARC:TXM, minWidth:22, transition:'color .3s' }}>
                  {`0${i+1}`}
                </span>
                <div style={{
                  width:30, height:30, flexShrink:0,
                  border:`1px solid ${i===idx?ARC:EL}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:i===idx?ARC:TXM,
                  transition:'border-color .3s, color .3s',
                }}>
                  <f.Icon size={13} />
                </div>
                <span style={{
                  fontSize:'0.875rem',
                  fontWeight:i===idx ? 600 : 400,
                  color:i===idx ? TXT : TXM,
                  letterSpacing:'0.01em',
                  transition:'color .3s',
                }}>
                  {f.title}
                </span>
                {i === idx && (
                  <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:ARC, boxShadow:`0 0 8px ${ARC}`, animation:'pulse-led 1.8s ease-in-out infinite', flexShrink:0 }} />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar + counter */}
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', paddingTop:'2rem' }}>
            <div style={{ flex:1, height:1, background:EL, position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:0, height:'100%', background:ARC, transition:'width .5s ease', width:`${((idx+1)/TOTAL)*100}%` }} />
            </div>
            <span style={{ fontFamily:JB, fontSize:9.5, letterSpacing:'0.18em', color:TXM, flexShrink:0 }}>{`0${idx+1} / 0${TOTAL}`}</span>
          </div>
        </div>

        {/* ── Right: active feature content ── */}
        <div style={{ padding:'4.5rem 4rem', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden' }}>
          {/* Giant ghost number watermark */}
          <div aria-hidden style={{
            position:'absolute', right:'-1.5rem', top:'50%', transform:'translateY(-50%)',
            fontFamily:BB, fontSize:'clamp(14rem,22vw,24rem)',
            color:'rgba(11,9,22,0.04)', lineHeight:1, userSelect:'none', pointerEvents:'none',
            transition:'opacity .3s',
          }}>
            {`0${idx+1}`}
          </div>

          {/* key swap → triggers fade-up from globals.css on every feature change */}
          <div key={idx} style={{ position:'relative', zIndex:1, animation:'fade-up .4s ease both' }}>
            <div style={{
              width:56, height:56,
              border:`1px solid rgba(46,87,255,0.25)`,
              background:'rgba(46,87,255,0.06)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:ARC, marginBottom:'2.5rem',
            }}>
              <feat.Icon size={24} />
            </div>

            <h3 style={{
              fontFamily:BB, fontSize:'clamp(2.5rem,4.5vw,5.5rem)',
              color:TXT, margin:'0 0 1.75rem', lineHeight:0.93, letterSpacing:'0.01em',
            }}>
              {feat.title}
            </h3>

            <p style={{ fontSize:'1.0625rem', lineHeight:1.8, color:TXM, maxWidth:480 }}>
              {feat.desc}
            </p>

            {/* Scroll hint */}
            <div style={{ marginTop:'3rem', display:'flex', alignItems:'center', gap:'0.625rem' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:1, height:12, background:idx < TOTAL-1 ? ARC : EL, transition:'background .3s' }} />
                <div style={{ width:6, height:6, border:`1px solid ${idx < TOTAL-1 ? ARC : EL}`, transform:'rotate(45deg)', transition:'border-color .3s' }} />
              </div>
              <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.22em', color:TXM }}>
                {idx < TOTAL - 1 ? 'SCROLL FOR NEXT' : 'KEEP SCROLLING'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Steps Carousel ───────────────────────────────────────────────────────────
function StepsCarousel() {
  const [cur,    setCur]    = useState(0)
  const [paused, setPaused] = useState(false)

  // Auto-advance every 4.5 s; pause on manual interaction
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setCur(c => (c + 1) % STEPS.length), 4500)
    return () => clearInterval(id)
  }, [paused])

  const goTo = (n: number) => { setCur(n); setPaused(true) }
  const prev = () => goTo((cur - 1 + STEPS.length) % STEPS.length)
  const next = () => goTo((cur + 1) % STEPS.length)

  const step = STEPS[cur]
  const pct  = `${((cur + 1) / STEPS.length) * 100}%`

  return (
    <div style={{ border:`1px solid ${EL}`, overflow:'hidden', position:'relative' }}>

      {/* Thin progress bar */}
      <div style={{ height:2, background:EL, position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', background:ARC, width:pct, transition:'width .55s ease' }} />
      </div>

      {/* Slide — key swap triggers fade-up from globals.css */}
      <div key={cur} style={{ display:'grid', gridTemplateColumns:'260px 1fr', minHeight:460 }}>

        {/* Left panel: big ghost number + icon + sub-label */}
        <div style={{ borderRight:`1px solid ${EL}`, padding:'3rem 2.5rem', display:'flex', flexDirection:'column', justifyContent:'space-between', background:'rgba(46,87,255,0.02)', animation:'fade-up .45s ease both' }}>
          <div aria-hidden style={{ fontFamily:BB, fontSize:'11rem', color:'rgba(11,9,22,0.05)', lineHeight:0.8, userSelect:'none', marginLeft:'-0.25rem' }}>{step.n}</div>
          <div>
            <div style={{ width:44, height:44, border:`1px solid ${EL}`, display:'flex', alignItems:'center', justifyContent:'center', color:ARC, marginBottom:'0.875rem' }}>
              <step.Icon size={20} />
            </div>
            <div style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.22em', color:TXM, textTransform:'uppercase' }}>{step.sub}</div>
          </div>
        </div>

        {/* Right panel: title + description + controls */}
        <div style={{ padding:'3rem 3.5rem', display:'flex', flexDirection:'column', justifyContent:'space-between', animation:'fade-up .45s .06s ease both' }}>
          <div>
            <h3 style={{ fontFamily:BB, fontSize:'clamp(3rem,5.5vw,6rem)', color:TXT, lineHeight:0.93, margin:'0 0 2rem', letterSpacing:'0.01em' }}>
              {step.title}
            </h3>
            <p style={{ fontSize:'1rem', lineHeight:1.8, color:TXM, maxWidth:560 }}>{step.desc}</p>
          </div>

          {/* Controls row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'3rem', flexWrap:'wrap', gap:'1rem' }}>

            {/* Step pills */}
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              {STEPS.map((_,i) => (
                <button key={i} onClick={() => goTo(i)}
                  style={{ height:4, width:i===cur?32:8, background:i===cur?ARC:EL, border:'none', cursor:'pointer', padding:0, transition:'width .35s,background .35s' }}
                  onMouseEnter={e => { if(i!==cur) s(e.currentTarget,{background:'rgba(11,9,22,0.18)'}) }}
                  onMouseLeave={e => { if(i!==cur) s(e.currentTarget,{background:EL}) }}
                />
              ))}
            </div>

            {/* Counter + arrows */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
              <span style={{ fontFamily:JB, fontSize:10, letterSpacing:'0.2em', color:TXM, minWidth:48 }}>
                {`0${cur+1} / 0${STEPS.length}`}
              </span>
              <button onClick={prev}
                style={{ width:42, height:42, border:`1px solid ${EL}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:JB, fontSize:14, color:TXM, transition:'all .2s' }}
                onMouseEnter={e => s(e.currentTarget,{borderColor:'rgba(11,9,22,0.25)',color:TXT,background:'rgba(11,9,22,0.03)'})}
                onMouseLeave={e => s(e.currentTarget,{borderColor:EL,color:TXM,background:'transparent'})}
              >←</button>
              <button onClick={next}
                style={{ width:42, height:42, border:`1px solid ${ARC}`, background:ARC, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:JB, fontSize:14, color:'#fff', transition:'all .2s' }}
                onMouseEnter={e => s(e.currentTarget,{background:'#4B6DFF',transform:'translateY(-1px)'})}
                onMouseLeave={e => s(e.currentTarget,{background:ARC,transform:'translateY(0)'})}
              >→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Step labels strip at the bottom */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:`1px solid ${EL}` }}>
        {STEPS.map((st,i) => (
          <button key={i} onClick={() => goTo(i)}
            style={{ padding:'1rem', textAlign:'left', background:i===cur?'rgba(46,87,255,0.04)':'transparent', borderRight:i<3?`1px solid ${EL}`:'none', border:'none', cursor:'pointer', transition:'background .2s', borderBottom:'none', display:'flex', alignItems:'center', gap:'0.625rem' }}
            onMouseEnter={e => { if(i!==cur) s(e.currentTarget,{background:'rgba(11,9,22,0.02)'}) }}
            onMouseLeave={e => { if(i!==cur) s(e.currentTarget,{background:'transparent'}) }}
          >
            <span style={{ width:6, height:6, borderRadius:'50%', background:i===cur?ARC:EL, flexShrink:0, transition:'background .3s', boxShadow:i===cur?`0 0 6px ${ARC}`:'none' }} />
            <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.16em', color:i===cur?ARC:TXM, transition:'color .2s', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{st.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Eyebrow label ────────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{ fontFamily:JB, fontSize:9.5, letterSpacing:'0.28em', color:ARC, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
      <span style={{ width:20, height:1, background:ARC, display:'inline-block' }} />
      {children}
    </div>
  )
}

// ─── Vault terminal (dark panel) ──────────────────────────────────────────────
function Vault({ phase, phases }: { phase: number; phases: readonly string[] }) {
  const ba = phase >= 1, sa = phase >= 3, lk = phase >= 1
  const bAmt  = phase === 0 ? 'PENDING' : phase === 1 ? '0.5000 USDC' : '✓ FUNDED'
  const sAmt  = phase < 3  ? 'PENDING'  : '0.4950 USDC'
  const state = ['OPEN','LOCKED','CONFIRMING','SETTLED'][phase]

  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'rgba(46,87,255,0.015)' }}>
      <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(46,87,255,0.6) 40%,rgba(46,87,255,0.6) 60%,transparent)', pointerEvents:'none' }} />

      {/* Chrome */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.75rem 1.25rem', borderBottom:`1px solid ${ED}`, flexShrink:0 }}>
        {['#FF5F57','#FFBD2E','#28C840'].map((c,i) => <span key={i} style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block', marginLeft:i>0?4:0 }} />)}
        <span style={{ fontFamily:JB, fontSize:9.5, letterSpacing:'0.16em', color:'rgba(255,255,255,0.2)', marginLeft:'0.625rem', flex:1 }}>ARCROW ESCROW VAULT · 0x4a2f…e391</span>
        <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontFamily:JB, fontSize:8.5, fontWeight:700, letterSpacing:'0.16em', color:ARC, border:'1px solid rgba(46,87,255,0.2)', padding:'2px 8px', background:'rgba(46,87,255,0.06)' }}>
          <span style={{ width:4, height:4, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.4s ease-in-out infinite' }} /> LIVE
        </div>
      </div>

      {/* Status */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem 1.25rem', borderBottom:`1px solid ${ED}`, fontFamily:JB, fontSize:10, letterSpacing:'0.14em', color:'rgba(255,255,255,0.2)', flexShrink:0 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.6s ease-in-out infinite', flexShrink:0 }} />
        STATUS:&nbsp;<span style={{ color:ARC, fontWeight:700 }}>{phases[phase]}</span>
      </div>

      {/* Flow */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.5rem 2rem', minHeight:0 }}>
        <VN l="BUYER"  a="0xBu…yer1" ch="B" />
        <VL active={ba} label={bAmt} />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', padding:'1.25rem 2rem', border:'1px solid rgba(46,87,255,0.2)', background:'rgba(46,87,255,0.05)', position:'relative', flexShrink:0 }}>
          <div aria-hidden style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(46,87,255,0.08), transparent)', pointerEvents:'none' }} />
          <span style={{ fontSize:'3.5rem', lineHeight:1, color:ARC, animation:'arc-glow 3s ease-in-out infinite', position:'relative' }}>⬡</span>
          <span style={{ fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.28em', color:'rgba(46,87,255,0.5)' }}>VAULT</span>
          <span style={{ fontFamily:JB, fontSize:8.5, letterSpacing:'0.14em', padding:'2px 10px', border:`1px solid ${lk?'rgba(46,87,255,0.35)':ED}`, color:lk?ARC:'rgba(255,255,255,0.2)', background:lk?'rgba(46,87,255,0.08)':'transparent', transition:'all .4s' }}>{state}</span>
        </div>
        <VL active={sa} label={sAmt} />
        <VN l="SELLER" a="0xSe…ler2" ch="S" />
      </div>

      {/* Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:`1px solid ${ED}`, flexShrink:0 }}>
        {[{k:'PRICE',v:'0.5000 USDC',h:false},{k:'COLLATERAL',v:'0.0500 USDC',h:false},{k:'FEE (1%)',v:'0.0050 USDC',h:false},{k:'SELLER GETS',v:'0.4950 USDC',h:true}].map((c,i) => (
          <div key={i} style={{ padding:'0.75rem 1rem', borderRight:i<3?`1px solid ${ED}`:'none', background:c.h?'rgba(46,87,255,0.04)':'transparent', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            <span style={{ fontFamily:JB, fontSize:7.5, letterSpacing:'0.18em', color:'rgba(255,255,255,0.2)' }}>{c.k}</span>
            <span style={{ fontFamily:JB, fontSize:11, fontWeight:700, color:c.h?ARC:TXL2 }}>{c.v}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display:'flex', alignItems:'center', padding:'0.625rem 1rem', borderTop:`1px solid ${ED}`, flexShrink:0 }}>
        {phases.map((label,i) => (
          <div key={i} style={{ display:'contents' }}>
            {i>0 && <div style={{ flex:1, height:1, background:i<=phase?'rgba(46,87,255,0.45)':ED, maxWidth:60, transition:'background .3s' }} />}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem', flexShrink:0 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:i<phase?'rgba(46,87,255,0.5)':i===phase?ARC:ED, boxShadow:i===phase?`0 0 8px ${ARC}`:'none', transition:'background .3s,box-shadow .3s' }} />
              <span style={{ fontFamily:JB, fontSize:7.5, letterSpacing:'0.1em', whiteSpace:'nowrap', color:i<phase?'rgba(46,87,255,0.5)':i===phase?ARC:'rgba(255,255,255,0.2)', transition:'color .3s' }}>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VN({ l, a, ch }: { l:string; a:string; ch:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem', flexShrink:0 }}>
      <div style={{ width:54, height:54, border:`1px solid ${ED}`, background:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BB, fontSize:'1.5rem', color:ARC, position:'relative' }}>
        <div style={{ position:'absolute', inset:4, border:'1px solid rgba(46,87,255,0.15)' }} />{ch}
      </div>
      <span style={{ fontFamily:JB, fontSize:8.5, fontWeight:700, letterSpacing:'0.2em', color:'rgba(255,255,255,0.2)' }}>{l}</span>
      <span style={{ fontFamily:JB, fontSize:8, color:'rgba(255,255,255,0.1)' }}>{a}</span>
    </div>
  )
}

function VL({ active, label }: { active:boolean; label:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, minHeight:44, gap:'0.375rem', padding:'0.25rem 0' }}>
      <div style={{ width:1, flex:1, background:active?ARC:ED, position:'relative', overflow:'hidden', transition:'background .5s' }}>
        {active && <span style={{ position:'absolute', left:-3, width:7, height:7, borderRadius:'50%', background:ARC, boxShadow:`0 0 8px ${ARC}`, animation:'flow-down 1.6s linear infinite' }} />}
      </div>
      <span style={{ fontFamily:JB, fontSize:8, letterSpacing:'0.1em', color:active?'rgba(46,87,255,0.8)':'rgba(255,255,255,0.2)', whiteSpace:'nowrap', transition:'color .4s' }}>{label}</span>
    </div>
  )
}
