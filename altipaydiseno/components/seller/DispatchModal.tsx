import { useState } from 'react';
import { X, Truck } from 'lucide-react';
import { GuiaUploader } from './GuiaUploader';
import { Order } from '@/lib/mockData';

export function DispatchModal({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: (tracking: string) => void }) {
  const [tracking, setTracking] = useState('');
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/75 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Confirmar Despacho</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close dialog">
            <X className="size-4" />
          </button>
        </div>
        
        <div className="space-y-5">
          <div className="rounded-xl bg-primary/10 text-primary p-4 flex items-start gap-3">
            <Truck className="size-5 mt-0.5 shrink-0" />
            <p className="text-sm leading-6">Por favor, entrega la mercadería a la empresa de transporte e ingresa los detalles del envío para notificar al comprador.</p>
          </div>
          
          <label className="block text-left">
            <span className="text-xs font-medium text-muted-foreground">Empresa y N° de Guía</span>
            <input 
              type="text" 
              value={tracking} 
              onChange={(e) => setTracking(e.target.value)} 
              placeholder="Ej. Flota Bolívar #84920" 
              className="mt-2 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-primary transition-colors" 
            />
          </label>

          <GuiaUploader onUpload={(file) => console.log('File uploaded', file)} />

          <button 
            disabled={!tracking}
            onClick={() => onConfirm(tracking)} 
            className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
          >
            Marcar como despachado
          </button>
        </div>
      </div>
    </div>
  );
}
