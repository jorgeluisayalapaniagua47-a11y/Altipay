"use client";

import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ERC20_ABI, getUSDCContractAddress, getEscrowContractConfig } from "@/contracts";

/**
 * Hook para interactuar con el token USDC (balance, allowance, approve y faucet)
 * Incluye confirmación en bloque para actualización precisa de balances
 */
export function useUSDC() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const usdcAddress = getUSDCContractAddress(chainId);
  const escrowConfig = getEscrowContractConfig(chainId);

  const { writeContractAsync, isPending: isApproving } = useWriteContract();

  // 1. Balance de USDC del usuario
  const {
    data: rawBalance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  // 2. Allowance permitido al contrato AltiPayEscrow
  const {
    data: rawAllowance,
    refetch: refetchAllowance,
    isLoading: isAllowanceLoading,
  } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, escrowConfig.address] : undefined,
    query: {
      enabled: Boolean(address && escrowConfig.address),
    },
  });

  // Formatear balances a string legible (USDC tiene 6 decimales)
  const balance = rawBalance ? formatUnits(rawBalance, 6) : "0";
  const allowance = rawAllowance ? formatUnits(rawAllowance, 6) : "0";

  /**
   * Aprobar USDC para que el contrato Escrow pueda custodiar los fondos
   */
  const approveEscrow = async (amountUSDC: string) => {
    const amountWei = parseUnits(amountUSDC, 6);
    const txHash = await writeContractAsync({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [escrowConfig.address, amountWei],
    });

    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: txHash });
    }

    await refetchAllowance();
    return txHash;
  };

  /**
   * Solicitar fondos de prueba en MockUSDC (faucet de 500 USDC)
   */
  const claimFaucet = async (amountUSDC = "500") => {
    if (!address) throw new Error("Wallet no conectada");
    const amountWei = parseUnits(amountUSDC, 6);

    const txHash = await writeContractAsync({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "faucet",
      args: [address, amountWei],
    });

    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: txHash });
    }

    await refetchBalance();
    return txHash;
  };

  /**
   * Verifica si el usuario tiene suficiente allowance para el monto
   */
  const hasSufficientAllowance = (amountUSDC: string) => {
    try {
      const required = parseUnits(amountUSDC || "0", 6);
      return (rawAllowance || BigInt(0)) >= required;
    } catch {
      return false;
    }
  };

  return {
    usdcAddress,
    balance,
    rawBalance,
    allowance,
    rawAllowance,
    isBalanceLoading,
    isAllowanceLoading,
    isApproving,
    approveEscrow,
    claimFaucet,
    hasSufficientAllowance,
    refetchBalance,
    refetchAllowance,
  };
}
