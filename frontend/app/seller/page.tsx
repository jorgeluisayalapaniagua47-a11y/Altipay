"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAltiPayEscrow } from "@/hooks/useAltiPayEscrow";
import { executeTransaction } from "@/services/transactionHandler";
import { toast } from "sonner";
import {
  Truck,
  ShieldCheck,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Upload,
  Search,
  FileText,
  X,
} from "lucide-react";

export default function SellerDashboardPage() {
  const { address, isConnected, chainId } = useAccount();
  const { confirmDispatch, isSubmitting } = useAltiPayEscrow();

  // Estados locales
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [transportCompany, setTransportCompany] = useState("Flota Bolívar");
  const [guiaNumber, setGuiaNumber] = useState("Guía #40921");
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar órdenes guardadas desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("altipay_escrows");
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        // Órdenes demo predefinidas para el vendedor
        setOrders([
          {
            id: "ALT-8918",
            orderId: "0x3c44291f00000000000000000000000000000000000000000000000000008918",
            title: "10 Cajas Aceite Sintético 15W40",
            counterparty: "0x7099...79C8 (Comprador Cochabamba)",
            amount: "2,400.00",
            status: "Depósito Garantizado",
            tone: "green",
            progress: 40,
            date: "Fondeado hoy · Listo para despacho",
            trackingInfo: "",
            initials: "CB",
          },
          {
            id: "ALT-8924",
            orderId: "0x709979c800000000000000000000000000000000000000000000000000008924",
            title: "Repuestos camión Volvo FH",
            counterparty: "0x3C44...291f (Comercial Oruro)",
            amount: "1,850.00",
            status: "En tránsito terrestre",
            tone: "blue",
            progress: 70,
            date: "Despachado en Flota Bolívar",
            trackingInfo: "Flota Bolívar #40921",
            initials: "OR",
          },
        ]);
      }
    } catch {}
  }, []);

  const totalGuaranteed = useMemo(() => {
    return orders
      .filter((o) => o.status.includes("Garantizado") || o.status.includes("tránsito"))
      .reduce((acc, curr) => acc + (parseFloat(curr.amount.replace(/,/g, "")) || 0), 0);
  }, [orders]);

  const openDispatch = (order: any) => {
    setSelectedOrder(order);
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedOrder) return;
    const fullTracking = `${transportCompany} ${guiaNumber}`;

    await executeTransaction(
      async () => {
        const orderIdHex = selectedOrder.orderId?.startsWith("0x")
          ? selectedOrder.orderId
          : `0x${selectedOrder.id.replace(/-/g, "").padEnd(64, "0")}`;

        const result = await confirmDispatch({
          orderId: orderIdHex,
          trackingInfo: fullTracking,
        });

        // Actualizar lista local
        const updated = orders.map((o) => {
          if (o.id === selectedOrder.id || o.orderId === selectedOrder.orderId) {
            return {
              ...o,
              status: "En tránsito terrestre",
              tone: "blue",
              progress: 70,
              trackingInfo: fullTracking,
              date: `Despachado con ${fullTracking}`,
            };
          }
          return o;
        });

        setOrders(updated);
        try {
          localStorage.setItem("altipay_escrows", JSON.stringify(updated));
        } catch {}

        setIsDispatchModalOpen(false);
        return result;
      },
      {
        loadingMessage: "Registrando despacho de guía en AltiPayEscrow...",
        successMessage: `¡Despacho confirmado! Guía: ${fullTracking}`,
        chainId,
      }
    );
  };

  return (
    <div className="min-h-screen bg-surface-darker text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-brand-400" />
              Panel de Despacho del Vendedor (Mayorista)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Verifica los depósitos bloqueados por los compradores antes de entregar tu mercadería en la terminal.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar encomienda..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Tarjeta Destacada Verde: Depósito Bloqueado y Garantizado */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-surface-card to-surface-card border border-emerald-500/40 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-emerald-300">
                    Depósitos Bloqueados y Garantizados
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="text-3xl font-black text-white mt-1">
                  ${totalGuaranteed.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                  <span className="text-sm font-normal text-slate-400">USDC</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 max-w-xl">
                  Fondos inmovilizados en el contrato neutral. Tienes la certeza 100% matemática de que el pago existe y se te transferirá tan pronto el cliente reciba la mercadería en la terminal.
                </p>
              </div>
            </div>

            <div className="bg-surface-darker/80 p-4 rounded-xl border border-surface-border text-xs space-y-1 md:text-right shrink-0">
              <div className="text-slate-400">Total Encomiendas en Custodia:</div>
              <div className="text-xl font-bold text-white">{orders.length} pedidos</div>
              <div className="text-[11px] text-emerald-400">Cero riesgo de incobrabilidad</div>
            </div>
          </div>
        </div>

        {/* Lista de Encomiendas Recibidas */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-400" />
            Pedidos Recibidos para Despacho Terrestre
          </h3>

          <div className="grid grid-cols-1 gap-3.5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-brand-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-emerald-300 shrink-0">
                    {order.initials || "EN"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{order.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Comprador: <span className="text-slate-200">{order.counterparty}</span>
                    </p>
                    {order.trackingInfo && (
                      <p className="text-xs text-blue-300 mt-0.5 font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        <span>{order.trackingInfo}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-surface-border">
                  <div className="text-left md:text-right">
                    <span className="text-sm font-bold text-white">${order.amount}</span>
                    <span className="text-[10px] text-slate-400 ml-1">USDC</span>
                    <div className="text-[10px] text-emerald-400 font-semibold">Garantizado</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status.includes("Garantizado") ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openDispatch(order)}
                        className="whitespace-nowrap"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Despachar en Flota</span>
                      </Button>
                    ) : (
                      <Link
                        href={`/order/${order.orderId || order.id}`}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-darker text-slate-300 hover:text-white border border-surface-border flex items-center gap-1 transition-colors"
                      >
                        <span>Ver Timeline</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal de Despacho de Encomienda */}
      {isDispatchModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-surface-card border border-surface-border shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">
                  Registrar Guía de Despacho de Encomienda
                </h3>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ingresa los datos de la flota donde dejaste la encomienda para que el comprador pueda hacer seguimiento del bulto: <strong>{selectedOrder.title}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Empresa de Transporte Interdepartamental
                </label>
                <select
                  value={transportCompany}
                  onChange={(e) => setTransportCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Flota Bolívar">Flota Bolívar</option>
                  <option value="Trans Copacabana 1 M.E.M.">Trans Copacabana 1 M.E.M.</option>
                  <option value="Flota El Dorado">Flota El Dorado</option>
                  <option value="Trans Azul">Trans Azul</option>
                  <option value="Flota Cosmos">Flota Cosmos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número de Guía Física / Factura de Transporte
                </label>
                <input
                  type="text"
                  value={guiaNumber}
                  onChange={(e) => setGuiaNumber(e.target.value)}
                  placeholder="Ej. Guía #40921"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-darker border border-surface-border text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Subida Simulada de Guía */}
              <div className="p-4 rounded-xl bg-surface-darker border border-dashed border-surface-border text-center space-y-2">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-300 font-medium">
                  Foto de la Guía de Despacho de la Flota (Opcional)
                </div>
                <div className="text-[10px] text-slate-500">
                  PNG, JPG hasta 5MB. Permite al comprador constatar la etiqueta física.
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDispatchModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  isLoading={isSubmitting}
                  onClick={handleConfirmDispatch}
                >
                  Confirmar Despacho On-Chain
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
