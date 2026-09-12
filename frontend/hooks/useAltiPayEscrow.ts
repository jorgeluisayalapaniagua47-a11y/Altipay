"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { keccak256, encodePacked, stringToHex, parseUnits, parseEventLogs, TransactionReceipt } from "viem";
import { getEscrowContractConfig, getUSDCContractAddress } from "@/contracts";

export enum OrderStatus {
  NONE = 0,
  FUNDED = 1,
  DISPATCHED = 2,
  COMPLETED = 3,
  REFUNDED = 4,
  CANCELLED = 5,
}

export interface OrderDetails {
  buyer: `0x${string}`;
  seller: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  secretHash: `0x${string}`;
  deadline: bigint;
  status: OrderStatus;
  description: string;
  trackingInfo: string;
  createdAt: bigint;
  completedAt: bigint;
}

/**
 * Hook para la gestión integral y transaccional del Smart Contract AltiPayEscrow
 * Incluye confirmación en bloque (waitForReceipt), extracción de orderId y control de minado
 */
export function useAltiPayEscrow() {
  const { chainId, address } = useAccount();
  const publicClient = usePublicClient();
  const escrowConfig = getEscrowContractConfig(chainId);
  const defaultToken = getUSDCContractAddress(chainId);

  const [isWaitingTx, setIsWaitingTx] = useState<boolean>(false);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);

  const {
    writeContractAsync,
    isPending: isSubmitting,
    error: writeError,
  } = useWriteContract();

  /**
   * Espera la confirmación en bloque de una transacción y retorna el recibo
   */
  const waitForReceipt = async (hash: `0x${string}`): Promise<TransactionReceipt | null> => {
    if (!publicClient) return null;
    setIsWaitingTx(true);
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setLastReceipt(receipt);
      return receipt;
    } finally {
      setIsWaitingTx(false);
    }
  };

  /**
   * 1. CREAR ORDEN (Comprador)
   * Genera secretHash, envía la TX, espera el bloque y extrae el orderId oficial del evento on-chain
   */
  const createOrder = async ({
    seller,
    amountUSDC,
    secretPin,
    deadlineHours = 48,
    description,
    tokenAddress,
    waitConfirm = true,
  }: {
    seller: `0x${string}`;
    amountUSDC: string;
    secretPin: string;
    deadlineHours?: number;
    description: string;
    tokenAddress?: `0x${string}`;
    waitConfirm?: boolean;
  }): Promise<{
    txHash: `0x${string}`;
    orderId?: `0x${string}`;
    receipt?: TransactionReceipt | null;
    secretPin: string;
    secretHash: `0x${string}`;
  }> => {
    // Cálculo criptográfico idéntico a keccak256(abi.encodePacked(bytes32(_secret)))
    const secretBytes32 = stringToHex(secretPin, { size: 32 });
    const secretHash = keccak256(encodePacked(["bytes32"], [secretBytes32]));

    const amountWei = parseUnits(amountUSDC, 6);
    const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadlineHours * 3600);
    const token = tokenAddress || defaultToken;

    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "createOrder",
      args: [seller, token, amountWei, secretHash, deadlineTimestamp, description],
    });

    setLastTxHash(txHash);

    let receipt: TransactionReceipt | null = null;
    let orderId: `0x${string}` | undefined;

    if (waitConfirm && publicClient) {
      receipt = await waitForReceipt(txHash);

      if (receipt) {
        try {
          const logs = parseEventLogs({
            abi: escrowConfig.abi,
            logs: receipt.logs,
            eventName: "OrderCreated",
          });

          if (logs.length > 0) {
            const firstLog = logs[0] as any;
            if (firstLog?.args?.orderId) {
              orderId = firstLog.args.orderId as `0x${string}`;
            }
          }
        } catch (e) {
          console.warn("No se pudo extraer orderId del log del recibo:", e);
        }
      }
    }

    return { txHash, orderId, receipt, secretPin, secretHash };
  };

  /**
   * 2. CONFIRMAR DESPACHO (Vendedor)
   * Registra el número de guía física de la flota/bus en terminal y espera confirmación
   */
  const confirmDispatch = async ({
    orderId,
    trackingInfo,
    waitConfirm = true,
  }: {
    orderId: `0x${string}`;
    trackingInfo: string;
    waitConfirm?: boolean;
  }): Promise<{
    txHash: `0x${string}`;
    receipt?: TransactionReceipt | null;
  }> => {
    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "confirmDispatch",
      args: [orderId, trackingInfo],
    });

    setLastTxHash(txHash);

    let receipt: TransactionReceipt | null = null;
    if (waitConfirm && publicClient) {
      receipt = await waitForReceipt(txHash);
    }

    return { txHash, receipt };
  };

  /**
   * 3. CONFIRMAR ENTREGA Y LIBERAR PAGO (Comprador en Terminal)
   * Valida el código secreto y transfiere atómicamente el 100% de USDC al vendedor
   */
  const confirmDeliveryWithSecret = async ({
    orderId,
    secretPin,
    waitConfirm = true,
  }: {
    orderId: `0x${string}`;
    secretPin: string;
    waitConfirm?: boolean;
  }): Promise<{
    txHash: `0x${string}`;
    receipt?: TransactionReceipt | null;
  }> => {
    const secretBytes32 = stringToHex(secretPin, { size: 32 });

    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "confirmDeliveryWithSecret",
      args: [orderId, secretBytes32],
    });

    setLastTxHash(txHash);

    let receipt: TransactionReceipt | null = null;
    if (waitConfirm && publicClient) {
      receipt = await waitForReceipt(txHash);
    }

    return { txHash, receipt };
  };

  /**
   * 4. RECLAMAR REEMBOLSO (Comprador)
   * Si expira el plazo límite sin entrega, recupera el 100% de los fondos
   */
  const claimRefund = async (
    orderId: `0x${string}`,
    waitConfirm = true
  ): Promise<{
    txHash: `0x${string}`;
    receipt?: TransactionReceipt | null;
  }> => {
    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "claimRefund",
      args: [orderId],
    });

    setLastTxHash(txHash);

    let receipt: TransactionReceipt | null = null;
    if (waitConfirm && publicClient) {
      receipt = await waitForReceipt(txHash);
    }

    return { txHash, receipt };
  };

  /**
   * 5. CANCELAR ORDEN (Comprador)
   * Cancela la orden antes de que el vendedor la despache
   */
  const cancelOrder = async (
    orderId: `0x${string}`,
    waitConfirm = true
  ): Promise<{
    txHash: `0x${string}`;
    receipt?: TransactionReceipt | null;
  }> => {
    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "cancelOrder",
      args: [orderId],
    });

    setLastTxHash(txHash);

    let receipt: TransactionReceipt | null = null;
    if (waitConfirm && publicClient) {
      receipt = await waitForReceipt(txHash);
    }

    return { txHash, receipt };
  };

  return {
    escrowAddress: escrowConfig.address,
    createOrder,
    confirmDispatch,
    confirmDeliveryWithSecret,
    claimRefund,
    cancelOrder,
    waitForReceipt,
    isSubmitting,
    isWaitingTx,
    isMining: isWaitingTx,
    lastTxHash,
    lastReceipt,
    writeError,
  };
}

/**
 * Hook de lectura para consultar los datos de una orden específica
 */
export function useGetOrder(orderId?: `0x${string}`) {
  const { chainId } = useAccount();
  const escrowConfig = getEscrowContractConfig(chainId);

  return useReadContract({
    address: escrowConfig.address,
    abi: escrowConfig.abi,
    functionName: "getOrder",
    args: orderId ? [orderId] : undefined,
    query: {
      enabled: Boolean(orderId && orderId !== "0x0000000000000000000000000000000000000000"),
    },
  });
}

/**
 * Hook de lectura para obtener todos los IDs de órdenes de un usuario
 */
export function useGetUserOrders(userAddress?: `0x${string}`) {
  const { chainId, address } = useAccount();
  const escrowConfig = getEscrowContractConfig(chainId);
  const targetAddress = userAddress || address;

  return useReadContract({
    address: escrowConfig.address,
    abi: escrowConfig.abi,
    functionName: "getUserOrders",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: Boolean(targetAddress),
    },
  });
}
