// src/app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getMenuItemsForRole, hasAccessToRoute } from '@/lib/roleConfig';
import { API_ENDPOINTS } from '@/lib/api';
import { ConfiguracionesGenerales } from '@/types';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, isLoading, logout, idRol } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [config, setConfig] = useState<ConfiguracionesGenerales>({
        controlStockActivo: false,
        controlEntregasActivo: false,
    });
    const [configLoading, setConfigLoading] = useState(true);

    // Cargar configuración
    useEffect(() => {
        const fetchConfiguracion = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(API_ENDPOINTS.CONFIGURACIONES_GENERALES, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data);
                }
            } catch (error) {
                console.error('Error al cargar configuración:', error);
            } finally {
                setConfigLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchConfiguracion();
        }
    }, [isAuthenticated]);

    // Verificar autenticación
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Verificar acceso a la ruta actual
    useEffect(() => {
        if (!isLoading && !configLoading && isAuthenticated && pathname) {
            // Si estamos en la página de entregas y el control está desactivado, redirigir
            if (pathname === '/dashboard/entregas' && !config.controlEntregasActivo) {
                toast.error('El control de entregas está desactivado');
                router.push('/dashboard');
                return;
            }

            if (!hasAccessToRoute(idRol, pathname)) {
                toast.error('No tienes permiso para acceder a esta página');
                router.push('/dashboard');
            }
        }
    }, [pathname, idRol, isAuthenticated, isLoading, configLoading, router, config.controlEntregasActivo]);

    const handleLogout = () => {
        logout();
        toast.success('Sesión cerrada exitosamente');
    };

    if (isLoading || configLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // Obtener items de menú filtrados por rol
    let navigation = getMenuItemsForRole(idRol);

    // Filtrar el menú de Entregas si el control está desactivado
    if (!config.controlEntregasActivo) {
        navigation = navigation.filter(item => item.href !== '/dashboard/entregas');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-cyan-600 via-blue-600 to-blue-700 text-white transform transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 shadow-2xl`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-center h-20 border-b border-blue-500/30 px-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                        <Image
                            src="/Logo.jpeg"
                            alt="Logo"
                            width={50}
                            height={50}
                            className="rounded-full mr-3 ring-2 ring-white/30"
                        />
                        <span className="text-xl font-bold">Lavandería Rodríguez</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg backdrop-blur-sm'
                                            : 'text-blue-50 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span className="text-xl mr-3">{item.icon}</span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info */}
                    <div className="border-t border-blue-500/30 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-lg font-bold ring-2 ring-white/30">
                                {user?.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium">{user?.nombre} {user?.apellido}</p>
                                <p className="text-xs text-blue-200">{user?.username}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-3 w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
                {/* Top Bar */}
                <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-cyan-100">
                    <div className="flex items-center justify-between px-4 py-4">
                        <button
                            type="button"
                            aria-label={sidebarOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
                            aria-expanded={sidebarOpen}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-cyan-50 lg:hidden transition-colors"
                        >
                            <svg
                                aria-hidden="true"
                                className="w-6 h-6 text-cyan-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>

                        <div className="flex-1 px-4">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
                            </h1>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">{children}</main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}