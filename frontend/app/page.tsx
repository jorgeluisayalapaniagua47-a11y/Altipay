"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { PollarCheckoutButton } from "@/components/bounties/PollarCheckoutButton";
import { useAltiPayEscrow } from "@/hooks/useAltiPayEscrow";
import { useUSDC } from "@/hooks/useUSDC";
import { useUnlockVIP } from "@/hooks/useUnlockVIP";
import { toast } from "sonner";
import {
  Shield,
  Coins,
  ArrowRight,
  Package,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const { balance, claimFaucet, isApproving, approveEscrow, hasSufficientAllowance } = useUSDC();
  const { isVIP, statusText, feePercent } = useUnlockVIP();
  const { createOrder, confirmDispatch, confirmDeliveryWithSecret, isSubmitting } = useAltiPayEscrow();

  // Estados locales para el formulario de prueba
  const [sellerAddress, setSellerAddress] = useState<string>("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [amountUSDC, setAmountUSDC] = useState<string>("50");
  const [secretPin, setSecretPin] = useState<string>("ALTI-8492");
  const [description, setDescription] = useState<string>("Repuestos automotrices La Paz -> Cochabamba");

  // Estados para despacho y entrega
  const [activeOrderId, setActiveOrderId] = useState<string>("");
  const [trackingInfo, setTrackingInfo] = useState<string>("Flota Bolivar #40921");
  const [releasePin, setReleasePin] = useState<string>("ALTI-8492");

  // 1. Manejador de Faucet
  const handleClaimFaucet = async () => {
    try {
      toast.loading("Acreditando 500 MockUSDC de prueba...");
      const tx = await claimFaucet("500");
      toast.dismiss();
      toast.success("¡500 USDC de prueba acreditados exitosamente!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Error al solicitar faucet");
    }
  };

  // 2. Manejador de Creación de Custodia
  const handleCreateOrder = async () => {
    try {
      if (!hasSufficientAllowance(amountUSDC)) {
        toast.loading("Aprobando USDC para el contrato de custodia...");
        await approveEscrow(amountUSDC);
        toast.dismiss();
        toast.success("Aprobación de USDC confirmada");
      }

      toast.loading("Creando orden de custodia en AltiPayEscrow...");
      const result = await createOrder({
        seller: sellerAddress as `0x${string}`,
        amountUSDC,
        secretPin,
        description,
        deadlineHours: 48,
      });

      toast.dismiss();
      toast.success("¡Orden creada y fondeada exitosamente!");
      if (result.txHash) {
        setActiveOrderId(result.txHash);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Error al crear la orden");
    }
  };

  // 3. Manejador de Despacho (Vendedor)
  const handleConfirmDispatch = async () => {
    try {
      if (!activeOrderId) {
        toast.error("Ingresa o genera un Order ID primero");
        return;
      }
      toast.loading("Registrando guía de despacho de flota...");
      await confirmDispatch({
        orderId: activeOrderId as `0x${string}`,
        trackingInfo,
      });
      toast.dismiss();
      toast.success("¡Despacho confirmado en terminal!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Error al confirmar despacho");
    }
  };

  // 4. Manejador de Liberación con PIN (Comprador)
  const handleReleasePayment = async () => {
    try {
      if (!activeOrderId) {
        toast.error("Ingresa o genera un Order ID primero");
        return;
      }
      toast.loading("Validando PIN criptográfico y liquidando...");
      await confirmDeliveryWithSecret({
        orderId: activeOrderId as `0x${string}`,
        secretPin: releasePin,
      });
      toast.dismiss();
      toast.success("¡Pago del 100% de USDC liberado al vendedor!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Error al liberar el pago");
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              AltiPay Protocol
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Web3 Core
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Custodia comercial y encomiendas para Bolivia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ConnectWalletButton />
        </div>
      </header>

      {/* Panel Superior: Estado de Wallet, Saldo USDC y Membresía VIP */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Saldo USDC + Faucet */}
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Saldo USDC
            </span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {balance} <span className="text-xs font-medium text-slate-400">USDC</span>
            </span>
            {isConnected && (
              <button
                onClick={handleClaimFaucet}
                type="button"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-4"
              >
                + Faucet (500)
              </button>
            )}
          </div>
        </div>

        {/* Membresía Unlock Protocol VIP */}
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Unlock Protocol (Bounty)
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white mb-1">
            {isVIP ? "Membresía VIP Activa" : "Usuario Estándar"}
          </div>
          <p className="text-xs text-slate-400">
            Comisión de Protocolo: <strong className="text-emerald-400">{feePercent}%</strong>
          </p>
        </div>

        {/* Estado de Red */}
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Estado de Red
            </span>
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-sm font-bold text-white mb-1">
            HSK Testnet (133) / Fuji (43113)
          </div>
          <p className="text-xs text-slate-400">
            Smart Contract AltiPayEscrow conectado
          </p>
        </div>
      </section>

      {/* Grid Principal: Fondeo Comprador, Checkout Pollar y Despacho/Liquidación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Flujo Comprador (Fondeo) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-400" />
              1. Crear y Fondear Custodia (Comprador)
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Inmoviliza el pago en el contrato. El vendedor verá el fondo garantizado pero no podrá retirarlo hasta que ingreses el PIN en destino.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Wallet del Vendedor (Mayorista en La Paz)
                </label>
                <input
                  type="text"
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder="0x..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Monto (USDC)
                  </label>
                  <input
                    type="number"
                    value={amountUSDC}
                    onChange={(e) => setAmountUSDC(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-sm text-white focus:outline-none focus:border-brand-500"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Código Secreto (PIN)
                  </label>
                  <input
                    type="text"
                    value={secretPin}
                    onChange={(e) => setSecretPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-sm font-mono text-amber-300 focus:outline-none focus:border-brand-500"
                    placeholder="ALTI-8492"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descripción de la Mercadería
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={isSubmitting || isApproving || !isConnected}
                type="button"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-brand-500/25 transition-all"
              >
                {isApproving
                  ? "Aprobando USDC..."
                  : isSubmitting
                  ? "Bloqueando Fondos en Escrow..."
                  : `Fondear Custodia (${amountUSDC} USDC)`}
              </button>
            </div>
          </div>

          {/* Componente Bounty Pollar */}
          <PollarCheckoutButton
            amountUSDC={amountUSDC}
            description={description}
            onSuccess={(tx) => {
              toast.success(`Fondeo Pollar registrado: ${tx.slice(0, 10)}...`);
            }}
          />
        </div>

        {/* Columna Derecha: Despacho (Vendedor) y Liberación (Comprador) */}
        <div className="space-y-6">
          {/* Despacho del Vendedor */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              2. Despacho en Flota (Vendedor)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Al verificar el badge verde de depósito garantizado, el vendedor entrega el bulto en la terminal y anota el número de guía.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Order ID (Bytes32)
                </label>
                <input
                  type="text"
                  value={activeOrderId}
                  onChange={(e) => setActiveOrderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white font-mono"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Guía de Transporte Terrestre
                </label>
                <input
                  type="text"
                  value={trackingInfo}
                  onChange={(e) => setTrackingInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white"
                />
              </div>

              <button
                onClick={handleConfirmDispatch}
                disabled={isSubmitting || !isConnected}
                type="button"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                Confirmar Despacho en Flota
              </button>
            </div>
          </div>

          {/* Liberación con PIN Secreto en Terminal */}
          <div className="p-6 rounded-2xl bg-surface-card border border-emerald-500/30">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              3. Recepción y Liquidación Atómica (PIN)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              El comprador en la terminal de destino revisa su mercadería e ingresa el código secreto para destrabar el 100% de los fondos.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ingresar Código Secreto (PIN de Retiro)
                </label>
                <input
                  type="text"
                  value={releasePin}
                  onChange={(e) => setReleasePin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-emerald-500/40 text-center text-lg font-mono font-black tracking-widest text-emerald-300 focus:outline-none"
                  placeholder="ALTI-8492"
                />
              </div>

              <button
                onClick={handleReleasePayment}
                disabled={isSubmitting || !isConnected}
                type="button"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-emerald-600/25 transition-all"
              >
                Validar PIN y Liberar Fondos al Vendedor
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
