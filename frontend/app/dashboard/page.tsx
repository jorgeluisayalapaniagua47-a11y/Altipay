'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeft, Bell, Check, ChevronRight, CircleHelp, Clock3,
  ExternalLink, FileText, LayoutDashboard, LifeBuoy, Menu, MoreHorizontal, Plus,
  Search, ShieldCheck, Sparkles, Wallet, X, Zap, KeyRound, Truck, AlertCircle,
  Share2, Copy
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectWalletButton } from '@/components/web3/ConnectWalletButton'
import { useUSDC } from '@/hooks/useUSDC'
import { useAltiPayEscrow, EscrowOrderItem } from '@/hooks/useAltiPayEscrow'
import { useUnlockVIP } from '@/hooks/useUnlockVIP'
import { DEPLOYED_CONTRACTS, DEFAULT_CHAIN_ID } from '@/contracts/deployedContracts'
import { toast } from 'sonner'

const sampleEscrows: EscrowOrderItem[] = [
  {
    id: 'ALT-8924',
    orderId: '0x8924000000000000000000000000000000000000000000000000000000000001',
    buyer: '0x1111111111111111111111111111111111111111',
    seller: '0x2222222222222222222222222222222222222222',
    amount: '1850000000',
    formattedAmount: '$1,850.00',
    description: 'MacBook Pro M3 — Encomienda La Paz a Cbba',
    trackingInfo: 'Flota Bolívar #40921',
    status: 'DISPATCHED',
    statusLabel: 'En tránsito',
    tone: 'blue',
    progress: 68,
    date: 'Despachado hoy',
    deadline: Math.floor(Date.now() / 1000) + 86400 * 3,
    isBuyer: true,
    isSeller: false,
    secretPin: '4092',
  },
  {
    id: 'ALT-8918',
    orderId: '0x8918000000000000000000000000000000000000000000000000000000000002',
    buyer: '0x3333333333333333333333333333333333333333',
    seller: '0x4444444444444444444444444444444444444444',
    amount: '680000000',
    formattedAmount: '$680.00',
    description: 'Repuestos automotrices — Santa Cruz a Oruro',
    trackingInfo: '',
    status: 'FUNDED',
    statusLabel: 'Pago asegurado',
    tone: 'green',
    progress: 33,
    date: 'Creado hoy',
    deadline: Math.floor(Date.now() / 1000) + 86400 * 2,
    isBuyer: true,
    isSeller: false,
    secretPin: '7819',
  },
]

const activities = [
  { icon: ArrowDownLeft, label: 'Fondos depositados', detail: 'MacBook Pro M3 — Custodia activa', time: 'Hoy, 9:42 AM', amount: '+ $1,850.00 USDC', positive: true },
  { icon: ShieldCheck, label: 'Custodia asegurada', detail: 'Repuestos automotrices', time: 'Ayer, 4:18 PM', amount: '$680.00 USDC', positive: false },
  { icon: ArrowUpRight, label: 'Pago liberado al vendedor', detail: 'Lote de café de especialidad', time: '10 Sep, 2026', amount: '− $950.00 USDC', positive: false },
]

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Zap className="size-4 fill-current" />
      </div>
      <span className="text-[17px] font-semibold tracking-tight">altipay</span>
    </div>
  )
}

