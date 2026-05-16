import { useChainId } from 'wagmi'
import { chains } from '@/lib/wagmi'

/**
 * Returns the native currency symbol for the currently connected chain.
 * Arc Testnet → "USDC" | Hardhat / Sepolia / Mainnet → "ETH"
 */
export function useNativeSymbol(): string {
  const chainId = useChainId()
  return chains.find(c => c.id === chainId)?.nativeCurrency.symbol ?? 'ETH'
}
