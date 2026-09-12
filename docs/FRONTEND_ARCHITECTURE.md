# AltiPay Protocol — Arquitectura Frontend

> **Versión:** 1.0.0  
> **Estado:** Especificación MVP  
> **Fecha:** 2026-09-11  

---

## 1. Visión General

El frontend de AltiPay es una **Single Page Application (SPA)** construida con React + Vite que se conecta directamente a la blockchain vía Web3 providers (MetaMask, WalletConnect). No existe backend intermedio — toda la interacción es client-to-chain.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA FRONTEND ALTIPAY                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        CAPA DE PRESENTACIÓN                      │   │
│  │                                                                   │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐  │   │
│  │  │  Landing   │ │ Dashboard  │ │  New Order │ │ Order Detail │  │   │
│  │  │  Page      │ │  Page      │ │  Page      │ │ Page         │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └──────────────┘  │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐   │   │
│  │  │                 COMPONENTES REUTILIZABLES                  │   │   │
│  │  │  OrderCard · StatusBadge · SecretModal · ChainSelector    │   │   │
│  │  │  WalletButton · ProgressTracker · AmountInput · Toast     │   │   │
│  │  └────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      CAPA DE ESTADO (State)                      │   │
│  │                                                                   │   │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │   │
│  │  │  WalletContext  │  │  OrdersContext  │  │  ChainContext    │  │   │
│  │  │  (conexión,     │  │  (CRUD órdenes, │  │  (red activa,   │  │   │
│  │  │   saldo, auth)  │  │   caché local)  │  │   switch chain) │  │   │
│  │  └────────────────┘  └─────────────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    CAPA DE SERVICIOS (Web3)                      │   │
│  │                                                                   │   │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │   │
│  │  │  ContractService│ │  WalletService  │  │  EventService    │  │   │
│  │  │  (ethers.js     │  │  (connect,     │  │  (listen events, │  │   │
│  │  │   contract      │  │   sign, switch) │  │   notifications) │  │   │
│  │  │   calls)        │  │                │  │                  │  │   │
│  │  └────────────────┘  └─────────────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   CAPA DE BLOCKCHAIN (Provider)                  │   │
│  │                                                                   │   │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │   │
│  │  │  MetaMask      │  │  Avalanche      │  │  HSK Chain       │  │   │
│  │  │  Provider      │  │  Fuji RPC       │  │  RPC             │  │   │
│  │  └────────────────┘  └─────────────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión | Justificación |
|-----------|-----------|---------|---------------|
| **Framework** | React | 18.x | Ecosistema maduro, hooks, comunidad activa |
| **Build Tool** | Vite | 5.x | Build rápido, HMR instantáneo, tree-shaking |
| **Lenguaje** | TypeScript | 5.x | Type safety para contratos y ABIs |
| **Web3 Library** | ethers.js | 6.x | Ligera, bien tipada, estándar en EVM |
| **Routing** | React Router | 6.x | SPA routing declarativo |
| **Estado** | React Context + useReducer | - | Suficiente para MVP sin Redux overhead |
| **Styling** | CSS Modules + Variables | - | Zero runtime, design tokens nativos |
| **Notificaciones** | React Hot Toast | 4.x | Lightweight, customizable |
| **Iconos** | Lucide React | Latest | SVG icons, tree-shakeable |
| **Animaciones** | Framer Motion | 11.x | Animaciones declarativas para React |
| **Fecha/Hora** | date-fns | 3.x | Ligera, modular, tree-shakeable |

---

## 3. Estructura del Proyecto

