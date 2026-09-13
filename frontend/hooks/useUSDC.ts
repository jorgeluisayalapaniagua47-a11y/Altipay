'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { DEPLOYED_CONTRACTS, DEFAULT_CHAIN_ID, MOCK_USDC_ABI } from '@/contracts/deployedContracts'
import { handleTxSuccess, handleTxError } from '@/services/transactionHandler'
import { toast } from 'sonner'

export function useUSDC() {
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const activeChainId = chainId && DEPLOYED_CONTRACTS[chainId] ? chainId : DEFAULT_CHAIN_ID
  const contractConfig = DEPLOYED_CONTRACTS[activeChainId]
  const usdcAddress = contractConfig?.usdcAddress
  const escrowAddress = contractConfig?.escrowAddress

  const [isApproving, setIsApproving] = useState(false)
  const [isMinting, setIsMinting] = useState(false)

  // Read balance
  const {
    data: rawBalance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: usdcAddress,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && usdcAddress),
    },
  })

  // Read allowance
  const {
    data: rawAllowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: usdcAddress,
    abi: MOCK_USDC_ABI,
    functionName: 'allowance',
    args: address && escrowAddress ? [address, escrowAddress] : undefined,
    query: {
      enabled: Boolean(address && usdcAddress && escrowAddress),
    },
  })

  const balance = rawBalance !== undefined ? formatUnits(rawBalance, 6) : '0.00'
  const allowance = rawAllowance !== undefined ? formatUnits(rawAllowance, 6) : '0.00'

  // Approve function
  const approveEscrow = async (amount: string) => {
    if (!address || !usdcAddress || !escrowAddress) {
      toast.error('Billetera no conectada')
      return false
    }

    try {
      setIsApproving(true)
      const parsedAmount = parseUnits(amount, 6)
      toast.info('Solicitando aprobación de USDC en billetera...')

      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: MOCK_USDC_ABI,
        functionName: 'approve',
        args: [escrowAddress, parsedAmount],
      })

      if (publicClient) {
        toast.loading('Confirmando aprobación en la blockchain...', { id: 'usdc-approve' })
        await publicClient.waitForTransactionReceipt({ hash })
        toast.dismiss('usdc-approve')
      }

      handleTxSuccess('USDC aprobado para custodia', hash, activeChainId)
      await refetchAllowance()
      return true
    } catch (error: any) {
      toast.dismiss('usdc-approve')
      handleTxError(error, 'Error al aprobar USDC')
      return false
    } finally {
      setIsApproving(false)
    }
  }

  // Demo Faucet function (mints 100 USDC)
  const requestFaucet = async (amount: string = '100') => {
    if (!address || !usdcAddress) {
      toast.error('Billetera no conectada')
      return false
    }

    try {
      setIsMinting(true)
      const parsedAmount = parseUnits(amount, 6)
      toast.info(`Solicitando ${amount} MockUSDC del faucet...`)

      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: MOCK_USDC_ABI,
        functionName: 'faucet',
        args: [address, parsedAmount],
      })

      if (publicClient) {
        toast.loading('Acreditando tokens en tu billetera...', { id: 'usdc-faucet' })
        await publicClient.waitForTransactionReceipt({ hash })
        toast.dismiss('usdc-faucet')
      }

      handleTxSuccess(`¡${amount} MockUSDC acreditados con éxito!`, hash, activeChainId, true)
      await refetchBalance()
      return true
    } catch (error: any) {
      toast.dismiss('usdc-faucet')
      handleTxError(error, 'Error al solicitar tokens del faucet')
      return false
    } finally {
      setIsMinting(false)
    }
  }

  return {
    usdcAddress,
    escrowAddress,
    balance,
    rawBalance,
    allowance,
    rawAllowance,
    isLoadingBalance,
    isLoadingAllowance,
    isApproving,
    isMinting,
    refetchBalance,
    refetchAllowance,
    approveEscrow,
    requestFaucet,
  }
}
