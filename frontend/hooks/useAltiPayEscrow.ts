'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits, stringToHex, keccak256, decodeEventLog } from 'viem'
import { DEPLOYED_CONTRACTS, DEFAULT_CHAIN_ID, ALTI_PAY_ESCROW_ABI } from '@/contracts/deployedContracts'
import { handleTxSuccess, handleTxError } from '@/services/transactionHandler'
import { toast } from 'sonner'

export type OrderStatusType = 'FUNDED' | 'DISPATCHED' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED' | 'UNKNOWN'

export interface EscrowOrderItem {
  id: string
  orderId: `0x${string}`
  buyer: `0x${string}`
  seller: `0x${string}`
  amount: string
  formattedAmount: string
  description: string
  trackingInfo: string
  status: OrderStatusType
  statusLabel: string
  tone: 'green' | 'blue' | 'amber' | 'emerald'
  progress: number
  date: string
  deadline: number
  isBuyer: boolean
  isSeller: boolean
  secretPin?: string
}

const STATUS_MAP: Record<number, { status: OrderStatusType; label: string; tone: 'green' | 'blue' | 'amber' | 'emerald'; progress: number }> = {
  1: { status: 'FUNDED', label: 'Pago asegurado', tone: 'green', progress: 33 },
  2: { status: 'DISPATCHED', label: 'En tránsito', tone: 'blue', progress: 66 },
  3: { status: 'COMPLETED', label: 'Completado', tone: 'emerald', progress: 100 },
  4: { status: 'REFUNDED', label: 'Reembolsado', tone: 'amber', progress: 100 },
  5: { status: 'CANCELLED', label: 'Cancelado', tone: 'amber', progress: 0 },
}