```
frontend/
├── public/
│   ├── favicon.svg
│   ├── og-image.png               # Open Graph image
│   └── manifest.json              # PWA manifest
│
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component + Router
│   ├── index.css                   # Design tokens + global styles
│   │
│   ├── pages/                      # Páginas/Rutas
│   │   ├── Landing/
│   │   │   ├── Landing.tsx
│   │   │   └── Landing.module.css
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   └── Dashboard.module.css
│   │   ├── NewOrder/
│   │   │   ├── NewOrder.tsx
│   │   │   └── NewOrder.module.css
│   │   └── OrderDetail/
│   │       ├── OrderDetail.tsx
│   │       └── OrderDetail.module.css
│   │
│   ├── components/                 # Componentes reutilizables
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.module.css
│   │   ├── OrderCard/
│   │   │   ├── OrderCard.tsx
│   │   │   └── OrderCard.module.css
│   │   ├── StatusBadge/
│   │   │   ├── StatusBadge.tsx
│   │   │   └── StatusBadge.module.css
│   │   ├── WalletButton/
│   │   │   ├── WalletButton.tsx
│   │   │   └── WalletButton.module.css
│   │   ├── ChainSelector/
│   │   │   ├── ChainSelector.tsx
│   │   │   └── ChainSelector.module.css
│   │   ├── SecretModal/
│   │   │   ├── SecretModal.tsx
│   │   │   └── SecretModal.module.css
│   │   ├── ProgressTracker/
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── ProgressTracker.module.css
│   │   ├── AmountInput/
│   │   │   ├── AmountInput.tsx
│   │   │   └── AmountInput.module.css
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Spinner.tsx
│   │       ├── Skeleton.tsx
│   │       └── Toast.tsx
│   │
│   ├── contexts/                   # Estado global (React Context)
│   │   ├── WalletContext.tsx
│   │   ├── OrdersContext.tsx
│   │   └── ChainContext.tsx
│   │
│   ├── services/                   # Servicios Web3
│   │   ├── contractService.ts
│   │   ├── walletService.ts
│   │   ├── eventService.ts
│   │   └── secretService.ts
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useWallet.ts
│   │   ├── useContract.ts
│   │   ├── useOrders.ts
│   │   ├── useOrderDetail.ts
│   │   ├── useChain.ts
│   │   └── useCountdown.ts
│   │
│   ├── config/                     # Configuración
│   │   ├── chains.ts               # Definición de redes
│   │   ├── contracts.ts            # ABIs y direcciones
│   │   └── constants.ts            # Constantes de la app
│   │
│   ├── types/                      # TypeScript types
│   │   ├── order.ts
│   │   ├── chain.ts
│   │   └── wallet.ts
│   │
│   ├── utils/                      # Utilidades
│   │   ├── format.ts               # Formateo de montos, fechas, direcciones
│   │   ├── crypto.ts               # Generación de secretos
│   │   ├── storage.ts              # localStorage helpers
│   │   └── validation.ts           # Validación de formularios
│   │
│   └── assets/                     # Assets estáticos
│       ├── images/
│       ├── icons/
│       └── abis/
│           ├── AltiPayEscrow.json
│           └── MockUSDC.json
│
├── index.html                      # HTML entry
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config
├── package.json
└── .env.example
```

---

## 4. Gestión de Estado

### 4.1 Diagrama de Flujo de Estado

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                          │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  WalletContext   │  Provee: address, chainId, provider,  │
│  │                  │          signer, isConnected, balance  │
│  │  ┌─────────┐    │                                        │
│  │  │ connect │───>│──> Actualiza provider + signer          │
│  │  │ switch  │───>│──> Cambia de red                        │
│  │  │ disconn │───>│──> Limpia estado                        │
│  │  └─────────┘    │                                        │
│  └────────┬────────┘                                        │
│           │ depende de                                       │
│  ┌────────▼────────┐                                        │
│  │  ChainContext    │  Provee: activeChain, contractAddr,   │
│  │                  │          usdcAddr, explorerUrl         │
│  └────────┬────────┘                                        │
│           │ depende de                                       │
│  ┌────────▼────────┐                                        │
│  │  OrdersContext   │  Provee: orders[], loading, error,    │
│  │                  │          createOrder, confirmDelivery, │
│  │  ┌───────────┐  │          claimRefund, refreshOrders    │
│  │  │ cached in │  │                                        │
│  │  │ IndexedDB │  │                                        │
│  │  └───────────┘  │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 WalletContext

