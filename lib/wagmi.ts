import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia } from 'wagmi/chains'
import type { Chain } from 'wagmi/chains'

// ─── Arc Testnet ──────────────────────────────────────────────────────────────
// Native token is USDC (18 decimals), not ETH.
// Gas is paid in USDC — EIP-1559, base fee ~$0.01/tx.
// Faucet: https://faucet.circle.com
export const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name:     'USD Coin',
    symbol:   'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
}

// ─── Hardhat local (dev only) ─────────────────────────────────────────────────
// Placed second so Arc is the default when connected to Arc.
const hardhatLocal: Chain = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
}

// Arc first → default chain when the wallet is on Arc.
// Arc's RPC is a real public URL (no CORS issues), so this is safe.
export const chains: [Chain, ...Chain[]] = [
  arcTestnet,
  hardhatLocal,
  sepolia,
  mainnet,
]

export const wagmiConfig = getDefaultConfig({
  appName:   'ARCROW',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
  ssr: true,
})
