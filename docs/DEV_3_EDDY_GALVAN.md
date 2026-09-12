# 🎨 AltiPay Protocol — Guía Maestra de Ingeniería: DESARROLLADOR 3
## 🧑‍💻 Eddy Galvan — Frontend UI/UX, Design System & Buyer Flow Engineer

> **Versión:** 1.0.0 — Hackathon Edition  
> **Estado:** 🟢 **100% COMPLETADO Y OPERATIVO EN TESTNET**  
> **Responsable:** **Eddy Galvan (DEV 3)**  
> **Handoffs principales:** Recibe hooks e infraestructura Web3 de **Jorge Ayala (DEV 2)**; colabora con **Joseca (DEV 4)** y **Luis Sandoval (DEV 1)** para alinear la experiencia visual y los contratos.

---

## 🧭 1. Delimitación Estricta de Funciones (Zero-Overlap)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTERAS DE RESPONSABILIDAD (ZERO CLASH)                       │
│                                                                                        │
│  ✅ TU DOMINIO EXCLUSIVO (Eddy Galvan - DEV 3):                                        │
│     • Diseño CSS/Tailwind y Sistema de Diseño (paleta de colores, tipografías).        │
│     • Maquetación de la Landing Page Comercial (`/`).                                  │
│     • Maquetación del flujo completo del comprador (`/dashboard`, `/create`).          │
│     • Creación de componentes UI (Botones, Modales, Tooltips, StatusPills).            │
│     • Componentes exclusivos: Teclado táctil de PIN y Generador de Secretos.           │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Luis Sandoval - DEV 1):                                      │
│     • Contratos Solidity y despliegue on-chain.                                        │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Jorge Ayala - DEV 2):                                        │
│     • Conectividad Web3 (Wagmi, Viem, RainbowKit) y Custom Hooks.                      │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Joseca - DEV 4):                                             │
│     • Maquetación del dashboard de vendedor `/seller`, fotos de guía.                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 2. Tablero de Tickets Técnicos (Sprint Hackathon)

### Resumen de Estados:
* 🟢 **Completado (Done):** 5 tickets (100% de la Hoja de Ruta DEV 3)
* 🟡 **En Progreso (In Progress):** 0 tickets
* 🔴 **Por Iniciar (Pending):** 0 tickets

