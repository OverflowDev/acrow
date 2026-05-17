# Scrow — Trustless P2P Escrow on Arc Network

Trustless P2P escrow protocol on Arc Network. Funds lock in a smart contract vault, release only on dual confirmation. Seller posts collateral as proof of commitment. No middlemen. Just the contract.

---

## Stack

| Layer | Tech |
|---|---|
| Smart contract | Solidity 0.8.24, OpenZeppelin ReentrancyGuard |
| Chain | Arc Network (chain ID 5042002, USDC native gas, 0.48s finality) |
| Frontend | Next.js 14 App Router, TypeScript |
| Wallet | RainbowKit v2, Wagmi v2, Viem |
| Off-chain | Supabase (metadata, secure chat, ratings) |
| Dev tooling | Hardhat |

---

## Arc Network

| Property | Value |
|---|---|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Native token | USDC (18 decimals, EIP-1559) |
| Finality | 0.48s |
| Gas cost | ~$0.01/tx |
| Faucet | https://faucet.circle.com |

> USDC has 18 decimals on Arc — `parseEther` / `formatEther` work identically to ETH. Only UI labels change.

---

## Escrow Flow

```
Seller                    Contract Vault                  Buyer
  │                            │                            │
  │── createListing(price) ──► │  (collateral locked)       │
  │                            │                            │
  │                            │ ◄── depositFunds(USDC) ────│
  │                            │   (price locked in vault)  │
  │                            │                            │
  │── confirmDelivery() ──────►│                            │
  │                            │ ◄── confirmReceipt() ──────│
  │ ◄── price (minus 1% fee) ──│   (dual confirmation met)  │
  │ ◄── collateral returned ───│                            │
  │                            │                            │
  │                         OR │                            │
  │                            │ ◄── initiateDispute() ─────│
  │                            │   (funds frozen)           │
  │         arbitrator resolves → winner receives funds     │
```

---

## Project Structure

```
scrow/
├── contracts/
│   └── EscrowMarket.sol              # Core escrow contract (v2)
├── scripts/
│   └── deploy.ts                     # Hardhat deploy script
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Landing page
│   ├── providers.tsx
│   ├── app/
│   │   └── page.tsx                  # Marketplace
│   └── api/
│       └── messages/[escrowId]/
│           └── route.ts              # Secure chat API (wallet-signature auth)
├── components/
│   ├── Navbar.tsx
│   ├── WalletButton.tsx
│   ├── OrderCard.tsx
│   ├── CreateListingModal.tsx
│   ├── TransactionDetail.tsx
│   ├── ChatPanel.tsx                 # Private buyer-seller chat (sign-to-unlock)
│   ├── EscrowStepper.tsx
│   ├── RatingModal.tsx
│   └── ReputationBadge.tsx
├── hooks/
│   ├── useEscrowContract.ts          # Contract read/write hooks
│   └── useNativeSymbol.ts            # USDC/ETH dynamic label
├── lib/
│   ├── contract.ts                   # ABI + contract address
│   ├── wagmi.ts                      # Arc chain config + RainbowKit
│   ├── supabase.ts                   # Client-side Supabase (metadata, ratings)
│   └── supabase-server.ts            # Server-only Supabase (service role key)
├── types/
│   └── index.ts
├── supabase/
│   └── migrations/
│       ├── 001_init.sql              # listings, profiles tables
│       ├── 002_chat_ratings.sql      # messages, ratings, reputation view
│       └── 003_secure_messages_rls.sql  # block direct client access to messages
├── .env.local.example                # copy to .env.local and fill in values
└── .env.local                        # gitignored — never commit
```

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
# WalletConnect — https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Contract — update after deploy
NEXT_PUBLIC_CONTRACT_ADDRESS=

# Arc Testnet
NEXT_PUBLIC_DEFAULT_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app

# Supabase — Settings → API (base URL, no /rest/v1/ suffix)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase service role — SERVER ONLY, never expose to browser
# Supabase → Settings → API → service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=

# Deploy only — NEVER commit a real key
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_NEVER_COMMIT
ARC_RPC_URL=https://rpc.testnet.arc.network
```

### 3. Database

Run in Supabase SQL Editor **in order**:

```
supabase/migrations/001_init.sql
supabase/migrations/002_chat_ratings.sql
supabase/migrations/003_secure_messages_rls.sql
```

Migration 003 locks down the `messages` table so only the server-side API route can read/write it — direct anon-key queries return nothing.

### 4. Deploy contract

**Arc Testnet:**
```bash
# Fund deployer wallet at https://faucet.circle.com first
npm run deploy:arc
```

**Local Hardhat:**
```bash
npm run node          # terminal 1
npm run deploy:local  # terminal 2
```

Copy the deployed address into `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### 5. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run compile` | Compile contracts |
| `npm run deploy:arc` | Deploy to Arc Testnet |
| `npm run deploy:local` | Deploy to local Hardhat |
| `npm run deploy:sepolia` | Deploy to Sepolia |
| `npm run node` | Start local Hardhat node |
| `npm run test:contract` | Run Hardhat tests |

---

## Contract — EscrowMarket v2

```solidity
createListing(price, collateral, itemId)  // seller locks collateral
depositFunds(listingId)                   // buyer locks price
confirmDelivery(listingId)                // seller signals delivery on-chain
confirmReceipt(listingId)                 // buyer releases funds + collateral
initiateDispute(listingId)                // either party freezes funds
resolveDispute(listingId, favorBuyer)     // arbitrator settles
cancelListing(listingId)                  // seller cancels open listing
```

**Collateral routing on `confirmReceipt`:**
- Seller confirmed delivery → collateral returns to seller
- Seller never confirmed → collateral goes to buyer as compensation

**Fee:** 1% of price, sent to contract owner on settlement.

---

## Chat Security

Chat between buyer and seller is protected at the API layer:

1. Buyer/seller clicks **Unlock Chat** → signs `scrow:chat:{escrowId}:{timestamp}` in their wallet
2. Signature is sent as a header to `POST /api/messages/[escrowId]` and `GET /api/messages/[escrowId]`
3. Server verifies the signature on-chain via `getListing()` — if the signer isn't buyer or seller, `403`
4. Server reads/writes using the Supabase service role key (server-side only)
5. Supabase RLS blocks all direct anon-key access — DevTools inspection returns nothing

Spectators see no chat UI. The chat section is hidden entirely if the connected wallet is neither buyer nor seller.

---

## Security Notes

- `.env.local` is gitignored — never committed
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix — stays server-side only
- `nonReentrant` on every fund-transferring function
- `feeBps` capped at 1000 (10%) in contract
- All transfers use `.call{value}` with revert on failure
- Change `arbitrator` to a multisig before mainnet
