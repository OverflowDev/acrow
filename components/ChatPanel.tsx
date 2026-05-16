'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { Send, MessageSquare, WifiOff } from 'lucide-react'
import { fetchMessages, sendMessage, subscribeToMessages } from '@/lib/supabase'
import type { Message } from '@/types'

interface ChatPanelProps {
  escrowId: string
  seller:   string
  buyer:    string
}

export function ChatPanel({ escrowId, seller, buyer }: ChatPanelProps) {
  const { address } = useAccount()
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [connected,   setConnected]   = useState(false)
  const [noSupabase,  setNoSupabase]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isParty = address &&
    (address.toLowerCase() === seller.toLowerCase() ||
     address.toLowerCase() === buyer.toLowerCase())

  // Load history + subscribe
  useEffect(() => {
    let unsub = () => {}

    fetchMessages(escrowId).then(msgs => {
      if (msgs === null) { setNoSupabase(true); return }
      setMessages(msgs)
      setConnected(true)

      const sub = subscribeToMessages(escrowId, (msg) => {
        setMessages(prev => {
          // dedupe by id
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      unsub = sub.unsubscribe
    })

    return () => unsub()
  }, [escrowId])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !address || sending) return
    setSending(true)
    try {
      await sendMessage(escrowId, address, input.trim())
      setInput('')
    } catch {
      // message will appear via realtime subscription
    } finally {
      setSending(false)
    }
  }, [input, address, escrowId, sending])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (noSupabase) {
    return (
      <div className="border border-slate-700 rounded-xl p-4 text-center text-xs text-slate-600 space-y-1">
        <WifiOff size={18} className="mx-auto text-slate-700" />
        <p>Chat requires Supabase.</p>
        <p>Add <code className="bg-slate-800 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> to .env.local</p>
      </div>
    )
  }

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden flex flex-col" style={{ height: 340 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 shrink-0">
        <MessageSquare size={14} className="text-emerald-400" />
        <span className="text-xs font-semibold text-slate-300">Negotiation Chat</span>
        {connected && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-900/40">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-600 py-6">
            No messages yet. Start the negotiation.
          </p>
        )}
        {messages.map(msg => {
          const isMe = address?.toLowerCase() === msg.sender_address.toLowerCase()
          const isSeller = msg.sender_address.toLowerCase() === seller.toLowerCase()
          const label = isMe ? 'You' : isSeller ? 'Seller' : 'Buyer'

          return (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-600 px-1">{label}</span>
              <div className={[
                'max-w-[80%] px-3 py-2 rounded-2xl text-sm break-words',
                isMe
                  ? 'bg-emerald-600/80 text-white rounded-br-sm'
                  : 'bg-slate-700 text-slate-100 rounded-bl-sm',
              ].join(' ')}>
                {msg.content}
              </div>
              <span className="text-xs text-slate-700 px-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-700 p-2 flex gap-2 bg-slate-800/60">
        {isParty ? (
          <>
            <input
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              maxLength={1000}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-lg text-white transition-colors shrink-0"
            >
              <Send size={15} />
            </button>
          </>
        ) : (
          <p className="w-full text-center text-xs text-slate-600 py-2">
            Only the buyer and seller can chat
          </p>
        )}
      </div>
    </div>
  )
}
