'use client'

import { useCallback } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseEther } from 'viem'
import { ESCROW_ABI, CONTRACT_ADDRESS, IS_CONTRACT_DEPLOYED } from '@/lib/contract'

// ─── Read: single listing ─────────────────────────────────────────────────────

export function useListing(listingId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi:     ESCROW_ABI,
    functionName: 'getListing',
    args:    listingId !== undefined ? [listingId] : undefined,
    query:   { enabled: IS_CONTRACT_DEPLOYED && listingId !== undefined, refetchInterval: 5_000 },
  })
}

// ─── Read: total count ────────────────────────────────────────────────────────

export function useListingCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi:     ESCROW_ABI,
    functionName: 'listingCount',
    query:   { enabled: IS_CONTRACT_DEPLOYED, refetchInterval: 8_000 },
  })
}

// ─── Read: paginated batch ────────────────────────────────────────────────────

export function useListings(from: bigint, to: bigint, enabled = true) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi:     ESCROW_ABI,
    functionName: 'getListings',
    args:    [from, to],
    query:   { enabled: IS_CONTRACT_DEPLOYED && enabled && to >= from, refetchInterval: 8_000 },
  })
}

// ─── Read: fee ────────────────────────────────────────────────────────────────

export function useFeeBps() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi:     ESCROW_ABI,
    functionName: 'feeBps',
    query:   { enabled: IS_CONTRACT_DEPLOYED },
  })
}

// ─── Write: create listing ────────────────────────────────────────────────────

export function useCreateListing() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const createListing = useCallback(
    async (priceEth: string, collateralEth: string, itemId: string) => {
      const collateralWei = parseEther(collateralEth || '0')
      return writeContractAsync({
        address:      CONTRACT_ADDRESS,
        abi:          ESCROW_ABI,
        functionName: 'createListing',
        args:         [parseEther(priceEth), collateralWei, itemId],
        value:        collateralWei,
      })
    },
    [writeContractAsync],
  )

  return { createListing, hash, isPending, receipt }
}

// ─── Write: deposit funds ─────────────────────────────────────────────────────

export function useDepositFunds() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const depositFunds = useCallback(
    async (listingId: bigint, priceWei: bigint) =>
      writeContractAsync({
        address:      CONTRACT_ADDRESS,
        abi:          ESCROW_ABI,
        functionName: 'depositFunds',
        args:         [listingId],
        value:        priceWei,
      }),
    [writeContractAsync],
  )

  return { depositFunds, hash, isPending, receipt }
}

// ─── Write: seller confirms delivery ─────────────────────────────────────────

export function useConfirmDelivery() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const confirmDelivery = useCallback(
    async (listingId: bigint) =>
      writeContractAsync({
        address:      CONTRACT_ADDRESS,
        abi:          ESCROW_ABI,
        functionName: 'confirmDelivery',
        args:         [listingId],
      }),
    [writeContractAsync],
  )

  return { confirmDelivery, hash, isPending, receipt }
}

// ─── Write: buyer confirms receipt ────────────────────────────────────────────

export function useConfirmReceipt() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const confirmReceipt = useCallback(
    async (listingId: bigint) =>
      writeContractAsync({
        address:      CONTRACT_ADDRESS,
        abi:          ESCROW_ABI,
        functionName: 'confirmReceipt',
        args:         [listingId],
      }),
    [writeContractAsync],
  )

  return { confirmReceipt, hash, isPending, receipt }
}

// ─── Write: dispute ───────────────────────────────────────────────────────────

export function useInitiateDispute() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const initiateDispute = useCallback(
    async (listingId: bigint) =>
      writeContractAsync({
        address:      CONTRACT_ADDRESS,
        abi:          ESCROW_ABI,
        functionName: 'initiateDispute',
        args:         [listingId],
      }),
    [writeContractAsync],
  )

  return { initiateDispute, hash, isPending, receipt }
}

// ─── Write: cancel ────────────────────────────────────────────────────────────

export function useCancelListing() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const cancelListing = useCallback(
    async (listingId: bigint) =>
      writeContractAsync({
        address:      CONTRACT_ADDRESS,
        abi:          ESCROW_ABI,
        functionName: 'cancelListing',
        args:         [listingId],
      }),
    [writeContractAsync],
  )

  return { cancelListing, hash, isPending, receipt }
}

// ─── Write: resolve dispute (arbitrator only) ─────────────────────────────────

export function useResolveDispute() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const resolveDispute = useCallback(
    async (listingId: bigint, favorBuyer: boolean) =>
      writeContractAsync({
        address:      CONTRACT_ADDRESS,
        abi:          ESCROW_ABI,
        functionName: 'resolveDispute',
        args:         [listingId, favorBuyer],
      }),
    [writeContractAsync],
  )

  return { resolveDispute, hash, isPending, receipt }
}

// ─── Read: arbitrator address ─────────────────────────────────────────────────

export function useArbitrator() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi:     ESCROW_ABI,
    functionName: 'arbitrator',
    query:   { enabled: IS_CONTRACT_DEPLOYED },
  })
}
