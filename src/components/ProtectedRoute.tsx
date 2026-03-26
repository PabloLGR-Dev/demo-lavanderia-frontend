// src/components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { hasAccessToRoute } from '@/lib/roleConfig';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: number;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, idRol } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }

            // Verificar si el usuario tiene acceso a esta ruta
            if (!hasAccessToRoute(idRol, pathname)) {
                toast.error('No tienes permiso para acceder a esta página');
                router.push('/dashboard');
                return;
            }

            // Verificar rol específico si se requiere
            if (requiredRole && idRol !== requiredRole) {
                toast.error('No tienes los permisos necesarios');
                router.push('/dashboard');
                return;
            }
        }
    }, [isAuthenticated, isLoading, idRol, pathname, requiredRole, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || !hasAccessToRoute(idRol, pathname)) {
        return null;
    }

    return <>{children}</>;
}