function StatusPill({ tone, children }: { tone: EscrowOrderItem['tone']; children: React.ReactNode }) {
  const style =
    tone === 'emerald' || tone === 'green'
      ? 'bg-emerald-400/10 text-emerald-300'
      : tone === 'amber'
      ? 'bg-amber-400/10 text-amber-300'
      : 'bg-sky-400/10 text-sky-300'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${style}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount()
  const activeChainId = chainId && DEPLOYED_CONTRACTS[chainId] ? chainId : DEFAULT_CHAIN_ID
  const networkName = DEPLOYED_CONTRACTS[activeChainId]?.name || 'Avalanche Fuji'

  const { balance, allowance, approveEscrow, isApproving, requestFaucet, isMinting } = useUSDC()
  const {
    orders: userOrders,
    createEscrowOrder,
    confirmDispatch,
    confirmDeliveryWithSecret,
    isSubmitting,
  } = useAltiPayEscrow()
  const { isVIP, feePercentage } = useUnlockVIP()

  const allEscrows = useMemo(() => {
    return userOrders.length > 0 ? userOrders : sampleEscrows
  }, [userOrders])

  const [mobileNav, setMobileNav] = useState(false)
  const [section, setSection] = useState('Resumen')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<'create' | 'dispute' | null>(null)
  const [selected, setSelected] = useState<EscrowOrderItem | null>(null)

  // Form for new Escrow
  const [form, setForm] = useState({
    description: '',
    seller: '',
    amount: '',
    secretPin: '',
    deadlineHours: '72',
  })

  // Action fields in selected modal
  const [inputPin, setInputPin] = useState('')
  const [inputTracking, setInputTracking] = useState('')

  const filtered = useMemo(() => {
    return allEscrows.filter((item) =>
      `${item.description} ${item.seller} ${item.id} ${item.trackingInfo}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [allEscrows, query])

  // Total protected balance calculation
  const protectedBalanceNum = useMemo(() => {
    return allEscrows.reduce((sum, item) => {
      const numeric = Number(item.amount) / 1e6
      return sum + (isNaN(numeric) ? 0 : numeric)
    }, 0)
  }, [allEscrows])

  // Create Escrow Handler
  const handleCreateEscrow = async () => {
    if (!isConnected) {
      toast.error('Por favor conecta tu billetera para crear una custodia')
      return
    }
    if (!form.description.trim()) {
      toast.error('Ingresa la descripción de la mercadería')
      return
    }
    if (!form.seller.trim() || !form.seller.startsWith('0x') || form.seller.length !== 42) {
      toast.error('Ingresa una dirección válida de billetera del vendedor (0x...)')
      return
    }
    const numAmount = Number(form.amount)
    if (!form.amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Ingresa un monto válido en USDC')
      return
    }
    if (!form.secretPin.trim() || form.secretPin.length < 4) {
      toast.error('El PIN secreto debe tener al menos 4 caracteres (ej. 4 dígitos)')
      return
    }

    // Step 1: Check allowance
    if (Number(allowance) < numAmount) {
      toast.info('Paso 1/2: Aprobando tokens USDC en tu billetera...')
      const approved = await approveEscrow(form.amount)
      if (!approved) return
    }

    // Step 2: Create on-chain escrow
    toast.info('Paso 2/2: Confirmando depósito de custodia...')
    const result = await createEscrowOrder({
      seller: form.seller as `0x${string}`,
      amount: form.amount,
      description: form.description,
      secretPin: form.secretPin,
      deadlineHours: Number(form.deadlineHours) || 72,
    })

    if (result) {
      setForm({ description: '', seller: '', amount: '', secretPin: '', deadlineHours: '72' })
      setModal(null)
    }
  }

  // Release funds with secret
  const handleReleaseWithPin = async () => {
    if (!selected) return
    if (selected.orderId.endsWith('00000000000000000000000000000001') || selected.orderId.endsWith('00000000000000000000000000000002')) {
      toast.info('Esta es una orden de muestra visual (demo). Para probar el flujo en blockchain, crea una custodia real con "+ Nueva custodia".')
      return
    }
    if (!inputPin.trim()) {
      toast.error('Ingresa el PIN de liberación')
      return
    }
    const success = await confirmDeliveryWithSecret(selected.orderId, inputPin.trim())
    if (success) {
      setSelected(null)
      setInputPin('')
    }
  }

  // Confirm dispatch with tracking
  const handleConfirmDispatch = async () => {
    if (!selected) return
    if (selected.orderId.endsWith('00000000000000000000000000000001') || selected.orderId.endsWith('00000000000000000000000000000002')) {
      toast.info('Esta es una orden de muestra visual (demo). Para probar el flujo en blockchain, crea una custodia real con "+ Nueva custodia".')
      return
    }
    if (!inputTracking.trim()) {
      toast.error('Ingresa el número de guía o flota')
      return
    }
    const success = await confirmDispatch(selected.orderId, inputTracking.trim())
    if (success) {
      setSelected(null)
      setInputTracking('')
    }
  }

  const nav = (name: string) => {
    setSection(name)
    setMobileNav(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[238px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform lg:translate-x-0 ${
          mobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button
            onClick={() => setMobileNav(false)}
            className="rounded-lg p-1.5 text-muted-foreground lg:hidden"
            aria-label="Cerrar navegación"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-10 flex flex-1 flex-col">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Área de trabajo
          </p>
          <nav className="space-y-1" aria-label="Navegación principal">
            {[
              ['Resumen', LayoutDashboard],
              ['Mis custodias', FileText],
              ['Billetera', Wallet],
              ['Disputas', LifeBuoy],
            ].map(([label, Icon]) => (
              <button
                key={label as string}
                onClick={() => nav(label as string)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                  section === label
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                }`}
              >
                <Icon className="size-[17px]" />
                <span className="flex-1">{label as string}</span>
                {label === 'Mis custodias' && <span className="text-[10px] opacity-80">{allEscrows.length}</span>}
                {label === 'Disputas' && (
                  <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300">1</span>
                )}
              </button>
            ))}
          </nav>

          <div className="my-7 h-px bg-sidebar-border" />

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Protocolo
          </p>
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Comisión activa:</span>
              <span className="font-semibold text-primary">{feePercentage}</span>
            </div>
            {isVIP && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-300">
                <Sparkles className="size-3" /> Membresía VIP Activa
              </p>
            )}
          </div>

          <button
            onClick={() => toast.info('Soporte AltiPay: Canal de arbitraje activo para Bolivia')}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <CircleHelp className="size-[17px]" />
            Centro de ayuda
          </button>
        </div>

        {/* Shield Badge */}
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <ShieldCheck className="size-4" />
            </div>
            <span className="text-xs font-semibold">Protección Criptográfica</span>
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">
            Los fondos quedan bloqueados en smart contract hasta que ambas partes confirman con PIN.
          </p>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-[238px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNav(true)}
              className="rounded-lg p-2 text-muted-foreground lg:hidden"
              aria-label="Abrir navegación"
            >
              <Menu className="size-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-64 rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
                placeholder="Buscar por ID, producto, flota..."
                aria-label="Buscar escrows"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="size-3.5" />
              Landing
            </Link>

            <ConnectWalletButton />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="mx-auto max-w-[1380px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Workspace</span>
                <ChevronRight className="size-3" />
                <span className="text-foreground">{section}</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[34px]">
                {isConnected ? (
                  <>
                    Bienvenido, <span className="text-primary font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </>
                ) : (
                  <>
                    Panel de Control <span className="text-primary">AltiPay.</span>
                  </>
                )}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Tus pagos y encomiendas protegidas entre La Paz, Cochabamba y Santa Cruz.
              </p>
            </div>

            <button
              onClick={() => setModal('create')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
            >
              <Plus className="size-4" /> Crear nuevo escrow
            </button>
          </div>

          {section === 'Mis custodias' ? (
            <EscrowsView
              escrows={filtered}
              onSelect={setSelected}
              onCreate={() => setModal('create')}
            />
          ) : section === 'Billetera' ? (
            <WalletView
              balance={balance}
              address={address}
              networkName={networkName}
              onRequestFaucet={() => requestFaucet('100')}
              isMinting={isMinting}
            />
          ) : section === 'Disputas' ? (
            <DisputesView onOpen={() => setModal('dispute')} />
          ) : (
            <>
              {/* Metric Cards */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Fondos en custodia"
                  value={`$${protectedBalanceNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  note="Protegidos en Smart Contracts"
                  icon={ShieldCheck}
                />
                <Metric
                  label="Balance USDC disponible"
                  value={`$${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  note={isConnected ? `En red ${networkName}` : 'Conecta tu wallet'}
                  icon={Wallet}
                  positive={Number(balance) > 0}
                />
                <Metric
                  label="Escrows activos"
                  value={String(allEscrows.length)}
                  note="Compras y envíos en curso"
                  icon={Clock3}
                />
                <Metric
                  label="Tarifa VIP Protocol"
                  value={feePercentage}
                  note={isVIP ? '0% Fee Unlock Activo' : '0.50% Comisión Base'}
                  icon={Sparkles}
                  positive={isVIP}
                />
              </section>

              {/* Main Workspace Layout */}
              <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold">Tus custodias recientes</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Monitorea los hitos de despacho y liberación</p>
                    </div>
                    <button
                      onClick={() => nav('Mis custodias')}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Ver todos <ChevronRight className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filtered.map((escrow) => (
                      <article
                        key={escrow.orderId}
                        onClick={() => setSelected(escrow)}
                        className="group cursor-pointer rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-card/80"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-xs font-semibold text-primary">
                              {escrow.id.slice(-4)}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold">{escrow.description}</h3>
                                <span className="font-mono text-[10px] text-muted-foreground">{escrow.id}</span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Vendedor:{' '}
                                <span className="font-mono text-foreground/70">
                                  {escrow.seller.slice(0, 6)}...{escrow.seller.slice(-4)}
                                </span>
                                {escrow.trackingInfo && (
                                  <span className="ml-2 text-primary font-medium">· 🚍 {escrow.trackingInfo}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 sm:justify-end">
                            <div className="text-left sm:text-right">
                              <p className="text-sm font-semibold">{escrow.formattedAmount}</p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">USDC</p>
                            </div>
                            <StatusPill tone={escrow.tone}>{escrow.statusLabel}</StatusPill>
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex justify-between text-[11px] text-muted-foreground">
                            <span>Progreso de entrega</span>
                            <span>{escrow.date}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${escrow.progress}%` }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}

                    {filtered.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                        No se encontraron custodias. ¡Crea tu primer escrow con el botón superior!
                      </div>
                    )}
                  </div>
                </section>

                {/* Right Sidebar Widget */}
                <aside className="space-y-5">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
                    <div className="flex items-start justify-between">
                      <div className="grid size-9 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                        <LifeBuoy className="size-4" />
                      </div>
                      <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-medium text-amber-300">
                        Garantía AltiPay
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold">¿Problemas con una flota?</h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Si el plazo de entrega vence sin que el producto llegue al terminal, puedes solicitar un reembolso unilateral o abrir un caso de mediación.
                    </p>
                    <button
                      onClick={() => setModal('dispute')}
                      className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
                    >
                      Centro de resolución <ExternalLink className="size-3.5" />
                    </button>
                  </div>

                  {/* Activity List */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Actividad reciente</h3>
                    </div>
                    <div className="mt-4 space-y-4">
                      {activities.map(({ icon: Icon, label, detail, time, amount, positive }) => (
                        <div className="flex items-start gap-3" key={label}>
                          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-xs font-medium">{label}</p>
                              <span className={`whitespace-nowrap text-[11px] font-medium ${positive ? 'text-emerald-300' : ''}`}>
                                {amount}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{detail}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground/70">{time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal: Create Escrow */}
      {modal === 'create' && (
        <Modal title="Crear nueva custodia protegida" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field
              label="Descripción del producto o encomienda"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              placeholder="Ej. MacBook Pro M3, Lote de café, Repuestos"
            />
            <Field
              label="Dirección de billetera del vendedor (0x...)"
              value={form.seller}
              onChange={(v) => setForm({ ...form, seller: v })}
              placeholder="0x..."
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Monto en USDC"
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
                placeholder="Ej. 100.00"
                type="number"
              />
              <Field
                label="PIN Secreto de Retiro"
                value={form.secretPin}
                onChange={(v) => setForm({ ...form, secretPin: v })}
                placeholder="Ej. 4092"
              />
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <KeyRound className="size-3.5" /> PIN Criptográfico
              </div>
              <p className="mt-1 leading-relaxed">
                Este PIN genera un hash keccak256 en la blockchain. Al retirar el producto en la flota o terminal, entrégale este PIN al vendedor para liberar los fondos atómicamente.
              </p>
            </div>

            <button
              disabled={isSubmitting || isApproving}
              onClick={handleCreateEscrow}
              className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50"
            >
              {isApproving
                ? 'Aprobando USDC...'
                : isSubmitting
                ? 'Creando en blockchain...'
                : Number(allowance) < Number(form.amount || 0)
                ? '1. Aprobar USDC y Crear Custodia'
                : 'Crear custodia protegida'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Dispute Info */}
      {modal === 'dispute' && (
        <Modal title="Centro de Resolución y Disputas" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Protección de Encomiendas:</strong> Si contrataste un envío interdepartamental y la guía de flota no registra entrega o el plazo se cumplió, nuestro contrato permite solicitar un reembolso unilateral.
            </div>
            <p className="text-xs text-muted-foreground">
              Para casos complejos donde la flota extravió el bulto, el mediador del protocolo revisará el ticket de flota antes de emitir la resolución final.
            </p>
            <button
              onClick={() => {
                setModal(null)
                toast.success('Solicitud enviada a revisión de soporte')
              }}
              className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Escrow Detail & Action */}
      {selected && (
        <Modal title={selected.description} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Monto en custodia</p>
                <p className="mt-1 text-2xl font-semibold">
                  {selected.formattedAmount} <span className="text-xs text-muted-foreground">USDC</span>
                </p>
              </div>
              <StatusPill tone={selected.tone}>{selected.statusLabel}</StatusPill>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">ID de Orden</p>
                <p className="mt-1 font-mono font-medium">{selected.id}</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">Estado</p>
                <p className="mt-1 font-medium text-primary">{selected.statusLabel}</p>
              </div>
            </div>

            {selected.trackingInfo && (
              <div className="rounded-xl border border-border p-3 text-xs">
                <p className="text-muted-foreground">Guía de Flota / Encomienda</p>
                <p className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
                  <Truck className="size-3.5 text-primary" /> {selected.trackingInfo}
                </p>
              </div>
            )}

            {selected.secretPin && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <p className="text-primary font-semibold">Tu PIN Secreto de Retiro</p>
                <p className="mt-1 font-mono text-base font-bold text-foreground">{selected.secretPin}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Proporciona este PIN al retirar la encomienda para liberar el pago.
                </p>
              </div>
            )}

            {/* Buyer action: Release with PIN */}
            {(selected.status === 'FUNDED' || selected.status === 'DISPATCHED') && (
              <div className="space-y-3 pt-2">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs font-semibold">Liberar fondos al vendedor</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Ingresa el PIN de retiro para completar la compra y transferir los USDC.
                  </p>
                  <input
                    type="text"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    placeholder="Ingresa el PIN de 4 dígitos"
                    className="mt-2 h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    disabled={isSubmitting}
                    onClick={handleReleaseWithPin}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Check className="size-4" /> Confirmar retiro y liberar fondos
                  </button>
                </div>

                {/* Seller action: Dispatch */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs font-semibold">¿Eres el vendedor? Registrar guía</p>
                  <input
                    type="text"
                    value={inputTracking}
                    onChange={(e) => setInputTracking(e.target.value)}
                    placeholder="Ej. Flota Bolívar #84920"
                    className="mt-2 h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    disabled={isSubmitting}
                    onClick={handleConfirmDispatch}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    <Truck className="size-4" /> Registrar despacho en flota
                  </button>
                </div>
              </div>
            )}

            {/* Acciones de comprobante y WhatsApp */}
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/order/${selected.orderId}`
                  const text = `Sigue el estado de tu encomienda protegida con AltiPay (${selected.description || selected.title}) por ${selected.formattedAmount} USDC: ${url}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition"
              >
                <Share2 className="size-3.5" /> Compartir por WhatsApp
              </button>
              <Link
                href={`/order/${selected.orderId}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
              >
                <ExternalLink className="size-3.5" /> Ver comprobante de rastreo
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EscrowsView({
  escrows,
  onSelect,
  onCreate,
}: {
  escrows: EscrowOrderItem[]
  onSelect: (escrow: EscrowOrderItem) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Todas las custodias protegidas</h2>
          <p className="mt-1 text-xs text-muted-foreground">Historial completo de encomiendas y pagos asegurados.</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Nueva custodia
        </button>
      </div>

      <div className="grid gap-3">
        {escrows.map((escrow) => (
          <button
            key={escrow.orderId}
            onClick={() => onSelect(escrow)}
            className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/40"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-muted text-xs font-semibold text-primary">
                  {escrow.id.slice(-4)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{escrow.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {escrow.id} · {escrow.seller.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold">{escrow.formattedAmount}</p>
                  <p className="text-[10px] text-muted-foreground">USDC</p>
                </div>
                <StatusPill tone={escrow.tone}>{escrow.statusLabel}</StatusPill>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${escrow.progress}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground">{escrow.progress}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function WalletView({
  balance,
  address,
  networkName,
  onRequestFaucet,
  isMinting,
}: {
  balance: string
  address?: string
  networkName: string
  onRequestFaucet: () => void
  isMinting: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs text-muted-foreground">Balance USDC disponible</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              ${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
              <span className="text-sm text-primary">USDC</span>
            </p>
            <p className="mt-2 text-xs text-emerald-300">Conectado en red {networkName}</p>
          </div>

          <button
            disabled={isMinting}
            onClick={onRequestFaucet}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            {isMinting ? 'Minteando tokens...' : 'Pedir 100 MockUSDC (Faucet)'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 text-left">
          <ArrowDownLeft className="size-5 text-emerald-300" />
          <p className="mt-4 text-sm font-semibold">Dirección de tu Billetera</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
            {address || 'Billetera no conectada'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-left">
          <ArrowUpRight className="size-5 text-primary" />
          <p className="mt-4 text-sm font-semibold">Smart Contract de MockUSDC</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
            0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C
          </p>
        </div>
      </div>
    </div>
  )
}

function DisputesView({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-amber-300">Protección de Compras Interdepartamentales</p>
            <h2 className="mt-2 text-xl font-semibold">Mediación y Reembolsos</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Altipay previene estafas entre ciudades de Bolivia mediante contratos inteligentes no custodiales. Si un paquete no es despachado dentro del plazo acordado, el comprador recupera sus fondos íntegramente.
            </p>
          </div>
          <LifeBuoy className="size-6 shrink-0 text-amber-300" />
        </div>
        <button
          onClick={onOpen}
          className="mt-5 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Consultar mediación
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Cómo funciona el circuito seguro</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            'Fondeo con PIN secreto',
            'Despacho en flota interdepartamental',
            'Liberación al retirar en terminal',
          ].map((step, index) => (
            <div key={step} className="rounded-xl bg-muted/50 p-4">
              <span className="text-xs text-primary font-bold">0{index + 1}</span>
              <p className="mt-2 text-xs font-medium">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
  positive,
}: {
  label: string
  value: string
  note: string
  icon: typeof Wallet
  positive?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-1 text-[11px] ${positive ? 'text-emerald-300' : 'text-muted-foreground'}`}>{note}</p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="block text-left">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
