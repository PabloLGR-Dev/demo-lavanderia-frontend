import {
    LayoutDashboard,
    Receipt,
    Truck,
    CreditCard,
    Users,
    Scissors,
    Shirt,
    BarChart2,
    Settings,
    Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ROLES = {
    ADMIN: 1,
    EMPLEADO: 2,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_ROUTES = {
    [ROLES.ADMIN]: [
        '/dashboard',
        '/dashboard/facturas',
        '/dashboard/entregas',
        '/dashboard/gastos',
        '/dashboard/clientes',
        '/dashboard/servicios',
        '/dashboard/prendas',
        '/dashboard/reportes',
        '/dashboard/configuracion',
        '/dashboard/grupos-facturas',
    ],
    [ROLES.EMPLEADO]: [
        '/dashboard',
        '/dashboard/facturas',
        '/dashboard/entregas',
        '/dashboard/gastos',
        '/dashboard/clientes',
        '/dashboard/reportes',
        '/dashboard/grupos-facturas',
    ],
} as const;

export const MENU_ITEMS: { name: string; href: string; icon: LucideIcon; allowedRoles: RoleId[] }[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        allowedRoles: [ROLES.ADMIN, ROLES.EMPLEADO]
    },
    {
        name: 'Facturas',
        href: '/dashboard/facturas',
        icon: Receipt,
        allowedRoles: [ROLES.ADMIN, ROLES.EMPLEADO]
    },
    {
        name: 'Grupos de Facturas',
        href: '/dashboard/grupos-facturas',
        icon: Layers,
        allowedRoles: [ROLES.ADMIN, ROLES.EMPLEADO]
    },
    {
        name: 'Entregas De Facturas',
        href: '/dashboard/entregas',
        icon: Truck,
        allowedRoles: [ROLES.ADMIN, ROLES.EMPLEADO]
    },
    {
        name: 'Gastos',
        href: '/dashboard/gastos',
        icon: CreditCard,
        allowedRoles: [ROLES.ADMIN, ROLES.EMPLEADO]
    },
    {
        name: 'Clientes',
        href: '/dashboard/clientes',
        icon: Users,
        allowedRoles: [ROLES.ADMIN, ROLES.EMPLEADO]
    },
    {
        name: 'Servicios',
        href: '/dashboard/servicios',
        icon: Scissors,
        allowedRoles: [ROLES.ADMIN]
    },
    {
        name: 'Prendas',
        href: '/dashboard/prendas',
        icon: Shirt,
        allowedRoles: [ROLES.ADMIN]
    },
    {
        name: 'Reportes',
        href: '/dashboard/reportes',
        icon: BarChart2,
        allowedRoles: [ROLES.ADMIN, ROLES.EMPLEADO]
    },
    {
        name: 'Configuracion',
        href: '/dashboard/configuracion',
        icon: Settings,
        allowedRoles: [ROLES.ADMIN]
    },
];

export function hasAccessToRoute(userRole: number | null | undefined, route: string): boolean {
    if (!userRole) return false;
    const allowedRoutes = ROLE_ROUTES[userRole as RoleId];
    if (!allowedRoutes) return false;
    return allowedRoutes.some(allowedRoute =>
        allowedRoute === '/dashboard'
            ? route === allowedRoute
            : route === allowedRoute || route.startsWith(`${allowedRoute}/`)
    );
}

export function getMenuItemsForRole(userRole: number | null | undefined) {
    if (!userRole) return [];
    return MENU_ITEMS.filter(item => item.allowedRoles.includes(userRole as RoleId));
}
