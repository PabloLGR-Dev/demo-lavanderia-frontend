# Lavandería Rodríguez — Frontend

Management dashboard for Lavandería Rodríguez. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Toasts | Sonner |
| Date utilities | date-fns |
| PDF export | jsPDF + html2canvas |
| Linter / Formatter | Biome |

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── clientes/        # Client management
│   │   ├── configuracion/   # System settings
│   │   ├── entregas/        # Delivery tracking
│   │   ├── facturas/        # Invoice management
│   │   ├── gastos/          # Expense tracking
│   │   ├── grupos-facturas/ # Invoice groups
│   │   ├── prendas/         # Garment catalog
│   │   ├── reportes/        # Reports and analytics
│   │   ├── servicios/       # Service catalog
│   │   ├── layout.tsx       # Dashboard shell (sidebar + topbar)
│   │   └── page.tsx         # Dashboard home
│   ├── forgot-password/
│   ├── login/
│   └── layout.tsx
├── context/
│   └── AuthContext.tsx      # Auth state + token management
├── lib/
│   ├── api.ts               # API endpoint constants
│   └── roleConfig.ts        # Role-based route and menu config
└── types/                   # Shared TypeScript types
```

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Login form |
| `/forgot-password` | Public | Password reset request |
| `/dashboard` | Admin, Empleado | Summary stats |
| `/dashboard/facturas` | Admin, Empleado | Create and manage invoices |
| `/dashboard/grupos-facturas` | Admin, Empleado | Group invoices and process bulk payments |
| `/dashboard/entregas` | Admin, Empleado | Track delivery status per invoice |
| `/dashboard/gastos` | Admin, Empleado | Log and review expenses |
| `/dashboard/clientes` | Admin, Empleado | Client directory |
| `/dashboard/reportes` | Admin, Empleado | Monthly income/expense reports |
| `/dashboard/servicios` | Admin | Manage available laundry services |
| `/dashboard/prendas` | Admin | Manage garment types and prices |
| `/dashboard/configuracion` | Admin | Toggle system features and exchange rates |

---

## Roles

### Demo credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `P@ssw0rd` |
| Empleado | `empleado` | `P@ssw0rd` |

### Access differences

| Feature | Admin | Empleado |
|---|---|---|
| Dashboard | Yes | Yes |
| Facturas | Yes | Yes |
| Grupos de Facturas | Yes | Yes |
| Entregas | Yes | Yes |
| Gastos | Yes | Yes |
| Clientes | Yes | Yes |
| Reportes | Yes | Yes |
| Servicios | Yes | No |
| Prendas | Yes | No |
| Configuracion | Yes | No |

**Admin** can manage the full catalog (services, garment types, prices) and system settings (feature toggles, exchange rates). These pages are hidden from the sidebar and blocked at the route level for Empleado users.

**Empleado** covers day-to-day operations: creating and reviewing invoices, logging expenses, managing deliveries, and consulting reports. They cannot modify catalog data or system configuration.

Route protection is enforced in [src/lib/roleConfig.ts](src/lib/roleConfig.ts) and applied by the dashboard layout.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- The backend running (see backend README)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app starts at `http://localhost:3001` by default (Next.js default is 3000; configure with `-p 3001` or set it in your run script).

### Production

```bash
npm run build
npm run start
```

---

## Code Quality

```bash
# Check linting and formatting
npm run lint

# Auto-format all files
npm run format
```

---

## Authentication

Auth state is managed by `AuthContext` (`src/context/AuthContext.tsx`):

- On login, an access token and a refresh token are stored in `localStorage`.
- The access token is attached to every API request via the `Authorization: Bearer` header.
- When the access token expires, the context automatically requests a new one using the refresh token.
- On logout, both tokens are cleared and the demo session on the server is destroyed.
