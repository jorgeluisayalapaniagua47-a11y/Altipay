# 📊 AltiPay Protocol — Reporte de Progreso y Estado del MVP

> **Fecha de Actualización:** 2026-09-12  
> **Contexto:** Buildathon Cochabamba 2026 / EAG Global Hackathon  
> **Objetivo del Documento:** Medir con exactitud el avance técnico de cada uno de los 4 desarrolladores y el porcentaje global de completitud del MVP para la entrega final.

---

## 🎯 1. Resumen Ejecutivo del Progreso Global

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          PROGRESO GLOBAL DEL PROYECTO MVP                             │
│                                                                                        │
│   ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   32.5% COMPLETADO                     │
│                                                                                        │
│   • Arquitectura y Especificación: 100%                                                │
│   • Núcleo de Smart Contracts (Solidity): 90%                                         │
│   • Integración Web3 y SDKs de Bounties: 8%                                            │
│   • Frontend UI/UX (Landing & Comprador): 5%                                           │
│   • Dashboard Vendedor, Pruebas E2E & Pitch: 5%                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 2. Métricas de Progreso por Desarrollador

| Desarrollador | Rol Técnico Principal | % Completado | Estado Actual | Tareas Clave Próximas |
|---|---|:---:|:---:|---|
| **Luis Sandoval**<br/>*(DEV 1)* | **Smart Contracts & Protocol Core** | **94%** | 🟢 **HSK Desplegado en Vivo** | Reclamar AVAX en faucet.avax.network y correr deploy de Fuji. |
| **Jorge Ayala**<br/>*(DEV 2)* | **Web3 Core & Patrocinadores SDK** | **8%** | 🟡 **Desbloqueado para Iniciar** | Montar hooks Wagmi con `deployedContracts.ts` e integrar checkout de Pollar. |
| **Eddy Galvan**<br/>*(DEV 3)* | **UI/UX, Design System & Buyer Flow** | **5%** | 🟡 **Desbloqueado para Iniciar** | Maquetar Landing Page y vista de creación de orden con generador de PIN. |
| **Joseca**<br/>*(DEV 4)* | **Seller Flow, Off-Chain & Pitch/Video** | **5%** | 🟡 **Desbloqueado para Iniciar** | Maquetar Dashboard Vendedor y preparar guión del video Bounty Vaquita. |

---

## ⚖️ 3. Ponderación Técnica de las Capas del MVP

Para evitar números arbitrarios, el porcentaje de avance global se calcula ponderando la dificultad, tiempo y valor de cada capa técnica del protocolo:

| Capa del Sistema | Responsable | Peso en el MVP | % de la Capa Completado | Aporte al Total |
|---|---|:---:|:---:|:---:|
| **1. Arquitectura & Especificaciones** | Todo el Equipo | 15% | 100% | **15.0%** |
| **2. Smart Contracts, Gas & Tests** | Luis Sandoval (DEV 1) | 30% | 88% | **26.4%** |
| **3. Web3 Core & SDKs (Pollar/Unlock)** | Jorge Ayala (DEV 2) | 20% | 8% | **1.6%** |
| **4. Frontend Comprador & Design System** | Eddy Galvan (DEV 3) | 15% | 5% | **0.8%** |
| **5. Dashboard Vendedor, E2E & Media** | Joseca (DEV 4) | 20% | 5% | **1.0%** |
| **TOTAL PONDERADO DEL PROYECTO** | — | **100%** | — | **34.8%** |

---

## 🔍 4. Detalle Quirúrgico por Desarrollador

---

### 🧑‍💻 DESARROLLADOR 1: Luis Sandoval
> **Estatus:** **88% de sus objetivos completados.**  
> El núcleo blockchain está **completamente escrito, compilado y con 15/15 tests unitarios pasando**. La base crítica del protocolo está asegurada.

