# AltiPay Protocol — Documento de Diseño (Design System & UX)

> **Versión:** 1.0.0  
> **Estado:** Especificación MVP  
> **Fecha:** 2026-09-11  

---

## 1. Filosofía de Diseño

### 1.1 Principios Fundamentales

| Principio | Descripción |
|-----------|-------------|
| **Confianza Visual** | Cada elemento de la UI debe transmitir seguridad y profesionalismo. Los comerciantes bolivianos necesitan sentir que su dinero está seguro. |
| **Simplicidad Radical** | Usuarios con nivel técnico básico deben poder completar todo el flujo sin asistencia. Máximo 3 clics por operación crítica. |
| **Transparencia On-Chain** | Cada estado del escrow debe ser verificable con un clic al explorador de bloques. |
| **Mobile-First** | >70% del público objetivo opera desde smartphones Android de gama media. |
| **Bilingüe** | Español (primario) con opción a inglés para el hackathon. |

### 1.2 Identidad Visual

```
┌─────────────────────────────────────────────────────────┐
│  ALTIPAY — BRAND IDENTITY                               │
│                                                          │
│  Nombre:     AltiPay (Alti = Altiplano + Pay)            │
│  Tagline:    "Comercio seguro, pago garantizado"         │
│  Tono:       Profesional, confiable, accesible           │
│  Iconografía: Escudo + candado + montaña (Altiplano)     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Sistema de Diseño (Design Tokens)

### 2.1 Paleta de Colores

```css
:root {
  /* ── Colores Primarios ── */
  --color-primary-50:  #EEF2FF;
  --color-primary-100: #E0E7FF;
  --color-primary-200: #C7D2FE;
  --color-primary-300: #A5B4FC;
  --color-primary-400: #818CF8;
  --color-primary-500: #6366F1;   /* Principal — Indigo */
  --color-primary-600: #4F46E5;
  --color-primary-700: #4338CA;
  --color-primary-800: #3730A3;
  --color-primary-900: #312E81;

  /* ── Colores de Acento (Éxito/Fondos liberados) ── */
  --color-success-50:  #ECFDF5;
  --color-success-400: #34D399;
  --color-success-500: #10B981;   /* Verde Esmeralda */
  --color-success-600: #059669;

  /* ── Colores de Alerta ── */
  --color-warning-50:  #FFFBEB;
  --color-warning-400: #FBBF24;
  --color-warning-500: #F59E0B;   /* Ámbar */

  /* ── Colores de Error ── */
  --color-error-50:  #FEF2F2;
  --color-error-400: #F87171;
  --color-error-500: #EF4444;     /* Rojo */

  /* ── Colores de Estado (Orden) ── */
  --status-funded:     #3B82F6;   /* Azul — Fondos bloqueados */
  --status-dispatched: #F59E0B;   /* Ámbar — En tránsito */
  --status-completed:  #10B981;   /* Verde — Entregado */
  --status-refunded:   #8B5CF6;   /* Violeta — Reembolsado */
  --status-cancelled:  #6B7280;   /* Gris — Cancelado */

  /* ── Superficie (Dark Mode) ── */
  --surface-bg:       #0F0F1A;
  --surface-card:     #1A1A2E;
  --surface-elevated: #252542;
  --surface-border:   rgba(255, 255, 255, 0.08);

  /* ── Texto ── */
  --text-primary:   #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted:     #64748B;
  --text-inverse:   #0F172A;

  /* ── Gradientes ── */
  --gradient-primary: linear-gradient(135deg, #6366F1, #8B5CF6);
  --gradient-success: linear-gradient(135deg, #10B981, #34D399);
  --gradient-hero:    linear-gradient(135deg, #0F0F1A 0%, #1E1B4B 50%, #312E81 100%);
  --gradient-glass:   linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05));
}
```

### 2.2 Tipografía

```css
/* ── Font Stack ── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* ── Scale ── */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */

  /* ── Line Heights ── */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### 2.3 Espaciado

```css
:root {
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
}
```

### 2.4 Bordes y Sombras

```css
:root {
  --radius-sm:  0.375rem;  /* 6px */
  --radius-md:  0.5rem;    /* 8px */
  --radius-lg:  0.75rem;   /* 12px */
  --radius-xl:  1rem;      /* 16px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;

  --shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.3);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.4);
  --shadow-xl:  0 20px 25px rgba(0,0,0,0.4);
  --shadow-glow: 0 0 20px rgba(99,102,241,0.3);
}
```

### 2.5 Animaciones

```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
  50%      { box-shadow: 0 0 20px 4px rgba(99,102,241,0.2); }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 3. Componentes de UI

### 3.1 Card de Orden

```
┌────────────────────────────────────────────────────┐
│  ┌──────┐                                          │
│  │ 🔒   │  Orden #A7K9...3PQX                     │
│  │      │  ────────────────────────────             │
│  └──────┘  Estado: ● FUNDED                        │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Comprador        │  │ Vendedor         │         │
│  │ 0x7a3F...8b2C   │  │ 0x9e1D...4f7A   │         │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
│  Monto:    150.00 USDC                              │
│  Deadline: 15 Sep 2026 14:00 (en 3 días)           │
│  Paquete:  "Repuestos freno disco Toyota"           │
│                                                     │
│  ┌──────────────┐  ┌──────────────────────┐        │
│  │ Ver en Chain  │  │ ✅ Confirmar Entrega │        │
│  └──────────────┘  └──────────────────────┘        │
└────────────────────────────────────────────────────┘
```

### 3.2 Formulario de Nueva Orden

```
┌────────────────────────────────────────────────────┐
│                                                     │
│  🛡️  CREAR NUEVA ORDEN DE CUSTODIA                 │
│  ─────────────────────────────────                  │
│                                                     │
│  Wallet del Vendedor                                │
│  ┌──────────────────────────────────────┐           │
│  │ 0x...                                │           │
│  └──────────────────────────────────────┘           │
│                                                     │
│  Monto (USDC)                                       │
│  ┌──────────────────────────────────────┐           │
│  │ 150.00                               │           │
│  └──────────────────────────────────────┘           │
│                                                     │
│  Descripción del Paquete                            │
│  ┌──────────────────────────────────────┐           │
│  │ Repuestos freno disco Toyota Hilux   │           │
│  └──────────────────────────────────────┘           │
│                                                     │
│  Tiempo Límite de Entrega                           │
│  ┌────────────┐                                     │
│  │ 72 horas ▾ │  (3 días desde ahora)               │
│  └────────────┘                                     │
│                                                     │
│  Red Blockchain                                     │
│  ┌────────────────────┐                             │
│  │ Avalanche Fuji   ▾ │                             │
│  └────────────────────┘                             │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │        🔒 FONDEAR CUSTODIA (150 USDC)    │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
│  ⚠️ Necesitas aprobar USDC antes de fondear         │
│                                                     │
└────────────────────────────────────────────────────┘
```

### 3.3 Modal de Confirmación de Entrega

```
┌────────────────────────────────────────────────────┐
│                                                     │
│            🎁  CONFIRMAR RECEPCIÓN                  │
│                                                     │
│  ¿Recibiste la mercadería completa?                 │
│                                                     │
│  Ingresa el código secreto de entrega:              │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │ A L │ │ T I │ │ 7 K │ │ 9 M │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                     │
│  ⚠️ Esta acción es IRREVERSIBLE.                    │
│  Los fondos se liberarán inmediatamente al          │
│  vendedor.                                          │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │      ✅ LIBERAR 150.00 USDC AL VENDEDOR  │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │              Cancelar                     │       │
│  └──────────────────────────────────────────┘       │
│                                                     │
└────────────────────────────────────────────────────┘
```

### 3.4 Barra de Progreso de Orden

```
Estado de la Orden:

  ● CREADA ──────── ● FONDEADA ──────── ● DESPACHADA ──────── ● ENTREGADA
    ✓ Done           ✓ Done              ◉ Actual              ○ Pendiente
    12 Sep            12 Sep              13 Sep
    10:30             10:32               08:15
```

---

## 4. Flujos de Usuario (User Flows)

### 4.1 Flujo del Comprador — Crear Orden

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌───────────┐
│ Conectar │────>│  Formulario│────>│  Aprobar     │────>│  Fondear  │
│  Wallet  │     │  Nueva     │     │  USDC        │     │  Escrow   │
│          │     │  Orden     │     │  (ERC-20)    │     │           │
└──────────┘     └───────────┘     └──────────────┘     └───────────┘
                                                               │
                                                               ▼
                                                        ┌───────────┐
                                                        │  Recibir  │
                                                        │  Código   │
                                                        │  Secreto  │
                                                        └───────────┘
                                                               │
                                                               ▼
                                                        ┌───────────┐
                                                        │  Compartir│
                                                        │  Link al  │
                                                        │  Vendedor │
                                                        └───────────┘
```

### 4.2 Flujo del Vendedor — Confirmar Despacho

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌───────────┐
│ Conectar │────>│  Ver Orden │────>│  Verificar   │────>│  Confirmar│
│  Wallet  │     │  Recibida  │     │  Fondos      │     │  Despacho │
│          │     │            │     │  Bloqueados  │     │           │
└──────────┘     └───────────┘     └──────────────┘     └───────────┘
                                                               │
                                                               ▼
                                                        ┌───────────┐
                                                        │  Agregar  │
                                                        │  Tracking │
                                                        │  (Opc.)   │
                                                        └───────────┘
                                                               │
                                                               ▼
                                                        ┌───────────┐
                                                        │  Esperar  │
                                                        │  Entrega  │
                                                        │  + Pago   │
                                                        └───────────┘
```

### 4.3 Flujo de Confirmación de Entrega

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│  Comprador   │────>│  Ingresar     │────>│  Contrato        │
│  recibe      │     │  Código       │     │  verifica hash   │
│  carga       │     │  Secreto      │     │  y libera fondos │
└──────────────┘     └───────────────┘     └──────────────────┘
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │  USDC llega  │
                                             │  al vendedor │
                                             │  ✅ COMPLETO  │
                                             └──────────────┘
```

---

## 5. Arquitectura de Pantallas (Sitemap)

```
                          ┌─────────────┐
                          │   Landing   │
                          │   Page      │
                          └──────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
              │ Dashboard │ │ Nueva  │ │  Orden   │
              │ (Mis      │ │ Orden  │ │  Detalle │
              │  Órdenes) │ │ Form   │ │  /id     │
              └───────────┘ └────────┘ └──────────┘
```

### 5.1 Descripción de Pantallas

| Pantalla | Ruta | Descripción |
|----------|------|-------------|
| **Landing** | `/` | Hero con propuesta de valor, CTA para conectar wallet, explicación visual del flujo |
| **Dashboard** | `/dashboard` | Lista de órdenes del usuario (como comprador y vendedor), filtros por estado |
| **Nueva Orden** | `/new` | Formulario para crear nueva orden de custodia |
| **Detalle de Orden** | `/order/:id` | Vista detallada de una orden con acciones contextuales según rol y estado |

---

## 6. Diseño Responsivo

### 6.1 Breakpoints

```css
/* Mobile First */
@media (min-width: 480px)  { /* sm  — Smartphones grandes */ }
@media (min-width: 768px)  { /* md  — Tablets              */ }
@media (min-width: 1024px) { /* lg  — Laptops              */ }
@media (min-width: 1280px) { /* xl  — Desktop              */ }
```

### 6.2 Layout Grid

```
Mobile (< 768px):          Desktop (≥ 1024px):
┌──────────────────┐       ┌───────┬──────────────────┐
│    Header/Nav    │       │ Side  │   Main Content   │
├──────────────────┤       │ Nav   │                  │
│                  │       │       │  ┌──────┬──────┐ │
│  Main Content    │       │       │  │ Card │ Card │ │
│  (Full Width)    │       │       │  ├──────┼──────┤ │
│                  │       │       │  │ Card │ Card │ │
│                  │       │       │  └──────┴──────┘ │
├──────────────────┤       │       │                  │
│   Bottom Nav     │       │       │                  │
└──────────────────┘       └───────┴──────────────────┘
```

---

## 7. Efectos Visuales y Micro-Animaciones

### 7.1 Glassmorphism (Cards)

```css
.glass-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
```

### 7.2 Hover Effects

```css
.order-card {
  transition: transform var(--transition-base),
              box-shadow var(--transition-base);
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow);
}
```

### 7.3 Status Indicator (Pulso)

```css
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: pulse-glow 2s ease-in-out infinite;
}

.status-dot--funded    { background: var(--status-funded); }
.status-dot--dispatched { background: var(--status-dispatched); }
.status-dot--completed  { background: var(--status-completed); }
```

### 7.4 Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-card) 25%,
    var(--surface-elevated) 50%,
    var(--surface-card) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
```

---

## 8. Iconografía y Estados Visuales

### 8.1 Iconos de Estado

| Estado | Icono | Color | Significado |
|--------|-------|-------|-------------|
| FUNDED | 🔒 | Azul `#3B82F6` | Fondos bloqueados en custodia |
| DISPATCHED | 🚚 | Ámbar `#F59E0B` | Carga en tránsito |
| COMPLETED | ✅ | Verde `#10B981` | Entrega confirmada, fondos liberados |
| REFUNDED | ↩️ | Violeta `#8B5CF6` | Reembolso ejecutado |
| CANCELLED | ❌ | Gris `#6B7280` | Orden cancelada |

### 8.2 Indicadores de Red/Chain

| Red | Color Badge | Icono |
|-----|-------------|-------|
| Avalanche Fuji | Rojo `#E84142` | ◆ |
| HSK Testnet | Azul `#2D5BFF` | ⬡ |
| Pollar Mainnet | Verde `#00D395` | ● |

---

## 9. Accesibilidad (a11y)

| Requisito | Implementación |
|-----------|---------------|
| Contraste mínimo | Ratio 4.5:1 para texto normal, 3:1 para texto grande |
| Navegación por teclado | Tab order lógico en formularios y acciones |
| Screen readers | ARIA labels en botones de acción y estados |
| Tamaño de touch target | Mínimo 44x44px en móvil |
| Indicadores no-color | Iconos + texto acompañan cada indicador de color |
| Feedback háptico | Vibración en confirmación de acciones críticas (móvil) |

---

## 10. Internacionalización (i18n)

| Key | Español (default) | English |
|-----|-------------------|---------|
| `nav.dashboard` | Mis Órdenes | My Orders |
| `nav.newOrder` | Nueva Orden | New Order |
| `order.status.funded` | Fondos Bloqueados | Funds Locked |
| `order.status.dispatched` | En Tránsito | In Transit |
| `order.status.completed` | Entregado | Delivered |
| `order.status.refunded` | Reembolsado | Refunded |
| `action.fund` | Fondear Custodia | Fund Escrow |
| `action.confirm` | Confirmar Entrega | Confirm Delivery |
| `action.refund` | Reclamar Reembolso | Claim Refund |
| `warning.irreversible` | Esta acción es IRREVERSIBLE | This action is IRREVERSIBLE |
