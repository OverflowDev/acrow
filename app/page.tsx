'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, ArrowUpRight, Shield, Lock, CheckCircle,
  MessageSquare, Star, Scale, Package, Zap,
} from 'lucide-react'

const CREAM = '#F5F2ED'
const DARK  = '#05080F'
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

const PHASES = ['LISTED','FUNDED','CONFIRMING','SETTLED'] as const

const STEPS = [
  { n:'01', title:'LOCK IT',  sub:'Seller posts the offer',    Icon:Lock,        desc:'List your item and set a USDC price on Arc. Optionally lock collateral on-chain — your commitment, enforced in code.' },
  { n:'02', title:'FUND IT',  sub:'Buyer deposits USDC',       Icon:Package,     desc:'Buyer sends USDC into the smart contract vault. Sub-second finality on Arc. Funds are locked — not transferred, not trusted.' },
  { n:'03', title:'PROVE IT', sub:'Both parties confirm',      Icon:CheckCircle, desc:'Seller signals delivery on-chain. Buyer confirms receipt. Two keys, one vault. No unilateral release, ever.' },
  { n:'04', title:'COLLECT',  sub:'Contract releases payment', Icon:Zap,         desc:'USDC settles to seller. Collateral returned. 1% fee deducted. Atomic, irreversible, on-chain. No one can stop it.' },
]

const FEATS = [
  { Icon:Shield,        title:'Non-Custodial Vault',   desc:'Your USDC lives in a smart contract, not on our servers. The code is the custodian — auditable and immutable.' },
  { Icon:Lock,          title:'Seller Collateral',     desc:'Sellers lock USDC collateral on-chain. Fails to deliver? Buyer gets it. Zero-faith, protocol-enforced accountability.' },
  { Icon:CheckCircle,   title:'Dual Confirmation',     desc:'Both counterparties must confirm on-chain. No unilateral fund release. The vault opens only when both agree.' },
  { Icon:MessageSquare, title:'Realtime Negotiation',  desc:'Live channel between buyer and seller, timestamped within the escrow. Clarify terms, amend, agree — never leave the deal.' },
  { Icon:Star,          title:'Verifiable Reputation', desc:'Ratings are tied to wallet addresses. Build a cross-deal trade history that lives on-chain and follows your address everywhere.' },
  { Icon:Scale,         title:'Dispute Arbitration',   desc:'File a formal dispute if delivery fails. Reviewed with full on-chain evidence, collateral at stake, and timestamped chat record.' },
]

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