#### ✅ Realizado (100% de la lógica de contratos):
* [x] Configuración de toolchain Hardhat v2 con TypeScript (`hardhat.config.ts`, `package.json`, `tsconfig.json`).
* [x] Redes configuradas: Avalanche Fuji (43113) y HSK Testnet (177).
* [x] Desarrollo de `contracts/AltiPayEscrow.sol`:
  * Fondeo y custodia condicional con `createOrder`.
  * Validación criptográfica atómica `keccak256(secret) == secretHash`.
  * Integración de descuento VIP con Unlock Protocol (0% fee waiver).
  * Reembolso por timeout unilateral con `claimRefund`.
  * Cancelación previa a despacho con `cancelOrder`.
  * Protección contra reentrancy y patrón CEI (*Checks-Effects-Interactions*).
* [x] Desarrollo de `contracts/MockUSDC.sol` con 6 decimales y función pública `faucet(...)`.
* [x] Interfaces `IAltiPayEscrow.sol` e `IUnlockLock.sol`.
* [x] Suite de pruebas automatizadas con **15 tests pasando en 670ms** (`test/AltiPayEscrow.test.ts`).
* [x] Script de exportación automática (`scripts/export-artifacts.ts`) ejecutado: generó `frontend/contracts/deployedContracts.ts` para Jorge Ayala.

#### ⏳ Pendiente (12% restante):
* [ ] Desplegar `MockUSDC` y `AltiPayEscrow` en la testnet pública de **Avalanche Fuji** usando una clave con faucet AVAX.
* [ ] Desplegar `MockUSDC` y `AltiPayEscrow` en la testnet pública de **HSK Chain** usando una clave con faucet HSK.
* [ ] Verificar el código fuente en Snowtrace (Avalanche) y en el explorador oficial de HSK.
* [ ] Distribuir tokens `MockUSDC` a las wallets de Jorge, Eddy y Joseca.

---

### ⚡ DESARROLLADOR 2: Jorge Ayala
> **Estatus:** **8% de sus objetivos completados.**  
> Tiene a su disposición los ABIs y tipos completos en `frontend/contracts/deployedContracts.ts`. Su tarea es levantar la infraestructura Web3 del frontend.

#### ✅ Realizado:
* [x] Especificación técnica de integración definida en `docs/FRONTEND_ARCHITECTURE.md`.
* [x] ABIs y tipos generados automáticamente y listos en `frontend/contracts/deployedContracts.ts`.

#### 🟡 En Proceso / Por Arrancar Inmediatamente:
* [ ] Inicializar la aplicación Next.js 14 / Scaffold-ETH 2 en la carpeta `frontend/`.
* [ ] Configurar los providers de RainbowKit y Wagmi v2 (`config/wagmi.ts`) apuntando a Avalanche Fuji y HSK Testnet.
* [ ] Integrar el SDK `@pollar/react` para el botón de fondeo en mainnet con USDC (*Bounty Pollar*).
* [ ] Crear el hook `useUnlockVIP()` consumiendo el Lock de membresía (*Bounty Unlock Protocol*).
* [ ] Construir los custom hooks: `useCreateOrder`, `useConfirmDispatch`, `useConfirmDelivery`, `useClaimRefund`.
* [ ] Manejo visual de transacciones: toasts de confirmación, loaders y gestión de errores de wallet (MetaMask/Coinbase).

---

### 🎨 DESARROLLADOR 3: Eddy Galvan
> **Estatus:** **5% de sus objetivos completados.**  
> El sistema de diseño visual y las especificaciones de pantalla están 100% documentadas en `docs/DESIGN.md`. Su foco es la interfaz del comprador y landing page.

#### ✅ Realizado:
* [x] Paleta de colores AltiPay, tokens de diseño y tipografías definidos en `docs/DESIGN.md`.
* [x] Wireframes y flujos del comprador especificados en `docs/FRONTEND_ARCHITECTURE.md`.