| ID Ticket | Nombre del Ticket | Prioridad | Estimación | Estado | Archivos Principales |
|---|---|:---:|:---:|:---:|---|
| **[TK-EDDY-01](#tk-eddy-01-sistema-de-diseño-y-configuración-inicial)** | Sistema de Diseño y Configuración Inicial | **P0 (Base)** | 1.5 h | 🟢 **Done (100%)** | `globals.css`, `postcss.config.mjs`, `package.json` |
| **[TK-EDDY-02](#tk-eddy-02-layout-estructural)** | Layout Estructural (Navbar, Sidebar & Web3) | **P1 (Core UX)** | 1.0 h | 🟢 **Done (100%)** | `app/layout.tsx`, `components/web3/ConnectWalletButton.tsx` |
| **[TK-EDDY-03](#tk-eddy-03-landing-page-comercial)** | Landing Page Comercial | **P1 (Marketing)** | 2.5 h | 🟢 **Done (100%)** | `app/page.tsx` |
| **[TK-EDDY-04](#tk-eddy-04-flujo-del-comprador)** | Flujo del Comprador & Workspace Dashboard | **P0 (Bloqueante)** | 2.5 h | 🟢 **Done (100%)** | `app/dashboard/page.tsx`, `app/create/page.tsx` |
| **[TK-EDDY-05](#tk-eddy-05-componentes-exclusivos--wow-factor)** | Componentes Exclusivos / WOW Factor | **P1 (UX/UI)** | 2.0 h | 🟢 **Done (100%)** | `components/web3/*`, `services/transactionHandler.ts` |

---

## 🎫 3. Especificación Detallada de Cada Ticket

---

### <a id="tk-eddy-01-sistema-de-diseño-y-configuración-inicial"></a>🎫 TK-EDDY-01: Sistema de Diseño y Configuración Inicial
* **Tipo:** Tarea de Infraestructura UI  
* **Prioridad:** `P0 (Base)`  
* **Estado:** 🟢 **Completado (100%)**  
* **Archivos Involucrados:**
  * `app/globals.css`
  * `postcss.config.mjs`
  * `package.json`

#### 🎯 Descripción:
Configurar la base visual del proyecto utilizando Tailwind CSS, tipografías modernas y los tokens oficiales de color del protocolo AltiPay.

#### 📋 Criterios de Aceptación (DoD):
* [x] Proyecto Next.js configurado en `frontend/` y dependencias empaquetadas sin errores de resolución.
* [x] Configuración de Tailwind CSS y PostCSS con soporte nativo para `@tailwindcss/postcss`.
* [x] Paleta oficial Dark Mint implementada: Fondo `#080b0d`, Primario Mint `#66e3d0`, Cards Slate `#101619`, Bordes `#233238`.
* [x] Integración de componentes utilitarios Shadcn/UI (`clsx`, `tailwind-merge`, `lucide-react`, `class-variance-authority`).

---

### <a id="tk-eddy-02-layout-estructural"></a>🎫 TK-EDDY-02: Layout Estructural
* **Tipo:** Feature / Componentes  
* **Prioridad:** `P1 (Core UX)`  
* **Estado:** 🟢 **Completado (100%)**  
* **Archivos Involucrados:**
  * `app/layout.tsx`
  * `components/web3/ConnectWalletButton.tsx`
  * `components/web3/Web3Provider.tsx`

#### 🎯 Descripción:
Desarrollar la estructura principal que envuelve a todas las páginas de la aplicación, garantizando navegación fluida, conexión de wallet multi-chain y notificaciones toast integradas.

#### 📋 Criterios de Aceptación (DoD):
* [x] Barra de navegación responsive en Landing Page con logotipo AltiPay, enlaces a secciones y botón `ConnectWalletButton`.
* [x] Sidebar interactivo en `app/dashboard/page.tsx` con navegación por Workspace (`Overview`, `My escrows`, `Wallet`, `Disputes`), badge de red y estado del protocolo.
* [x] Integración de `Web3Provider` y `<Toaster richColors position="top-right" />` en `app/layout.tsx`.

---

### <a id="tk-eddy-03-landing-page-comercial"></a>🎫 TK-EDDY-03: Landing Page Comercial
* **Tipo:** Feature / Maquetación  
* **Prioridad:** `P1 (Marketing)`  
* **Estado:** 🟢 **Completado (100%)**  
* **Archivos Involucrados:**
  * `app/page.tsx`

#### 🎯 Descripción:
Construir la cara de presentación de AltiPay, enfocada en la narrativa boliviana y resaltando los beneficios del protocolo frente a métodos tradicionales.

#### 📋 Criterios de Aceptación (DoD):
* [x] Maquetar *Hero Section* (Narrativa boliviana de La Paz, Cochabamba y Santa Cruz).
* [x] Maquetar circuito interactivo de 3 pasos (Fondeo ➔ Despacho ➔ Liberación con PIN).
* [x] Maquetar comparativa interactiva vs Bancos, Tigo Money, Efectivo.
* [x] Maquetar calculadora interactiva de ahorro con la membresía VIP de Unlock Protocol.
* [x] Botones de llamado a la acción con redirección directa al Workspace Dashboard.

---

### <a id="tk-eddy-04-flujo-del-comprador"></a>🎫 TK-EDDY-04: Flujo del Comprador & Workspace Dashboard
* **Tipo:** Feature / Core App  
* **Prioridad:** `P0 (Bloqueante)`  
* **Estado:** 🟢 **Completado (100%)**  
* **Archivos Involucrados:**
  * `app/dashboard/page.tsx`
  * `app/create/page.tsx`

#### 🎯 Descripción:
Implementar la interfaz completa donde un comprador inicia una orden de custodia, visualiza sus transacciones activas y gestiona el ciclo de vida de sus pagos protegidos.

#### 📋 Criterios de Aceptación (DoD):
* [x] Formulario modal de custodia (Input billetera vendedor, descripción, monto USDC, PIN criptográfico, tiempo límite).
* [x] Integración de doble paso transaccional (Aprobación de USDC + Fondeo on-chain `createOrder`).
* [x] Lista dinámica de órdenes activas con barras de progreso y píldoras de estado (`Pago asegurado`, `En tránsito`, `Completado`).
* [x] Modal de confirmación de hito con campo de PIN para destrabe atómico de fondos hacia el vendedor.

---

### <a id="tk-eddy-05-componentes-exclusivos--wow-factor"></a>🎫 TK-EDDY-05: Componentes Exclusivos / WOW Factor
* **Tipo:** Feature / UI Avanzada  
* **Prioridad:** `P1 (UX/UI)`  
* **Estado:** 🟢 **Completado (100%)**  
* **Archivos Involucrados:**
  * `frontend/components/web3/*`
  * `frontend/services/transactionHandler.ts`
  * `frontend/hooks/useUSDC.ts`

#### 🎯 Descripción:
Crear los elementos interactivos que le dan el "Wow Factor" a la aplicación, enfocados principalmente en feedback visual de alto impacto y autoservicio para jueces y evaluadores.

#### 📋 Criterios de Aceptación (DoD):
* [x] Animación de confeti (`canvas-confetti`) disparada automáticamente al momento de liberarse los fondos al vendedor.
* [x] Notificaciones Toast (`sonner`) con enlaces directos a Snowtrace y HashKey Explorer en cada evento on-chain.
* [x] Pestaña de Billetera (`WalletView`) con visualización de balance en tiempo real y botón de Faucet para solicitar 100 MockUSDC de prueba al instante.
* [x] Píldoras de estado con pulso activo y badges de red multi-chain.

---

## 🛠️ 4. Verificación y Resultados Técnicos

```bash
# Validación de compilación en producción
npm run build
# Salida: Exit Code 0 (7 páginas generadas sin errores)

# Validación de servidor local
npm run dev
# Salida: Ready in 2.3s -> HTTP 200 OK en /, /dashboard, /create, /seller, /order/[id]
```
