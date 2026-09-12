"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { UnlockVIPBadge } from "@/components/bounties/UnlockVIPBadge";
import { PollarCheckoutButton } from "@/components/bounties/PollarCheckoutButton";
import { useAltiPayEscrow } from "@/hooks/useAltiPayEscrow";
import { useUSDC } from "@/hooks/useUSDC";
import { useUnlockVIP } from "@/hooks/useUnlockVIP";
import { executeTransaction } from "@/services/transactionHandler";
import { toast } from "sonner";
import {
  Package,
  ShieldCheck,
  Zap,
  Sparkles,
  Coins,
  KeyRound,
  RefreshCw,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";

export default function CreateOrderPage() {
  const router = useRouter();
  const { isConnected, chainId } = useAccount();
  const { balance, claimFaucet, isApproving, approveEscrow, hasSufficientAllowance } = useUSDC();
  const { isVIP, calculateFee } = useUnlockVIP();
  const { createOrder, isSubmitting } = useAltiPayEscrow();

  // Estados del Formulario
  const [fundingMethod, setFundingMethod] = useState<"escrow" | "pollar">("escrow");
  const [sellerAddress, setSellerAddress] = useState<string>("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [amountUSDC, setAmountUSDC] = useState<string>("150");
  const [secretPin, setSecretPin] = useState<string>("ALTI-8492");
  const [description, setDescription] = useState<string>("Encomienda repuestos - Terminal La Paz a Cochabamba");
  const [copiedPin, setCopiedPin] = useState(false);

  // Desglose dinámico de comisiones
  const feeDetails = useMemo(() => calculateFee(amountUSDC), [amountUSDC, isVIP, calculateFee]);

  // Generador de PIN aleatorio de 6 dígitos
  const generateRandomPin = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const pin = `ALTI-${randomNum.toString().slice(-4)}`;
    setSecretPin(pin);
    toast.info(`Nuevo PIN generado: ${pin}`);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(secretPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
    toast.success("PIN secreto copiado al portapapeles");
  };

  // Guardar orden en almacenamiento compartido
  const saveOrderOffline = (orderData: any) => {
    try {
      const stored = localStorage.getItem("altipay_escrows");
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(orderData);
      localStorage.setItem("altipay_escrows", JSON.stringify(list));
    } catch (e) {
      console.error("Error guardando orden:", e);
    }
  };

  // 1. Manejador de Faucet
  const handleClaimFaucet = async () => {
    await executeTransaction(
      async () => {
        return await claimFaucet("500");
      },
      {
        loadingMessage: "Acreditando 500 MockUSDC de prueba en tu wallet...",
        successMessage: "¡500 USDC acreditados exitosamente!",
        chainId,
      }
    );
  };

  // 2. Manejador de Creación de Orden On-Chain
  const handleCreateOrder = async () => {
    if (!sellerAddress.startsWith("0x") || sellerAddress.length !== 42) {
      toast.error("Ingresa una dirección de wallet de vendedor válida");
      return;
    }

    await executeTransaction(
      async () => {
        if (!hasSufficientAllowance(amountUSDC)) {
          toast.loading("Aprobando transferencia de USDC para el contrato Escrow...");
          await approveEscrow(amountUSDC);
        }

        const result = await createOrder({
          seller: sellerAddress as `0x${string}`,
          amountUSDC,
          secretPin,
          description,
          deadlineHours: 48,
        });

        const orderIdentifier = result.orderId || (result.txHash ? `ALT-${result.txHash.slice(2, 6).toUpperCase()}` : "ALT-NEW");

        saveOrderOffline({
          id: orderIdentifier,
          orderId: result.orderId || result.txHash,
          title: description,
          counterparty: `${sellerAddress.slice(0, 6)}...${sellerAddress.slice(-4)}`,
          seller: sellerAddress,
          role: "Comprador",
          amount: Number(amountUSDC).toLocaleString("en-US", { minimumFractionDigits: 2 }),
          status: "Depósito Garantizado",
          tone: "green",
          progress: 25,
          secretPin,
          date: "Creado hoy · Esperando despacho de flota",
          initials: "BO",
        });

        // Redirigir a la vista de seguimiento
        if (result.orderId) {
          router.push(`/order/${result.orderId}`);
        } else if (result.txHash) {
          router.push(`/order/${result.txHash}`);
        }

        return result;
      },
      {
        loadingMessage: "Registrando orden y bloqueando fondos en AltiPayEscrow...",
        successMessage: `¡Orden creada y fondeada exitosamente! PIN: ${secretPin}`,
        chainId,
      }
    );
  };

  // 3. Manejador de Pollar Checkout
  const handlePollarSuccess = (data: any) => {
    saveOrderOffline({
      id: `POL-${data.orderId.slice(2, 6).toUpperCase()}`,
      orderId: data.orderId,
      title: data.description,
      counterparty: `${data.sellerAddress.slice(0, 6)}...${data.sellerAddress.slice(-4)}`,
      seller: data.sellerAddress,
      role: "Comprador",
      amount: Number(data.amountUSDC).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      status: "Depósito Garantizado (Pollar Mainnet)",
      tone: "green",
      progress: 30,
      secretPin,
      date: "Fondeado en Mainnet con Pollar SDK",
      initials: "PL",
    });

    router.push(`/order/${data.orderId}`);
  };

  return (
    <div className="min-h-screen bg-surface-darker text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-400" />
            Crear Nueva Custodia de Encomienda
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Garantiza el pago de mercadería interdepartamental de forma neutral hasta verificar el arribo en la terminal de destino.
          </p>
        </div>

        {/* Insignia de Unlock Protocol */}
        <UnlockVIPBadge />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario Principal (2 columnas) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-card border border-surface-border space-y-5">
            {/* Selector de Método de Fondeo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Selecciona la Red y Motor de Fondeo
              </label>
              <div className="p-1 rounded-xl bg-surface-darker border border-surface-border flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFundingMethod("escrow")}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    fundingMethod === "escrow"
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>AltiPay Escrow (Testnet)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFundingMethod("pollar")}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    fundingMethod === "pollar"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Pollar Checkout (Mainnet)</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wallet del Vendedor (Mayorista en La Paz / Cochabamba)
                </label>
                <input
                  type="text"
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder="0x..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Monto de la Mercadería (USDC)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Saldo: <strong className="text-white">{balance}</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    value={amountUSDC}
                    onChange={(e) => setAmountUSDC(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-sm text-white focus:outline-none focus:border-brand-500 font-bold"
                    placeholder="150"
                  />
                  {isConnected && (
                    <button
                      type="button"
                      onClick={handleClaimFaucet}
                      className="mt-1.5 text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                    >
                      <Coins className="w-3 h-3" />
                      <span>Solicitar +500 USDC de prueba (Faucet)</span>
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Código Secreto (PIN de Retiro)
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generar otro</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={secretPin}
                      onChange={(e) => setSecretPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-brand-500 text-center"
                      placeholder="ALTI-8492"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPin}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg"
                      title="Copiar PIN"
                    >
                      {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Guarda este PIN. Solo compártelo al chofer al recibir la carga.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción del Pedido y Ruta Terrestre
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500"
                  placeholder="Ej. Repuestos de camión - Terminal La Paz a Cochabamba"
                />
              </div>

              {/* Desglose dinámico de comisiones */}
              <div className="p-4 rounded-xl bg-surface-darker border border-surface-border space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Monto de mercadería:</span>
                  <span className="font-semibold text-white">{feeDetails.subtotal.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span>Comisión de custodia ({feeDetails.feePercent}%):</span>
                    {isVIP && (
                      <span className="text-[10px] font-extrabold text-amber-300 px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/30">
                        UNLOCK VIP 0%
                      </span>
                    )}
                  </span>
                  <span className={isVIP ? "text-emerald-400 font-bold" : "text-white font-medium"}>
                    {isVIP ? "0.00 USDC (Exento)" : `${feeDetails.feeAmount.toFixed(2)} USDC`}
                  </span>
                </div>
                {isVIP && (
                  <div className="flex justify-between text-emerald-400 text-[11px] font-semibold border-t border-surface-border/50 pt-2">
                    <span>Ahorro obtenido con Unlock VIP:</span>
                    <span>+ {(feeDetails.subtotal * 0.005).toFixed(2)} USDC</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm border-t border-surface-border pt-2.5">
                  <span>Total a depositar en custodia:</span>
                  <span className="text-brand-300 font-black">{feeDetails.total.toFixed(2)} USDC</span>
                </div>
              </div>

              {fundingMethod === "escrow" ? (
                <Button
                  onClick={handleCreateOrder}
                  isLoading={isSubmitting || isApproving}
                  disabled={!isConnected}
                  className="w-full"
                  size="lg"
                  variant="gradient"
                >
                  {isApproving
                    ? "Aprobando USDC en tu wallet..."
                    : isSubmitting
                    ? "Bloqueando fondos en contrato..."
                    : `Bloquear y Custodiar ${feeDetails.total.toFixed(2)} USDC`}
                </Button>
              ) : (
                <PollarCheckoutButton
                  amountUSDC={amountUSDC}
                  sellerAddress={sellerAddress}
                  secretPin={secretPin}
                  description={description}
                  onSuccess={handlePollarSuccess}
                />
              )}
            </div>
          </div>

          {/* Columna Derecha: Explicación de Seguridad y Bounties */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3.5 text-xs text-slate-300">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Protocolo Anti-Fraude AltiPay
              </h3>
              <p className="leading-relaxed">
                1. <strong>Custodia Imparcial:</strong> Tus fondos quedan retenidos on-chain en el contrato neutral. Nadie puede retirarlos unilateralmente.
              </p>
              <p className="leading-relaxed">
                2. <strong>Despacho en Flota:</strong> El vendedor despacha el paquete en la terminal de buses y registra la guía de transporte en el sistema.
              </p>
              <p className="leading-relaxed">
                3. <strong>Liberación con PIN:</strong> Al recibir y revisar el bulto en destino, proporcionas el PIN <strong className="text-amber-300">{secretPin}</strong> para liberar el 100% de los fondos.
              </p>
              <p className="leading-relaxed">
                4. <strong>Protección por Plazo:</strong> Si la encomienda no llega en 48 horas sin despacho, tienes derecho a reclamar tu reembolso total.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
