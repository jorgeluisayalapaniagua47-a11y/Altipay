import { NextResponse } from 'next/server';
import { MOCK_ORDERS } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  
  // En producción real, aquí se llamaría a la blockchain (via viem/ethers) 
  // o a un indexador para obtener los datos de la orden.
  // Para el MVP, utilizamos nuestra base de datos simulada.
  const order = MOCK_ORDERS.find(o => o.orderId === orderId);

  if (!order) {
    return NextResponse.json(
      { error: 'Orden no encontrada' },
      { status: 404 }
    );
  }

  // Se exponen solo los datos públicos necesarios para metadatos o previews
  return NextResponse.json({
    id: order.orderId,
    status: order.status,
    amount: order.amount,
    token: order.token,
    trackingInfo: order.trackingInfo,
    description: order.description,
    deadline: new Date(order.deadline).toISOString(),
  });
}
