import { Order, OrderStatus } from '@/lib/mockData';
import { Check } from 'lucide-react';

export function OrderTimeline({ order }: { order: Order }) {
  const steps = [
    { label: 'Custodia Creada', status: OrderStatus.FUNDED },
    { label: 'En Tránsito', status: OrderStatus.DISPATCHED },
    { label: 'Liquidado', status: OrderStatus.COMPLETED },
  ];

  let currentStepIndex = 0;
  if (order.status === OrderStatus.DISPATCHED) currentStepIndex = 1;
  if (order.status === OrderStatus.COMPLETED) currentStepIndex = 2;
  if (order.status === OrderStatus.REFUNDED || order.status === OrderStatus.CANCELLED) {
      currentStepIndex = -1; // Specialized visual for refunded could go here
  }

  const progress = currentStepIndex === 0 ? 33 : currentStepIndex === 1 ? 66 : currentStepIndex === 2 ? 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex justify-between text-xs mb-5">
        <span className="font-semibold">Progreso de la Orden</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <div className="relative flex items-center justify-between px-2">
        {/* Progress Bar Background */}
        <div className="absolute top-3 left-0 h-1 w-full rounded-full bg-muted" />
        {/* Progress Bar Active */}
        <div 
          className="absolute top-3 left-0 h-1 rounded-full bg-primary transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
        
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`grid size-7 place-items-center rounded-full text-[11px] font-bold transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                {isActive ? <Check className="size-3.5" /> : index + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
}
