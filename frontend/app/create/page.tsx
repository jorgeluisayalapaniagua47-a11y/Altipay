'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, KeyRound, ShieldCheck, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectWalletButton } from '@/components/web3/ConnectWalletButton'
import { useUSDC } from '@/hooks/useUSDC'
import { useAltiPayEscrow } from '@/hooks/useAltiPayEscrow'
import { toast } from 'sonner'

export default function CreateOrderPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const { allowance, approveEscrow, isApproving } = useUSDC()
  const { createEscrowOrder, isSubmitting } = useAltiPayEscrow()

  const [form, setForm] = useState({
    description: '',
    seller: '',
    amount: '',
    secretPin: '',
    deadlineHours: '72',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error('Por favor conecta tu billetera primero')
      return
    }
    if (!form.description.trim()) {
      toast.error('Ingresa la descripción')
      return
    }
    if (!form.seller.startsWith('0x') || form.seller.length !== 42) {
      toast.error('Dirección de vendedor inválida (debe empezar con 0x y tener 42 caracteres)')
      return
    }
    const numAmount = Number(form.amount)
    if (!form.amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Monto inválido')
      return
    }
    if (!form.secretPin || form.secretPin.length < 4) {
      toast.error('El PIN debe tener al menos 4 caracteres')
      return
    }

    if (Number(allowance) < numAmount) {
      const approved = await approveEscrow(form.amount)
      if (!approved) return
    }

    const order = await createEscrowOrder({
      seller: form.seller as `0x${string}`,
      amount: form.amount,
      description: form.description,
      secretPin: form.secretPin,
      deadlineHours: Number(form.deadlineHours) || 72,
    })

    if (order) {
      router.push('/dashboard')
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

      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <ShieldCheck className="size-4" /> Custodia Comercial No Custodial
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Crear nueva custodia</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Bloquea el pago en smart contract para asegurar la entrega antes de liberar el dinero.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">Mercadería o servicio</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej. MacBook Pro M3 de La Paz a Santa Cruz"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground">Billetera del vendedor (0x...)</label>
              <input
                type="text"
                value={form.seller}
                onChange={(e) => setForm({ ...form, seller: e.target.value })}
                placeholder="0x1234...5678"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Monto en USDC</label>
                <input
                  type="number"
                  step="any"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="150.00"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">PIN Secreto (4 dígitos)</label>
                <input
                  type="text"
                  value={form.secretPin}
                  onChange={(e) => setForm({ ...form, secretPin: e.target.value })}
                  placeholder="4092"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <KeyRound className="size-3.5" /> ¿Cómo funciona el PIN?
              </div>
              <p className="mt-1 leading-relaxed">
                Tú guardas este PIN. Cuando la flota llegue a tu ciudad y revises tu paquete en el terminal, se lo das al vendedor para que libere sus fondos.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isApproving}
              className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50"
            >
              {isApproving
                ? 'Aprobando USDC...'
                : isSubmitting
                ? 'Confirmando en blockchain...'
                : Number(allowance) < Number(form.amount || 0)
                ? 'Aprobar y Crear Custodia'
                : 'Crear custodia protegida'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
