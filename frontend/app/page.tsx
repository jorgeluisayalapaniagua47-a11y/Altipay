"use client";

import React, { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { PollarCheckoutButton } from "@/components/bounties/PollarCheckoutButton";
import { UnlockVIPBadge } from "@/components/bounties/UnlockVIPBadge";
import { Button } from "@/components/ui/button";
import { useAltiPayEscrow, OrderStatus } from "@/hooks/useAltiPayEscrow";
import { useUSDC } from "@/hooks/useUSDC";
import { useUnlockVIP } from "@/hooks/useUnlockVIP";
import { executeTransaction } from "@/services/transactionHandler";
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
  Zap,
  Truck,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Search,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";

export interface DemoEscrowItem {
  id: string;
  title: string;
  counterparty: string;
  role: "Comprador" | "Vendedor";
  amount: string;
  status: string;
  tone: "green" | "amber" | "blue";
  progress: number;
  date: string;
  initials: string;
}

const initialDemoEscrows: DemoEscrowItem[] = [
  {
    id: "ALT-8924",
    title: "Repuestos camión Volvo FH",
    counterparty: "0x7099...79C8 (Mayorista La Paz)",
    role: "Comprador",
    amount: "1,850.00",
    status: "En tránsito (Flota Bolívar)",
    tone: "blue",
    progress: 68,
    date: "Llegada estimada hoy 18:00",
    initials: "LP",
  },
  {
    id: "ALT-8918",
    title: "10 Cajas Aceite Sintético 15W40",
    counterparty: "0x3C44...291f (Comercial Cochabamba)",
    role: "Vendedor",
    amount: "2,400.00",
    status: "Depósito Garantizado",
    tone: "green",
    progress: 42,
    date: "Esperando despacho en terminal",
    initials: "CB",
  },
  {
    id: "ALT-8891",
    title: "Equipos de Telecomunicación",
    counterparty: "0x90F7...c912 (Distribuidor Santa Cruz)",
    role: "Comprador",
    amount: "680.00",
    status: "Completado & Liquidado",
    tone: "green",
    progress: 100,
    date: "Entregado en Terminal Bimodal",
    initials: "SC",
  },
];

export default function HomePage() {
  const { isConnected, address, chainId } = useAccount();
  const { balance, claimFaucet, isApproving, approveEscrow, hasSufficientAllowance } = useUSDC();
  const { isVIP, feePercent, calculateFee } = useUnlockVIP();
  const { createOrder, confirmDispatch, confirmDeliveryWithSecret, isSubmitting } = useAltiPayEscrow();

  // Pestaña de navegación activa y método de fondeo
  const [activeTab, setActiveTab] = useState<"dashboard" | "create" | "dispatch" | "release">("dashboard");
  const [fundingMethod, setFundingMethod] = useState<"escrow" | "pollar">("escrow");
  const [searchQuery, setSearchQuery] = useState("");

  // Estados locales para el formulario de custodia
  const [sellerAddress, setSellerAddress] = useState<string>("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [amountUSDC, setAmountUSDC] = useState<string>("150");
  const [secretPin, setSecretPin] = useState<string>("ALTI-8492");
  const [description, setDescription] = useState<string>("Encomienda repuestos - Terminal La Paz a Cochabamba");

  // Desglose de comisiones dinámicas Unlock Protocol
  const feeDetails = useMemo(() => calculateFee(amountUSDC), [amountUSDC, isVIP, calculateFee]);

  // Estados para despacho y entrega
  const [activeOrderId, setActiveOrderId] = useState<string>("");
  const [trackingInfo, setTrackingInfo] = useState<string>("Flota Bolivar #40921");
  const [releasePin, setReleasePin] = useState<string>("ALTI-8492");

  // Lista reactiva de órdenes con persistencia
  const [escrows, setEscrows] = useState<DemoEscrowItem[]>(initialDemoEscrows);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("altipay_escrows");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEscrows(parsed);
        }
      }
    } catch {}
  }, []);

  const saveEscrows = (newEscrows: DemoEscrowItem[]) => {
    setEscrows(newEscrows);
    try {
      localStorage.setItem("altipay_escrows", JSON.stringify(newEscrows));
    } catch {}
  };

  const handlePollarSuccess = (data: {
    txHash: string;
    orderId: string;
    amountUSDC: string;
    sellerAddress: string;
    description: string;
  }) => {
    setActiveOrderId(data.orderId);

    const newEscrow: DemoEscrowItem = {
      id: `POL-${data.orderId.slice(2, 6).toUpperCase()}`,
      title: data.description,
      counterparty: `${data.sellerAddress.slice(0, 6)}...${data.sellerAddress.slice(-4)}`,
      role: "Comprador",
      amount: Number(data.amountUSDC).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      status: "Depósito Garantizado (Pollar Mainnet)",
      tone: "green",
      progress: 35,
      date: "Garantía bloqueada en Mainnet",
      initials: "PL",
    };

    saveEscrows([newEscrow, ...escrows]);
    toast.success("¡Garantía comercial Pollar Mainnet fondeada exitosamente!", {
      description: `Orden garantizada: ${data.orderId.slice(0, 10)}...`,
      action: {
        label: "Ver Etherscan",
        onClick: () => window.open(`https://etherscan.io/tx/${data.txHash}`, "_blank"),
      },
    });
  };

  const filteredEscrows = useMemo(() => {
    return escrows.filter((item) =>
      `${item.title} ${item.counterparty} ${item.id} ${item.status}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [escrows, searchQuery]);

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

  // 2. Manejador de Creación de Custodia
  const handleCreateOrder = async () => {
    await executeTransaction(
      async () => {
        if (!hasSufficientAllowance(amountUSDC)) {
          toast.loading("Aprobando transferencia de USDC para el Escrow...");
          await approveEscrow(amountUSDC);
        }

        const result = await createOrder({
          seller: sellerAddress as `0x${string}`,
          amountUSDC,
          secretPin,
          description,
          deadlineHours: 48,
        });

        if (result.orderId) {
          setActiveOrderId(result.orderId);
        } else if (result.txHash) {
          setActiveOrderId(result.txHash);
        }
          // Agregar a la lista de órdenes visual
          const newEscrow: DemoEscrowItem = {
            id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
            title: description,
            counterparty: `${sellerAddress.slice(0, 6)}...${sellerAddress.slice(-4)}`,
            role: "Comprador",
            amount: Number(amountUSDC).toLocaleString("en-US", { minimumFractionDigits: 2 }),
            status: "Depósito Garantizado",
            tone: "green",
            progress: 25,
            date: "Creado hoy · En espera de guía",
            initials: "BO",
          };
          setEscrows([newEscrow, ...escrows]);

        return result;
      },
      {
        loadingMessage: "Registrando orden y bloqueando fondos en AltiPayEscrow...",
        successMessage: `¡Orden creada exitosamente! Guarda tu PIN: ${secretPin}`,
        chainId,
      }
    );
  };

  // 3. Manejador de Despacho (Vendedor)
  const handleConfirmDispatch = async () => {
    if (!activeOrderId) {
      toast.error("Ingresa o genera un Order ID primero");
      return;
    }

    await executeTransaction(
      async () => {
        return await confirmDispatch({
          orderId: activeOrderId as `0x${string}`,
          trackingInfo,
        });
      },
      {
        loadingMessage: "Registrando guía de flota y despacho de encomienda...",
        successMessage: `¡Despacho confirmado! Guía: ${trackingInfo}`,
        chainId,
      }
    );
  };

  // 4. Manejador de Liberación con PIN (Comprador)
  const handleReleasePayment = async () => {
    if (!activeOrderId) {
      toast.error("Ingresa o genera un Order ID primero");
      return;
    }

    await executeTransaction(
      async () => {
        return await confirmDeliveryWithSecret({
          orderId: activeOrderId as `0x${string}`,
          secretPin: releasePin,
        });
      },
      {
        loadingMessage: "Verificando PIN secreto y liquidando el 100% de USDC...",
        successMessage: "¡Fondos liberados exitosamente al vendedor!",
        chainId,
      }
    );
  };

  return (
    <div className="min-h-screen bg-surface-darker text-slate-100 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 bg-surface-dark/95 backdrop-blur-md border-b border-surface-border px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">AltiPay</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  PayFi Bolivia
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Custodia no custodial para comercio interdepartamental
              </p>
            </div>
          </div>

          {/* Menú de pestañas */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-card border border-surface-border p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "create"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Crear Custodia
            </button>
            <button
              onClick={() => setActiveTab("dispatch")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dispatch"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Despacho Flota
            </button>
            <button
              onClick={() => setActiveTab("release")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "release"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Liberar PIN
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Banner Superior de Métricas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Saldo Disponible
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {balance} <span className="text-xs font-normal text-slate-400">USDC</span>
              </span>
              {isConnected && (
                <button
                  onClick={handleClaimFaucet}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-4"
                >
                  + Faucet
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Token de prueba MockUSDC activo
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Custodias Activas
              </span>
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{escrows.length}</div>
            <p className="mt-2 text-[11px] text-slate-400">
              {escrows.filter((e) => e.role === "Comprador").length} compras ·{" "}
              {escrows.filter((e) => e.role === "Vendedor").length} ventas
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tarifa de Protocolo
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {feePercent}%{" "}
              <span className="text-xs font-normal text-slate-400">
                {isVIP ? "(VIP)" : "(Estándar)"}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {isVIP ? "🌟 0% comisiones con Unlock NFT" : "Aplica 0.5% a órdenes"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Seguridad Cripto
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">100% On-Chain</div>
            <p className="mt-2 text-[11px] text-blue-300">
              Liberación atómica por Keccak256
            </p>
          </div>
        </section>

        {/* Notificación de Membresía Unlock VIP */}
        <UnlockVIPBadge />

        {/* Selector de pestañas para móviles */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-2 border-b border-surface-border">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-brand-500 text-white" : "bg-surface-card text-slate-300"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "create" ? "bg-brand-500 text-white" : "bg-surface-card text-slate-300"
            }`}
          >
            Crear Custodia
          </button>
          <button
            onClick={() => setActiveTab("dispatch")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "dispatch" ? "bg-brand-500 text-white" : "bg-surface-card text-slate-300"
            }`}
          >
            Despacho
          </button>
          <button
            onClick={() => setActiveTab("release")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "release" ? "bg-brand-500 text-white" : "bg-surface-card text-slate-300"
            }`}
          >
            Liberar PIN
          </button>
        </div>

        {/* VISTA 1: Dashboard de Órdenes */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Tus Custodias y Encomiendas
                </h2>
                <p className="text-xs text-slate-400">
                  Monitorea el estado de despachos de flotas y liberaciones con PIN
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar encomienda..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <Button
                  onClick={() => setActiveTab("create")}
                  className="whitespace-nowrap"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Custodia
                </Button>
              </div>
            </div>

            {/* Lista de Órdenes */}
            <div className="grid grid-cols-1 gap-3">
              {filteredEscrows.map((escrow) => (
                <div
                  key={escrow.id}
                  className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-brand-500/40 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-brand-300">
                        {escrow.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{escrow.title}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {escrow.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {escrow.role} · {escrow.counterparty}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-sm font-bold text-white">{escrow.amount}</span>
                        <span className="text-[10px] text-slate-400 ml-1">USDC</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          escrow.tone === "green"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : escrow.tone === "blue"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {escrow.status}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span>Progreso de Custodia</span>
                      <span>{escrow.date}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-darker overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${escrow.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {filteredEscrows.length === 0 && (
                <div className="p-10 rounded-2xl bg-surface-card border border-dashed border-surface-border text-center text-sm text-slate-400">
                  No se encontraron encomiendas que coincidan con &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA 2: Formulario de Creación de Custodia */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-400" />
                  Crear y Fondear Custodia Comercial
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Inmoviliza el pago de forma neutral. El comerciante verá el depósito garantizado pero los fondos solo se liberarán cuando ingreses tu PIN al retirar el paquete en la terminal.
                </p>
              </div>

              {/* Selector de Método de Fondeo (Bounties Integration) */}
              <div className="p-1 rounded-xl bg-surface-darker border border-surface-border flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFundingMethod("escrow")}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    fundingMethod === "escrow"
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>AltiPay Escrow (Testnet)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFundingMethod("pollar")}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    fundingMethod === "pollar"
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Pollar Checkout (Mainnet USDC)</span>
                </button>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Monto de la Mercadería (USDC)
                    </label>
                    <input
                      type="number"
                      value={amountUSDC}
                      onChange={(e) => setAmountUSDC(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-sm text-white focus:outline-none focus:border-brand-500 font-bold"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Código Secreto (PIN de Retiro)
                    </label>
                    <input
                      type="text"
                      value={secretPin}
                      onChange={(e) => setSecretPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-brand-500 text-center"
                      placeholder="ALTI-8492"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Descripción del Pedido y Ruta
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="Ej. Repuestos de camión - La Paz a Cochabamba"
                  />
                </div>

                {/* Desglose dinámico de comisiones Unlock Protocol */}
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
                      <span>Ahorro con Membresía Unlock:</span>
                      <span>+ {(feeDetails.subtotal * 0.005).toFixed(2)} USDC</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-sm border-t border-surface-border pt-2.5">
                    <span>Total a congelar en Escrow:</span>
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

            {/* Columna Derecha: Detalles de Bounties y Seguridad */}
            <div className="space-y-6">
              <PollarCheckoutButton
                amountUSDC={amountUSDC}
                sellerAddress={sellerAddress}
                secretPin={secretPin}
                description={description}
                onSuccess={handlePollarSuccess}
              />

              <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3 text-xs text-slate-300">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ¿Cómo protege AltiPay al Comprador?
                </h4>
                <p className="leading-relaxed">
                  1. Tus fondos se congelan de forma no custodial en un contrato auditado o en el motor <strong>Pollar Mainnet</strong>.
                </p>
                <p className="leading-relaxed">
                  2. El transportista y el vendedor ven el depósito garantizado pero no pueden extraer los fondos a menos que entreguen el paquete y tú proporciones el PIN: <strong className="text-amber-300">{secretPin}</strong>.
                </p>
                <p className="leading-relaxed">
                  3. Si la mercadería no llega dentro de las 48 horas de plazo, el contrato te permite reclamar un reembolso total unilateralmente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 3: Despacho en Terminal (Vendedor) */}
        {activeTab === "dispatch" && (
          <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-surface-card border border-surface-border space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                Despacho en Flota (Vendedor)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Al verificar el depósito garantizado, acércate a la flota de encomiendas (Bolívar, Trans Copacabana, El Dorado) y registra el número de guía para que el comprador pueda hacer seguimiento.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Order ID de la Custodia (Hash / Bytes32)
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Guía de Transporte Terrestre
                </label>
                <input
                  type="text"
                  value={trackingInfo}
                  onChange={(e) => setTrackingInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white"
                  placeholder="Ej. Flota Bolívar #40921"
                />
              </div>

              <Button
                onClick={handleConfirmDispatch}
                isLoading={isSubmitting}
                disabled={!isConnected}
                className="w-full"
                variant="primary"
                size="lg"
              >
                Confirmar Despacho en Flota
              </Button>
            </div>
          </div>
        )}

        {/* VISTA 4: Liberación con PIN en Terminal (Comprador) */}
        {activeTab === "release" && (
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-surface-card border border-emerald-500/30 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Recepción y Liquidación con PIN
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ingresa el código secreto entregado al crear la orden. La verificación criptográfica liberará el 100% del pago al vendedor.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Order ID
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
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-center">
                  PIN de Retiro
                </label>
                <input
                  type="text"
                  value={releasePin}
                  onChange={(e) => setReleasePin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-darker border border-emerald-500/40 text-center text-xl font-mono font-black tracking-widest text-emerald-300 focus:outline-none"
                  placeholder="ALTI-8492"
                />
              </div>

              <Button
                onClick={handleReleasePayment}
                isLoading={isSubmitting}
                disabled={!isConnected}
                className="w-full"
                variant="emerald"
                size="lg"
              >
                Validar PIN y Destrabar Fondos al Vendedor
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
