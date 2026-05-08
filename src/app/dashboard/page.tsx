// app/dashboard/page.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { DashboardResumen } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertCircle,
    Calendar,
    ArrowDownCircle,
    ArrowUpCircle,
    Receipt,
    CheckCircle2,
    Clock,
    Banknote,
    User,
    BarChart2
} from 'lucide-react';
// Formatear moneda
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};
export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardResumen | null>(null);
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.DASHBOARD_RESUMEN, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setDashboardData(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };
    const formatCategoria = (cat?: string) => {
        if (!cat) return '';
        return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }
    if (!dashboardData) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <p className="text-gray-500">No se pudo cargar la información del dashboard</p>
            </div>
        );
    }
    const { resumenFinanciero, estadisticasFacturas, ultimosMovimientos } = dashboardData;
    return (
        <div className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 rounded-xl shadow-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">
                    ¡Bienvenido, {user?.nombre}!
                </h2>
                <p className="text-blue-100">
                    Resumen del mes actual - {format(new Date(), 'MMMM yyyy', { locale: es })}
                </p>
            </div>
            {/* Stats Grid Principal - Resumen Financiero */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-green-100 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Ingresos del Mes</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 leading-tight break-words">
                                {formatCurrency(resumenFinanciero.totalIngresos)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Facturas pagadas</p>
                        </div>
                        <div className="flex-shrink-0 bg-gradient-to-br from-green-400 to-emerald-600 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md">
                            <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-red-100 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Gastos del Mes</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 leading-tight break-words">
                                {formatCurrency(resumenFinanciero.totalGastos)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Gastos operativos</p>
                        </div>
                        <div className="flex-shrink-0 bg-gradient-to-br from-orange-400 to-red-600 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md">
                            <TrendingDown className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                    </div>
                </div>
                <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 border ${
                    resumenFinanciero.gananciaNeta >= 0 ? 'border-cyan-100' : 'border-orange-100'
                } hover:shadow-xl transition-all hover:-translate-y-1`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Ganancia Neta</p>
                            <p className={`text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words ${
                                resumenFinanciero.gananciaNeta >= 0 ? 'text-cyan-600' : 'text-orange-600'
                            }`}>
                                {formatCurrency(resumenFinanciero.gananciaNeta)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Ingresos - Gastos</p>
                        </div>
                        <div className={`flex-shrink-0 bg-gradient-to-br ${
                            resumenFinanciero.gananciaNeta >= 0
                                ? 'from-cyan-500 to-blue-600'
                                : 'from-orange-400 to-red-500'
                        } w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md`}>
                            <DollarSign className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Margen de Ganancia</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 leading-tight">
                                {resumenFinanciero.margenGanancia.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Porcentaje de rentabilidad</p>
                        </div>
                        <div className="flex-shrink-0 bg-gradient-to-br from-blue-400 to-indigo-600 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md">
                            <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Stats Grid Secundario - Facturas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Facturas del Mes
                            </p>
                            <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                {estadisticasFacturas.totalFacturas}
                            </p>
                        </div>
                        <div className="p-2 bg-cyan-100 rounded-lg">
                            <Receipt className="h-7 w-7 text-cyan-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Facturas Pagadas
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                                {estadisticasFacturas.facturasPagadas}
                            </p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="h-7 w-7 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Pendientes de Pago
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-orange-600">
                                {estadisticasFacturas.facturasPendientes}
                            </p>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="h-7 w-7 text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Promedio por Factura
                            </p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 leading-tight">
                                {formatCurrency(estadisticasFacturas.promedioVenta)}
                            </p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Banknote className="h-7 w-7 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Últimos Movimientos */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Últimos Movimientos
                        </h3>
                        <button
                            onClick={() => router.push('/dashboard/facturas')}
                            className="text-sm text-cyan-600 hover:text-blue-700 font-medium"
                        >
                            Ver todos
                        </button>
                    </div>
                    {ultimosMovimientos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No hay movimientos recientes</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ultimosMovimientos.map((movimiento) => {
                                const isIngresoPendiente = movimiento.tipo === 'ingreso' && movimiento.categoria?.toLowerCase().includes('pendiente');
                                return (
                                    <div
                                        key={`${movimiento.tipo}-${movimiento.id}`}
                                        className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                                            movimiento.tipo === 'gasto'
                                                ? 'bg-red-50 hover:bg-red-100 border border-red-100'
                                                : isIngresoPendiente
                                                    ? 'bg-orange-50 hover:bg-orange-100 border border-orange-100'
                                                    : 'bg-green-50 hover:bg-green-100 border border-green-100'
                                        }`}
                                        onClick={() => {
                                            if (movimiento.tipo === 'ingreso') {
                                                router.push(`/dashboard/facturas?id=${movimiento.id}`);
                                            } else {
                                                router.push(`/dashboard/gastos?id=${movimiento.id}`);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className={`flex-shrink-0 p-1.5 rounded-full ${
                                                movimiento.tipo === 'ingreso'
                                                    ? isIngresoPendiente ? 'bg-orange-100' : 'bg-green-100'
                                                    : 'bg-red-100'
                                            }`}>
                                                {movimiento.tipo === 'ingreso' ? (
                                                    <ArrowUpCircle className={`h-4 w-4 ${isIngresoPendiente ? 'text-orange-600' : 'text-green-600'}`} />
                                                ) : (
                                                    <ArrowDownCircle className="h-4 w-4 text-red-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">
                                                    {movimiento.descripcion}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    {movimiento.categoria && (
                                                        <span
                                                            className="text-xs px-1.5 py-0.5 rounded-full truncate max-w-[110px]"
                                                            style={{
                                                                backgroundColor: movimiento.tipo === 'gasto' && movimiento.color
                                                                    ? `${movimiento.color}20`
                                                                    : movimiento.tipo === 'ingreso'
                                                                        ? isIngresoPendiente ? '#ffedd5' : '#dcfce7'
                                                                        : '#fee2e2',
                                                                color: movimiento.tipo === 'gasto' && movimiento.color
                                                                    ? movimiento.color
                                                                    : movimiento.tipo === 'ingreso'
                                                                        ? isIngresoPendiente ? '#ea580c' : '#16a34a'
                                                                        : '#dc2626'
                                                            }}
                                                        >
                                                            {formatCategoria(movimiento.categoria)}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        {format(parseISO(movimiento.fecha), 'dd MMM', { locale: es })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right ml-2">
                                            <p className={`text-xs sm:text-sm font-bold whitespace-nowrap ${
                                                movimiento.tipo === 'ingreso'
                                                    ? isIngresoPendiente ? 'text-orange-600' : 'text-green-600'
                                                    : 'text-red-600'
                                            }`}>
                                                {movimiento.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(movimiento.monto)}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">
                                                {movimiento.tipo}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4">
                        Acciones Rápidas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => router.push('/dashboard/facturas')}
                            className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-xl text-left transition-all group shadow-sm hover:shadow-md"
                        >
                            <Receipt className="h-8 w-8 text-cyan-600 mb-2" />
                            <p className="font-medium text-gray-900 group-hover:text-cyan-600 text-sm">
                                Nueva Factura
                            </p>
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/clientes')}
                            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl text-left transition-all group shadow-sm hover:shadow-md"
                        >
                            <User className="h-8 w-8 text-green-600 mb-2" />
                            <p className="font-medium text-gray-900 group-hover:text-green-600 text-sm">
                                Nuevo Cliente
                            </p>
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/gastos')}
                            className="p-4 bg-gradient-to-br from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-xl text-left transition-all group shadow-sm hover:shadow-md"
                        >
                            <TrendingDown className="h-8 w-8 text-red-600 mb-2" />
                            <p className="font-medium text-gray-900 group-hover:text-red-600 text-sm">
                                Registrar Gasto
                            </p>
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/reportes')}
                            className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-xl text-left transition-all group shadow-sm hover:shadow-md"
                        >
                            <BarChart2 className="h-8 w-8 text-purple-600 mb-2" />
                            <p className="font-medium text-gray-900 group-hover:text-purple-600 text-sm">
                                Ver Reportes
                            </p>
                        </button>
                    </div>
                </div>
            </div>
            {/* Alerta de Saldo Pendiente */}
            {estadisticasFacturas.totalPendiente > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-xl p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-6 w-6 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-orange-800 mb-1">
                                Hay {formatCurrency(estadisticasFacturas.totalPendiente)} pendientes de cobro
                            </h4>
                            <p className="text-sm text-orange-700">
                                {estadisticasFacturas.facturasPendientes} facturas tienen pagos pendientes. Revisa la sección de facturas para hacer seguimiento.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}