```typescript
// src/contexts/WalletContext.tsx

interface WalletState {
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isConnecting: boolean;
  usdcBalance: string;
  nativeBalance: string;
  error: string | null;
}

type WalletAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: { address: string; chainId: number; provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner } }
  | { type: 'CONNECT_ERROR'; payload: string }
  | { type: 'DISCONNECT' }
  | { type: 'CHAIN_CHANGED'; payload: number }
  | { type: 'BALANCE_UPDATED'; payload: { usdc: string; native: string } };

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}
```

### 4.3 OrdersContext

```typescript
// src/contexts/OrdersContext.tsx

interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  lastSync: number;
}

interface OrdersContextType extends OrdersState {
  createOrder: (params: CreateOrderParams) => Promise<string>;    // returns orderId
  confirmDispatch: (orderId: string, trackingInfo: string) => Promise<void>;
  confirmDelivery: (orderId: string, secret: string) => Promise<void>;
  claimRefund: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
}

interface CreateOrderParams {
  sellerAddress: string;
  amount: string;           // Human readable (e.g., "150.00")
  description: string;
  deadlineHours: number;    // Horas desde ahora
}
```

---

## 5. Servicios Web3

### 5.1 ContractService

```typescript
// src/services/contractService.ts

import { ethers } from 'ethers';
import { CHAIN_CONFIG } from '../config/chains';
import AltiPayEscrowABI from '../assets/abis/AltiPayEscrow.json';
import MockUSDCABI from '../assets/abis/MockUSDC.json';

export class ContractService {
  private escrowContract: ethers.Contract;
  private usdcContract: ethers.Contract;
  private signer: ethers.JsonRpcSigner;

  constructor(signer: ethers.JsonRpcSigner, chainId: number) {
    const config = CHAIN_CONFIG[chainId];
    this.signer = signer;
    this.escrowContract = new ethers.Contract(
      config.escrowAddress,
      AltiPayEscrowABI,
      signer
    );
    this.usdcContract = new ethers.Contract(
      config.usdcAddress,
      MockUSDCABI,
      signer
    );
  }

  // ── Approve USDC spending ──
  async approveUSDC(amount: bigint): Promise<ethers.TransactionReceipt> {
    const tx = await this.usdcContract.approve(
      await this.escrowContract.getAddress(),
      amount
    );
    return tx.wait();
  }

  // ── Check USDC allowance ──
  async getAllowance(owner: string): Promise<bigint> {
    return this.usdcContract.allowance(
      owner,
      await this.escrowContract.getAddress()
    );
  }

  // ── Create Order ──
  async createOrder(
    seller: string,
    amount: bigint,
    secretHash: string,
    deadline: number,
    description: string
  ): Promise<{ tx: ethers.TransactionReceipt; orderId: string }> {
    const tx = await this.escrowContract.createOrder(
      seller,
      await this.usdcContract.getAddress(),
      amount,
      secretHash,
      deadline,
      description
    );
    const receipt = await tx.wait();

    // Extract orderId from OrderCreated event
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'OrderCreated'
    );
    const orderId = event?.args?.[0] || '';

    return { tx: receipt, orderId };
  }

  // ── Confirm Dispatch ──
  async confirmDispatch(orderId: string, trackingInfo: string): Promise<ethers.TransactionReceipt> {
    const tx = await this.escrowContract.confirmDispatch(orderId, trackingInfo);
    return tx.wait();
  }

  // ── Confirm Delivery ──
  async confirmDelivery(orderId: string, secret: string): Promise<ethers.TransactionReceipt> {
    const tx = await this.escrowContract.confirmDelivery(orderId, secret);
    return tx.wait();
  }

  // ── Claim Refund ──
  async claimRefund(orderId: string): Promise<ethers.TransactionReceipt> {
    const tx = await this.escrowContract.claimRefund(orderId);
    return tx.wait();
  }

  // ── Cancel Order ──
  async cancelOrder(orderId: string): Promise<ethers.TransactionReceipt> {
    const tx = await this.escrowContract.cancelOrder(orderId);
    return tx.wait();
  }

  // ── Read Order ──
  async getOrder(orderId: string): Promise<any> {
    return this.escrowContract.getOrder(orderId);
  }

  // ── Get User Orders ──
  async getUserOrders(address: string): Promise<string[]> {
    return this.escrowContract.getUserOrders(address);
  }

  // ── Get USDC Balance ──
  async getUSDCBalance(address: string): Promise<bigint> {
    return this.usdcContract.balanceOf(address);
  }

  // ── Faucet (Testnet only) ──
  async faucet(amount: bigint): Promise<ethers.TransactionReceipt> {
    const tx = await this.usdcContract.faucet(amount);
    return tx.wait();
  }
}
```

