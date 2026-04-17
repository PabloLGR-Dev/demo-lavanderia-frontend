// app/dashboard/reportes/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { ReporteFinancieroCompleto } from '@/types';
import { toast } from 'sonner';
import {
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    BarChart3,
    Download,
    RefreshCw,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Formatear moneda
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

// Períodos predefinidos
const PERIODOS_PREDEFINIDOS = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Esta Semana', value: 'semana' },
    { label: 'Este Mes', value: 'mes' },
    { label: 'Mes Anterior', value: 'mes_anterior' },
    { label: 'Este Año', value: 'año' },
];

export default function ReportesPage() {
    const [loading, setLoading] = useState(false);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('hoy');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [modoRangoPersonalizado, setModoRangoPersonalizado] = useState(false);

    // Datos
    const [reporteCompleto, setReporteCompleto] = useState<ReporteFinancieroCompleto | null>(null);

    useEffect(() => {
        aplicarPeriodo('hoy');
    }, []);

    const aplicarPeriodo = (periodo: string) => {
        const hoy = new Date();
        let desde = new Date();
        let hasta = new Date();

        switch (periodo) {
            case 'hoy':
                desde = startOfDay(hoy);
                hasta = endOfDay(hoy);
                break;
            case 'semana':
                desde = new Date(hoy);
                desde.setDate(hoy.getDate() - hoy.getDay());
                desde = startOfDay(desde);
                hasta = endOfDay(hoy);
                break;
            case 'mes':
                desde = startOfDay(startOfMonth(hoy));
                hasta = endOfDay(endOfMonth(hoy));
                break;
            case 'mes_anterior':
                desde = startOfDay(startOfMonth(subMonths(hoy, 1)));
                hasta = endOfDay(endOfMonth(subMonths(hoy, 1)));
                break;
            case 'año':
                desde = startOfDay(startOfYear(hoy));
                hasta = endOfDay(endOfYear(hoy));
                break;
        }

        setFechaDesde(format(desde, 'yyyy-MM-dd'));
        setFechaHasta(format(hasta, 'yyyy-MM-dd'));
        setPeriodoSeleccionado(periodo);
        setModoRangoPersonalizado(false);

        // Fetch inmediato
        fetchReporte(desde, hasta);
    };

    const fetchReporte = async (desde?: Date, hasta?: Date) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            const desdeISO = desde ? desde.toISOString() : new Date(fechaDesde).toISOString();
            const hastaISO = hasta ? hasta.toISOString() : new Date(fechaHasta).toISOString();

            const params = `?fechaDesde=${desdeISO}&fechaHasta=${hastaISO}`;

            const response = await fetch(`${API_ENDPOINTS.REPORTES_FINANCIERO_COMPLETO}${params}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setReporteCompleto(data);
            } else {
                toast.error('Error al cargar el reporte');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarReportePersonalizado = () => {
        if (!fechaDesde || !fechaHasta) {
            toast.error('Selecciona el rango de fechas');
            return;
        }

        // Aplicar horarios 00:00 y 23:59
        const desde = startOfDay(new Date(fechaDesde));
        const hasta = endOfDay(new Date(fechaHasta));

        fetchReporte(desde, hasta);
    };

    const exportarReportePDF = async () => {
        if (!reporteCompleto) {
            toast.error('No hay datos para exportar');
            return;
        }

        const confirmarDescarga = window.confirm(
            '¿Deseas descargar el reporte como PDF?\n\n' +
            'El archivo se descargará automáticamente en tu computadora.'
        );

        if (!confirmarDescarga) {
            return;
        }

        const toastId = toast.loading('Generando PDF...');

        try {
            const jsPDF = (await import('jspdf')).default;
            const html2canvas = (await import('html2canvas')).default;

            // Convertir logo a base64
            const logoBase64 = await fetch('/logo.jpeg')
                .then(res => res.blob())
                .then(blob => new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                }));

            const { resumenFinanciero, estadisticasGastos, estadisticasFacturas, recomendaciones } = reporteCompleto;

            // Crear contenido HTML
            const contenidoHTML = `
                <div style="background: white; padding: 40px; font-family: Arial, sans-serif; color: #333; width: 210mm;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0891b2; padding-bottom: 20px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px;">
                            <img src="${logoBase64}" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #0891b2;">
                            <h2 style="color: #0891b2; font-size: 32px; font-weight: bold; margin: 0;">Lavandería Rodríguez</h2>
                        </div>
                        <h1 style="color: #0891b2; font-size: 28px; margin: 10px 0;">💰 Reporte Financiero</h1>
                        <p style="color: #666; font-size: 14px;">Cuadre de Caja y Análisis del Negocio</p>
                    </div>

                    <!-- Período -->
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                        <strong>Período:</strong> ${format(parseISO(resumenFinanciero.fechaDesde), 'dd MMM yyyy', { locale: es })} - ${format(parseISO(resumenFinanciero.fechaHasta), 'dd MMM yyyy', { locale: es })}
                    </div>

                    <!-- Cuadre de Caja -->
                    <div style="background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 25px;">
                        <h2 style="font-size: 22px; margin-bottom: 20px;">💰 Cuadre de Caja</h2>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
                            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">INGRESOS</div>
                                <div style="font-size: 24px; font-weight: bold;">${formatCurrency(resumenFinanciero.totalIngresos)}</div>
                                <div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">Facturas pagadas</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">GASTOS</div>
                                <div style="font-size: 24px; font-weight: bold;">${formatCurrency(resumenFinanciero.totalGastos)}</div>
                                <div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">Gastos operativos</div>
                            </div>
                            <div style="background: ${resumenFinanciero.gananciaNeta >= 0 ? '#10b981' : '#f97316'}; padding: 20px; border-radius: 8px;">
                                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">GANANCIA NETA</div>
                                <div style="font-size: 24px; font-weight: bold;">${formatCurrency(resumenFinanciero.gananciaNeta)}</div>
                                <div style="font-size: 11px; margin-top: 5px;">Margen: ${resumenFinanciero.margenGanancia.toFixed(1)}%</div>
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; text-align: center; font-size: 16px; font-weight: bold;">
                            Estado: ${resumenFinanciero.gananciaNeta >= 0 ? '✅ RENTABLE' : '⚠️ PÉRDIDAS'}
                        </div>
                    </div>

                    <!-- Análisis de Ingresos y Gastos -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
                        <!-- Ingresos -->
                        <div style="background: white; border: 2px solid #10b981; border-radius: 12px; padding: 20px;">
                            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #0891b2; padding-left: 10px;">Análisis de Ingresos</h3>
                            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                <span style="color: #4b5563; font-size: 14px;">Total de Facturas:</span>
                                <span style="font-weight: bold; color: #111827;">${estadisticasFacturas.totalFacturas}</span>
                            </div>
                            <div style="background: #d1fae5; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                <span style="color: #4b5563; font-size: 14px;">Facturas Pagadas:</span>
                                <span style="font-weight: bold; color: #059669;">${estadisticasFacturas.facturasPagadas}</span>
                            </div>
                            <div style="background: #fed7aa; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                <span style="color: #4b5563; font-size: 14px;">Facturas Pendientes:</span>
                                <span style="font-weight: bold; color: #ea580c;">${estadisticasFacturas.facturasPendientes}</span>
                            </div>
                            <div style="background: #cffafe; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; border: 2px solid #06b6d4;">
                                <span style="color: #4b5563; font-size: 14px;">Total Cobrado:</span>
                                <span style="font-weight: bold; color: #0891b2;">${formatCurrency(estadisticasFacturas.totalAbonado)}</span>
                            </div>
                            <div style="background: #fecaca; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between;">
                                <span style="color: #4b5563; font-size: 14px;">Pendiente de Cobro:</span>
                                <span style="font-weight: bold; color: #dc2626;">${formatCurrency(estadisticasFacturas.totalPendiente)}</span>
                            </div>
                        </div>

                        <!-- Gastos -->
                        <div style="background: white; border: 2px solid #ef4444; border-radius: 12px; padding: 20px;">
                            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #0891b2; padding-left: 10px;">Análisis de Gastos</h3>
                            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                <span style="color: #4b5563; font-size: 14px;">Total de Gastos:</span>
                                <span style="font-weight: bold; color: #111827;">${estadisticasGastos.totalRegistros}</span>
                            </div>
                            <div style="background: #fecaca; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; border: 2px solid #ef4444;">
                                <span style="color: #4b5563; font-size: 14px;">Total Gastado:</span>
                                <span style="font-weight: bold; color: #dc2626;">${formatCurrency(estadisticasGastos.totalGastos)}</span>
                            </div>
                            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between;">
                                <span style="color: #4b5563; font-size: 14px;">Promedio por Gasto:</span>
                                <span style="font-weight: bold; color: #111827;">${formatCurrency(estadisticasGastos.promedioGasto)}</span>
                            </div>
                            <div style="font-weight: 600; color: #374151; margin-bottom: 10px; font-size: 13px;">Gastos por Categoría:</div>
                            ${estadisticasGastos.gastosPorCategoria.slice(0, 5).map(cat => `
                                <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${cat.color};"></div>
                                        <span style="font-size: 12px; color: #4b5563;">${cat.categoria}</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: bold; font-size: 13px; color: #111827;">${formatCurrency(cat.total)}</div>
                                        <div style="font-size: 10px; color: #6b7280;">${cat.porcentaje.toFixed(1)}%</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Recomendaciones -->
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h3 style="color: #92400e; font-size: 16px; margin-bottom: 15px;">💡 Análisis y Recomendaciones</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${recomendaciones.map(rec => `
                                <li style="color: #78350f; font-size: 13px; margin-bottom: 8px; padding-left: 20px; position: relative;">
                                    <span style="position: absolute; left: 0;">•</span> ${rec.mensaje}
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                        <p>Reporte generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
                        <p style="margin-top: 5px; font-weight: bold; color: #0891b2;">Lavandería Rodríguez</p>
                    </div>
                </div>
            `;

            // Crear elemento temporal
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contenidoHTML;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            document.body.appendChild(tempDiv);

            await new Promise(resolve => setTimeout(resolve, 500));

            // Capturar como imagen
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: tempDiv.offsetWidth,
                height: tempDiv.offsetHeight
            });

            document.body.removeChild(tempDiv);

            // Crear PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = 297;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

            const nombreArchivo = `Reporte_Financiero_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
            pdf.save(nombreArchivo);

            toast.dismiss(toastId);
            toast.success('¡PDF descargado exitosamente!');
        } catch (error) {
            console.error('Error al exportar:', error);
            toast.dismiss(toastId);
            toast.error('Error al generar el PDF');
        }
    };

    if (loading && !reporteCompleto) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Reportes y Análisis Financiero
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Cuadres de caja, ganancias y análisis detallado del negocio
                    </p>
                </div>
                <button
                    onClick={exportarReportePDF}
                    disabled={!reporteCompleto}
                    className={`px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center gap-2 ${
                        !reporteCompleto ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                </button>
            </div>

            {/* FILTROS DE PERÍODO - COLAPSABLE */}
            <div className="bg-white rounded-xl shadow-lg border border-cyan-100">
                <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-cyan-600" />
                        <h3 className="font-semibold text-gray-800">Filtros de Período</h3>
                    </div>
                    {mostrarFiltros ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                    )}
                </button>

                {mostrarFiltros && (
                    <div className="p-6 pt-0 border-t border-gray-100">
                        {/* Períodos predefinidos */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Períodos rápidos:</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {PERIODOS_PREDEFINIDOS.map((periodo) => (
                                    <button
                                        key={periodo.value}
                                        onClick={() => aplicarPeriodo(periodo.value)}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                            periodoSeleccionado === periodo.value && !modoRangoPersonalizado
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {periodo.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rango de fechas personalizado */}
                        <div className="border-t border-gray-200 pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">O selecciona un rango personalizado:</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => {
                                            setFechaDesde(e.target.value);
                                            setModoRangoPersonalizado(true);
                                            setPeriodoSeleccionado('');
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Desde las 00:00</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => {
                                            setFechaHasta(e.target.value);
                                            setModoRangoPersonalizado(true);
                                            setPeriodoSeleccionado('');
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Hasta las 23:59</p>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleGenerarReportePersonalizado}
                                        disabled={!modoRangoPersonalizado}
                                        className={`w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2 ${
                                            !modoRangoPersonalizado ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Generar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {reporteCompleto && (
                            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium">Período actual:</span> {' '}
                                {format(parseISO(reporteCompleto.resumenFinanciero.fechaDesde), 'dd MMM yyyy', { locale: es })} -{' '}
                                {format(parseISO(reporteCompleto.resumenFinanciero.fechaHasta), 'dd MMM yyyy', { locale: es })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CONTENIDO DEL REPORTE */}
            {reporteCompleto ? (
                <>
                    {/* Cuadre de Caja */}
                    <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-700 rounded-xl shadow-2xl p-8 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold mb-1">💰 Cuadre de Caja</h3>
                                <p className="text-blue-100 text-sm">
                                    Resumen financiero del período
                                </p>
                            </div>
                            <DollarSign className="h-16 w-16 text-white/30" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="h-6 w-6" />
                                    <span className="text-sm font-medium text-blue-100">INGRESOS</span>
                                </div>
                                <p className="text-3xl font-bold">
                                    {formatCurrency(reporteCompleto.resumenFinanciero.totalIngresos)}
                                </p>
                                <p className="text-xs text-blue-100 mt-1">
                                    Facturas pagadas en el período
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingDown className="h-6 w-6" />
                                    <span className="text-sm font-medium text-blue-100">GASTOS</span>
                                </div>
                                <p className="text-3xl font-bold">
                                    {formatCurrency(reporteCompleto.resumenFinanciero.totalGastos)}
                                </p>
                                <p className="text-xs text-blue-100 mt-1">
                                    Gastos operativos del período
                                </p>
                            </div>

                            <div className={`rounded-xl p-6 ${
                                reporteCompleto.resumenFinanciero.gananciaNeta >= 0
                                    ? 'bg-green-500/90'
                                    : 'bg-orange-500/90'
                            }`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="h-6 w-6" />
                                    <span className="text-sm font-medium">GANANCIA NETA</span>
                                </div>
                                <p className="text-3xl font-bold">
                                    {formatCurrency(reporteCompleto.resumenFinanciero.gananciaNeta)}
                                </p>
                                <p className="text-xs mt-1">
                                    Margen: {reporteCompleto.resumenFinanciero.margenGanancia.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span>Estado del negocio:</span>
                                <span className="font-bold text-lg">
                                    {reporteCompleto.resumenFinanciero.gananciaNeta >= 0 ? '✅ RENTABLE' : '⚠️ PÉRDIDAS'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Análisis Detallado */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Análisis de Ingresos */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Análisis de Ingresos</h3>
                                    <p className="text-sm text-gray-500">Facturas del período</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Total de Facturas:</span>
                                    <span className="font-bold text-gray-900">{reporteCompleto.estadisticasFacturas.totalFacturas}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                                    <span className="text-gray-700">Facturas Pagadas:</span>
                                    <span className="font-bold text-green-600">{reporteCompleto.estadisticasFacturas.facturasPagadas}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                                    <span className="text-gray-700">Facturas Pendientes:</span>
                                    <span className="font-bold text-orange-600">{reporteCompleto.estadisticasFacturas.facturasPendientes}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Promedio por Factura:</span>
                                    <span className="font-bold text-gray-900">
                                        {formatCurrency(reporteCompleto.estadisticasFacturas.promedioVenta)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-cyan-50 rounded-lg border-2 border-cyan-200">
                                    <span className="text-gray-700 font-medium">Total Cobrado:</span>
                                    <span className="font-bold text-cyan-600 text-lg">
                                        {formatCurrency(reporteCompleto.estadisticasFacturas.totalAbonado)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                                    <span className="text-gray-700">Pendiente de Cobro:</span>
                                    <span className="font-bold text-red-600">
                                        {formatCurrency(reporteCompleto.estadisticasFacturas.totalPendiente)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Análisis de Gastos */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-red-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <TrendingDown className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Análisis de Gastos</h3>
                                    <p className="text-sm text-gray-500">Gastos del período</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Total de Gastos:</span>
                                    <span className="font-bold text-gray-900">{reporteCompleto.estadisticasGastos.totalRegistros}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                                    <span className="text-gray-700 font-medium">Total Gastado:</span>
                                    <span className="font-bold text-red-600 text-lg">
                                        {formatCurrency(reporteCompleto.estadisticasGastos.totalGastos)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Promedio por Gasto:</span>
                                    <span className="font-bold text-gray-900">
                                        {formatCurrency(reporteCompleto.estadisticasGastos.promedioGasto)}
                                    </span>
                                </div>

                                {/* Gastos por Categoría */}
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-700 mb-3 text-sm">Gastos por Categoría:</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {reporteCompleto.estadisticasGastos.gastosPorCategoria.map((cat, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: cat.color }}
                                                    />
                                                    <span className="text-sm text-gray-700 flex-1">{cat.categoria}</span>
                                                    <span className="text-xs text-gray-500">({cat.cantidad})</span>
                                                </div>
                                                <div className="text-right ml-3">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {formatCurrency(cat.total)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {cat.porcentaje.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tendencias por Mes */}
                    {reporteCompleto.estadisticasGastos.gastosPorMes.length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                            <div className="flex items-center gap-3 mb-4">
                                <BarChart3 className="h-6 w-6 text-cyan-600" />
                                <h3 className="font-bold text-gray-800">Gastos por Mes</h3>
                            </div>
                            <div className="space-y-3">
                                {reporteCompleto.estadisticasGastos.gastosPorMes.map((mes, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-32 text-sm text-gray-700 font-medium">
                                            {mes.mesNombre} {mes.año}
                                        </div>
                                        <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full flex items-center justify-end pr-3"
                                                style={{
                                                    width: `${(mes.total / reporteCompleto.estadisticasGastos.totalGastos * 100)}%`,
                                                    minWidth: '60px'
                                                }}
                                            >
                                                <span className="text-xs font-bold text-black">
                                                    {formatCurrency(mes.total)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-20 text-right text-sm text-gray-600">
                                            {mes.cantidad} gastos
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recomendaciones */}
                    {reporteCompleto.recomendaciones.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <PieChart className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-red-600 mb-2">💡 Análisis y Recomendaciones</h4>
                                    <ul className="space-y-2 text-sm text-orange-800">
                                        {reporteCompleto.recomendaciones.map((rec, index) => (
                                            <li key={index}>{rec.mensaje}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">Selecciona un período para generar el reporte</p>
                    <p className="text-gray-400 text-sm">Usa los filtros de arriba para elegir el rango de fechas</p>
                </div>
            )}
        </div>
    );
}