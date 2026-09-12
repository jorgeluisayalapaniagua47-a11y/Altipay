export enum OrderStatus {
  NONE = 0,
  FUNDED = 1,
  DISPATCHED = 2,
  COMPLETED = 3,
  REFUNDED = 4,
  CANCELLED = 5,
}

export type Order = {
  orderId: string;
  buyer: string;
  seller: string;
  token: string;
  amount: string; // Formatting to USDC scale
  deadline: number;
  status: OrderStatus;
  description: string;
  trackingInfo: string;
  createdAt: number;
  completedAt: number;
  buyerUsername?: string; // Mock visual details
  buyerInitials?: string; // Mock visual details
};

export const MOCK_ORDERS: Order[] = [
  {
    orderId: 'ALT-8924',
    buyer: '0x1234...abcd',
    seller: '0xSellerWallet',
    token: 'USDC',
    amount: '1850.00',
    deadline: new Date('2026-09-18T12:00:00Z').getTime(),
    status: OrderStatus.DISPATCHED,
    description: 'Repuestos freno disco Toyota Hilux',
    trackingInfo: 'Flota Bolívar #48291',
    createdAt: new Date('2026-09-10T09:00:00Z').getTime(),
    completedAt: 0,
    buyerUsername: 'jordan.merchant',
    buyerInitials: 'JM',
  },
  {
    orderId: 'ALT-8918',
    buyer: '0x5678...efgh',
    seller: '0xSellerWallet',
    token: 'USDC',
    amount: '2400.00',
    deadline: new Date('2026-09-22T12:00:00Z').getTime(),
    status: OrderStatus.FUNDED,
    description: 'Mercadería textil por mayor',
    trackingInfo: '',
    createdAt: new Date('2026-09-12T09:00:00Z').getTime(),
    completedAt: 0,
    buyerUsername: 'studio.north',
    buyerInitials: 'SN',
  },
  {
    orderId: 'ALT-8891',
    buyer: '0x9abc...ijkl',
    seller: '0xSellerWallet',
    token: 'USDC',
    amount: '680.00',
    deadline: new Date('2026-09-11T12:00:00Z').getTime(),
    status: OrderStatus.COMPLETED,
    description: 'Lotes de celulares Xiaomi',
    trackingInfo: 'Flota Dorado #1122',
    createdAt: new Date('2026-09-08T09:00:00Z').getTime(),
    completedAt: new Date('2026-09-10T15:00:00Z').getTime(),
    buyerUsername: 'kai.builds',
    buyerInitials: 'KB',
  },
];
