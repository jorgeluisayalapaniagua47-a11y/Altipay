"use client";

import { useState, useEffect } from "react";
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

export interface FeeCalculation {
  subtotal: number;
  feePercent: number;
  feeAmount: number;
  total: number;
  savings: number;
  isVIP: boolean;
}

export function useUnlockVIP() {
  const { address, chainId } = useAccount();
  const escrowConfig = getEscrowContractConfig(chainId);

  // Estado para simulación interactiva en hackathons / demos
  const [isSimulatedVIP, setIsSimulatedVIP] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("altipay_simulated_vip");
      if (saved === "true") {
        setIsSimulatedVIP(true);
      }
    } catch {
      // Ignorar errores de acceso a localStorage en SSR
    }
  }, []);

  const toggleSimulatedVIP = () => {
    setIsSimulatedVIP((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("altipay_simulated_vip", String(next));
      } catch {}
      return next;
    });
  };

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

  // 2. Comprobar si el usuario posee la llave NFT válida en la blockchain
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

  // Es VIP si tiene la llave on-chain O si activó la simulación para demo
  const isVIP = Boolean(hasValidKey || isSimulatedVIP);
  const feePercent = isVIP ? 0.0 : 0.5; // 0% con NFT VIP, 0.5% tarifa estándar

  /**
   * Calcula el desglose financiero del cobro con o sin tarifa VIP
   */
  const calculateFee = (amountUSDC: string | number): FeeCalculation => {
    const subtotal = Math.max(0, typeof amountUSDC === "string" ? parseFloat(amountUSDC) || 0 : amountUSDC);
    const standardFee = subtotal * 0.005; // 0.50%
    const actualFee = isVIP ? 0 : standardFee;
    const total = subtotal + actualFee;
    const savings = isVIP ? standardFee : 0;

    return {
      subtotal,
      feePercent,
      feeAmount: actualFee,
      total,
      savings,
      isVIP,
    };
  };

  return {
    isVIP,
    isSimulatedVIP,
    toggleSimulatedVIP,
    feePercent,
    feeBasisPoints: isVIP ? 0 : 50,
    vipLockAddress: validLockAddress,
    statusText: isVIP
      ? "🌟 Membresía AltiPay VIP Activa (0% Comisiones)"
      : "Tarifa Estándar: 0.5% (Obtén la VIP Key para 0% fee)",
    calculateFee,
    isLoading,
    refetchVIPStatus: refetch,
  };
}
