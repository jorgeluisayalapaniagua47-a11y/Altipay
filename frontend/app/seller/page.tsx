'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ShieldCheck, Truck, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectWalletButton } from '@/components/web3/ConnectWalletButton'
import { useAltiPayEscrow } from '@/hooks/useAltiPayEscrow'
import { toast } from 'sonner'

export default function SellerPortalPage() {
  const { isConnected } = useAccount()
  const { confirmDispatch, isSubmitting } = useAltiPayEscrow()

  const [orderId, setOrderId] = useState('')
  const [trackingInfo, setTrackingInfo] = useState('')

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error('Por favor conecta tu billetera como vendedor')
      return
    }
    if (!orderId.startsWith('0x')) {
      toast.error('Ingresa un Order ID válido de 32 bytes (0x...)')
      return
    }
    if (!trackingInfo.trim()) {
      toast.error('Ingresa los datos de guía de flota o encomienda')
      return
    }

    const success = await confirmDispatch(orderId as `0x${string}`, trackingInfo)
    if (success) {
      setTrackingInfo('')
    }
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
        {/* Banner de Garantía para el Vendedor */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-emerald-300">
                Depósito Bloqueado y Garantizado en Blockchain
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                El comprador ya ha depositado los fondos en el Smart Contract no custodial. Nadie puede retirar ese dinero mientras dure el plazo pactado. Despacha con total seguridad a través de la flota interdepartamental de tu preferencia.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Despacho */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Truck className="size-4" /> Portal de Vendedores y Despachos
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Registrar Guía de Envío</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Ingresa la guía para que el comprador pueda seguir la encomienda y saber cuándo recogerla en la terminal.
          </p>

          <form onSubmit={handleDispatch} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">ID de Orden (Hash on-chain)</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="0x..."
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground">Guía y Flota de Transporte</label>
              <input
                type="text"
                value={trackingInfo}
                onChange={(e) => setTrackingInfo(e.target.value)}
                placeholder="Ej. Flota Bolívar #40921 — Terminal La Paz a Cbba"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50"
            >
              <Truck className="size-4" />
              {isSubmitting ? 'Registrando en blockchain...' : 'Confirmar despacho en flota'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