#### 🟡 En Proceso / Por Arrancar Inmediatamente:
* [ ] Configurar Tailwind CSS con los tokens oficiales de AltiPay (Indigo `#6366F1`, Verde Esmeralda `#10B981`, Slate oscuro).
* [ ] Construir los componentes UI base (Button, Card, Modal, Input, Badge).
* [ ] Maquetar la **Landing Page (`/`)**: Hero section comercial, comparativa interactiva vs bancos/Tigo Money y flujo en 3 pasos.
* [ ] Maquetar la vista **Crear Custodia (`/create`)**: formulario de monto en USDC, wallet del vendedor y selector de plazo.
* [ ] Construir el **Generador de PIN Criptográfico**: genera el secreto de 6 dígitos y calcula el hash `keccak256`.
* [ ] Construir el **Keypad Táctil Mobile-First**: teclado numérico para smartphones para ingresar el PIN al recibir la mercadería.

---

### 📦 DESARROLLADOR 4: Joseca
> **Estatus:** **5% de sus objetivos completados.**  
> Todos los escenarios BDD de aceptación están listos en `docs/ACCEPTANCE_SCENARIOS.md`. Su foco es el dashboard del vendedor, trazabilidad física y liderar el pitch.

#### ✅ Realizado:
* [x] Escenarios de aceptación Gherkin documentados al 100% en `docs/ACCEPTANCE_SCENARIOS.md`.
* [x] Arquitectura de tracking y datos off-chain definidos en `docs/DATA_MODEL.md`.

#### 🟡 En Proceso / Por Arrancar Inmediatamente:
* [ ] Maquetar el **Dashboard del Vendedor (`/seller`)**: lista de pedidos con la tarjeta verde destacada *"Depósito Garantizado"*.
* [ ] Construir el modal de despacho con subida y preview de foto de guía de transporte (Flota Bolívar/El Dorado).
* [ ] Implementar la **Línea de Tiempo de la Encomienda (`/order/[id]`)** con stepper visual interactivo.
* [ ] Generador de código QR y link compartible para enviar al chofer o comprador por WhatsApp.
* [ ] Redactar el guión y grabar el video vertical para el **Bounty Vaquita (100 USDC)**.
* [ ] Diseñar las diapositivas de presentación (Pitch Deck) para el jurado de Devfolio / EAG Global.

---

## 🚦 5. Semáforo de Desbloqueo: ¿Qué debe hacer el equipo AHORA?

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                PLAN DE ACCIÓN INMEDIATO                               │
│                                                                                       │
│  1. LUIS SANDOVAL (DEV 1) ──> Conseguir faucet testnet AVAX/HSK y ejecutar scripts    │
│                               de deploy para tener direcciones públicas en vivo.      │
│                                                                                       │
│  2. JORGE AYALA (DEV 2)   ──> Inicializar el frontend de Next.js y conectar Wagmi     │
│                               con el archivo frontend/contracts/deployedContracts.ts  │
│                                                                                       │
│  3. EDDY GALVAN (DEV 3)   ──> Maquetar el Landing Page y la vista de Crear Orden      │
│                               utilizando Tailwind CSS y el diseño de docs/DESIGN.md   │
│                                                                                       │
│  4. JOSECA (DEV 4)        ──> Comenzar el Dashboard del Vendedor y redactar el        │
│                               guión del video TikTok de Vaquita sobre el comercio.    │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 6. Conclusión y Proyección

* **La fase más crítica y riesgosa (la seguridad de los fondos en Smart Contracts) ya está resuelta y validada al 88%.**
* El proyecto está listo para un desarrollo paralelo acelerado: los desarrolladores de frontend (Jorge, Eddy y Joseca) pueden avanzar simultáneamente sin pisarse, gracias a que los contratos y ABIs ya están formalizados.
* Siguiendo este ritmo, el proyecto alcanzará el **70% al finalizar las integraciones UI/Web3** y el **100% tras el testeo E2E y el video demo**.