### 5.2 SecretService

```typescript
// src/services/secretService.ts

import { ethers } from 'ethers';

export class SecretService {
  /**
   * Genera un secreto aleatorio de 32 bytes
   * y retorna tanto el secreto como su hash
   */
  static generateSecret(): { secret: string; secretHash: string; displayCode: string } {
    // Generar 32 bytes aleatorios
    const randomBytes = ethers.randomBytes(32);
    const secret = ethers.hexlify(randomBytes);

    // Computar hash (keccak256)
    const secretHash = ethers.keccak256(
      ethers.solidityPacked(['bytes32'], [secret])
    );

    // Generar código legible (8 caracteres alfanuméricos)
    const displayCode = this.toDisplayCode(secret);

    return { secret, secretHash, displayCode };
  }

  /**
   * Convierte el secreto hex en un código legible
   * Formato: ALTI-XXXX-XXXX
   */
  private static toDisplayCode(secretHex: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I,O,0,1 para evitar confusión
    const bytes = ethers.getBytes(secretHex);
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return `ALTI-${code.slice(0, 4)}-${code.slice(4, 8)}`;
  }

  /**
   * Almacena el secreto cifrado en localStorage
   */
  static storeSecret(orderId: string, secret: string): void {
    const secrets = JSON.parse(
      localStorage.getItem('altipay_secrets') || '{}'
    );
    secrets[orderId] = {
      secret,
      storedAt: Date.now(),
    };
    localStorage.setItem('altipay_secrets', JSON.stringify(secrets));
  }

  /**
   * Recupera el secreto almacenado
   */
  static getStoredSecret(orderId: string): string | null {
    const secrets = JSON.parse(
      localStorage.getItem('altipay_secrets') || '{}'
    );
    return secrets[orderId]?.secret || null;
  }

  /**
   * Verifica que un secreto corresponde al hash esperado
   */
  static verifySecret(secret: string, expectedHash: string): boolean {
    const hash = ethers.keccak256(
      ethers.solidityPacked(['bytes32'], [secret])
    );
    return hash === expectedHash;
  }
}
```

---

## 6. Configuración de Cadenas

```typescript
// src/config/chains.ts

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  escrowAddress: string;
  usdcAddress: string;
  isTestnet: boolean;
  iconColor: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAIN_CONFIG: Record<number, ChainConfig> = {
  43113: {
    chainId: 43113,
    name: 'Avalanche Fuji Testnet',
    shortName: 'Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    escrowAddress: import.meta.env.VITE_FUJI_ESCROW_ADDRESS || '',
    usdcAddress: import.meta.env.VITE_FUJI_USDC_ADDRESS || '',
    isTestnet: true,
    iconColor: '#E84142',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  177: {
    chainId: 177,
    name: 'HSK Testnet',
    shortName: 'HSK',
    rpcUrl: import.meta.env.VITE_HSK_RPC_URL || 'https://testnet-rpc.hsk.xyz',
    explorerUrl: 'https://testnet-explorer.hsk.xyz',
    escrowAddress: import.meta.env.VITE_HSK_ESCROW_ADDRESS || '',
    usdcAddress: import.meta.env.VITE_HSK_USDC_ADDRESS || '',
    isTestnet: true,
    iconColor: '#2D5BFF',
    nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  },
};

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIG).map(Number);

export const DEFAULT_CHAIN_ID = 43113; // Avalanche Fuji
```

