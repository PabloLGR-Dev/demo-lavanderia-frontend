// hooks/useConfiguracion.ts
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { ConfiguracionesGenerales } from '@/types';

export function useConfiguracion() {
    const [config, setConfig] = useState<ConfiguracionesGenerales>({
        controlStockActivo: false,
        controlEntregasActivo: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfiguracion();
    }, []);

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
            setLoading(false);
        }
    };

    return { config, loading, refetch: fetchConfiguracion };
}