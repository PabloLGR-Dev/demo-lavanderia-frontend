// app/dashboard/configuracion/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { ConfiguracionesGenerales } from '@/types';
import { toast } from 'sonner';
import { Package, Truck } from 'lucide-react';

export default function ConfiguracionPage() {
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
            console.error('Error:', error);
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const toggleControlStock = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.TOGGLE_CONTROL_STOCK, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                toast.success(data.mensaje);
                fetchConfiguracion();
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar configuración');
        }
    };

    const toggleControlEntregas = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.TOGGLE_CONTROL_ENTREGAS, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                toast.success(data.mensaje);
                fetchConfiguracion();
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar configuración');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Configuración del Sistema
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Activa o desactiva funcionalidades opcionales
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Control de Stock */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Control de Stock</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Valida disponibilidad de productos
                                </p>
                            </div>
                        </div>

                        {/* Toggle más grande y visible */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleControlStock}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 shadow-sm ${
                                    config.controlStockActivo ? 'bg-cyan-600' : 'bg-gray-400'
                                }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                        config.controlStockActivo ? 'translate-x-7' : 'translate-x-0.5'
                                    } ${config.controlStockActivo ? 'bg-white' : 'bg-gray-800'}`}
                                />
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                {config.controlStockActivo ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className={`p-3 rounded-lg ${config.controlStockActivo ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <p className="font-medium text-gray-700">
                                Estado: {config.controlStockActivo ? 'Activo' : 'Inactivo'}
                            </p>
                            <p className="text-gray-600 mt-1">
                                {config.controlStockActivo
                                    ? '✓ El sistema valida el stock antes de crear facturas'
                                    : '⨯ Se pueden crear facturas sin validar stock'}
                            </p>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            <p className="font-medium mb-1">Cuando está activo:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>No se pueden facturar productos sin stock</li>
                                <li>El stock se reduce automáticamente</li>
                                <li>Se muestran alertas de stock bajo</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Control de Entregas */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Truck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Control de Entregas</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gestiona entrega de servicios
                                </p>
                            </div>
                        </div>

                        {/* Toggle más grande y visible */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleControlEntregas}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 shadow-sm ${
                                    config.controlEntregasActivo ? 'bg-cyan-600' : 'bg-gray-400'
                                }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                        config.controlEntregasActivo ? 'translate-x-7' : 'translate-x-0.5'
                                    } ${config.controlEntregasActivo ? 'bg-white' : 'bg-gray-800'}`}
                                />
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                {config.controlEntregasActivo ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className={`p-3 rounded-lg ${config.controlEntregasActivo ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <p className="font-medium text-gray-700">
                                Estado: {config.controlEntregasActivo ? 'Activo' : 'Inactivo'}
                            </p>
                            <p className="text-gray-600 mt-1">
                                {config.controlEntregasActivo
                                    ? '✓ Se gestionan estados de entrega de pedidos'
                                    : '⨯ No se gestionan entregas separadamente'}
                            </p>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            <p className="font-medium mb-1">Cuando está activo:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Se rastrean entregas pendientes</li>
                                <li>Se registra quién recoge el pedido</li>
                                <li>Se pueden marcar entregas parciales</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}