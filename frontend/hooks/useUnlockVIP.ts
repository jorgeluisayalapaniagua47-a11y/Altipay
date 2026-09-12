"use client";

import { useAccount, useReadContract } from "wagmi";
import { getEscrowContractConfig } from "@/contracts";

// Interfaz para el Lock de Unlock Protocol
const UNLOCK_LOCK_ABI = [
  {
    inputs: [{ name: "_keyOwner", type: "address" }],
    name: "getHasValidKey",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useUnlockVIP() {
  const { address, chainId } = useAccount();
  const escrowConfig = getEscrowContractConfig(chainId);

  // 1. Obtener la dirección del Lock de Unlock configurada en el Escrow
  const { data: vipLockAddress } = useReadContract({
    address: escrowConfig.address,
    abi: escrowConfig.abi,
    functionName: "vipLock",
  });

  const validLockAddress =
    vipLockAddress && vipLockAddress !== "0x0000000000000000000000000000000000000000"
      ? (vipLockAddress as `0x${string}`)
      : undefined;

  // 2. Comprobar si el usuario posee la llave NFT válida
  const {
    data: hasValidKey,
    isLoading,
    refetch,
  } = useReadContract({
    address: validLockAddress,
    abi: UNLOCK_LOCK_ABI,
    functionName: "getHasValidKey",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(validLockAddress && address),
    },
  });

  const isVIP = Boolean(hasValidKey);
  const feePercent = isVIP ? 0.0 : 0.5; // 0% con NFT VIP, 0.5% tarifa estándar

  return {
    isVIP,
    feePercent,
    feeBasisPoints: isVIP ? 0 : 50,
    vipLockAddress: validLockAddress,
    statusText: isVIP
      ? "🌟 Membresía AltiPay VIP Activa (0% Comisiones)"
      : "Tarifa Estándar: 0.5% (Obtén la VIP Key para 0% fee)",
    isLoading,
    refetchVIPStatus: refetch,
  };
}
