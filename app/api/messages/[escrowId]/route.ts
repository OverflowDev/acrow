import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage, createPublicClient, http } from 'viem'
import { supabaseAdmin } from '@/lib/supabase-server'
import { ESCROW_ABI, CONTRACT_ADDRESS } from '@/lib/contract'

const AUTH_WINDOW_SEC = 300 // 5 minutes

function buildClient() {
  const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'
  return createPublicClient({ transport: http(rpcUrl) })
}

async function getParties(escrowId: string): Promise<{ seller: string; buyer: string } | null> {
  try {
    const listing = await buildClient().readContract({
      address: CONTRACT_ADDRESS,
      abi:     ESCROW_ABI,
      functionName: 'getListing',
      args:    [BigInt(escrowId)],
    }) as { seller: string; buyer: string }
    return {
      seller: listing.seller.toLowerCase(),
      buyer:  listing.buyer.toLowerCase(),
    }
  } catch {
    return null
  }
}

async function authorize(
  escrowId: string,
  address:  string,
  signature: string,
  timestamp: number,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > AUTH_WINDOW_SEC) return false

  const message = `scrow:chat:${escrowId}:${timestamp}`
  const valid = await verifyMessage({
    address:   address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  })
  if (!valid) return false

  const parties = await getParties(escrowId)
  if (!parties) return false

  const addr = address.toLowerCase()
  return addr === parties.seller || addr === parties.buyer
}

function getAuthHeaders(req: NextRequest) {
  return {
    address:   req.headers.get('x-wallet-address') || '',
    signature: req.headers.get('x-signature')      || '',
    timestamp: parseInt(req.headers.get('x-timestamp') || '0', 10),
  }
}

// ─── GET /api/messages/[escrowId] ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { escrowId: string } },
) {
  const { escrowId } = params
  const { address, signature, timestamp } = getAuthHeaders(req)

  if (!address || !signature || !timestamp) {
    return NextResponse.json({ error: 'Missing auth headers' }, { status: 401 })
  }

  const ok = await authorize(escrowId, address, signature, timestamp)
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ─── POST /api/messages/[escrowId] ────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { escrowId: string } },
) {
  const { escrowId } = params
  const { address, signature, timestamp } = getAuthHeaders(req)

  let content = ''
  try {
    const body = await req.json()
    content = (body.content || '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!address || !signature || !timestamp || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const ok = await authorize(escrowId, address, signature, timestamp)
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      escrow_id:      escrowId,
      sender_address: address.toLowerCase(),
      content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