---

## 7. Custom Hooks

### 7.1 useContract Hook

```typescript
// src/hooks/useContract.ts

import { useState, useCallback } from 'react';
import { ContractService } from '../services/contractService';
import { useWallet } from './useWallet';
import toast from 'react-hot-toast';

export function useContract() {
  const { signer, chainId } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const getService = useCallback(() => {
    if (!signer || !chainId) throw new Error('Wallet not connected');
    return new ContractService(signer, chainId);
  }, [signer, chainId]);

  const executeTransaction = useCallback(
    async <T>(
      operation: (service: ContractService) => Promise<T>,
      {
        loadingMessage = 'Procesando transacción...',
        successMessage = '¡Transacción exitosa!',
        errorMessage = 'Error en la transacción',
      } = {}
    ): Promise<T | null> => {
      setIsLoading(true);
      const toastId = toast.loading(loadingMessage);

      try {
        const service = getService();
        const result = await operation(service);
        toast.success(successMessage, { id: toastId });
        return result;
      } catch (error: any) {
        const message = error?.reason || error?.message || errorMessage;
        toast.error(message, { id: toastId });
        console.error('Transaction failed:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getService]
  );

  return { executeTransaction, isLoading, getService };
}
```

### 7.2 useCountdown Hook

```typescript
// src/hooks/useCountdown.ts

import { useState, useEffect } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(deadline: number): CountdownResult {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = deadline - now;
  const isExpired = diff <= 0;

  if (isExpired) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: 'Expirado' };
  }

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return { days, hours, minutes, seconds, isExpired, formatted: parts.join(' ') };
}
```

---

## 8. Routing

```typescript
// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { ChainProvider } from './contexts/ChainContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { Layout } from './components/Layout/Layout';
import { Landing } from './pages/Landing/Landing';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { NewOrder } from './pages/NewOrder/NewOrder';
import { OrderDetail } from './pages/OrderDetail/OrderDetail';

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <ChainProvider>
          <OrdersProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/new" element={<NewOrder />} />
                <Route path="/order/:orderId" element={<OrderDetail />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </OrdersProvider>
        </ChainProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 9. Flujo de Transacciones (Frontend → Chain)

### 9.1 Crear Orden (Flujo Completo)

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│ 1. Validar │     │ 2. Generar │     │ 3. Aprobar │     │ 4. Crear   │
│ Formulario │────>│ Secreto    │────>│ USDC       │────>│ Orden      │
│ (client)   │     │ (client)   │     │ (TX 1)     │     │ (TX 2)     │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                                                                │
       ┌────────────────────────────────────────────────────────┘
       ▼
┌────────────┐     ┌────────────┐     ┌────────────┐
│ 5. Guardar │     │ 6. Mostrar │     │ 7. Generar │
│ Secreto    │────>│ Código al  │────>│ Link       │
│ (localStorage)│  │ Comprador  │     │ Compartible│
└────────────┘     └────────────┘     └────────────┘
```

```typescript
// Pseudocódigo del flujo createOrder
async function handleCreateOrder(params: CreateOrderParams) {
  // 1. Validar inputs
  validateForm(params);

  // 2. Generar secreto
  const { secret, secretHash, displayCode } = SecretService.generateSecret();

  // 3. Calcular monto en unidades mínimas
  const amount = ethers.parseUnits(params.amount, 6); // USDC tiene 6 decimales

  // 4. Calcular deadline
  const deadline = Math.floor(Date.now() / 1000) + (params.deadlineHours * 3600);

  // 5. Verificar allowance
  const allowance = await contractService.getAllowance(address);
  if (allowance < amount) {
    // TX 1: Aprobar USDC
    toast.loading('Aprobando USDC...');
    await contractService.approveUSDC(amount);
    toast.success('USDC aprobado');
  }

  // 6. TX 2: Crear orden
  toast.loading('Creando orden de custodia...');
  const { orderId } = await contractService.createOrder(
    params.sellerAddress, amount, secretHash, deadline, params.description
  );

  // 7. Guardar secreto localmente
  SecretService.storeSecret(orderId, secret);

  // 8. Mostrar resultado
  showSecretModal(displayCode, orderId);
}
```