export function useAltiPayEscrow() {
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const activeChainId = chainId && DEPLOYED_CONTRACTS[chainId] ? chainId : DEFAULT_CHAIN_ID
  const contractConfig = DEPLOYED_CONTRACTS[activeChainId]
  const escrowAddress = contractConfig?.escrowAddress
  const usdcAddress = contractConfig?.usdcAddress

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localOrders, setLocalOrders] = useState<EscrowOrderItem[]>([])

  // Load cached and local orders for the active address
  useEffect(() => {
    if (!address) {
      setLocalOrders([])
      return
    }
    try {
      const saved = localStorage.getItem(`altipay_escrows_${address.toLowerCase()}_${activeChainId}`)
      if (saved) {
        setLocalOrders(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Error reading local orders:', e)
    }
  }, [address, activeChainId])

  const saveLocalOrder = useCallback((order: EscrowOrderItem) => {
    if (!address) return
    setLocalOrders((prev) => {
      const existsIndex = prev.findIndex((o) => o.orderId.toLowerCase() === order.orderId.toLowerCase())
      let updated: EscrowOrderItem[]
      if (existsIndex >= 0) {
        updated = [...prev]
        updated[existsIndex] = { ...updated[existsIndex], ...order }
      } else {
        updated = [order, ...prev]
      }
      try {
        localStorage.setItem(`altipay_escrows_${address.toLowerCase()}_${activeChainId}`, JSON.stringify(updated))
      } catch (e) {
        console.error('Error persisting order:', e)
      }
      return updated
    })
  }, [address, activeChainId])

  // Read list of user order IDs on-chain
  const {
    data: onChainOrderIds,
    refetch: refetchUserOrders,
    isLoading: isLoadingOrders,
  } = useReadContract({
    address: escrowAddress,
    abi: ALTI_PAY_ESCROW_ABI,
    functionName: 'getUserOrders',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && escrowAddress),
    },
  })

  // Create Escrow Order
  const createEscrowOrder = async ({
    seller,
    amount,
    description,
    secretPin,
    deadlineHours = 72,
  }: {
    seller: `0x${string}`
    amount: string
    description: string
    secretPin: string
    deadlineHours?: number
  }) => {
    if (!address || !escrowAddress || !usdcAddress) {
      toast.error('Billetera no conectada')
      return null
    }

    try {
      setIsSubmitting(true)
      const parsedAmount = parseUnits(amount, 6)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineHours * 3600)

      // Viem encode secret to bytes32, then keccak256
      const secretBytes32 = stringToHex(secretPin, { size: 32 })
      const secretHash = keccak256(secretBytes32)

      toast.info('Creando orden de custodia en billetera...')
      const hash = await writeContractAsync({
        address: escrowAddress,
        abi: ALTI_PAY_ESCROW_ABI,
        functionName: 'createOrder',
        args: [seller, usdcAddress, parsedAmount, secretHash, deadline, description],
      })

      let orderId: `0x${string}` = '0x'
      if (publicClient) {
        toast.loading('Confirmando custodia en blockchain...', { id: 'escrow-create' })
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        toast.dismiss('escrow-create')

        for (const log of receipt.logs) {
          try {
            const event = decodeEventLog({
              abi: ALTI_PAY_ESCROW_ABI,
              data: log.data,
              topics: log.topics,
            })
            if (event.eventName === 'OrderCreated') {
              orderId = (event.args as any).orderId
              break
            }
          } catch {
            // not OrderCreated event
          }
        }
      }

      handleTxSuccess('¡Depósito en custodia creado exitosamente!', hash, activeChainId, true)

      // Fallback display ID
      const displayId = orderId && orderId !== '0x' ? `ALT-${orderId.slice(2, 6).toUpperCase()}` : `ALT-${Date.now().toString().slice(-4)}`

      const newOrder: EscrowOrderItem = {
        id: displayId,
        orderId: orderId !== '0x' ? orderId : (hash as `0x${string}`),
        buyer: address,
        seller,
        amount: parsedAmount.toString(),
        formattedAmount: `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        description,
        trackingInfo: '',
        status: 'FUNDED',
        statusLabel: 'Pago asegurado',
        tone: 'green',
        progress: 33,
        date: 'Creado hoy',
        deadline: Number(deadline),
        isBuyer: true,
        isSeller: false,
        secretPin,
      }

      saveLocalOrder(newOrder)
      await refetchUserOrders()
      return newOrder
    } catch (error: any) {
      toast.dismiss('escrow-create')
      handleTxError(error, 'Error al crear la orden de custodia')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirm Dispatch (Seller action)
  const confirmDispatch = async (orderId: `0x${string}`, trackingInfo: string) => {
    if (!address || !escrowAddress) {
      toast.error('Billetera no conectada')
      return false
    }

    try {
      setIsSubmitting(true)
      toast.info('Registrando despacho en la blockchain...')

      const hash = await writeContractAsync({
        address: escrowAddress,
        abi: ALTI_PAY_ESCROW_ABI,
        functionName: 'confirmDispatch',
        args: [orderId, trackingInfo],
      })

      if (publicClient) {
        toast.loading('Confirmando guía de despacho...', { id: 'escrow-dispatch' })
        await publicClient.waitForTransactionReceipt({ hash })
        toast.dismiss('escrow-dispatch')
      }

      handleTxSuccess('¡Guía de flota registrada en blockchain!', hash, activeChainId)

      // Update local cache
      const updated = localOrders.map((ord) => {
        if (ord.orderId.toLowerCase() === orderId.toLowerCase()) {
          return {
            ...ord,
            status: 'DISPATCHED' as OrderStatusType,
            statusLabel: 'En tránsito',
            tone: 'blue' as const,
            progress: 66,
            trackingInfo,
          }
        }
        return ord
      })
      setLocalOrders(updated)
      try {
        localStorage.setItem(`altipay_escrows_${address.toLowerCase()}_${activeChainId}`, JSON.stringify(updated))
      } catch (e) {}

      await refetchUserOrders()
      return true
    } catch (error: any) {
      toast.dismiss('escrow-dispatch')
      handleTxError(error, 'Error al registrar el despacho')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirm Delivery with Secret PIN (Buyer action)
  const confirmDeliveryWithSecret = async (orderId: `0x${string}`, secretPin: string) => {
    if (!address || !escrowAddress) {
      toast.error('Billetera no conectada')
      return false
    }

    try {
      setIsSubmitting(true)
      const secretBytes32 = stringToHex(secretPin, { size: 32 })
      toast.info('Verificando PIN y liberando fondos...')

      const hash = await writeContractAsync({
        address: escrowAddress,
        abi: ALTI_PAY_ESCROW_ABI,
        functionName: 'confirmDeliveryWithSecret',
        args: [orderId, secretBytes32],
      })

      if (publicClient) {
        toast.loading('Liberando fondos al vendedor...', { id: 'escrow-release' })
        await publicClient.waitForTransactionReceipt({ hash })
        toast.dismiss('escrow-release')
      }

      handleTxSuccess('¡Fondos liberados con éxito al vendedor!', hash, activeChainId, true)

      // Update local state
      const updated = localOrders.map((ord) => {
        if (ord.orderId.toLowerCase() === orderId.toLowerCase()) {
          return {
            ...ord,
            status: 'COMPLETED' as OrderStatusType,
            statusLabel: 'Completado',
            tone: 'emerald' as const,
            progress: 100,
          }
        }
        return ord
      })
      setLocalOrders(updated)
      try {
        localStorage.setItem(`altipay_escrows_${address.toLowerCase()}_${activeChainId}`, JSON.stringify(updated))
      } catch (e) {}

      await refetchUserOrders()
      return true
    } catch (error: any) {
      toast.dismiss('escrow-release')
      handleTxError(error, 'PIN inválido o error al liberar fondos')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Claim Refund
  const claimRefund = async (orderId: `0x${string}`) => {
    if (!address || !escrowAddress) {
      toast.error('Billetera no conectada')
      return false
    }

    try {
      setIsSubmitting(true)
      toast.info('Reclamando reembolso...')

      const hash = await writeContractAsync({
        address: escrowAddress,
        abi: ALTI_PAY_ESCROW_ABI,
        functionName: 'claimRefund',
        args: [orderId],
      })

      if (publicClient) {
        toast.loading('Procesando reembolso en la blockchain...', { id: 'escrow-refund' })
        await publicClient.waitForTransactionReceipt({ hash })
        toast.dismiss('escrow-refund')
      }

      handleTxSuccess('¡Reembolso completado exitosamente!', hash, activeChainId)
      await refetchUserOrders()
      return true
    } catch (error: any) {
      toast.dismiss('escrow-refund')
      handleTxError(error, 'No se pudo reclamar el reembolso')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    escrowAddress,
    activeChainId,
    orders: localOrders,
    onChainOrderIds,
    isLoadingOrders,
    isSubmitting,
    createEscrowOrder,
    confirmDispatch,
    confirmDeliveryWithSecret,
    claimRefund,
    refetchUserOrders,
  }
}
