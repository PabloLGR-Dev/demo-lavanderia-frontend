// app/dashboard/entregas/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { FacturaPendienteEntrega, MarcarEntregaDto, FacturaDetallesCompletos, RegistrarPagoFacturaDto } from '@/types';
import { toast } from 'sonner';
import {
    Package,
    CheckCircle,
    Clock,
    X,
    Eye,
    Filter,
    RefreshCw,
    DollarSign,
    Edit,
    AlertCircle,
    Search,
    Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ROLES } from "@/lib/roleConfig";
import ProtectedRoute from "@/components/ProtectedRoute";

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

type FiltroEntrega = 'todas' | 'pendientes' | 'parciales' | 'completadas';

const ESTADOS_ENTREGA = {
    PENDIENTE: 7,
    COMPLETADA: 8,
    PARCIAL: 9
};

interface ContadoresEntregas {
    total: number;
    pendientes: number;
    completadas: number;
    parciales: number;
}

export default function EntregasPage() {
    const [todasLasFacturas, setTodasLasFacturas] = useState<FacturaPendienteEntrega[]>([]);
    const [contadores, setContadores] = useState<ContadoresEntregas>({
        total: 0,
        pendientes: 0,
        completadas: 0,
        parciales: 0
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [selectedFactura, setSelectedFactura] = useState<FacturaPendienteEntrega | null>(null);
    const [facturaDetalle, setFacturaDetalle] = useState<FacturaDetallesCompletos | null>(null);
    const [filtro, setFiltro] = useState<FiltroEntrega>('pendientes');
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Estados para control de carga de botones específicos
    const [loadingFacturaId, setLoadingFacturaId] = useState<number | null>(null);
    const [actionType, setActionType] = useState<'detail' | 'entrega' | null>(null);
    const isProcessingRef = useRef(false); // Para evitar múltiples llamadas

    const [formData, setFormData] = useState({
        recogidoPor: '',
        notasEntrega: '',
        entregaParcial: false
    });

    const [pagoForm, setPagoForm] = useState({
        monto: '',
        metodoPago: 'efectivo',
        referencia: '',
        notas: '',
    });

    useEffect(() => {
        fetchDatos();
    }, [filtro]);

    // OPTIMIZACIÓN: Una sola función que carga facturas y contadores
    const fetchDatos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            // Cargar contadores (llamada rápida)
            const contadoresPromise = fetch(API_ENDPOINTS.FACTURAS_CONTADORES_ENTREGAS, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            // Cargar facturas según filtro usando el nuevo endpoint optimizado
            let estadoEntregaParam = '';
            if (filtro === 'pendientes') {
                estadoEntregaParam = `?estadoEntrega=${ESTADOS_ENTREGA.PENDIENTE}`;
            } else if (filtro === 'completadas') {
                estadoEntregaParam = `?estadoEntrega=${ESTADOS_ENTREGA.COMPLETADA}`;
            } else if (filtro === 'parciales') {
                estadoEntregaParam = `?estadoEntrega=${ESTADOS_ENTREGA.PARCIAL}`;
            }

            const facturasPromise = fetch(
                `${API_ENDPOINTS.FACTURAS_ENTREGAS_RESUMEN}${estadoEntregaParam}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            // Ejecutar ambas llamadas en paralelo
            const [contadoresRes, facturasRes] = await Promise.all([contadoresPromise, facturasPromise]);

            // Procesar contadores
            if (contadoresRes.ok) {
                const contadoresData = await contadoresRes.json();
                setContadores(contadoresData);
            }

            // Procesar facturas
            if (facturasRes.ok) {
                const facturasData = await facturasRes.json();
                setTodasLasFacturas(facturasData);
                console.log('Facturas cargadas:', facturasData.length);
            } else {
                toast.error('Error al cargar facturas');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const fetchFacturaDetalle = async (id: number) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.FACTURAS_DETALLES_COMPLETOS(id), {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setFacturaDetalle(data);
                return data;
            } else {
                toast.error('Error al cargar detalles');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
            return null;
        }
    };

    // OPTIMIZADO: Abrir modal de detalle INMEDIATAMENTE
    const handleOpenDetail = async (id: number) => {
        if (isProcessingRef.current || loadingFacturaId === id) return;

        try {
            isProcessingRef.current = true;
            setLoadingFacturaId(id);
            setActionType('detail');
            setFacturaDetalle(null);

            // ABRIR MODAL INMEDIATAMENTE
            setShowDetailModal(true);  // ← Usuario ve el modal instantáneamente

            // Cargar datos en paralelo (background)
            await fetchFacturaDetalle(id);
            const detalle = await fetchFacturaDetalle(id);
            if (!detalle) {
                setShowDetailModal(false);
                return;
            }

        } catch (error) {
            console.error('Error:', error);
            setShowDetailModal(false); // Cerrar si hay error
        } finally {
            setLoadingFacturaId(null);
            setActionType(null);
            isProcessingRef.current = false;
        }
    };

    const handleMarcarEntrega = async () => {
        if (!selectedFactura) return;

        try {
            const token = localStorage.getItem('accessToken');
            const dto: MarcarEntregaDto = {
                recogidoPor: formData.recogidoPor || undefined,
                notasEntrega: formData.notasEntrega || undefined,
                entregaParcial: formData.entregaParcial
            };

            const response = await fetch(
                API_ENDPOINTS.FACTURA_MARCAR_ENTREGA(selectedFactura.idFactura),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(dto),
                }
            );

            if (response.ok) {
                toast.success(formData.entregaParcial
                    ? 'Entrega parcial registrada'
                    : 'Entrega completada registrada');
                fetchDatos();
                handleCloseModal();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al marcar entrega');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleRevertirEntrega = async (idFactura: number) => {
        if (!confirm('¿Estás seguro de revertir esta entrega a pendiente?')) return;

        try {
            const token = localStorage.getItem('accessToken');

            const updateResponse = await fetch(
                API_ENDPOINTS.FACTURA_ACTUALIZAR_ESTADO_ENTREGA(idFactura),
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        idEstadoEntrega: ESTADOS_ENTREGA.PENDIENTE,
                        notasEntrega: 'Revertida a pendiente'
                    }),
                }
            );

            if (updateResponse.ok) {
                toast.success('Entrega revertida a pendiente');
                fetchDatos();
            } else {
                const error = await updateResponse.json();
                toast.error(error.message || 'Error al revertir entrega');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleRegistrarPago = async () => {
        if (!selectedFactura) return;

        if (!pagoForm.monto || parseFloat(pagoForm.monto) <= 0) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        const monto = parseFloat(pagoForm.monto);
        const pendiente = selectedFactura.montoPendiente || 0;

        if (monto > pendiente) {
            toast.error(`El monto excede lo pendiente (${formatCurrency(pendiente)})`);
            return;
        }

        await procesarPago(selectedFactura.idFactura, monto);
    };

    const procesarPago = async (idFactura: number, monto: number) => {
        const token = localStorage.getItem('accessToken');
        try {
            const dto: RegistrarPagoFacturaDto = {
                monto: monto,
                metodoPago: pagoForm.metodoPago,
                referencia: pagoForm.referencia || undefined,
                notas: pagoForm.notas || undefined,
            };

            const response = await fetch(API_ENDPOINTS.FACTURA_PAGAR(idFactura), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dto),
            });

            if (response.ok) {
                toast.success('Pago registrado exitosamente');
                fetchDatos();
                setShowPagoModal(false);
                setPagoForm({
                    monto: '',
                    metodoPago: 'efectivo',
                    referencia: '',
                    notas: '',
                });

                if (facturaDetalle && facturaDetalle.idFactura === idFactura) {
                    fetchFacturaDetalle(idFactura);
                }
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al registrar pago');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    // OPTIMIZADO: Abrir modal de entrega INMEDIATAMENTE
    const handleOpenModal = (factura: FacturaPendienteEntrega) => {
        if (isProcessingRef.current || loadingFacturaId === factura.idFactura) return;

        setLoadingFacturaId(factura.idFactura);
        setActionType('entrega');

        setSelectedFactura(factura);
        setFormData({
            recogidoPor: '',
            notasEntrega: '',
            entregaParcial: false
        });
        setShowModal(true);

        setLoadingFacturaId(null);
        setActionType(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedFactura(null);
        setFormData({
            recogidoPor: '',
            notasEntrega: '',
            entregaParcial: false
        });
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setFacturaDetalle(null);
    };

    const abrirPagoModal = (factura: FacturaPendienteEntrega) => {
        setSelectedFactura(factura);
        const pendiente = factura.montoPendiente || 0;
        setPagoForm({
            monto: pendiente.toString(),
            metodoPago: 'efectivo',
            referencia: '',
            notas: '',
        });
        setShowPagoModal(true);
    };

    const getEstadoEntrega = (factura: FacturaPendienteEntrega) => {
        if (factura.idEstadoEntrega === ESTADOS_ENTREGA.COMPLETADA) {
            return {
                texto: 'Entregado',
                clase: 'bg-green-100 text-green-800'
            };
        }
        if (factura.idEstadoEntrega === ESTADOS_ENTREGA.PARCIAL) {
            return {
                texto: 'Entrega Parcial',
                clase: 'bg-purple-100 text-orange-800'
            };
        }
        return {
            texto: 'Pendiente',
            clase: 'bg-orange-100 text-orange-800'
        };
    };

    const getEstadoPago = (factura: FacturaPendienteEntrega) => {
        const pendiente = factura.montoPendiente || 0;
        if (pendiente <= 0) {
            return {
                texto: 'Pagado',
                clase: 'bg-green-100 text-green-800'
            };
        }
        if (factura.montoAbonado && factura.montoAbonado > 0) {
            return {
                texto: 'Pago Parcial',
                clase: 'bg-yellow-100 text-yellow-800'
            };
        }
        return {
            texto: 'Pendiente Pago',
            clase: 'bg-red-100 text-red-800'
        };
    };

    // OPTIMIZACIÓN: Filtro solo por búsqueda (el filtro de estado ya se aplica en el backend)
    const getFacturasFiltradas = () => {
        if (!searchTerm.trim()) {
            return todasLasFacturas;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        return todasLasFacturas.filter(f =>
            f.numeroFactura.toLowerCase().includes(searchLower) ||
            f.nombreCliente.toLowerCase().includes(searchLower)
        );
    };

    const facturasMostradas = getFacturasFiltradas();

    if (loading) {
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
                        Gestión de Entregas
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {contadores.pendientes} pendientes | {contadores.completadas} completadas | {contadores.parciales} parciales
                    </p>
                </div>
                <button
                    onClick={fetchDatos}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                </button>
            </div>

            {/* BÚSQUEDA */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Buscar por número de factura o nombre de cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                    />
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setFiltro('pendientes')}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
                            filtro === 'pendientes'
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Clock className="h-4 w-4" />
                        Pendientes ({contadores.pendientes})
                    </button>
                    <button
                        onClick={() => setFiltro('completadas')}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
                            filtro === 'completadas'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <CheckCircle className="h-4 w-4" />
                        Completadas ({contadores.completadas})
                    </button>
                    <button
                        onClick={() => setFiltro('parciales')}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
                            filtro === 'parciales'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Package className="h-4 w-4" />
                        Parciales ({contadores.parciales})
                    </button>
                    <button
                        onClick={() => setFiltro('todas')}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
                            filtro === 'todas'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Filter className="h-4 w-4" />
                        Todas ({contadores.total})
                    </button>
                </div>
            </div>

            {/* LISTA DE FACTURAS */}
            {facturasMostradas.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-cyan-100">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {searchTerm.trim() ? 'No se encontraron resultados' :
                            filtro === 'pendientes' ? 'No hay entregas pendientes' :
                                filtro === 'completadas' ? 'No hay entregas completadas' :
                                    filtro === 'parciales' ? 'No hay entregas parciales' :
                                        'No hay entregas'}
                    </h3>
                    <p className="text-gray-500">
                        {searchTerm.trim() ? `No hay facturas que coincidan con "${searchTerm}"` :
                            filtro === 'pendientes' && 'Todas las entregas han sido completadas'}
                        {filtro === 'completadas' && 'No hay entregas completadas aún'}
                        {filtro === 'parciales' && 'No hay entregas parciales'}
                        {filtro === 'todas' && 'No hay entregas registradas'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facturasMostradas.map((factura) => {
                        const estadoEntrega = getEstadoEntrega(factura);
                        const estadoPago = getEstadoPago(factura);
                        const esPendiente = factura.idEstadoEntrega === ESTADOS_ENTREGA.PENDIENTE;
                        const pendiente = factura.montoPendiente || 0;
                        const isLoadingThisRow = loadingFacturaId === factura.idFactura;

                        return (
                            <div
                                key={factura.idFactura}
                                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                                    esPendiente
                                        ? 'border-orange-200 hover:border-orange-400'
                                        : factura.idEstadoEntrega === ESTADOS_ENTREGA.PARCIAL
                                            ? 'border-purple-200 hover:border-purple-400'
                                            : 'border-green-200 hover:border-green-400'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-lg ${
                                            esPendiente ? 'bg-orange-100' :
                                                factura.idEstadoEntrega === ESTADOS_ENTREGA.PARCIAL ? 'bg-purple-100' :
                                                    'bg-green-100'
                                        }`}>
                                            {esPendiente ? (
                                                <Clock className="h-6 w-6 text-orange-600" />
                                            ) : factura.idEstadoEntrega === ESTADOS_ENTREGA.PARCIAL ? (
                                                <Package className="h-6 w-6 text-purple-600" />
                                            ) : (
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{factura.numeroFactura}</h3>
                                            <p className="text-sm text-gray-600">{factura.nombreCliente}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${estadoEntrega.clase}`}>
                                        {estadoEntrega.texto}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${estadoPago.clase}`}>
                                        {estadoPago.texto}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Items:</span>
                                        <span className="font-medium text-gray-900">{factura.totalItems}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total:</span>
                                        <span className="font-bold text-cyan-600">{formatCurrency(factura.total)}</span>
                                    </div>
                                    {pendiente > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Pendiente:</span>
                                            <span className="font-semibold text-orange-600">
                                                {formatCurrency(pendiente)}
                                            </span>
                                        </div>
                                    )}
                                    {factura.fechaEntregaEstimada && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Entrega:</span>
                                            <span className="font-medium text-gray-900">
                                                {format(parseISO(factura.fechaEntregaEstimada), 'dd/MM/yyyy', { locale: es })}
                                            </span>
                                        </div>
                                    )}
                                    {esPendiente && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Días esperando:</span>
                                            <span className={`font-semibold ${
                                                factura.diasDesdeCreacion > 7 ? 'text-red-600' :
                                                    factura.diasDesdeCreacion > 3 ? 'text-orange-600' :
                                                        'text-green-600'
                                            }`}>
                                                {factura.diasDesdeCreacion} días
                                            </span>
                                        </div>
                                    )}
                                    {!esPendiente && factura.recogidoPor && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Recogido por:</span>
                                            <span className="font-medium text-gray-900">{factura.recogidoPor}</span>
                                        </div>
                                    )}
                                    {factura.telefonoCliente && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Teléfono:</span>
                                            <span className="font-medium text-gray-900">{factura.telefonoCliente}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        {/* ✅ BOTÓN VER DETALLE CON LOADER */}
                                        <button
                                            onClick={() => handleOpenDetail(factura.idFactura)}
                                            disabled={isLoadingThisRow && actionType === 'detail'}
                                            className="flex-1 px-3 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                                        >
                                            {isLoadingThisRow && actionType === 'detail' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            Ver Detalle
                                        </button>

                                        {/* ✅ BOTÓN ENTREGAR CON LOADER */}
                                        {esPendiente ? (
                                            <button
                                                onClick={() => handleOpenModal(factura)}
                                                disabled={isLoadingThisRow && actionType === 'entrega'}
                                                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                                            >
                                                {isLoadingThisRow && actionType === 'entrega' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4" />
                                                )}
                                                Entregar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRevertirEntrega(factura.idFactura)}
                                                className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all flex items-center justify-center gap-2 font-medium"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Revertir
                                            </button>
                                        )}
                                    </div>

                                    {pendiente > 0 && (
                                        <button
                                            onClick={() => abrirPagoModal(factura)}
                                            className="w-full px-3 py-2 bg-blue-100 text-green-700 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center gap-2 font-medium"
                                        >
                                            <DollarSign className="h-4 w-4" />
                                            Registrar Pago
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL MARCAR ENTREGA */}
            {showModal && selectedFactura && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Registrar Entrega
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedFactura.numeroFactura} - {selectedFactura.nombreCliente}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Items:</span>
                                        <p className="font-medium text-gray-900">{selectedFactura.totalItems}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total:</span>
                                        <p className="font-bold text-cyan-600">{formatCurrency(selectedFactura.total)}</p>
                                    </div>
                                    {(selectedFactura.montoPendiente ?? 0) > 0 && (
                                        <div className="col-span-2 pt-2 border-t">
                                            <div className="flex items-center gap-2 text-orange-600">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    Pendiente de pago: {formatCurrency(selectedFactura.montoPendiente ?? 0)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    ¿Quién recoge el pedido? (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.recogidoPor}
                                    onChange={(e) => setFormData({ ...formData, recogidoPor: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    placeholder="Nombre de quien recoge"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Notas (Opcional)
                                </label>
                                <textarea
                                    value={formData.notasEntrega}
                                    onChange={(e) => setFormData({ ...formData, notasEntrega: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    rows={2}
                                    placeholder="Observaciones sobre la entrega..."
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <input
                                    type="checkbox"
                                    id="entregaParcial"
                                    checked={formData.entregaParcial}
                                    onChange={(e) => setFormData({ ...formData, entregaParcial: e.target.checked })}
                                    className="w-4 h-4 text-cyan-600"
                                />
                                <label htmlFor="entregaParcial" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Es una entrega parcial
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handleMarcarEntrega}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md font-medium"
                                >
                                    {formData.entregaParcial ? 'Entrega Parcial' : 'Entrega Completada'}
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE DE FACTURA */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-2xl border border-cyan-100 my-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Detalle de Factura
                                </h3>
                                {facturaDetalle ? (
                                    <p className="text-sm text-gray-500 mt-1">{facturaDetalle.numeroFactura}</p>
                                ) : (
                                    <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mt-1" />
                                )}
                            </div>
                            <button
                                onClick={handleCloseDetailModal}
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* SKELETON LOADER MIENTRAS CARGA */}
                        {!facturaDetalle ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-100 p-4 rounded-lg h-20" />
                                    <div className="bg-gray-100 p-4 rounded-lg h-20" />
                                </div>
                                <div className="bg-gray-100 p-4 rounded-lg h-64" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-100 p-4 rounded-lg h-48" />
                                    <div className="bg-gray-100 p-4 rounded-lg h-48" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">Cliente</p>
                                        <p className="font-semibold text-gray-900">{facturaDetalle.nombreCliente}</p>
                                        {facturaDetalle.telefonoCliente && (
                                            <p className="text-sm text-gray-600 mt-1">{facturaDetalle.telefonoCliente}</p>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">Fecha Creación</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(parseISO(facturaDetalle.fechaCreacion), "dd/MM/yyyy HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Items de la Factura</h4>
                                    <div className="border rounded-lg overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Item</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Cant.</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">P. Unit.</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Subtotal</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                            {facturaDetalle.detalles.map((detalle, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {detalle.tipo === 'servicio' && detalle.servicio && (
                                                            <div>
                                                                <p className="font-medium">{detalle.servicio.prenda} - {detalle.servicio.servicio}</p>
                                                                {detalle.descripcion && (
                                                                    <p className="text-xs text-gray-500">{detalle.descripcion}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {detalle.tipo === 'producto' && detalle.producto && (
                                                            <div>
                                                                <p className="font-medium">{detalle.producto.nombre}</p>
                                                                <p className="text-xs text-gray-500">{detalle.producto.categoria}</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{detalle.cantidad}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(detalle.precioUnitario)}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(detalle.subtotal)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                                        <h4 className="font-semibold text-gray-900 mb-3">Resumen Financiero</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-medium text-gray-900">{formatCurrency(facturaDetalle.subtotal)}</span>
                                            </div>
                                            {facturaDetalle.descuento > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Descuento:</span>
                                                    <span className="font-medium text-red-600">-{formatCurrency(facturaDetalle.descuento)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="font-semibold text-gray-700">Total:</span>
                                                <span className="font-bold text-cyan-600">{formatCurrency(facturaDetalle.total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Abonado:</span>
                                                <span className="font-semibold text-green-600">{formatCurrency(facturaDetalle.montoAbonado || 0)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="font-semibold text-gray-700">Pendiente:</span>
                                                <span className={`font-bold ${
                                                    (facturaDetalle.montoPendiente || 0) > 0 ? 'text-orange-600' : 'text-green-600'
                                                }`}>
                                                    {formatCurrency(facturaDetalle.montoPendiente || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-semibold text-gray-900 mb-3">Estado</h4>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Estado de Pago</p>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                    (facturaDetalle.montoPendiente || 0) <= 0
                                                        ? 'bg-green-100 text-green-800'
                                                        : facturaDetalle.montoAbonado && facturaDetalle.montoAbonado > 0
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {(facturaDetalle.montoPendiente || 0) <= 0
                                                        ? 'Pagado'
                                                        : facturaDetalle.montoAbonado && facturaDetalle.montoAbonado > 0
                                                            ? 'Pago Parcial'
                                                            : 'Pendiente Pago'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Estado General</p>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                    facturaDetalle.estado.idEstado === 5 ? 'bg-green-100 text-green-800' :
                                                        facturaDetalle.estado.idEstado === 4 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {facturaDetalle.estado.nombre}
                                                </span>
                                            </div>
                                            {facturaDetalle.fechaEntregaEstimada && (
                                                <div>
                                                    <p className="text-xs text-gray-600 mb-1">Entrega Estimada</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {format(parseISO(facturaDetalle.fechaEntregaEstimada), 'dd/MM/yyyy', { locale: es })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
                                    {(facturaDetalle.montoPendiente || 0) > 0 && (
                                        <button
                                            onClick={() => {
                                                const facturaParaPago: FacturaPendienteEntrega = {
                                                    idFactura: facturaDetalle.idFactura,
                                                    numeroFactura: facturaDetalle.numeroFactura,
                                                    nombreCliente: facturaDetalle.nombreCliente,
                                                    telefonoCliente: facturaDetalle.telefonoCliente,
                                                    fechaCreacion: facturaDetalle.fechaCreacion,
                                                    fechaEntregaEstimada: facturaDetalle.fechaEntregaEstimada,
                                                    total: facturaDetalle.total,
                                                    montoAbonado: facturaDetalle.montoAbonado,
                                                    montoPendiente: facturaDetalle.montoPendiente,
                                                    estado: facturaDetalle.estado,
                                                    totalItems: facturaDetalle.detalles.reduce((sum, d) => sum + d.cantidad, 0),
                                                    diasDesdeCreacion: 0
                                                };
                                                setShowDetailModal(false);
                                                abrirPagoModal(facturaParaPago);
                                            }}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2 font-medium"
                                        >
                                            <DollarSign className="h-4 w-4" />
                                            Registrar Pago
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCloseDetailModal}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR PAGO */}
            {showPagoModal && selectedFactura && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Registrar Pago
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedFactura.numeroFactura} - {selectedFactura.nombreCliente}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPagoModal(false)}
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Factura:</span>
                                    <span className="font-medium text-black">{formatCurrency(selectedFactura.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ya Abonado:</span>
                                    <span className="font-medium text-green-600">
                                        {formatCurrency(selectedFactura.montoAbonado || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-1">
                                    <span className="font-medium text-gray-700">Pendiente:</span>
                                    <span className="font-bold text-orange-600">
                                        {formatCurrency(selectedFactura.montoPendiente || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Monto a Pagar *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={selectedFactura.montoPendiente || selectedFactura.total}
                                    value={pagoForm.monto}
                                    onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Máximo: {formatCurrency(selectedFactura.montoPendiente || 0)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Método de Pago *</label>
                                <select
                                    value={pagoForm.metodoPago}
                                    onChange={(e) => setPagoForm({ ...pagoForm, metodoPago: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Referencia (Opcional)</label>
                                <input
                                    type="text"
                                    value={pagoForm.referencia}
                                    onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    placeholder="Número de transacción, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Notas (Opcional)</label>
                                <textarea
                                    value={pagoForm.notas}
                                    onChange={(e) => setPagoForm({ ...pagoForm, notas: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    rows={2}
                                    placeholder="Notas adicionales sobre el pago..."
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handleRegistrarPago}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md font-medium"
                                >
                                    Registrar Pago
                                </button>
                                <button
                                    onClick={() => setShowPagoModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}