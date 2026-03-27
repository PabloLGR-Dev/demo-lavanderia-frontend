// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api';
import { LoginCredentials, LoginResponse, UserAuthDto } from '@/types';

interface AuthContextType {
    user: UserAuthDto | null;
    roles: string[];
    idRol: number | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserAuthDto | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [idRol, setIdRol] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.ME, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
                const storedIdRol = localStorage.getItem('idRol');
                setRoles(storedRoles);
                setIdRol(storedIdRol ? parseInt(storedIdRol) : null);
            } else {
                await refreshToken();
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al iniciar sesión');
        }

        const data: LoginResponse = await response.json();

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('roles', JSON.stringify(data.roles));
        if (data.idRol) {
            localStorage.setItem('idRol', data.idRol.toString());
        }

        setUser(data.user);
        setRoles(data.roles);
        setIdRol(data.idRol || null);

        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('roles');
        localStorage.removeItem('idRol');
        setUser(null);
        setRoles([]);
        setIdRol(null);
        router.push('/login');
    };

    const refreshToken = async () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshTokenValue = localStorage.getItem('refreshToken');

        if (!accessToken || !refreshTokenValue) {
            logout();
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accessToken,
                    refreshToken: refreshTokenValue,
                }),
            });

            if (response.ok) {
                const data: LoginResponse = await response.json();
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                if (data.idRol) {
                    localStorage.setItem('idRol', data.idRol.toString());
                }
                setUser(data.user);
                setRoles(data.roles);
                setIdRol(data.idRol || null);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Error renovando token:', error);
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            roles,
            idRol,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            refreshToken
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
}