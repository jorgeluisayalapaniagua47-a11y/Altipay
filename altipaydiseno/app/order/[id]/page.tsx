import { OrderTimeline } from '@/components/common/OrderTimeline';
import { MOCK_ORDERS } from '@/lib/mockData';
import { QrCode, ArrowLeft, Package, User, Hash } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const order = MOCK_ORDERS.find(o => o.orderId === params.id);
  
  if (!order) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background p-5 sm:p-10 text-foreground">
      <div className="max-w-2xl mx-auto">
        <Link href="/seller" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="mr-2 size-4" /> Volver al Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em]">Detalle de Envío</h1>
            <p className="mt-2 text-sm text-muted-foreground">Trazabilidad pública y segura de la encomienda.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
            <QrCode className="size-4" />
            Compartir Seguimiento
          </button>
        </div>
        
        <div className="grid gap-6">
          {/* Timeline */}
          <OrderTimeline order={order} />
          
          {/* Detalle */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-6">Información del Pedido</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Hash className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">ID de Orden (Blockchain)</p>
                  <p className="mt-1 font-mono text-sm">{order.orderId}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Package className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Descripción</p>
                  <p className="mt-1 text-sm">{order.description}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <User className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Comprador</p>
                  <p className="mt-1 text-sm">{order.buyerUsername || order.buyer}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-400">
                  <span className="font-semibold text-lg">$</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Monto Garantizado</p>
                  <p className="mt-1 text-sm font-semibold">{order.amount} USDC</p>
                </div>
              </div>
            </div>
            
            {order.trackingInfo && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="text-xs font-medium text-muted-foreground mb-2">Información de Transporte Terrestre</p>
                <div className="rounded-xl bg-amber-400/10 p-4 border border-amber-400/20">
                  <p className="text-amber-400 font-semibold">{order.trackingInfo}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
