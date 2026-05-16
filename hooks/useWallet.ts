'use client'

import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { formatEther } from 'viem'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { data: balance }                       = useBalance({ address })
  const { disconnect }                          = useDisconnect()
  const chainId                                 = useChainId()
  const { switchChain, chains }                 = useSwitchChain()

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null

  const balanceEth = balance
    ? parseFloat(formatEther(balance.value)).toFixed(4)
    : '0.0000'

  return {
    address,
    shortAddress,
    isConnected,
    isConnecting,
    balanceEth,
    balanceSymbol: balance?.symbol ?? 'ETH',
    chainId,
    chains,
    switchChain,
    disconnect,
  }
}

export function useIsOwnerOrBuyer(
  seller: string | undefined,
  buyer:  string | undefined,
) {
  const { address } = useAccount()
  if (!address) return { isSeller: false, isBuyer: false, isParty: false }

  const norm = (a: string | undefined) => a?.toLowerCase()
  const isSeller = norm(address) === norm(seller)
  const isBuyer  = norm(address) === norm(buyer)

  return { isSeller, isBuyer, isParty: isSeller || isBuyer }
}