### 9.2 Estados de UI por Transacción

```
┌─────────────────────────────────────────────────────────┐
│          ESTADOS DE UI DURANTE TRANSACCIÓN               │
│                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐        │
│  │  IDLE    │────>│ PENDING  │────>│ MINING   │        │
│  │  (form)  │     │ (wallet  │     │ (on-chain │       │
│  │          │     │  popup)  │     │  confirm) │       │
│  └──────────┘     └──────────┘     └──────────┘        │
│                        │                  │              │
│                        ▼                  ▼              │
│                  ┌──────────┐     ┌──────────┐          │
│                  │ REJECTED │     │ CONFIRMED│          │
│                  │ (user    │     │ (success │          │
│                  │  denied) │     │  + event)│          │
│                  └──────────┘     └──────────┘          │
│                                        │                │
│                                        ▼                │
│                                  ┌──────────┐           │
│                                  │  FAILED  │           │
│                                  │ (revert) │           │
│                                  └──────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Event Listening (Tiempo Real)

```typescript
// src/services/eventService.ts

import { ethers } from 'ethers';

export class EventService {
  private contract: ethers.Contract;
  private listeners: Map<string, ethers.Listener> = new Map();

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  /**
   * Escucha eventos OrderCreated para el usuario actual
   */
  listenOrderCreated(
    userAddress: string,
    callback: (orderId: string, event: any) => void
  ) {
    // Como comprador
    const buyerFilter = this.contract.filters.OrderCreated(null, userAddress);
    this.contract.on(buyerFilter, (orderId, buyer, seller, ...args) => {
      callback(orderId, { buyer, seller, ...args });
    });

    // Como vendedor
    const sellerFilter = this.contract.filters.OrderCreated(null, null, userAddress);
    this.contract.on(sellerFilter, (orderId, buyer, seller, ...args) => {
      callback(orderId, { buyer, seller, ...args });
    });
  }

  /**
   * Escucha eventos de cambio de estado
   */
  listenOrderUpdates(
    orderId: string,
    callbacks: {
      onDispatched?: (trackingInfo: string) => void;
      onCompleted?: (amount: bigint) => void;
      onRefunded?: (amount: bigint) => void;
    }
  ) {
    if (callbacks.onDispatched) {
      const filter = this.contract.filters.OrderDispatched(orderId);
      this.contract.on(filter, (_id, _seller, trackingInfo) => {
        callbacks.onDispatched!(trackingInfo);
      });
    }

    if (callbacks.onCompleted) {
      const filter = this.contract.filters.OrderCompleted(orderId);
      this.contract.on(filter, (_id, _seller, amount) => {
        callbacks.onCompleted!(amount);
      });
    }

    if (callbacks.onRefunded) {
      const filter = this.contract.filters.OrderRefunded(orderId);
      this.contract.on(filter, (_id, _buyer, amount) => {
        callbacks.onRefunded!(amount);
      });
    }
  }

  /**
   * Detiene todos los listeners
   */
  removeAllListeners() {
    this.contract.removeAllListeners();
    this.listeners.clear();
  }
}
```

---

## 11. Variables de Entorno (Frontend)

```bash
# frontend/.env.example

# ── Avalanche Fuji ──
VITE_FUJI_ESCROW_ADDRESS=0x...
VITE_FUJI_USDC_ADDRESS=0x...

