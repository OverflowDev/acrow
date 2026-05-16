# ARCROW — Trustless USDC Escrow on Arc Network

P2P escrow protocol deployed natively on Arc Network. Funds lock in a smart contract vault, release only on dual confirmation. No middlemen. No lawyers. Just the contract.

---

## Stack

| Layer | Tech |
|---|---|
| Smart contract | Solidity 0.8.24, OpenZeppelin ReentrancyGuard |
| Chain | Arc Network (chain ID 5042002, USDC native gas, 0.48s finality) |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Wallet | RainbowKit v2, Wagmi v2, Viem |
| Off-chain | Supabase (chat, ratings) |
| Dev tooling | Hardhat, TypeChain |

---

## Arc Network

| Property | Value |
|---|---|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Native token | USDC (18 decimals, EIP-1559) |
| Consensus | Malachite BFT |
| Finality | 0.48s |
| Gas cost | ~$0.01/tx |
| Faucet | https://faucet.circle.com |

> USDC has 18 decimals on Arc — `parseEther` / `formatEther` work identically. Only UI labels change from ETH → USDC.

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
arcrow/
├── contracts/
│   └── EscrowMarket.sol          # Core escrow contract (v2)
├── scripts/
│   └── deploy.ts                 # Hardhat deploy script
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # Landing page
│   ├── providers.tsx
│   └── app/
│       ├── page.tsx              # Marketplace
│       └── escrow/[id]/page.tsx  # Listing detail
├── components/
│   ├── Navbar.tsx
│   ├── WalletButton.tsx
│   ├── OrderCard.tsx
│   ├── CreateListingModal.tsx
│   └── TransactionDetail.tsx
├── hooks/
│   ├── useEscrowContract.ts      # Contract read/write hooks
│   └── useNativeSymbol.ts        # ETH/USDC dynamic label
├── lib/
│   ├── contract.ts               # ABI + address
│   ├── wagmi.ts                  # Arc chain config + RainbowKit
│   └── supabase.ts
├── types/
│   └── index.ts
├── supabase/
│   └── migrations/
│       ├── 001_listings.sql
│       └── 002_chat_ratings.sql
└── .env.local                    # gitignored — never commit
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

```env
# WalletConnect — cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Contract — update after deploy
NEXT_PUBLIC_CONTRACT_ADDRESS=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Arc Network
NEXT_PUBLIC_DEFAULT_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app

# Deploy only — NEVER commit a real key
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_NEVER_COMMIT
ARC_RPC_URL=https://rpc.testnet.arc.network
```

### 3. Database

Run in Supabase SQL Editor (in order):

```
supabase/migrations/001_listings.sql
supabase/migrations/002_chat_ratings.sql
```

### 4. Deploy contract

**Arc Testnet (primary):**
```bash
# Fund deployer wallet at https://faucet.circle.com first
npm run deploy:arc
```

**Local Hardhat:**
```bash
npm run node          # terminal 1
npm run deploy:local  # terminal 2
```

Update `NEXT_PUBLIC_CONTRACT_ADDRESS` after each deploy.

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
// Key functions
createListing(price, collateral, itemId)  // seller locks collateral
depositFunds(listingId)                   // buyer locks price
confirmDelivery(listingId)                // seller signals on-chain
confirmReceipt(listingId)                 // buyer releases funds
initiateDispute(listingId)                // either party freezes
resolveDispute(listingId, favorBuyer)     // arbitrator settles
```

Collateral routing on `confirmReceipt`:
- Seller confirmed delivery → collateral returns to seller
- Seller never confirmed → collateral goes to buyer as compensation

---

## Security

- `.env.local` is gitignored — never committed
- `DEPLOYER_PRIVATE_KEY` sentinel makes accidental commits obvious
- `nonReentrant` on every fund-transferring function
- `feeBps` capped at 1000 (10%) in contract
- All transfers use `.call{value}` with revert on failure
- Change `arbitrator` to a multisig before mainnet
