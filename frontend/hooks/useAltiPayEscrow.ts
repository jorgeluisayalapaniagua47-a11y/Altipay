"use client";

import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { keccak256, encodePacked, stringToHex, parseUnits } from "viem";
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
 * Hook para la gestión de operaciones del Smart Contract AltiPayEscrow
 */
export function useAltiPayEscrow() {
  const { chainId, address } = useAccount();
  const escrowConfig = getEscrowContractConfig(chainId);
  const defaultToken = getUSDCContractAddress(chainId);

  const {
    writeContractAsync,
    isPending: isSubmitting,
    error: writeError,
  } = useWriteContract();

  /**
   * 1. CREAR ORDEN (Comprador)
   * Genera el secretHash criptográfico a partir del PIN/código secreto y envía la TX
   */
  const createOrder = async ({
    seller,
    amountUSDC,
    secretPin,
    deadlineHours = 48,
    description,
    tokenAddress,
  }: {
    seller: `0x${string}`;
    amountUSDC: string; // ej. "150"
    secretPin: string; // ej. "849201" o "ALTI-8492"
    deadlineHours?: number;
    description: string;
    tokenAddress?: `0x${string}`;
  }) => {
    // Cálculo seguro del hash criptográfico keccak256
    // Para coincidir con abi.encodePacked(bytes32(_secret)) en Solidity
    const secretBytes32 = stringToHex(secretPin, { size: 32 });
    const secretHash = keccak256(encodePacked(["bytes32"], [secretBytes32]));

    const amountWei = parseUnits(amountUSDC, 6); // USDC maneja 6 decimales
    const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadlineHours * 3600);
    const token = tokenAddress || defaultToken;

    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "createOrder",
      args: [seller, token, amountWei, secretHash, deadlineTimestamp, description],
    });

    return { txHash, secretPin, secretHash };
  };

  /**
   * 2. CONFIRMAR DESPACHO (Vendedor)
   * Registra el número de guía física de la flota/bus en terminal
   */
  const confirmDispatch = async ({
    orderId,
    trackingInfo,
  }: {
    orderId: `0x${string}`;
    trackingInfo: string; // ej. "Flota Bolívar Guía #40921"
  }) => {
    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "confirmDispatch",
      args: [orderId, trackingInfo],
    });

    return { txHash };
  };

  /**
   * 3. CONFIRMAR ENTREGA Y LIBERAR PAGO (Comprador en Terminal)
   * Valida el código secreto y transfiere atómicamente el 100% de USDC al vendedor
   */
  const confirmDeliveryWithSecret = async ({
    orderId,
    secretPin,
  }: {
    orderId: `0x${string}`;
    secretPin: string;
  }) => {
    const secretBytes32 = stringToHex(secretPin, { size: 32 });

    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "confirmDeliveryWithSecret",
      args: [orderId, secretBytes32],
    });

    return { txHash };
  };

  /**
   * 4. RECLAMAR REEMBOLSO (Comprador)
   * Si expira el plazo límite sin entrega, recupera el 100% de los fondos
   */
  const claimRefund = async (orderId: `0x${string}`) => {
    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "claimRefund",
      args: [orderId],
    });

    return { txHash };
  };

  /**
   * 5. CANCELAR ORDEN (Comprador)
   * Cancela la orden antes de que el vendedor la despache
   */
  const cancelOrder = async (orderId: `0x${string}`) => {
    const txHash = await writeContractAsync({
      address: escrowConfig.address,
      abi: escrowConfig.abi,
      functionName: "cancelOrder",
      args: [orderId],
    });

    return { txHash };
  };

  return {
    escrowAddress: escrowConfig.address,
    createOrder,
    confirmDispatch,
    confirmDeliveryWithSecret,
    claimRefund,
    cancelOrder,
    isSubmitting,
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
      enabled: Boolean(orderId),
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