# ── HSK Testnet ──
VITE_HSK_ESCROW_ADDRESS=0x...
VITE_HSK_USDC_ADDRESS=0x...
VITE_HSK_RPC_URL=https://testnet-rpc.hsk.xyz

# ── App Config ──
VITE_APP_NAME=AltiPay Protocol
VITE_DEFAULT_CHAIN_ID=43113
```

---

## 12. Optimización y Performance

### 12.1 Estrategias de Carga

| Estrategia | Implementación |
|-----------|---------------|
| **Code Splitting** | `React.lazy()` para páginas (Dashboard, NewOrder, OrderDetail) |
| **Tree Shaking** | ethers.js v6 es modular — importar solo lo necesario |
| **Caching** | Orders cacheadas en IndexedDB, sincronización incremental por bloques |
| **Skeleton Loading** | Placeholders animados mientras se cargan datos on-chain |
| **Optimistic UI** | Actualizar UI inmediatamente, confirmar con evento on-chain |
| **Debounced RPC** | Agrupar llamadas `getOrder` con debounce de 500ms |

### 12.2 Bundle Size Target

| Módulo | Target Size |
|--------|------------|
| React + Router | ~45 KB gzip |
| ethers.js (parcial) | ~85 KB gzip |
| Framer Motion | ~30 KB gzip |
| App code | ~25 KB gzip |
| **Total** | **< 200 KB gzip** |

---

## 13. Manejo de Errores (UX)

```typescript
// src/utils/errorHandler.ts

export function getHumanReadableError(error: any): string {
  const reason = error?.reason || error?.data?.message || error?.message || '';

  const errorMap: Record<string, string> = {
    'user rejected': 'Transacción cancelada por el usuario.',
    'insufficient funds': 'Saldo insuficiente para cubrir el gas.',
    'Buyer cannot be seller': 'No puedes crear una orden para ti mismo.',
    'Amount must be > 0': 'El monto debe ser mayor a cero.',
    'Deadline must be in the future': 'La fecha límite debe ser futura.',
    'Invalid secret': 'Código secreto incorrecto. Verifica e intenta de nuevo.',
    'Only seller can dispatch': 'Solo el vendedor puede confirmar el despacho.',
    'Only buyer can confirm': 'Solo el comprador puede confirmar la entrega.',
    'Only buyer can refund': 'Solo el comprador puede reclamar el reembolso.',
    'Deadline not reached': 'La fecha límite aún no ha expirado.',
    'Order not funded': 'La orden no está fondeada.',
    'Order not in valid state': 'La orden no está en un estado válido para esta acción.',
    'insufficient allowance': 'Debes aprobar el gasto de USDC primero.',
    'transfer amount exceeds balance': 'Saldo USDC insuficiente.',
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (reason.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  return 'Error desconocido. Por favor intenta de nuevo.';
}
```

---

## 14. SEO y Meta Tags

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- SEO -->
  <title>AltiPay Protocol — Comercio Seguro, Pago Garantizado</title>
  <meta name="description" content="Infraestructura PayFi no custodial para comercio mayorista. Custodia inteligente de pagos en stablecoins con liquidación determinista." />

  <!-- Open Graph -->
  <meta property="og:title" content="AltiPay Protocol" />
  <meta property="og:description" content="Custodia comercial descentralizada para encomiendas interdepartamentales." />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:type" content="website" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="AltiPay Protocol" />
  <meta name="twitter:description" content="Comercio seguro, pago garantizado. PayFi no custodial." />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## 15. Deploy y Hosting

| Opción | Ventaja | Configuración |
|--------|---------|-------------|
| **Vercel** (Recomendado MVP) | Deploy automático desde GitHub, preview por PR | `vercel.json` con rewrites SPA |
| **IPFS** (Post-MVP) | Fully decentralized, censorship resistant | `ipfs deploy` via Fleek o Pinata |
| **GitHub Pages** | Gratis, simple | `vite build` + `gh-pages` branch |

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```
