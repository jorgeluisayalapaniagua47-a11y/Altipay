'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Check, Copy, ExternalLink, KeyRound, Share2, ShieldCheck, Truck, Zap } from 'lucide-react'
import { ConnectWalletButton } from '@/components/web3/ConnectWalletButton'
import { useAltiPayEscrow } from '@/hooks/useAltiPayEscrow'
import { toast } from 'sonner'

export default function OrderDetailPage() {
  const params = useParams()
  const orderIdParam = (params?.id as string) || ''
  const { orders, confirmDeliveryWithSecret, isSubmitting } = useAltiPayEscrow()

  const [inputPin, setInputPin] = useState('')

  // Find order in local cache or fallback demo
  const order = orders.find(
    (o) => o.id.toLowerCase() === orderIdParam.toLowerCase() || o.orderId.toLowerCase() === orderIdParam.toLowerCase()
  ) || {
    id: orderIdParam.startsWith('ALT') ? orderIdParam : 'ALT-8924',
    orderId: '0x8924000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
    buyer: '0x1111111111111111111111111111111111111111' as `0x${string}`,
    seller: '0x2222222222222222222222222222222222222222' as `0x${string}`,
    amount: '1850000000',
    formattedAmount: '$1,850.00',
    description: 'MacBook Pro M3 — Encomienda interdepartamental',
    trackingInfo: 'Flota Bolívar #40921',
    status: 'DISPATCHED',
    statusLabel: 'En tránsito',
    tone: 'blue' as const,
    progress: 68,
    date: 'Despachado hoy',
    deadline: Math.floor(Date.now() / 1000) + 86400 * 3,
    isBuyer: true,
    isSeller: false,
    secretPin: '4092',
  }

  const handleShareWhatsApp = () => {
    const text = `Sigue el estado de tu encomienda protegida con AltiPay (${order.description}) por un valor de ${order.formattedAmount} USDC: ${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Enlace copiado al portapapeles')
  }

  const handleRelease = async () => {
    if (!inputPin.trim()) {
      toast.error('Ingresa el PIN de liberación')
      return
    }
    await confirmDeliveryWithSecret(order.orderId, inputPin.trim())
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver al panel
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-3.5 fill-current" />
            </div>
            <span className="font-semibold text-sm tracking-tight">altipay</span>
          </div>
        </div>
        <ConnectWalletButton />
      </nav>

      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <ShieldCheck className="size-4" /> Tracking de Encomienda Protegida
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{order.description}</h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">ID: {order.id}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-bold text-foreground">{order.formattedAmount}</p>
              <p className="text-xs text-muted-foreground">USDC bloqueados</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 rounded-xl bg-muted/40 p-4">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Estado actual</span>
              <span className="text-primary font-semibold">{order.statusLabel}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${order.progress}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
              <div className={order.progress >= 33 ? 'text-primary font-semibold' : ''}>1. Fondeo seguro</div>
              <div className={order.progress >= 66 ? 'text-primary font-semibold' : ''}>2. Despacho en flota</div>
              <div className={order.progress >= 100 ? 'text-primary font-semibold' : ''}>3. Liberación con PIN</div>
            </div>
          </div>

          {/* Tracking guide */}
          {order.trackingInfo && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-background p-4 text-xs">
              <div>
                <p className="text-muted-foreground">Guía de Flota / Transporte</p>
                <p className="mt-1 flex items-center gap-1.5 font-semibold text-foreground text-sm">
                  <Truck className="size-4 text-primary" /> {order.trackingInfo}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                En ruta
              </span>
            </div>
          )}

          {/* Buyer PIN release action */}
          {order.status !== 'COMPLETED' && (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <KeyRound className="size-4" /> Liberar fondos al recibir tu encomienda
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Una vez que tengas el paquete en tus manos en el terminal de flota, ingresa el PIN para desbloquear el pago al vendedor.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="Ingresa el PIN de 4 dígitos"
                  className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary font-mono"
                />
                <button
                  disabled={isSubmitting}
                  onClick={handleRelease}
                  className="h-10 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Liberar fondos
                </button>
              </div>
            </div>
          )}

          {/* Social share actions */}
          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-border">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
            >
              <Share2 className="size-3.5" /> Compartir por WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Copy className="size-3.5" /> Copiar enlace
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
