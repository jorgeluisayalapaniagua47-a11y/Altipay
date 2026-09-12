# 🎨 AltiPay Protocol — Guía Maestra de Ingeniería: DESARROLLADOR 3
## 🧑‍💻 Eddy Galvan — Frontend UI/UX, Design System & Buyer Flow Engineer

> **Versión:** 1.0.0 — Hackathon Edition  
> **Estado:** Documento de Planificación y Ejecución Técnica por Tickets  
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
│     • Maquetación del flujo completo del comprador (`/create`).                        │
│     • Creación de componentes UI (Botones, Modales, Tooltips).                         │
│     • Componentes exclusivos: Teclado táctil (KeypadRelease) y Generador de Secretos.  │
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
* 🟢 **Completado (Done):** 0 tickets
* 🟡 **En Progreso (In Progress):** 0 tickets
* 🔴 **Por Iniciar (Pending):** 5 tickets

| ID Ticket | Nombre del Ticket | Prioridad | Estimación | Estado | Archivos Principales |
|---|---|:---:|:---:|:---:|---|
| **[TK-EDDY-01](#tk-eddy-01-sistema-de-diseño-y-configuración-inicial)** | Sistema de Diseño y Configuración Inicial | **P0 (Base)** | 1.5 h | 🔴 **Pending** | `tailwind.config.js`, `globals.css` |
| **[TK-EDDY-02](#tk-eddy-02-layout-estructural)** | Layout Estructural (Navbar & Footer) | **P1 (Core UX)** | 1.0 h | 🔴 **Pending** | `components/layout/*` |
| **[TK-EDDY-03](#tk-eddy-03-landing-page-comercial)** | Landing Page Comercial | **P1 (Marketing)** | 2.5 h | 🔴 **Pending** | `app/page.tsx` |
| **[TK-EDDY-04](#tk-eddy-04-flujo-del-comprador)** | Flujo del Comprador (Custodia) | **P0 (Bloqueante)** | 2.5 h | 🔴 **Pending** | `app/create/page.tsx` |
| **[TK-EDDY-05](#tk-eddy-05-componentes-exclusivos--wow-factor)** | Componentes Exclusivos / WOW Factor | **P1 (UX/UI)** | 2.0 h | 🔴 **Pending** | `components/buyer/*` |

---

## 🎫 3. Especificación Detallada de Cada Ticket

---

### <a id="tk-eddy-01-sistema-de-diseño-y-configuración-inicial"></a>🎫 TK-EDDY-01: Sistema de Diseño y Configuración Inicial
* **Tipo:** Tarea de Infraestructura UI  
* **Prioridad:** `P0 (Base)`  
* **Estado:** 🔴 **Pendiente**  
* **Archivos Involucrados:**
  * `tailwind.config.js`
  * `app/globals.css`
  * `components/ui/*`

#### 🎯 Descripción:
Configurar la base visual del proyecto utilizando Tailwind CSS, tipografías modernas y los componentes base de Shadcn/UI. Establecer la paleta de colores oficial de AltiPay.

#### 📋 Criterios de Aceptación (DoD):
* [ ] Inicializar proyecto Next.js limpio.
* [ ] Configurar Tailwind CSS v4.
* [ ] Instalar tipografías base (`Inter` y `Outfit`).
* [ ] Inyectar paleta de colores oficial en `globals.css` (Indigo `#6366F1`, Verde `#10B981`, Slate oscuro).
* [ ] Instalar e inicializar librería de componentes base (Shadcn/UI).

---

### <a id="tk-eddy-02-layout-estructural"></a>🎫 TK-EDDY-02: Layout Estructural
* **Tipo:** Feature / Componentes  
* **Prioridad:** `P1 (Core UX)`  
* **Estado:** 🔴 **Pendiente**  
* **Archivos Involucrados:**
  * `components/layout/Navbar.tsx`
  * `components/layout/Footer.tsx`
  * `app/layout.tsx`

#### 🎯 Descripción:
Desarrollar la estructura principal que envuelve a todas las páginas de la aplicación, garantizando una navegación fluida y consistente.

#### 📋 Criterios de Aceptación (DoD):
* [ ] Desarrollar `Navbar.tsx` (Logo, navegación, botón "Conectar Wallet").
* [ ] Desarrollar `Footer.tsx` (Créditos del Buildathon, tecnologías).
* [ ] Integrar ambos componentes dentro del layout principal.

---

### <a id="tk-eddy-03-landing-page-comercial"></a>🎫 TK-EDDY-03: Landing Page Comercial
* **Tipo:** Feature / Maquetación  
* **Prioridad:** `P1 (Marketing)`  
* **Estado:** 🔴 **Pendiente**  
* **Archivos Involucrados:**
  * `app/page.tsx`

#### 🎯 Descripción:
Construir la cara de presentación de AltiPay, enfocada en la narrativa boliviana y resaltando los beneficios del protocolo frente a métodos tradicionales.

#### 📋 Criterios de Aceptación (DoD):
* [ ] Maquetar *Hero Section* (Narrativa boliviana de La Paz, Cochabamba y Santa Cruz).
* [ ] Maquetar diagrama interactivo de 3 pasos (Fondeo ➔ Despacho ➔ Liberación).
* [ ] Maquetar comparativa interactiva vs Bancos, Tigo Money, Efectivo.
* [ ] Maquetar calculadora de ahorro con la membresía VIP de Unlock Protocol.

---

### <a id="tk-eddy-04-flujo-del-comprador"></a>🎫 TK-EDDY-04: Flujo del Comprador
* **Tipo:** Feature / Core App  
* **Prioridad:** `P0 (Bloqueante)`  
* **Estado:** 🔴 **Pendiente**  
* **Archivos Involucrados:**
  * `app/create/page.tsx`

#### 🎯 Descripción:
Implementar la interfaz completa donde un comprador inicia una orden de custodia, con una experiencia de usuario clara y segura.

#### 📋 Criterios de Aceptación (DoD):
* [ ] Diseñar formulario de custodia (Input billetera vendedor, descripción, monto USDC, tiempo límite).
* [ ] Integrar sección de resumen de fee (Protocol fee vs VIP 0%).
* [ ] Diseñar botón principal de llamado a la acción "Generar Secreto y Fondear".

---

### <a id="tk-eddy-05-componentes-exclusivos--wow-factor"></a>🎫 TK-EDDY-05: Componentes Exclusivos / WOW Factor
* **Tipo:** Feature / UI Avanzada  
* **Prioridad:** `P1 (UX/UI)`  
* **Estado:** 🔴 **Pendiente**  
* **Archivos Involucrados:**
  * `components/buyer/SecretGeneratorModal.tsx`
  * `components/buyer/KeypadReleaseModal.tsx`

#### 🎯 Descripción:
Crear los elementos interactivos que le dan el "Wow Factor" a la aplicación, enfocados principalmente en dispositivos móviles y retroalimentación visual.

#### 📋 Criterios de Aceptación (DoD):
* [ ] Desarrollar modal del generador de secreto (Advertencias en rojo, PIN grande, botón de copiar).
* [ ] Desarrollar teclado táctil en pantalla (`KeypadReleaseModal`) mobile-first.
* [ ] Añadir micro-animaciones al teclado (rebote de teclas, cambio a verde al completar el PIN).

---

## 🛠️ 4. Guía Rápida de Comandos para DEV 3

```bash
# Entrar al frontend
cd frontend

# Instalar dependencias si agregas algún paquete
npm install

# Correr el servidor de desarrollo
npm run dev

# Compilar proyecto y validar errores
npm run build
```

---

## 🤝 5. Puntos de Contacto con tus Compañeros

* **Con Jorge Ayala (DEV 2):** Solicítale los hooks (`useCreateOrder`, `useUSDC`, etc.) para conectarlos en los botones de tus formularios. Hasta que estén listos, usa funciones dummy.
* **Con Joseca (DEV 4):** Coordina para asegurar que el diseño del `/seller` mantenga la misma coherencia visual (colores, fuentes) que tú definiste.
