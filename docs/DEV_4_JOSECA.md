# 📦 AltiPay Protocol — Guía Maestra de Ingeniería: DESARROLLADOR 4
## 🧑‍💻 Jose Carlos (Joseca) — Seller Dashboard, Off-Chain Services & E2E Testing

> **Versión:** 1.0.0 — Hackathon Edition  
> **Estado:** Documento de Planificación y Ejecución Técnica por Tickets  
> **Responsable:** **Joseca (DEV 4)**  
> **Enfoque principal:** Flujo del vendedor, trazabilidad física de encomiendas, capa off-chain y pruebas E2E.
> **Handoffs principales:** Consume los diseños base de **Eddy Galvan (DEV 3)** y conectará los botones transaccionales con los hooks construidos por **Jorge Ayala (DEV 2)**.

---

## 🧭 1. Delimitación Estricta de Funciones (Zero-Overlap)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTERAS DE RESPONSABILIDAD (ZERO CLASH)                       │
│                                                                                        │
│  ✅ TU DOMINIO EXCLUSIVO (Joseca - DEV 4):                                             │
│     • Dashboard del vendedor (`app/seller/page.tsx`).                                  │
│     • Interfaz de seguimiento público de encomiendas (`app/order/[id]/page.tsx`).      │
│     • Componentes de logística: `DispatchModal`, `GuiaUploader`, `OrderTimeline`.      │
│     • Servicios API Off-chain para metadata (`app/api/orders/[id]/route.ts`).          │
│     • Pruebas de integración E2E automatizadas (`test/e2e/escrow-flow.test.ts`).       │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Luis Sandoval - DEV 1):                                      │
│     • Contratos Solidity y despliegues On-chain.                                       │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Jorge Ayala - DEV 2):                                        │
│     • Hooks de Wagmi, RainbowKit, conectividad de red y servicios web3 base.           │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Eddy Galvan - DEV 3):                                        │
│     • Creación de órdenes (Flujo del comprador), Keypad táctil de liberación de fondos.│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 2. Tablero de Tickets Técnicos (Sprint Hackathon)

### Resumen de Estados:
* 🟢 **Completado (Done):** 7 tickets (100% de la Hoja de Ruta Técnica DEV 4)
* 🟡 **En Progreso (In Progress):** 0 tickets
* 🔴 **Por Iniciar (Pending):** 0 tickets
*(Nota: Las tareas administrativas como el Video/Pitch de Vaquita han sido omitidas de este tablero de código).*

| ID Ticket | Nombre del Ticket | Prioridad | Estimación | Estado | Archivos Principales |
|---|---|:---:|:---:|:---:|---|
| **TK-JOSECA-01** | Arquitectura de Datos Simulados (Mock) | **P0 (Bloqueante)** | 0.5 h | 🟢 **Done (100%)** | `lib/mockData.ts` |
| **TK-JOSECA-02** | Componente de Timeline (Stepper) | **P1 (Core UX)** | 1.0 h | 🟢 **Done (100%)** | `components/common/OrderTimeline.tsx` |
| **TK-JOSECA-03** | Modales de Logística y Despacho | **P1 (Core UX)** | 1.5 h | 🟢 **Done (100%)** | `components/seller/DispatchModal.tsx`, `GuiaUploader.tsx` |
| **TK-JOSECA-04** | Dashboard Principal del Vendedor | **P0 (Bloqueante)** | 2.5 h | 🟢 **Done (100%)** | `app/seller/page.tsx` |
| **TK-JOSECA-05** | Página Pública de Rastreo | **P1 (Core UX)** | 1.0 h | 🟢 **Done (100%)** | `app/order/[id]/page.tsx` |
| **TK-JOSECA-06** | API Backend-for-Frontend de Metadata | **P2 (Integración)** | 0.5 h | 🟢 **Done (100%)** | `api/orders/[id]/route.ts` |
| **TK-JOSECA-07** | E2E Testing del Protocolo (Playwright) | **P0 (QA)** | 1.0 h | 🟢 **Done (100%)** | `test/e2e/escrow-flow.test.ts` |

---

## 🎫 3. Especificación Detallada de Cada Ticket

### 🎫 TK-JOSECA-01: Arquitectura de Datos Simulados (Mock)
* **Estado:** 🟢 **Done (100%)**
* **Descripción:** Extraer la data cableada del monolito original y organizarla en el tipo `Order` tipado en TypeScript. 
* **DoD (Definición de Terminado):** Se creó el enumerador `OrderStatus` y el arreglo `MOCK_ORDERS` que simula estados reales del contrato para poder construir la UI sin depender de DEV 2.

### 🎫 TK-JOSECA-02: Componente de Timeline (Stepper)
* **Estado:** 🟢 **Done (100%)**
* **Descripción:** Un componente reutilizable de 3 a 4 pasos (Fondeado ➔ En Tránsito ➔ Completado) con una barra de progreso que se ajusta de acuerdo al estado del escrow.
* **DoD:** Diseñado con Tailwind, soporta visualización dinámica de progreso al 33%, 66% y 100%.

### 🎫 TK-JOSECA-03: Modales de Logística y Despacho
* **Estado:** 🟢 **Done (100%)**
* **Descripción:** Flujo que permite al vendedor registrar que el paquete ya fue entregado a la flota o empresa de transporte.
* **DoD:** Input de texto para la empresa/código de rastreo, simulador de Drag&Drop para una foto (Guía), y emisión del evento a la interfaz principal.

### 🎫 TK-JOSECA-04: Dashboard Principal del Vendedor
* **Estado:** 🟢 **Done (100%)**
* **Descripción:** Adaptar la vista maestra de la landing para reflejar la perspectiva del Vendedor. Listado de "Órdenes Activas".
* **DoD:** Muestra de forma destacada los "Depósitos Bloqueados y Garantizados" (para generar confianza visual). Permite interactuar con los modales para cambiar el estado de Fondeado a Despachado.

### 🎫 TK-JOSECA-05: Página Pública de Rastreo
* **Estado:** 🟢 **Done (100%)**
* **Descripción:** Una URL única (`/order/ALT-8924`) independiente del Dashboard.
* **DoD:** Muestra la trazabilidad física. Accesible para cualquier persona (comprador o chofer) para corroborar la existencia del depósito garantizado.

### 🎫 TK-JOSECA-06: API Backend-for-Frontend de Metadata
* **Estado:** 🟢 **Done (100%)**
* **Descripción:** API Route de Next.js.
* **DoD:** `GET /api/orders/[id]` responde un JSON limpio. Prepara el terreno para OpenGraph Preview en redes sociales y servicios off-chain futuros.

### 🎫 TK-JOSECA-07: E2E Testing del Protocolo
* **Estado:** 🟢 **Done (100%)**
* **Descripción:** Implementación de pruebas end-to-end usando Playwright basándose en el documento `ACCEPTANCE_SCENARIOS.md`.
* **DoD:** El test garantiza el flujo principal de interfaz del Vendedor: entra, verifica depósito, despacha, revisa página pública, y consulta API. 
