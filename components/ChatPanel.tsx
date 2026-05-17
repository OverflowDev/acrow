'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { Send, MessageSquare, Lock, Loader2 } from 'lucide-react'
import type { Message } from '@/types'

const BG   = '#05080F'
const BG2  = '#08101E'
const BG3  = '#0C1525'
const ARC  = '#2E57FF'
const BD   = 'rgba(255,255,255,0.07)'
const TXL  = '#EDE9F8'
const TXM  = '#6B6B99'
const JB   = 'var(--font-jb,monospace)'

const POLL_MS      = 4_000
const AUTH_TTL_MS  = 4 * 60 * 1000 // 4 min client cache (server accepts 5 min)

interface Auth { address: string; signature: string; timestamp: number }

function sessionKey(escrowId: string) { return `chat_auth_${escrowId}` }

function loadAuth(escrowId: string): Auth | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(escrowId))
    if (!raw) return null
    const auth: Auth = JSON.parse(raw)
    if (Date.now() - auth.timestamp * 1000 > AUTH_TTL_MS) return null
    return auth
  } catch { return null }
}

function saveAuth(escrowId: string, auth: Auth) {
  try { sessionStorage.setItem(sessionKey(escrowId), JSON.stringify(auth)) } catch {}
}

interface ChatPanelProps {
  escrowId: string
  seller:   string
  buyer:    string
}

export function ChatPanel({ escrowId, seller, buyer }: ChatPanelProps) {
  const { address }          = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [auth,      setAuth]      = useState<Auth | null>(null)
  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Restore cached auth on mount
  useEffect(() => {
    const cached = loadAuth(escrowId)
    if (cached && cached.address === address?.toLowerCase()) setAuth(cached)
  }, [escrowId, address])

  // Auth headers helper
  const headers = useCallback((a: Auth) => ({
    'Content-Type':    'application/json',
    'x-wallet-address': a.address,
    'x-signature':      a.signature,
    'x-timestamp':      String(a.timestamp),
  }), [])

  // Fetch messages
  const fetchMsgs = useCallback(async (a: Auth) => {
    try {
      const res = await fetch(`/api/messages/${escrowId}`, { headers: headers(a) })
      if (!res.ok) { if (res.status === 403) setAuth(null); return }
      const data: Message[] = await res.json()
      setMessages(data)
    } catch {}
  }, [escrowId, headers])

  // Poll while authed
  useEffect(() => {
    if (!auth) return
    fetchMsgs(auth)
    const id = setInterval(() => fetchMsgs(auth), POLL_MS)
    return () => clearInterval(id)
  }, [auth, fetchMsgs])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const unlock = async () => {
    if (!address) return
    setUnlocking(true)
    setError(null)
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const message   = `scrow:chat:${escrowId}:${timestamp}`
      const signature = await signMessageAsync({ message })
      const a: Auth   = { address: address.toLowerCase(), signature, timestamp }
      saveAuth(escrowId, a)
      setAuth(a)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg.includes('rejected') ? 'Signature rejected.' : 'Could not sign.')
    } finally {
      setUnlocking(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !auth || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${escrowId}`, {
        method:  'POST',
        headers: headers(auth),
        body:    JSON.stringify({ content: input.trim() }),
      })
      if (!res.ok) throw new Error('Send failed')
      setInput('')
      await fetchMsgs(auth)
    } catch {
      setError('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isSeller = (a: string) => a.toLowerCase() === seller.toLowerCase()

  // ── Locked / unauthenticated state ──────────────────────────────────────────
  if (!auth) {
    return (
      <div style={{ border: `1px solid ${BD}`, background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '2rem 1.25rem', height: 240 }}>
        <div style={{ width: 44, height: 44, border: `1px solid rgba(46,87,255,0.25)`, background: 'rgba(46,87,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={18} style={{ color: ARC }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: JB, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', color: TXL, marginBottom: 4 }}>CHAT IS ENCRYPTED</p>
          <p style={{ fontFamily: JB, fontSize: 9, letterSpacing: '0.06em', color: TXM, lineHeight: 1.6 }}>
            Sign to prove wallet ownership.<br />Only buyer &amp; seller can read this chat.
          </p>
        </div>
        {error && (
          <p style={{ fontFamily: JB, fontSize: 9, color: '#f87171', letterSpacing: '0.06em' }}>{error}</p>
        )}
        <button
          onClick={unlock}
          disabled={unlocking}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.5rem 1.5rem', background: unlocking ? 'rgba(46,87,255,0.5)' : ARC,
            border: 'none', cursor: unlocking ? 'not-allowed' : 'pointer',
            color: '#fff', fontFamily: JB, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          }}
        >
          {unlocking
            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> SIGNING…</>
            : <><MessageSquare size={13} /> UNLOCK CHAT</>
          }
        </button>
      </div>
    )
  }

  // ── Authenticated chat ───────────────────────────────────────────────────────
  return (
    <div style={{ border: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', height: 360, background: BG }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 0.875rem', borderBottom: `1px solid ${BD}`, background: BG2, flexShrink: 0 }}>
        <MessageSquare size={13} style={{ color: ARC }} />
        <span style={{ fontFamily: JB, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: TXL }}>PRIVATE CHAT</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontFamily: JB, fontSize: 9, letterSpacing: '0.1em', color: ARC }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ARC }} />
          SECURED
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', fontFamily: JB, fontSize: 9.5, letterSpacing: '0.1em', color: TXM, paddingTop: '1.5rem' }}>
            NO MESSAGES YET — START NEGOTIATION
          </p>
        )}
        {messages.map(msg => {
          const isMe    = address?.toLowerCase() === msg.sender_address.toLowerCase()
          const label   = isMe ? 'YOU' : isSeller(msg.sender_address) ? 'SELLER' : 'BUYER'
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
              <span style={{ fontFamily: JB, fontSize: 8, letterSpacing: '0.14em', color: TXM, paddingInline: 4 }}>{label}</span>
              <div style={{
                maxWidth: '78%', padding: '0.4rem 0.7rem',
                fontFamily: JB, fontSize: 11, letterSpacing: '0.03em', lineHeight: 1.5,
                wordBreak: 'break-word',
                background: isMe ? 'rgba(46,87,255,0.18)' : BG3,
                border: `1px solid ${isMe ? 'rgba(46,87,255,0.35)' : BD}`,
                color: isMe ? '#A8BFFF' : TXL,
              }}>
                {msg.content}
              </div>
              <span style={{ fontFamily: JB, fontSize: 8, color: 'rgba(107,107,153,0.4)', paddingInline: 4 }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.4rem 0.875rem', background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.15)', fontFamily: JB, fontSize: 9, color: '#f87171', letterSpacing: '0.06em' }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${BD}`, padding: '0.625rem', display: 'flex', gap: 6, background: BG2 }}>
        <input
          style={{
            flex: 1, background: BG3, border: `1px solid ${BD}`, color: TXL,
            fontFamily: JB, fontSize: 11, letterSpacing: '0.04em',
            padding: '0.4rem 0.65rem', outline: 'none',
          }}
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(46,87,255,0.4)')}
          onBlur={e   => (e.currentTarget.style.borderColor = BD)}
          maxLength={1000}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            padding: '0.4rem 0.7rem', background: ARC, border: 'none',
            cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!input.trim() || sending) ? 0.4 : 1,
            transition: 'opacity .18s, background .18s', flexShrink: 0,
          }}
          onMouseEnter={e => { if (input.trim() && !sending) (e.currentTarget as HTMLElement).style.background = '#4B6DFF' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ARC }}
        >
          {sending ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
        </button>
      </div>
    </div>
  )
}