function useWindowWidth() {
  const [w, setW] = useState(0)
  useEffect(() => {
    setW(window.innerWidth)
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w
}

const s = (el: EventTarget, o: Record<string, string>) =>
  Object.assign((el as HTMLElement).style, o)

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [phase,   setPhase]   = useState(0)
  const [statsOn, setStatsOn] = useState(false)
  const dot      = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const w        = useWindowWidth()
  const mob      = w === 0 || w < 768

  const c1 = useCounter(10,  1400, statsOn)
  const c2 = useCounter(380, 1900, statsOn)
  const c3 = useCounter(5,   1200, statsOn)

  useEffect(() => {
    if (mob) return
    const fn = (e: MouseEvent) => {
      if (dot.current) { dot.current.style.left = `${e.clientX}px`; dot.current.style.top = `${e.clientY}px` }
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [mob])

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % 4), 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true) }, { threshold: 0.2 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const px = mob ? '1.25rem' : '3rem'
  const py = mob ? '4rem'    : '8rem'

  return (
    <>
      {!mob && (
        <div ref={dot} style={{ position:'fixed', width:8, height:8, background:ARC, borderRadius:'50%', pointerEvents:'none', zIndex:9999, transform:'translate(-50%,-50%)', transition:'left .05s linear,top .05s linear' }} />
      )}

      <div style={{ background:DARK, color:TXL, fontFamily:SP, overflowX:'clip', cursor: mob ? 'auto' : 'none' }}>

        {/* ══════════════════════════════════════ NAV */}
        <nav style={{
          height: mob ? 56 : 64,
          display:'flex', alignItems:'center', padding:`0 ${px}`, gap:'1.5rem',
          borderBottom:`1px solid ${ED}`, background:DARK,
          position:'sticky', top:0, zIndex:100,
        }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', flexShrink:0 }}>
            <Image src="/logo.png" alt="Scrow" width={28} height={28} style={{ objectFit:'contain' }} priority />
            <span style={{ fontFamily:BB, fontSize:'1.25rem', letterSpacing:'0.12em', color:TXL }}>Scrow</span>
          </Link>
          {!mob && (
            <div style={{ display:'flex', gap:'2rem', margin:'0 auto' }}>
              {[['PROTOCOL','#protocol'],['FEATURES','#features'],['STATS','#stats']].map(([l,h]) => (
                <a key={l} href={h} style={{ fontSize:'0.8125rem', fontWeight:500, color:TXL2, textDecoration:'none', transition:'color .2s' }}
                  onMouseEnter={e => s(e.currentTarget,{color:TXL})} onMouseLeave={e => s(e.currentTarget,{color:TXL2})}>{l}</a>
              ))}
            </div>
          )}
          <Link href="/app"
            style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', background:ARC, color:'#fff', textDecoration:'none', fontSize:'0.8125rem', fontWeight:600, padding: mob ? '0.45rem 1rem' : '0.5rem 1.25rem', letterSpacing:'0.04em', transition:'background .2s', marginLeft:'auto', flexShrink:0, whiteSpace:'nowrap' }}
            onMouseEnter={e => s(e.currentTarget,{background:'#4B6DFF'})}
            onMouseLeave={e => s(e.currentTarget,{background:ARC})}
          >
            Launch App {!mob && <ArrowRight size={13} style={{ marginLeft:4 }} />}
          </Link>
        </nav>

        {/* ══════════════════════════════════════ HERO — dark orbital */}
        <section style={{
          minHeight:`calc(100vh - ${mob ? 56 : 64}px)`,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding: mob ? '4rem 1.25rem 3rem' : '5rem 3rem',
          position:'relative', overflow:'hidden', textAlign:'center', background:DARK,
        }}>
          {/* Grid texture */}
          <div aria-hidden style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${ED} 1px,transparent 1px),linear-gradient(90deg,${ED} 1px,transparent 1px)`, backgroundSize:'64px 64px', pointerEvents:'none' }} />

          {/* Radial glow */}
          <div aria-hidden style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width: mob ? 320 : 600, height: mob ? 320 : 600, background:'radial-gradient(ellipse,rgba(46,87,255,0.2) 0%,transparent 68%)', pointerEvents:'none' }} />

          {/* Orbital rings + hex */}
          <div style={{ position:'relative', zIndex:1, marginBottom: mob ? '2rem' : '3.5rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {[mob?260:340, mob?190:248, mob?124:162].map((d,i) => (
              <div key={i} aria-hidden style={{ position:'absolute', width:d, height:d, borderRadius:'50%', border:`1px solid rgba(46,87,255,${[0.1,0.18,0.26][i]})`, pointerEvents:'none' }} />
            ))}
            <div style={{ fontSize: mob ? '4rem' : '6rem', color:ARC, animation:'arc-glow 3s ease-in-out infinite', position:'relative', lineHeight:1, padding: mob ? '1.5rem' : '2.5rem', zIndex:1 }}>⬡</div>
          </div>

          {/* Badge */}
          <span style={{ position:'relative', zIndex:1, display:'inline-flex', alignItems:'center', gap:'0.4rem', fontFamily:JB, fontSize:9, fontWeight:700, letterSpacing:'0.22em', color:ARC, border:`1px solid rgba(46,87,255,0.2)`, background:'rgba(46,87,255,0.06)', padding:'5px 12px', marginBottom: mob ? '1.5rem' : '2rem' }}>
            <span style={{ width:4, height:4, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.8s ease-in-out infinite' }} />
            LIVE ON ARC NETWORK
          </span>

          {/* Headline */}
          <div style={{ position:'relative', zIndex:1, maxWidth: mob ? 340 : 760, width:'100%' }}>
            <div style={{ overflow:'hidden', lineHeight:0.88 }}>
              <div style={{ fontFamily:BB, fontSize: mob ? 'clamp(3.25rem,15vw,5.5rem)' : 'clamp(4.5rem,10vw,10.5rem)', letterSpacing:'-0.01em', color:TXL, animation:'word-rise .8s cubic-bezier(.22,1,.36,1) both', animationDelay:'0.05s' }}>
                THE VAULT
              </div>
            </div>
            <div style={{ overflow:'hidden', lineHeight:0.88, marginTop:'0.1rem' }}>
              <div style={{ fontFamily:BB, fontSize: mob ? 'clamp(3.25rem,15vw,5.5rem)' : 'clamp(4.5rem,10vw,10.5rem)', letterSpacing:'-0.01em', color:ARC, animation:'word-rise .8s cubic-bezier(.22,1,.36,1) both', animationDelay:'0.2s' }}>
                IS OPEN.
              </div>
            </div>

            <p style={{ marginTop: mob ? '1.5rem' : '2rem', fontSize: mob ? '0.9375rem' : '1.0625rem', lineHeight:1.75, color:TXL2, maxWidth:480, margin: mob ? '1.5rem auto 0' : '2rem auto 0' }}>
              Trustless P2P escrow on Arc Network. USDC locked in a smart contract, released only when both parties confirm on-chain.
            </p>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', marginTop: mob ? '2rem' : '2.5rem', flexWrap:'wrap' }}>
              <Link href="/app"
                style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:ARC, color:'#fff', textDecoration:'none', fontSize:'0.875rem', fontWeight:700, letterSpacing:'0.05em', padding:'0.9rem 2rem', transition:'all .2s', whiteSpace:'nowrap' }}
                onMouseEnter={e => s(e.currentTarget,{background:'#4B6DFF',boxShadow:'0 8px 32px rgba(46,87,255,0.4)',transform:'translateY(-2px)'})}
                onMouseLeave={e => s(e.currentTarget,{background:ARC,boxShadow:'none',transform:'translateY(0)'})}
              >
                Enter the Vault <ArrowRight size={15} />
              </Link>
              <a href="#protocol"
                style={{ display:'inline-flex', alignItems:'center', fontSize:'0.875rem', fontWeight:600, color:TXL2, textDecoration:'none', border:`1px solid ${ED}`, padding:'0.9rem 1.5rem', transition:'color .2s,border-color .2s', whiteSpace:'nowrap' }}
                onMouseEnter={e => s(e.currentTarget,{color:TXL,borderColor:'rgba(255,255,255,0.18)'})}
                onMouseLeave={e => s(e.currentTarget,{color:TXL2,borderColor:ED})}
              >
                How it works
              </a>
            </div>
          </div>

          {/* Stat strip */}
          <div style={{
            position:'relative', zIndex:1, width:'100%', maxWidth:720,
            marginTop: mob ? '3rem' : '4.5rem',
            paddingTop: mob ? '2rem' : '2.5rem',
            borderTop:`1px solid ${ED}`,
            display:'grid',
            gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4,1fr)',
            gap: mob ? '1.75rem 0' : 0,
          }}>
            {[{v:'0.48s',l:'Finality on Arc'},{v:'~$0.01',l:'Per transaction'},{v:'1%',l:'Protocol fee'},{v:'USDC',l:'Native gas'}].map((st,i) => (
              <div key={i} style={{
                textAlign:'center',
                padding: mob ? '0 0.75rem' : '0 1.5rem',
                borderRight: (!mob && i < 3) ? `1px solid ${ED}` : (mob && i % 2 === 0) ? `1px solid ${ED}` : 'none',
              }}>
                <div style={{ fontFamily:BB, fontSize: mob ? '1.875rem' : '2.25rem', color:TXL, lineHeight:1 }}>{st.v}</div>
                <div style={{ fontSize:'0.75rem', color:TXL2, marginTop:'0.35rem' }}>{st.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════ MARQUEE */}
        <div style={{ overflow:'hidden', background:'rgba(46,87,255,0.05)', borderTop:`1px solid rgba(46,87,255,0.12)`, borderBottom:`1px solid rgba(46,87,255,0.12)`, padding:'1rem 0' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'band-scroll 30s linear infinite' }}>
            {Array(14).fill(null).map((_,i) => (
              <span key={i} style={{ fontFamily:BB, fontSize:'0.9375rem', letterSpacing:'0.3em', color:TXL2, padding:'0 2.5rem', display:'inline-flex', alignItems:'center', gap:'2.5rem' }}>
                ARC NATIVE ESCROW <span style={{ color:ARC, fontSize:'0.6em' }}>⬡</span>
              </span>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════ HOW IT WORKS */}
        <section id="protocol" style={{ padding:`${py} ${px}`, background:CREAM }}>
          <div style={{ maxWidth:1400, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: mob ? '2.5rem' : '5rem', gap:'2rem', flexWrap:'wrap' }}>
              <div>
                <Eyebrow>PROTOCOL</Eyebrow>
                <h2 style={{ fontFamily:BB, fontSize: mob ? 'clamp(2.5rem,10vw,4rem)' : 'clamp(3rem,6vw,6rem)', color:TXT, lineHeight:0.93, margin:0, letterSpacing:'0.01em' }}>HOW IT<br />WORKS</h2>
              </div>
              {!mob && <p style={{ fontSize:'1rem', color:TXM, maxWidth:380, lineHeight:1.75, paddingBottom:'0.25rem' }}>Four atomic steps. Zero trust required. Every action recorded permanently on-chain.</p>}
            </div>
            <StepsCarousel mob={mob} />
          </div>
        </section>

        {/* ══════════════════════════════════════ VAULT */}
        <div style={{ background:DARK, padding:`${py} ${px}`, borderTop:`1px solid ${ED}` }}>
          <div style={{ maxWidth:1400, margin:'0 auto', display:'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? '3rem' : '6rem', alignItems:'center' }}>
            <div>
              <Eyebrow>THE VAULT</Eyebrow>
              <h2 style={{ fontFamily:BB, fontSize: mob ? 'clamp(2.25rem,9vw,3.5rem)' : 'clamp(2.75rem,5vw,5.5rem)', color:TXL, lineHeight:0.93, margin:'0 0 1.5rem', letterSpacing:'0.01em' }}>
                WHERE YOUR<br /><span style={{ color:ARC }}>USDC LIVES.</span>
              </h2>
              <p style={{ fontSize:'0.9375rem', lineHeight:1.8, color:TXL2, marginBottom:'2rem', maxWidth:400 }}>
                A smart contract holds your USDC in escrow. Neither party has unilateral access. The contract releases funds atomically when both confirm delivery.
              </p>
              {!mob && (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  {[['Non-custodial','No server holds your funds'],['Auditable','Open-source, verifiable on ArcScan'],['Atomic','Release is all-or-nothing, no partial'],['Immutable','No admin key, no upgrade backdoor']].map(([k,v],i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem' }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:ARC, flexShrink:0, marginTop:'0.45rem' }} />
                      <span style={{ fontSize:'0.875rem', color:TXL2, lineHeight:1.5 }}><strong style={{ color:TXL, fontWeight:600 }}>{k}</strong> — {v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ height: mob ? 380 : 540, position:'relative', border:`1px solid ${ED}` }}>
              <div aria-hidden style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(transparent,rgba(46,87,255,0.1),transparent)', animation:'scanline 8s linear infinite', pointerEvents:'none', zIndex:10 }} />
              <Vault phase={phase} phases={PHASES} mob={mob} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════ FEATURES */}
        {mob ? <FeaturesMobile /> : <FeaturesScrollSection />}

        {/* ══════════════════════════════════════ STATS */}
        <div id="stats" ref={statsRef} style={{ background:DARK, padding:`${py} ${px}`, borderTop:`1px solid ${ED}` }}>
          <div style={{ maxWidth:1400, margin:'0 auto' }}>
            <Eyebrow>STATS</Eyebrow>
            <h2 style={{ fontFamily:BB, fontSize: mob ? 'clamp(2.5rem,10vw,4rem)' : 'clamp(3rem,6vw,6rem)', color:TXL, lineHeight:0.93, margin:'0 0 3rem', letterSpacing:'0.01em' }}>BY THE<br />NUMBERS</h2>
            <div style={{ display:'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4,1fr)', borderTop:`1px solid ${ED}` }}>
              {[{n:c1.toString(),l:'Deals locked\non chain'},{n:`$${c2}`,l:'USDC moved\nthrough escrow'},{n:c3.toString(),l:'Deals settled\nin full'},{n:'1%',l:"Protocol fee.\nThat's it."}].map((st,i) => (
                <div key={i} style={{
                  paddingTop:'2.5rem', paddingBottom:'2.5rem',
                  paddingRight: mob ? '0.75rem' : '2rem',
                  paddingLeft: i > 0 ? (mob ? '0.75rem' : '2rem') : '0',
                  borderRight: (mob ? i % 2 === 0 : i < 3) ? `1px solid ${ED}` : 'none',
                  borderBottom: (mob && i < 2) ? `1px solid ${ED}` : 'none',
                }}>
                  <div style={{ fontFamily:BB, fontSize: mob ? 'clamp(2.75rem,11vw,4.5rem)' : 'clamp(4rem,7vw,7rem)', color:ARC, lineHeight:0.88, letterSpacing:'-0.01em', marginBottom:'1rem' }}>{st.n}</div>
                  <div style={{ fontSize:'0.8125rem', color:TXL2, lineHeight:1.6, whiteSpace:'pre-line' }}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════ CTA */}
        <div style={{ background:CREAM, padding: mob ? '5rem 1.25rem' : '10rem 3rem', borderTop:`1px solid ${EL}`, position:'relative', overflow:'hidden' }}>
          <div aria-hidden style={{ position:'absolute', right:'-5rem', bottom:'-6rem', fontSize:'45vw', color:EL, fontFamily:BB, lineHeight:1, pointerEvents:'none', userSelect:'none' }}>⬡</div>
          <div style={{ maxWidth:900, position:'relative', zIndex:1 }}>
            <Eyebrow>READY TO TRADE</Eyebrow>
            <h2 style={{ fontFamily:BB, fontSize: mob ? 'clamp(3rem,14vw,6rem)' : 'clamp(4rem,9vw,11rem)', color:TXT, lineHeight:0.88, margin:'0 0 2rem', letterSpacing:'-0.01em' }}>
              LOCK YOUR<br /><span style={{ color:ARC }}>FIRST DEAL.</span>
            </h2>
            <p style={{ fontSize: mob ? '1rem' : '1.125rem', color:TXM, marginBottom:'2.5rem', maxWidth:460, lineHeight:1.75 }}>
              Connect your wallet. List or browse. Trade without trust, without permission, without middlemen.
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
              <Link href="/app"
                style={{ display:'inline-flex', alignItems:'center', gap:'0.625rem', background:TXT, color:CREAM, textDecoration:'none', fontSize:'0.9375rem', fontWeight:700, letterSpacing:'0.04em', padding:'1rem 2.5rem', transition:'all .2s', whiteSpace:'nowrap' }}
                onMouseEnter={e => s(e.currentTarget,{background:ARC,transform:'translateY(-2px)',boxShadow:'0 8px 32px rgba(46,87,255,0.3)'})}
                onMouseLeave={e => s(e.currentTarget,{background:TXT,transform:'translateY(0)',boxShadow:'none'})}
              >
                Open the App <ArrowUpRight size={18} />
              </Link>
              {!mob && (
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {['ARC TESTNET','CHAIN 5042002','USDC NATIVE'].map((t,i) => (
                    <span key={i} style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.14em', color:TXM, border:`1px solid ${EL}`, padding:'4px 10px' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════ FOOTER */}
        <footer style={{ background:DARK, padding: mob ? '2rem 1.25rem' : '2.5rem 3rem', borderTop:`1px solid ${ED}`, display:'flex', alignItems: mob ? 'flex-start' : 'center', justifyContent:'space-between', gap:'1.25rem', flexWrap:'wrap', flexDirection: mob ? 'column' : 'row' }}>
          <div style={{ fontFamily:BB, fontSize:'1.125rem', letterSpacing:'0.14em', color:'rgba(255,255,255,0.18)' }}>Scrow</div>
          <div style={{ display:'flex', gap: mob ? '1.5rem' : '2rem', flexWrap:'wrap' }}>
            {[{l:'Docs',h:'#'},{l:'GitHub',h:'#'},{l:'Discord',h:'#'},{l:'ArcScan ↗',h:'https://testnet.arcscan.app'}].map((lk,i) => (
              <a key={i} href={lk.h} target={lk.h.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
                style={{ fontSize:'0.8125rem', color:TXL2, textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={e => s(e.currentTarget,{color:TXL})} onMouseLeave={e => s(e.currentTarget,{color:TXL2})}>{lk.l}</a>
            ))}
          </div>
          <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.1)', fontFamily:JB, letterSpacing:'0.06em' }}>© 2026 Scrow Protocol · Arc Network</div>
        </footer>

      </div>
    </>
  )
}

// ─── Features — mobile card list ──────────────────────────────────────────────
function FeaturesMobile() {
  return (
    <div id="features" style={{ background:CREAM, padding:'4rem 1.25rem', borderTop:`1px solid ${EL}` }}>
      <Eyebrow>FEATURES</Eyebrow>
      <h2 style={{ fontFamily:BB, fontSize:'clamp(2.5rem,10vw,4rem)', color:TXT, lineHeight:0.93, margin:'0 0 2.5rem', letterSpacing:'0.01em' }}>BUILT<br />DIFFERENT</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:'1px', border:`1px solid ${EL}` }}>
        {FEATS.map((f, i) => (
          <div key={i} style={{ display:'flex', gap:'1.25rem', padding:'1.375rem 1.25rem', background:CREAM, borderBottom: i < FEATS.length - 1 ? `1px solid ${EL}` : 'none' }}>
            <div style={{ width:42, height:42, flexShrink:0, border:`1px solid rgba(46,87,255,0.22)`, background:'rgba(46,87,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', color:ARC }}>
              <f.Icon size={17} />
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.375rem' }}>
                <span style={{ fontFamily:JB, fontSize:8.5, letterSpacing:'0.2em', color:ARC }}>{`0${i+1}`}</span>
                <h3 style={{ fontFamily:BB, fontSize:'1.25rem', color:TXT, margin:0, letterSpacing:'0.03em', lineHeight:1 }}>{f.title}</h3>
              </div>
              <p style={{ fontSize:'0.8125rem', color:TXM, lineHeight:1.65, margin:0 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Features — desktop scroll-pinned ─────────────────────────────────────────
function FeaturesScrollSection() {
  const [idx, setIdx] = useState(0)
  const outer         = useRef<HTMLDivElement>(null)
  const TOTAL         = FEATS.length

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
    <div id="features" ref={outer} style={{ height:`${(TOTAL + 1) * 100}vh`, position:'relative', background:CREAM }}>
      <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden', background:CREAM, display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:`1px solid ${EL}` }}>

        {/* Left */}
        <div style={{ borderRight:`1px solid ${EL}`, padding:'4.5rem 4rem', display:'flex', flexDirection:'column', justifyContent:'space-between', overflow:'hidden' }}>
          <div>
            <Eyebrow>FEATURES</Eyebrow>
            <h2 style={{ fontFamily:BB, fontSize:'clamp(2.5rem,4.5vw,5rem)', color:TXT, lineHeight:0.93, margin:'0 0 2.5rem', letterSpacing:'0.01em' }}>BUILT<br />DIFFERENT</h2>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            {FEATS.map((f, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.875rem 0', borderBottom:i < FEATS.length - 1 ? `1px solid ${EL}` : 'none', opacity:i === idx ? 1 : 0.35, transition:'opacity .4s ease' }}>
                <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.22em', color:i===idx?ARC:TXM, minWidth:22, transition:'color .3s' }}>{`0${i+1}`}</span>
                <div style={{ width:30, height:30, flexShrink:0, border:`1px solid ${i===idx?ARC:EL}`, display:'flex', alignItems:'center', justifyContent:'center', color:i===idx?ARC:TXM, transition:'border-color .3s,color .3s' }}>
                  <f.Icon size={13} />
                </div>
                <span style={{ fontSize:'0.875rem', fontWeight:i===idx?600:400, color:i===idx?TXT:TXM, letterSpacing:'0.01em', transition:'color .3s' }}>{f.title}</span>
                {i === idx && (
                  <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:ARC, boxShadow:`0 0 8px ${ARC}`, animation:'pulse-led 1.8s ease-in-out infinite', flexShrink:0 }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', paddingTop:'2rem' }}>
            <div style={{ flex:1, height:1, background:EL, position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:0, height:'100%', background:ARC, transition:'width .5s ease', width:`${((idx+1)/TOTAL)*100}%` }} />
            </div>
            <span style={{ fontFamily:JB, fontSize:9.5, letterSpacing:'0.18em', color:TXM, flexShrink:0 }}>{`0${idx+1} / 0${TOTAL}`}</span>
          </div>
        </div>

        {/* Right */}
        <div style={{ padding:'4.5rem 4rem', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden' }}>
          <div aria-hidden style={{ position:'absolute', right:'-1.5rem', top:'50%', transform:'translateY(-50%)', fontFamily:BB, fontSize:'clamp(14rem,22vw,24rem)', color:'rgba(11,9,22,0.04)', lineHeight:1, userSelect:'none', pointerEvents:'none' }}>{`0${idx+1}`}</div>
          <div key={idx} style={{ position:'relative', zIndex:1, animation:'fade-up .4s ease both' }}>
            <div style={{ width:56, height:56, border:`1px solid rgba(46,87,255,0.25)`, background:'rgba(46,87,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', color:ARC, marginBottom:'2.5rem' }}>
              <feat.Icon size={24} />
            </div>
            <h3 style={{ fontFamily:BB, fontSize:'clamp(2.5rem,4.5vw,5.5rem)', color:TXT, margin:'0 0 1.75rem', lineHeight:0.93, letterSpacing:'0.01em' }}>{feat.title}</h3>
            <p style={{ fontSize:'1.0625rem', lineHeight:1.8, color:TXM, maxWidth:480 }}>{feat.desc}</p>
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
function StepsCarousel({ mob }: { mob: boolean }) {
  const [cur,    setCur]    = useState(0)
  const [paused, setPaused] = useState(false)

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
      {/* Progress bar */}
      <div style={{ height:2, background:EL, position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', background:ARC, width:pct, transition:'width .55s ease' }} />
      </div>

      {/* Slide */}
      <div key={cur} style={{ display:'grid', gridTemplateColumns: mob ? '1fr' : '260px 1fr', minHeight: mob ? 'auto' : 460 }}>

        {/* Left panel — desktop only */}
        {!mob && (
          <div style={{ borderRight:`1px solid ${EL}`, padding:'3rem 2.5rem', display:'flex', flexDirection:'column', justifyContent:'space-between', background:'rgba(11,9,22,0.02)', animation:'fade-up .45s ease both' }}>
            <div aria-hidden style={{ fontFamily:BB, fontSize:'11rem', color:'rgba(11,9,22,0.05)', lineHeight:0.8, userSelect:'none', marginLeft:'-0.25rem' }}>{step.n}</div>
            <div>
              <div style={{ width:44, height:44, border:`1px solid ${EL}`, display:'flex', alignItems:'center', justifyContent:'center', color:ARC, marginBottom:'0.875rem' }}>
                <step.Icon size={20} />
              </div>
              <div style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.22em', color:TXM }}>{step.sub.toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Right panel */}
        <div style={{ padding: mob ? '2rem 1.25rem' : '3rem 3.5rem', display:'flex', flexDirection:'column', justifyContent:'space-between', animation:'fade-up .45s .06s ease both' }}>
          {/* Mobile step header */}
          {mob && (
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
              <div aria-hidden style={{ fontFamily:BB, fontSize:'4.5rem', color:'rgba(11,9,22,0.06)', lineHeight:1, userSelect:'none', flexShrink:0 }}>{step.n}</div>
              <div>
                <div style={{ width:40, height:40, border:`1px solid ${EL}`, display:'flex', alignItems:'center', justifyContent:'center', color:ARC, marginBottom:'0.5rem' }}>
                  <step.Icon size={18} />
                </div>
                <div style={{ fontFamily:JB, fontSize:8.5, letterSpacing:'0.18em', color:TXM }}>{step.sub.toUpperCase()}</div>
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontFamily:BB, fontSize: mob ? 'clamp(2.5rem,10vw,4rem)' : 'clamp(3rem,5.5vw,6rem)', color:TXT, lineHeight:0.93, margin:'0 0 1.5rem', letterSpacing:'0.01em' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: mob ? '0.9375rem' : '1rem', lineHeight:1.8, color:TXM, maxWidth:560 }}>{step.desc}</p>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: mob ? '2rem' : '3rem', flexWrap:'wrap', gap:'1rem' }}>
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              {STEPS.map((_,i) => (
                <button key={i} onClick={() => goTo(i)}
                  style={{ height:4, width:i===cur?32:8, background:i===cur?ARC:EL, border:'none', cursor:'pointer', padding:0, transition:'width .35s,background .35s' }}
                />
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
              <span style={{ fontFamily:JB, fontSize:10, letterSpacing:'0.2em', color:TXM, minWidth:48 }}>{`0${cur+1} / 0${STEPS.length}`}</span>
              <button onClick={prev} style={{ width:42, height:42, border:`1px solid ${EL}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:JB, fontSize:14, color:TXM, transition:'all .2s' }}
                onMouseEnter={e => s(e.currentTarget,{borderColor:'rgba(11,9,22,0.25)',color:TXT})}
                onMouseLeave={e => s(e.currentTarget,{borderColor:EL,color:TXM})}
              >←</button>
              <button onClick={next} style={{ width:42, height:42, border:`1px solid ${ARC}`, background:ARC, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:JB, fontSize:14, color:'#fff', transition:'all .2s' }}
                onMouseEnter={e => s(e.currentTarget,{background:'#4B6DFF'})}
                onMouseLeave={e => s(e.currentTarget,{background:ARC})}
              >→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Step labels strip */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${STEPS.length},1fr)`, borderTop:`1px solid ${EL}` }}>
        {STEPS.map((st,i) => (
          <button key={i} onClick={() => goTo(i)}
            style={{ padding: mob ? '0.875rem 0.5rem' : '1rem', textAlign:'left', background:i===cur?'rgba(46,87,255,0.04)':'transparent', borderRight:i<STEPS.length-1?`1px solid ${EL}`:'none', border:'none', cursor:'pointer', transition:'background .2s', display:'flex', alignItems:'center', gap:'0.5rem', justifyContent: mob ? 'center' : 'flex-start' }}
            onMouseEnter={e => { if(i!==cur) s(e.currentTarget,{background:'rgba(11,9,22,0.02)'}) }}
            onMouseLeave={e => { if(i!==cur) s(e.currentTarget,{background:'transparent'}) }}
          >
            <span style={{ width:6, height:6, borderRadius:'50%', background:i===cur?ARC:EL, flexShrink:0, transition:'background .3s', boxShadow:i===cur?`0 0 6px ${ARC}`:'none' }} />
            {!mob && <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.16em', color:i===cur?ARC:TXM, transition:'color .2s', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{st.title}</span>}
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

// ─── Vault terminal ───────────────────────────────────────────────────────────
function Vault({ phase, phases, mob }: { phase: number; phases: readonly string[]; mob: boolean }) {
  const lk    = phase >= 1
  const bAmt  = phase === 0 ? 'PENDING' : phase === 1 ? '0.5000 USDC' : '✓ FUNDED'
  const sAmt  = phase < 3  ? 'PENDING'  : '0.4950 USDC'
  const state = ['OPEN','LOCKED','CONFIRMING','SETTLED'][phase]

  if (mob) return <VaultMobile phase={phase} phases={phases} bAmt={bAmt} sAmt={sAmt} state={state} lk={lk} />

  const ba = phase >= 1, sa = phase >= 3
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'rgba(46,87,255,0.015)' }}>
      <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(46,87,255,0.6) 40%,rgba(46,87,255,0.6) 60%,transparent)', pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.75rem 1.25rem', borderBottom:`1px solid ${ED}`, flexShrink:0 }}>
        {['#FF5F57','#FFBD2E','#28C840'].map((c,i) => <span key={i} style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block', marginLeft:i>0?3:0 }} />)}
        <span style={{ fontFamily:JB, fontSize:9, letterSpacing:'0.14em', color:'rgba(255,255,255,0.2)', marginLeft:'0.5rem', flex:1 }}>Scrow VAULT · 0x4a2f…e391</span>
        <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontFamily:JB, fontSize:8, fontWeight:700, letterSpacing:'0.16em', color:ARC, border:'1px solid rgba(46,87,255,0.2)', padding:'2px 7px', background:'rgba(46,87,255,0.06)' }}>
          <span style={{ width:4, height:4, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.4s ease-in-out infinite' }} /> LIVE
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1.25rem', borderBottom:`1px solid ${ED}`, fontFamily:JB, fontSize:10, letterSpacing:'0.12em', color:'rgba(255,255,255,0.2)', flexShrink:0 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.6s ease-in-out infinite', flexShrink:0 }} />
        STATUS:&nbsp;<span style={{ color:ARC, fontWeight:700 }}>{phases[phase]}</span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.5rem 2rem', minHeight:0 }}>
        <VN l="BUYER"  a="0xBu…yer1" ch="B" />
        <VL active={ba} label={bAmt} />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem', padding:'1.25rem 2rem', border:'1px solid rgba(46,87,255,0.2)', background:'rgba(46,87,255,0.05)', position:'relative', flexShrink:0 }}>
          <div aria-hidden style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 50%,rgba(46,87,255,0.08),transparent)', pointerEvents:'none' }} />
          <span style={{ fontSize:'3.5rem', lineHeight:1, color:ARC, animation:'arc-glow 3s ease-in-out infinite', position:'relative' }}>⬡</span>
          <span style={{ fontFamily:JB, fontSize:8, fontWeight:700, letterSpacing:'0.28em', color:'rgba(46,87,255,0.5)' }}>VAULT</span>
          <span style={{ fontFamily:JB, fontSize:8, letterSpacing:'0.12em', padding:'2px 8px', border:`1px solid ${lk?'rgba(46,87,255,0.35)':ED}`, color:lk?ARC:'rgba(255,255,255,0.2)', background:lk?'rgba(46,87,255,0.08)':'transparent', transition:'all .4s' }}>{state}</span>
        </div>
        <VL active={sa} label={sAmt} />
        <VN l="SELLER" a="0xSe…ler2" ch="S" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:`1px solid ${ED}`, flexShrink:0 }}>
        {[{k:'PRICE',v:'0.5000 USDC',h:false},{k:'COLLATERAL',v:'0.0500',h:false},{k:'FEE (1%)',v:'0.0050',h:false},{k:'SELLER GETS',v:'0.4950 USDC',h:true}].map((c,i) => (
          <div key={i} style={{ padding:'0.75rem 1rem', borderRight:i<3?`1px solid ${ED}`:'none', background:c.h?'rgba(46,87,255,0.04)':'transparent', display:'flex', flexDirection:'column', gap:'0.2rem' }}>
            <span style={{ fontFamily:JB, fontSize:7, letterSpacing:'0.16em', color:'rgba(255,255,255,0.2)' }}>{c.k}</span>
            <span style={{ fontFamily:JB, fontSize:11, fontWeight:700, color:c.h?ARC:TXL2 }}>{c.v}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', padding:'0.625rem 1rem', borderTop:`1px solid ${ED}`, flexShrink:0 }}>
        {phases.map((label,i) => (
          <div key={i} style={{ display:'contents' }}>
            {i>0 && <div style={{ flex:1, height:1, background:i<=phase?'rgba(46,87,255,0.45)':ED, transition:'background .3s' }} />}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem', flexShrink:0 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:i<phase?'rgba(46,87,255,0.5)':i===phase?ARC:ED, boxShadow:i===phase?`0 0 6px ${ARC}`:'none', transition:'all .3s' }} />
              <span style={{ fontFamily:JB, fontSize:7, letterSpacing:'0.08em', whiteSpace:'nowrap', color:i<phase?'rgba(46,87,255,0.5)':i===phase?ARC:'rgba(255,255,255,0.2)', transition:'color .3s' }}>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Vault — mobile layout (horizontal buyer/vault/seller row) ─────────────────
function VaultMobile({ phase, phases, bAmt, sAmt, state, lk }: {
  phase:number; phases:readonly string[]; bAmt:string; sAmt:string; state:string; lk:boolean
}) {
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'rgba(46,87,255,0.015)', overflow:'hidden' }}>

      {/* Chrome */}
      <div style={{ display:'flex', alignItems:'center', padding:'0.625rem 1rem', borderBottom:`1px solid ${ED}`, flexShrink:0, gap:'0.5rem' }}>
        <div style={{ display:'flex', gap:3 }}>
          {['#FF5F57','#FFBD2E','#28C840'].map((c,i) => <span key={i} style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block' }} />)}
        </div>
        <span style={{ fontFamily:JB, fontSize:8, letterSpacing:'0.1em', color:'rgba(255,255,255,0.18)', flex:1 }}>Scrow VAULT</span>
        <div style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontFamily:JB, fontSize:7.5, fontWeight:700, letterSpacing:'0.14em', color:ARC, border:'1px solid rgba(46,87,255,0.2)', padding:'2px 7px', background:'rgba(46,87,255,0.06)' }}>
          <span style={{ width:4, height:4, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.4s ease-in-out infinite' }} /> LIVE
        </div>
      </div>

      {/* Status */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.375rem 1rem', borderBottom:`1px solid ${ED}`, fontFamily:JB, fontSize:8.5, letterSpacing:'0.1em', color:'rgba(255,255,255,0.2)', flexShrink:0 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:ARC, display:'inline-block', animation:'pulse-led 1.6s ease-in-out infinite' }} />
        STATUS:&nbsp;<span style={{ color:ARC, fontWeight:700 }}>{phases[phase]}</span>
      </div>

      {/* Main body — horizontal three-column flow */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', padding:'1.25rem 1rem', gap:'0.75rem', minHeight:0 }}>

        {/* Buyer */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <div style={{ width:44, height:44, border:`1px solid ${ED}`, background:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BB, fontSize:'1.375rem', color:ARC, position:'relative' }}>
            <div style={{ position:'absolute', inset:3, border:'1px solid rgba(46,87,255,0.15)' }} />B
          </div>
          <span style={{ fontFamily:JB, fontSize:7.5, fontWeight:700, letterSpacing:'0.16em', color:'rgba(255,255,255,0.2)' }}>BUYER</span>
          <span style={{ fontFamily:JB, fontSize:8, color: phase >= 1 ? ARC : 'rgba(255,255,255,0.15)', textAlign:'center', lineHeight:1.3 }}>{bAmt}</span>
        </div>

        {/* Center vault hex */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem', padding:'1rem 0.875rem', border:'1px solid rgba(46,87,255,0.2)', background:'rgba(46,87,255,0.05)', position:'relative', flexShrink:0 }}>
          <div aria-hidden style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%,rgba(46,87,255,0.1),transparent)', pointerEvents:'none' }} />
          <span style={{ fontSize:'2.25rem', lineHeight:1, color:ARC, animation:'arc-glow 3s ease-in-out infinite', position:'relative' }}>⬡</span>
          <span style={{ fontFamily:JB, fontSize:7, fontWeight:700, letterSpacing:'0.22em', color:'rgba(46,87,255,0.5)' }}>VAULT</span>
          <span style={{ fontFamily:JB, fontSize:7, letterSpacing:'0.1em', padding:'1px 6px', border:`1px solid ${lk?'rgba(46,87,255,0.35)':ED}`, color:lk?ARC:'rgba(255,255,255,0.18)', background:lk?'rgba(46,87,255,0.08)':'transparent', transition:'all .4s', whiteSpace:'nowrap' }}>{state}</span>
        </div>

        {/* Seller */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <div style={{ width:44, height:44, border:`1px solid ${ED}`, background:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BB, fontSize:'1.375rem', color:ARC, position:'relative' }}>
            <div style={{ position:'absolute', inset:3, border:'1px solid rgba(46,87,255,0.15)' }} />S
          </div>
          <span style={{ fontFamily:JB, fontSize:7.5, fontWeight:700, letterSpacing:'0.16em', color:'rgba(255,255,255,0.2)' }}>SELLER</span>
          <span style={{ fontFamily:JB, fontSize:8, color: phase >= 3 ? ARC : 'rgba(255,255,255,0.15)', textAlign:'center', lineHeight:1.3 }}>{sAmt}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:`1px solid ${ED}`, flexShrink:0 }}>
        {[{k:'PRICE',v:'0.5000 USDC',h:false},{k:'SELLER GETS',v:'0.4950 USDC',h:true},{k:'COLLATERAL',v:'0.0500 USDC',h:false},{k:'FEE (1%)',v:'0.0050 USDC',h:false}].map((c,i) => (
          <div key={i} style={{ padding:'0.625rem 0.875rem', borderRight:i%2===0?`1px solid ${ED}`:'none', borderBottom:i<2?`1px solid ${ED}`:'none', background:c.h?'rgba(46,87,255,0.05)':'transparent', display:'flex', flexDirection:'column', gap:'0.2rem' }}>
            <span style={{ fontFamily:JB, fontSize:7, letterSpacing:'0.14em', color:'rgba(255,255,255,0.18)' }}>{c.k}</span>
            <span style={{ fontFamily:JB, fontSize:10.5, fontWeight:700, color:c.h?ARC:TXL2 }}>{c.v}</span>
          </div>
        ))}
      </div>

      {/* Timeline — dots only on mobile */}
      <div style={{ display:'flex', alignItems:'center', padding:'0.5rem 1rem', borderTop:`1px solid ${ED}`, flexShrink:0, gap:0 }}>
        {phases.map((label,i) => (
          <div key={i} style={{ display:'contents' }}>
            {i>0 && <div style={{ flex:1, height:1, background:i<=phase?'rgba(46,87,255,0.45)':ED, transition:'background .3s' }} />}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem', flexShrink:0 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:i<phase?'rgba(46,87,255,0.5)':i===phase?ARC:ED, boxShadow:i===phase?`0 0 6px ${ARC}`:'none', transition:'all .3s' }} />
              <span style={{ fontFamily:JB, fontSize:6, letterSpacing:'0.06em', color:i===phase?ARC:'rgba(255,255,255,0.18)', whiteSpace:'nowrap' }}>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VN({ l, a, ch }: { l:string; a:string; ch:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem', flexShrink:0 }}>
      <div style={{ width:54, height:54, border:`1px solid ${ED}`, background:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BB, fontSize:'1.5rem', color:ARC, position:'relative' }}>
        <div style={{ position:'absolute', inset:4, border:'1px solid rgba(46,87,255,0.15)' }} />{ch}
      </div>
      <span style={{ fontFamily:JB, fontSize:8, fontWeight:700, letterSpacing:'0.18em', color:'rgba(255,255,255,0.2)' }}>{l}</span>
      <span style={{ fontFamily:JB, fontSize:8, color:'rgba(255,255,255,0.1)' }}>{a}</span>
    </div>
  )
}

function VL({ active, label }: { active:boolean; label:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, minHeight:32, gap:'0.25rem', padding:'0.2rem 0' }}>
      <div style={{ width:1, flex:1, background:active?ARC:ED, position:'relative', overflow:'hidden', transition:'background .5s' }}>
        {active && <span style={{ position:'absolute', left:-3, width:7, height:7, borderRadius:'50%', background:ARC, boxShadow:`0 0 8px ${ARC}`, animation:'flow-down 1.6s linear infinite' }} />}
      </div>
      <span style={{ fontFamily:JB, fontSize:7.5, letterSpacing:'0.08em', color:active?'rgba(46,87,255,0.8)':'rgba(255,255,255,0.2)', whiteSpace:'nowrap', transition:'color .4s' }}>{label}</span>
    </div>
  )
}
