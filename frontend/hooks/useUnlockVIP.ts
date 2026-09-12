'use client'

import { useAccount, useReadContract } from 'wagmi'
import { DEPLOYED_CONTRACTS, DEFAULT_CHAIN_ID, ALTI_PAY_ESCROW_ABI, UNLOCK_LOCK_ABI } from '@/contracts/deployedContracts'

export function useUnlockVIP() {
  const { address, chainId } = useAccount()
  const activeChainId = chainId && DEPLOYED_CONTRACTS[chainId] ? chainId : DEFAULT_CHAIN_ID
  const escrowAddress = DEPLOYED_CONTRACTS[activeChainId]?.escrowAddress

  // Read vipLock address from Escrow contract
  const { data: vipLockAddress } = useReadContract({
    address: escrowAddress,
    abi: ALTI_PAY_ESCROW_ABI,
    functionName: 'vipLock',
    query: {
      enabled: Boolean(escrowAddress),
    },
  })

  // Read hasValidKey for user
  const hasValidLockAddress = Boolean(vipLockAddress && vipLockAddress !== '0x0000000000000000000000000000000000000000')

  const { data: isValidVIP, isLoading: isLoadingVIP } = useReadContract({
    address: hasValidLockAddress ? (vipLockAddress as `0x${string}`) : undefined,
    abi: UNLOCK_LOCK_ABI,
    functionName: 'getHasValidKey',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(hasValidLockAddress && address),
    },
  })

  const isVIP = Boolean(isValidVIP)
  const feeRate = isVIP ? 0 : 0.005 // 0% if VIP, 0.5% standard

  const calculateFee = (amountNum: number) => {
    return isVIP ? 0 : amountNum * 0.005
  }

  const calculateSavings = (amountNum: number) => {
    // Standard escrow vs banking 3.5%
    return Math.max(0, amountNum * 0.028)
  }

  return {
    isVIP,
    isLoadingVIP,
    feeRate,
    feePercentage: isVIP ? '0%' : '0.50%',
    calculateFee,
    calculateSavings,
  }
}
