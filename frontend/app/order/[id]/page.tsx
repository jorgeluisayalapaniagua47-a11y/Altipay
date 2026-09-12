"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAltiPayEscrow, useGetOrder, OrderStatus } from "@/hooks/useAltiPayEscrow";
import { executeTransaction } from "@/services/transactionHandler";
import { toast } from "sonner";
import {
  Truck,
  ShieldCheck,
  Package,
  KeyRound,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  Share2,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "";
  const { isConnected, chainId, address } = useAccount();
  const { confirmDeliveryWithSecret, claimRefund, isSubmitting } = useAltiPayEscrow();

  // Consulta on-chain al contrato Escrow
  const isHexOrderId = orderId.startsWith("0x") && orderId.length === 66;
  const { data: onChainOrder, isLoading: isChainLoading, refetch } = useGetOrder(
    isHexOrderId ? (orderId as `0x${string}`) : undefined
  );

  // Datos locales de la orden
  const [localOrder, setLocalOrder] = useState<any | null>(null);
  const [releasePin, setReleasePin] = useState("ALTI-8492");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("altipay_escrows");
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((o: any) => o.id === orderId || o.orderId === orderId);
        if (match) {
          setLocalOrder(match);
          if (match.secretPin) {
            setReleasePin(match.secretPin);
          }
        }
      }
    } catch {}
  }, [orderId]);

  // Si hay datos on-chain, tienen prioridad
  const chainData = onChainOrder as any;
  const orderTitle = chainData?.description || localOrder?.title || "Encomienda comercial";
  const orderAmount = chainData?.amount
    ? (Number(chainData.amount) / 1e6).toFixed(2)
    : localOrder?.amount || "150.00";
  const trackingInfo = chainData?.trackingInfo || localOrder?.trackingInfo || "Flota Bolívar #40921";
  const statusNumber = chainData ? Number(chainData.status) : localOrder?.status?.includes("tránsito") ? 2 : 1;

  // Manejo de compartir link por WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📦 Seguimiento de Encomienda AltiPay\nOrden: ${orderId}\nMercadería: ${orderTitle}\nTracking: ${trackingInfo}\nVer estado: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Enlace de seguimiento copiado");
  };

  // Manejador de confirmación de entrega y destrabe con PIN
  const handleReleasePayment = async () => {
    await executeTransaction(
      async () => {
        const orderIdHex = orderId.startsWith("0x")
          ? (orderId as `0x${string}`)
          : (`0x${orderId.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`);

        const result = await confirmDeliveryWithSecret({
          orderId: orderIdHex,
          secretPin: releasePin,
        });

        // Actualizar estado local
        if (localOrder) {
          try {
            const stored = localStorage.getItem("altipay_escrows");
            if (stored) {
              const list = JSON.parse(stored);
              const updated = list.map((o: any) =>
                o.id === orderId || o.orderId === orderId
                  ? { ...o, status: "Completado & Liquidado", tone: "green", progress: 100 }
                  : o
              );
              localStorage.setItem("altipay_escrows", JSON.stringify(updated));
            }
          } catch {}
        }

        refetch();
        return result;
      },
      {
        loadingMessage: "Verificando PIN secreto Keccak256 y liquidando fondos...",
        successMessage: "¡Pago del 100% liberado exitosamente al vendedor!",
        chainId,
      }
    );
  };

  // Stepper de 4 fases
  const steps = [
    { title: "Custodia Fondeada", desc: "Pago bloqueado en contrato", done: statusNumber >= 1 },
    { title: "Despacho en Flota", desc: trackingInfo, done: statusNumber >= 2 },
    { title: "Arribo a Terminal", desc: "Listo para inspección física", done: statusNumber >= 2 },
    { title: "Liquidado al Vendedor", desc: "Fondos liberados con PIN", done: statusNumber === 3 },
  ];

  return (
    <div className="min-h-screen bg-surface-darker text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Navegación y Encabezado */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{orderTitle}</h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-brand-300">
                  {orderId.slice(0, 12)}...
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Trazabilidad física y custodia garantizada en tiempo real
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-card border border-surface-border text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de la Orden */}
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <span className="text-xs text-slate-400">Monto Asegurado:</span>
            <div className="text-2xl font-black text-white mt-1">
              ${orderAmount} <span className="text-xs font-normal text-slate-400">USDC</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">100% Irrevocable</span>
          </div>

          <div>
            <span className="text-xs text-slate-400">Guía de Transporte:</span>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-400" />
              <span>{trackingInfo}</span>
            </div>
            <span className="text-[11px] text-slate-400">Ruta Interdepartamental</span>
          </div>

          <div>
            <span className="text-xs text-slate-400">Estado de Custodia:</span>
            <div className="text-sm font-bold text-emerald-300 mt-1">
              {statusNumber === 3
                ? "Liquidado y Entregado"
                : statusNumber === 2
                ? "En Tránsito Terrestre"
                : "Custodia Fondeada"}
            </div>
            <span className="text-[11px] text-slate-400">
              {statusNumber === 3 ? "Transacción finalizada" : "Esperando entrega en terminal"}
            </span>
          </div>
        </div>

        {/* Timeline / Stepper de 4 Fases */}
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
          <h3 className="text-sm font-bold text-white">Línea de Tiempo de la Encomienda</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                  step.done
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-surface-darker border-surface-border text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black">FASE 0{idx + 1}</span>
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{step.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Liberación con PIN Secreto (Para el Comprador) */}
        {statusNumber !== 3 && (
          <div className="p-6 rounded-2xl bg-gradient-to-b from-surface-card to-surface-darker border border-emerald-500/40 shadow-xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Liberar Pago al Vendedor con tu PIN
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Una vez que revises la encomienda en la terminal de buses, introduce el código secreto para liberar los ${orderAmount} USDC al transportista/vendedor.
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-center">
                  PIN de Retiro Criptográfico
                </label>
                <input
                  type="text"
                  value={releasePin}
                  onChange={(e) => setReleasePin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-darker border border-emerald-500/40 text-center text-2xl font-mono font-black tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-400"
                  placeholder="ALTI-8492"
                />
              </div>

              <Button
                variant="emerald"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                disabled={!isConnected}
                onClick={handleReleasePayment}
              >
                Validar PIN y Destrabar Fondos
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
