'use client'

import { useMemo, useState } from 'react'
import {
  Bell, LayoutDashboard, Menu,
  Search, ShieldCheck, Wallet, X, Zap, Package, ChevronRight
} from 'lucide-react'
import { MOCK_ORDERS, Order, OrderStatus } from '@/lib/mockData'
import { DispatchModal } from '@/components/seller/DispatchModal'
import Link from 'next/link'

function Logo() { return <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Zap className="size-4 fill-current" /></div><span className="text-[17px] font-semibold tracking-tight">altipay</span></div> }

function StatusPill({ status }: { status: OrderStatus }) { 
  const style = status === OrderStatus.COMPLETED ? 'bg-emerald-400/10 text-emerald-300' 
    : status === OrderStatus.DISPATCHED ? 'bg-amber-400/10 text-amber-300' 
    : status === OrderStatus.FUNDED ? 'bg-sky-400/10 text-sky-300'
    : 'bg-muted text-muted-foreground'; 
    
  const label = status === OrderStatus.COMPLETED ? 'Liquidado' 
    : status === OrderStatus.DISPATCHED ? 'En Tránsito' 
    : status === OrderStatus.FUNDED ? 'Fondeado'
    : 'Cancelado';
    
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${style}`}><span className="size-1.5 rounded-full bg-current" />{label}</span> 
}

function CheckCircle2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
}

export default function SellerDashboard() {
  const [escrows, setEscrows] = useState(MOCK_ORDERS)
  const [mobileNav, setMobileNav] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null)
  
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  
  const filtered = useMemo(() => escrows.filter((item) => `${item.description} ${item.buyerUsername} ${item.orderId}`.toLowerCase().includes(query.toLowerCase())), [escrows, query])

  const handleDispatch = (tracking: string) => {
    if (!dispatchModalOrder) return;
    setEscrows(escrows.map(o => o.orderId === dispatchModalOrder.orderId ? { ...o, status: OrderStatus.DISPATCHED, trackingInfo: tracking } : o));
    setDispatchModalOrder(null);
    showToast(`Orden ${dispatchModalOrder.orderId} marcada como despachada`);
  }

  return <div className="min-h-screen bg-background text-foreground">
    {/* Sidebar */}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[238px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2"><Logo /><button onClick={() => setMobileNav(false)} className="rounded-lg p-1.5 text-muted-foreground lg:hidden" aria-label="Close navigation"><X className="size-4" /></button></div>
      <div className="mt-10 flex flex-1 flex-col">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Workspace Vendedor</p>
        <nav className="space-y-1" aria-label="Primary navigation">
          <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium bg-primary text-primary-foreground`}>
            <LayoutDashboard className="size-[17px]" />
            <span className="flex-1">Órdenes Recibidas</span>
          </button>
          <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground`}>
            <Wallet className="size-[17px]" />
            <span className="flex-1">Mi Billetera</span>
          </button>
        </nav>
      </div>
    </aside>
    
    <div className="lg:pl-[238px]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-muted-foreground lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 w-56 rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Buscar órdenes..." aria-label="Search escrows" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-300">Fuji Testnet</span>
          </div>
          <button onClick={() => showToast('Conectado como vendedor')} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 py-1.5 pl-2 pr-2.5 text-xs font-medium">
            <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary"><Wallet className="size-3.5" /></span>
            0xVendor...92cD
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="mx-auto max-w-[1380px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[34px]">Tus Ventas<span className="text-primary">.</span></h1>
            <p className="mt-2 text-sm text-muted-foreground">Gestiona tus despachos y fondos garantizados.</p>
          </div>
        </div>
        
        {/* Depósito Garantizado Banner */}
        <div className="mb-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.04] p-6 shadow-sm shadow-emerald-400/5">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-xl bg-emerald-400/10 text-emerald-400">
                    <ShieldCheck className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400/80 uppercase tracking-wider">Depósitos Bloqueados y Garantizados</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-400">
                    $4,250.00 <span className="text-sm text-emerald-400/70 font-normal">USDC</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground max-w-[200px] text-left sm:text-right leading-5">Estos fondos están 100% garantizados en el Smart Contract. Seguros para despachar.</p>
            </div>
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Órdenes Activas</h2>
              <p className="mt-1 text-xs text-muted-foreground">Pedidos listos para ser enviados o en tránsito</p>
            </div>
          </div>
          
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((escrow) => (
              <article key={escrow.orderId} className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-xs font-semibold text-muted-foreground">{escrow.buyerInitials}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{escrow.description}</h3>
                        <span className="font-mono text-[10px] text-muted-foreground">{escrow.orderId}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Comprador: <span className="text-foreground/70">{escrow.buyerUsername}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold">${escrow.amount}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">USDC</p>
                    </div>
                    <StatusPill status={escrow.status} />
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground">
                    {escrow.status === OrderStatus.FUNDED ? (
                       <span className="flex items-center text-emerald-400 font-medium"><CheckCircle2 className="size-3.5 mr-1.5 shrink-0" /> Fondos bloqueados. Listo para despachar.</span>
                    ) : escrow.status === OrderStatus.DISPATCHED ? (
                        <span className="flex items-center text-amber-300 font-medium"><Package className="size-3.5 mr-1.5 shrink-0" /> En tránsito: {escrow.trackingInfo}</span>
                    ) : (
                        <span className="text-muted-foreground">Orden Completada y Liquidada</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/order/${escrow.orderId}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors">
                      Ver Tracking <ChevronRight className="size-3.5 ml-1 text-muted-foreground" />
                    </Link>
                    {escrow.status === OrderStatus.FUNDED && (
                      <button 
                        onClick={() => setDispatchModalOrder(escrow)} 
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Despachar Carga
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {filtered.length === 0 && <div className="col-span-2 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No hay órdenes que coincidan con tu búsqueda.</div>}
          </div>
        </section>
      </main>
    </div>
    
    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-2xl">{toast}</div>}
    
    {dispatchModalOrder && (
      <DispatchModal 
        order={dispatchModalOrder} 
        onClose={() => setDispatchModalOrder(null)} 
        onConfirm={handleDispatch} 
      />
    )}
  </div>
}
