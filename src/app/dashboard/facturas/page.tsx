'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import {
    FacturaResumen,
    FacturaDetallesCompletos,
    ProximaEntregaFactura,
    Cliente,
    RegistrarPagoFacturaDto
} from '@/types';
import { toast } from 'sonner';
import {
    FileText,
    Search,
    RefreshCw,
    Clock,
    Filter,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    DollarSign,
    Printer,
    X,
    Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import FacturasComponents from '@/components/FacturasComponents';
import PrintFactura from '@/components/PrintFactura';
import { useRolePermissions } from '@/hooks/Userolepermissions';
import CalculadoraCambioModal from '@/components/CalculadoraCambioModal';

// ==========================================
// COMPONENTE: ClienteSearchFilter
// ==========================================
function ClienteSearchFilter({
    clientes,
    clienteId,
    onChange
}: {
    clientes: Cliente[];
    clienteId: number | null;
    onChange: (id: number | null) => void;
}) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selectedCliente = clientes.find(c => c.idCliente === clienteId);

    const filtered = search.trim()
        ? clientes.filter(c =>
            `${c.nombre} ${c.apellido || ''}`.toLowerCase().includes(search.toLowerCase()) ||
            (c.telefono || '').includes(search)
          )
        : clientes.slice(0, 20);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative min-w-[220px]">
            <div
                onClick={() => { setOpen(!open); setSearch(''); }}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm ${
                    clienteId ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-white'
                }`}
            >
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className={`flex-1 truncate ${clienteId ? 'text-cyan-700 font-medium' : 'text-gray-400'}`}>
                    {selectedCliente
                        ? `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim()
                        : 'Filtrar por cliente...'}
                </span>
                {clienteId && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
                        className="text-gray-400 hover:text-red-500"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-50 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-500">Sin resultados</p>
                        ) : (
                            filtered.map(c => (
                                <button
                                    key={c.idCliente}
                                    onMouseDown={() => { onChange(c.idCliente); setOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-cyan-50 ${
                                        c.idCliente === clienteId ? 'bg-cyan-50 font-medium text-cyan-700' : 'text-gray-900'
                                    }`}
                                >
                                    <span>{c.nombre} {c.apellido || ''}</span>
                                    {c.telefono && (
                                        <span className="text-xs text-gray-500 ml-2">{c.telefono}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// CONSTANTES Y HELPERS
// ==========================================

const ESTADOS_FACTURA = {
    PENDIENTE: 4,
    PAGADO: 5,
    ENTREGADO: 6,
    ANULADO: 7
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const getEstadoFactura = (factura: FacturaResumen) => {
    const formatEstadoNombre = (nombre: string): string => {
        const estadosMap: Record<string, string> = {
            'pago_pendiente': 'Pago Pendiente',
            'pago_completado': 'Pago Completado',
            'pendiente': 'Pendiente',
            'pagado': 'Pagado',
            'entregado': 'Entregado',
            'anulado': 'Anulado'
        };
        const formatted = nombre.toLowerCase()
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        return estadosMap[nombre.toLowerCase()] || formatted;
    };

    if (factura.estado.idEstado === ESTADOS_FACTURA.PAGADO) {
        return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-green-100 text-green-800' };
    }
    if (factura.estado.idEstado === ESTADOS_FACTURA.PENDIENTE) {
        if (factura.montoAbonado && factura.montoAbonado > 0) {
            return {
                texto: `Pago Parcial ${formatCurrency(factura.total - (factura.montoPendiente || factura.total))}`,
                clase: 'bg-yellow-100 text-yellow-800',
            };
        }
        return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-orange-100 text-orange-800' };
    }
    if (factura.estado.idEstado === ESTADOS_FACTURA.ENTREGADO) {
        return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-blue-100 text-blue-800' };
    }
    return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-gray-100 text-gray-800' };
};

const getEstadoDetalleFactura = (factura: FacturaDetallesCompletos) => {
    const formatEstadoNombre = (nombre: string): string => {
        const estadosMap: Record<string, string> = {
            'pago_pendiente': 'Pago Pendiente',
            'pago_completado': 'Pago Completado',
            'pendiente': 'Pendiente',
            'pagado': 'Pagado',
            'entregado': 'Entregado',
            'anulado': 'Anulado'
        };
        const formatted = nombre.toLowerCase()
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        return estadosMap[nombre.toLowerCase()] || formatted;
    };

    if (factura.estado.idEstado === ESTADOS_FACTURA.PAGADO)
        return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-green-100 text-green-800' };
    if (factura.estado.idEstado === ESTADOS_FACTURA.PENDIENTE)
        return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-orange-100 text-orange-800' };
    if (factura.estado.idEstado === ESTADOS_FACTURA.ENTREGADO)
        return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-blue-100 text-blue-800' };
    return { texto: formatEstadoNombre(factura.estado.nombre), clase: 'bg-gray-100 text-gray-800' };
};

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function FacturasPage() {
    const { canDelete } = useRolePermissions();

    // Estados principales
    const [facturasResumen, setFacturasResumen] = useState<FacturaResumen[]>([]);
    const [facturaDetalles, setFacturaDetalles] = useState<FacturaDetallesCompletos | null>(null);
    const [proximasEntregas, setProximasEntregas] = useState<ProximaEntregaFactura[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState({
        facturas: true,
        detalles: false,
        estadisticas: false,
        proximas: false
    });

    const [loadingFacturaId, setLoadingFacturaId] = useState<number | null>(null);
    const [actionType, setActionType] = useState<'detail' | 'print' | null>(null);

    // Filtros — incluye clienteId
    const [filtros, setFiltros] = useState({
        search: '',
        estadoId: null as number | null,
        fechaDesde: '',
        fechaHasta: '',
        soloPendientes: false,
        clienteId: null as number | null,
    });

    // Paginación
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Modales
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
    const [showPagoChangeModal, setShowPagoChangeModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showPrintPromptModal, setShowPrintPromptModal] = useState(false);
    const [showCalculadoraCambio, setShowCalculadoraCambio] = useState(false);
    const [facturaParaImprimir, setFacturaParaImprimir] = useState<FacturaDetallesCompletos | null>(null);

    // Selección / formularios
    const [selectedFactura, setSelectedFactura] = useState<FacturaResumen | null>(null);
    const [preparedFacturaDto, setPreparedFacturaDto] = useState<any>(null);
    const [dineroEntregado, setDineroEntregado] = useState('');
    const [facturaCreadaRecientemente, setFacturaCreadaRecientemente] = useState<FacturaDetallesCompletos | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const isProcessingRef = useRef(false);

    // Divisas
    const [divisas, setDivisas] = useState<{ clave: string; valor: string }[]>([]);
    const [divisaSeleccionadaPago, setDivisaSeleccionadaPago] = useState<string>('RD');

    // Formulario de pago
    const [pagoForm, setPagoForm] = useState<{
        monto: string;
        metodoPago: string;
        referencia?: string;
        notas?: string;
    }>({
        monto: '',
        metodoPago: 'efectivo',
        referencia: '',
        notas: '',
    });

    // ==========================================
    // EFECTOS
    // ==========================================

    useEffect(() => {
        fetchClientes();
        fetchProximasEntregas();
    }, []);

    useEffect(() => {
        const delay = setTimeout(() => { fetchFacturasResumen(); }, 500);
        return () => clearTimeout(delay);
    }, [filtros.search]);

    useEffect(() => {
        fetchFacturasResumen();
    }, [
        filtros.estadoId,
        filtros.fechaDesde,
        filtros.fechaHasta,
        filtros.soloPendientes,
        filtros.clienteId,
        pagination.page,
        pagination.pageSize
    ]);

    useEffect(() => {
        const img = new Image();
        img.src = '/Logo.jpeg';
    }, []);

    useEffect(() => {
        const fetchDivisas = async () => {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(API_ENDPOINTS.CONFIGURACIONES, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDivisas(data.filter((c: any) => c.clave.startsWith('DIVISA_')));
            }
        };
        fetchDivisas();
    }, []);

    // ==========================================
    // FETCH
    // ==========================================

    const fetchFacturasResumen = useCallback(async () => {
        try {
            setLoading(prev => ({ ...prev, facturas: true }));
            const token = localStorage.getItem('accessToken');

            let url = API_ENDPOINTS.FACTURAS_RESUMEN;
            const params = new URLSearchParams();

            if (filtros.search) params.append('search', filtros.search);
            if (filtros.estadoId) params.append('estadoId', filtros.estadoId.toString());
            if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
            if (filtros.clienteId) params.append('clienteId', filtros.clienteId.toString());
            params.append('page', pagination.page.toString());
            params.append('pageSize', pagination.pageSize.toString());

            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();

                if (data.data && data.pagination) {
                    let facturasFiltradas = data.data;
                    if (filtros.soloPendientes) {
                        facturasFiltradas = data.data.filter((f: FacturaResumen) =>
                            f.estado.idEstado === ESTADOS_FACTURA.PENDIENTE ||
                            (f.montoPendiente && f.montoPendiente > 0)
                        );
                    }
                    setFacturasResumen(facturasFiltradas);
                    setPagination(prev => ({
                        ...prev,
                        total: data.pagination.totalRecords || data.pagination.total || facturasFiltradas.length,
                        totalPages: data.pagination.totalPages || 1
                    }));
                } else {
                    let facturasFiltradas = data;
                    if (filtros.soloPendientes) {
                        facturasFiltradas = data.filter((f: FacturaResumen) =>
                            f.estado.idEstado === ESTADOS_FACTURA.PENDIENTE ||
                            (f.montoPendiente && f.montoPendiente > 0)
                        );
                    }
                    setFacturasResumen(facturasFiltradas);
                    setPagination(prev => ({
                        ...prev,
                        total: facturasFiltradas.length,
                        totalPages: Math.ceil(facturasFiltradas.length / pagination.pageSize)
                    }));
                }
            } else {
                toast.error('Error al cargar facturas');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        } finally {
            setLoading(prev => ({ ...prev, facturas: false }));
        }
    }, [filtros, pagination.page, pagination.pageSize]);

    const fetchClientes = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_ENDPOINTS.CLIENTES}?page=1&pageSize=1000`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setClientes(data.data || data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchFacturaDetalles = async (id: number) => {
        try {
            setLoading(prev => ({ ...prev, detalles: true }));
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.FACTURAS_DETALLES_COMPLETOS(id), {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setFacturaDetalles(data);
                return data;
            } else {
                toast.error('Error al cargar detalles');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, detalles: false }));
        }
    };

    const fetchProximasEntregas = async () => {
        try {
            setLoading(prev => ({ ...prev, proximas: true }));
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.FACTURAS_PROXIMAS_ENTREGA, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setProximasEntregas(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(prev => ({ ...prev, proximas: false }));
        }
    };

    // ==========================================
    // CREACIÓN E IMPRESIÓN
    // ==========================================

    const handleFacturaCreada = async (facturaCreada: FacturaDetallesCompletos) => {
        setFacturaCreadaRecientemente(facturaCreada);
        setShowPrintPromptModal(true);
    };

    const handleImprimirFacturaCreada = async () => {
        if (facturaCreadaRecientemente) {
            const facturaCompleta = await fetchFacturaDetalles(facturaCreadaRecientemente.idFactura);
            if (facturaCompleta) {
                setFacturaParaImprimir(facturaCompleta);
                setShowPrintModal(true);
                setShowPrintPromptModal(false);
                setFacturaCreadaRecientemente(null);
            }
        }
    };

    const handleNoImprimirFacturaCreada = () => {
        setShowPrintPromptModal(false);
        setFacturaCreadaRecientemente(null);
        fetchFacturasResumen();
    };

    const handleImprimirRapido = async (id: number) => {
        if (isProcessingRef.current || loadingFacturaId === id) return;
        try {
            isProcessingRef.current = true;
            setLoadingFacturaId(id);
            setActionType('print');
            setShowPrintModal(true);
            const factura = await fetchFacturaDetalles(id);
            if (factura) {
                setFacturaParaImprimir(factura);
            } else {
                setShowPrintModal(false);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar factura para impresión');
            setShowPrintModal(false);
        } finally {
            setLoadingFacturaId(null);
            setActionType(null);
            isProcessingRef.current = false;
        }
    };

    // ==========================================
    // PAGINACIÓN
    // ==========================================

    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page }));
        }
    };

    const goToNextPage = () => {
        if (pagination.page < pagination.totalPages)
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    };

    const goToPrevPage = () => {
        if (pagination.page > 1)
            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    };

    // ==========================================
    // PAGOS
    // ==========================================

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
        if (pagoForm.metodoPago === 'efectivo') {
            setShowPagoChangeModal(true);
            return;
        }
        await procesarPago(selectedFactura.idFactura, monto);
    };

    const procesarPago = async (idFactura: number, monto: number) => {
        const token = localStorage.getItem('accessToken');
        try {
            const dto: RegistrarPagoFacturaDto = {
                monto,
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
                fetchFacturasResumen();
                setShowPagoModal(false);
                setShowPagoChangeModal(false);
                setPagoForm({ monto: '', metodoPago: 'efectivo', referencia: '', notas: '' });

                const updatedFactura = await fetchFacturaDetalles(idFactura);
                if (updatedFactura) {
                    if ((updatedFactura.montoPendiente || 0) <= 0) {
                        setFacturaCreadaRecientemente(updatedFactura);
                        setShowPrintPromptModal(true);
                    }
                    if (facturaDetalles && facturaDetalles.idFactura === idFactura) {
                        setFacturaDetalles(updatedFactura);
                    }
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

    const handlePagoConCambio = async () => {
        if (!selectedFactura) return;
        const monto = parseFloat(pagoForm.monto) || 0;
        const entregadoRaw = parseFloat(dineroEntregado) || 0;
        const tasa = divisaSeleccionadaPago !== 'RD'
            ? parseFloat(divisas.find(d => d.clave === divisaSeleccionadaPago)?.valor || '1')
            : 1;
        const entregadoEnRD = entregadoRaw * tasa;
        if (entregadoEnRD < monto) {
            toast.error('El monto entregado es insuficiente');
            return;
        }
        await procesarPago(selectedFactura.idFactura, monto);
    };

    const getChangeAmountPago = () => {
        if (!selectedFactura) return 0;
        const monto = parseFloat(pagoForm.monto) || 0;
        const entregadoRaw = parseFloat(dineroEntregado) || 0;
        const tasa = divisaSeleccionadaPago !== 'RD'
            ? parseFloat(divisas.find(d => d.clave === divisaSeleccionadaPago)?.valor || '1')
            : 1;
        const entregadoEnRD = entregadoRaw * tasa;
        return Math.max(0, entregadoEnRD - monto);
    };

    // ==========================================
    // ESTADO Y ELIMINACIÓN
    // ==========================================

    const cambiarEstadoFactura = async (idFactura: number, idEstado: number, notas?: string) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.FACTURAS_CAMBIAR_ESTADO(idFactura), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ idEstado, notas }),
            });
            if (response.ok) {
                toast.success('Estado actualizado correctamente');
                fetchFacturasResumen();
                if (facturaDetalles && facturaDetalles.idFactura === idFactura) {
                    fetchFacturaDetalles(idFactura);
                }
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al cambiar estado');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) { toast.error('No tienes permisos para eliminar facturas'); return; }
        if (!confirm('¿Estás seguro de eliminar esta factura?')) return;
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.FACTURA_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                toast.success('Factura eliminada exitosamente');
                fetchFacturasResumen();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al eliminar factura');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    // ==========================================
    // HELPERS
    // ==========================================

    const handleCloseAllModals = () => {
        setShowModal(false);
        setShowConfirmationModal(false);
        setShowChangeModal(false);
        setShowDetailModal(false);
        setShowPagoModal(false);
        setShowPagoChangeModal(false);
        setShowPrintModal(false);
        setShowPrintPromptModal(false);
        setPreparedFacturaDto(null);
        setDineroEntregado('');
        setFacturaCreadaRecientemente(null);
        setFacturaParaImprimir(null);
        setSelectedFactura(null);
        setFacturaDetalles(null);
    };

    const abrirPagoModal = (factura: FacturaResumen) => {
        setSelectedFactura(factura);
        const pendiente = factura.montoPendiente || 0;
        setPagoForm({ monto: pendiente.toString(), metodoPago: 'efectivo', referencia: '', notas: '' });
        setDineroEntregado('');
        setDivisaSeleccionadaPago('RD');
        setShowPagoModal(true);
    };

    const aplicarFiltroPendientes = () => {
        const nuevoSoloPendientes = !filtros.soloPendientes;
        setFiltros(prev => ({
            ...prev,
            soloPendientes: nuevoSoloPendientes,
            estadoId: nuevoSoloPendientes ? ESTADOS_FACTURA.PENDIENTE : null
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const resetFiltros = () => {
        setFiltros({
            search: '',
            estadoId: null,
            fechaDesde: '',
            fechaHasta: '',
            soloPendientes: false,
            clienteId: null,
        });
        setPagination(prev => ({ ...prev, page: 1 }));
        if (searchInputRef.current) searchInputRef.current.focus();
    };

    const handleCloseChangeModal = () => {
        if (confirm('¿Estás seguro de cancelar? Asegúrate de haber anotado el cambio a devolver.')) {
            setShowChangeModal(false);
            setShowConfirmationModal(true);
        }
    };

    const handleClosePagoChangeModal = () => {
        if (confirm('¿Estás seguro de cancelar? Asegúrate de haber anotado el cambio a devolver.')) {
            setShowPagoChangeModal(false);
        }
    };

    const handleOpenDetail = async (id: number) => {
        if (isProcessingRef.current || loadingFacturaId === id) return;
        try {
            isProcessingRef.current = true;
            setLoadingFacturaId(id);
            setActionType('detail');
            setShowDetailModal(true);
            await fetchFacturaDetalles(id);
        } catch (error) {
            console.error('Error:', error);
            setShowDetailModal(false);
        } finally {
            setLoadingFacturaId(null);
            setActionType(null);
            isProcessingRef.current = false;
        }
    };

    // ==========================================
    // RENDER
    // ==========================================

    if (loading.facturas && facturasResumen.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    const startIndex = (pagination.page - 1) * pagination.pageSize + 1;
    const endIndex = Math.min(pagination.page * pagination.pageSize, pagination.total);
    const showingCount = facturasResumen.length;

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Gestión de Facturas
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Mostrando {showingCount} facturas {pagination.total > pagination.pageSize
                            ? `(${startIndex}-${endIndex} de ${pagination.total})`
                            : `de ${pagination.total} totales`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={aplicarFiltroPendientes}
                        className={`px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-2 ${
                            filtros.soloPendientes
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Clock className="h-4 w-4" />
                        {filtros.soloPendientes ? 'Mostrar Todas' : 'Solo Pendientes'}
                    </button>
                    <button
                        onClick={() => setShowCalculadoraCambio(true)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all shadow-md flex items-center gap-2"
                    >
                        <DollarSign className="h-4 w-4" /> Calcular Cambio
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" /> Nueva Factura
                    </button>
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Buscador de texto */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Buscar por número de factura o nombre de cliente..."
                                value={filtros.search}
                                onChange={(e) => {
                                    setFiltros({ ...filtros, search: e.target.value });
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black text-sm"
                            />
                        </div>
                    </div>

                    {/* Filtro por cliente */}
                    <ClienteSearchFilter
                        clientes={clientes}
                        clienteId={filtros.clienteId}
                        onChange={(id) => {
                            setFiltros(prev => ({ ...prev, clienteId: id }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    />

                    <button
                        onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {showFiltrosAvanzados ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <button
                        onClick={resetFiltros}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                    >
                        <RefreshCw className="h-4 w-4" /> Limpiar
                    </button>
                </div>

                {/* Indicador de filtro de cliente activo */}
                {filtros.clienteId && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded-full flex items-center gap-1">
                            Filtrando por: <strong>
                                {(() => {
                                    const c = clientes.find(c => c.idCliente === filtros.clienteId);
                                    return c ? `${c.nombre} ${c.apellido || ''}`.trim() : 'Cliente';
                                })()}
                            </strong>
                            <button
                                onClick={() => {
                                    setFiltros(prev => ({ ...prev, clienteId: null }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="ml-1 hover:text-red-500"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    </div>
                )}

                {/* FILTROS AVANZADOS */}
                {showFiltrosAvanzados && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Estado</label>
                                <select
                                    value={filtros.estadoId || ''}
                                    onChange={(e) => {
                                        setFiltros({ ...filtros, estadoId: e.target.value ? parseInt(e.target.value) : null });
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="4">Pendiente</option>
                                    <option value="5">Pagado</option>
                                    <option value="6">Entregado</option>
                                    <option value="7">Anulado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Fecha Desde</label>
                                <input
                                    type="date"
                                    value={filtros.fechaDesde}
                                    onChange={(e) => {
                                        setFiltros({ ...filtros, fechaDesde: e.target.value });
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Fecha Hasta</label>
                                <input
                                    type="date"
                                    value={filtros.fechaHasta}
                                    onChange={(e) => {
                                        setFiltros({ ...filtros, fechaHasta: e.target.value });
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PRÓXIMAS ENTREGAS */}
            {proximasEntregas.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-orange-700 flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Próximas Entregas
                        </h3>
                        <span className="text-sm text-orange-600">{proximasEntregas.length} facturas</span>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex gap-3 pb-2">
                            {proximasEntregas.slice(0, 5).map((entrega) => (
                                <div key={entrega.idFactura} className="bg-white p-3 rounded-lg border border-orange-200 min-w-[250px] flex-shrink-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">{entrega.numeroFactura}</p>
                                            <p className="text-xs text-gray-600">{entrega.nombreCliente}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            entrega.diasRestantes <= 0 ? 'bg-red-100 text-red-800' :
                                            entrega.diasRestantes <= 1 ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {entrega.diasRestantes <= 0 ? 'Hoy' :
                                             entrega.diasRestantes === 1 ? 'Mañana' :
                                             `${entrega.diasRestantes} días`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total:</span>
                                        <span className="font-semibold text-gray-900">{formatCurrency(entrega.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-600">Entrega:</span>
                                        <span className="font-medium text-gray-900">
                                            {entrega.fechaEntregaEstimada
                                                ? format(parseISO(entrega.fechaEntregaEstimada), 'dd/MM/yyyy', { locale: es })
                                                : 'Sin fecha'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 mt-2">
                                        <button
                                            onClick={() => handleOpenDetail(entrega.idFactura)}
                                            disabled={loadingFacturaId === entrega.idFactura && actionType === 'detail'}
                                            className="flex-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                        >
                                            {loadingFacturaId === entrega.idFactura && actionType === 'detail'
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : 'Ver'}
                                        </button>
                                        <button
                                            onClick={() => handleImprimirRapido(entrega.idFactura)}
                                            disabled={loadingFacturaId === entrega.idFactura && actionType === 'print'}
                                            className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                        >
                                            {loadingFacturaId === entrega.idFactura && actionType === 'print'
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : 'Imprimir'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cyan-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Número</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Pagado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Pendiente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {facturasResumen.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-gray-500 font-medium">No se encontraron facturas</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {filtros.search || filtros.estadoId || filtros.fechaDesde || filtros.fechaHasta || filtros.clienteId
                                                    ? 'Intenta con otros filtros'
                                                    : 'Crea tu primera factura'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                facturasResumen.map((factura) => {
                                    const estado = getEstadoFactura(factura);
                                    const pendiente = factura.montoPendiente || 0;
                                    const isLoadingThisRow = loadingFacturaId === factura.idFactura;

                                    return (
                                        <tr key={factura.idFactura} className="hover:bg-cyan-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{factura.numeroFactura}</div>
                                                <div className="text-xs text-gray-500">{factura.totalItems} items</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{factura.nombreCliente}</div>
                                                {factura.telefonoCliente && (
                                                    <div className="text-xs text-gray-500">{factura.telefonoCliente}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {format(parseISO(factura.fechaCreacion), 'dd/MM/yyyy', { locale: es })}
                                                </div>
                                                {factura.fechaEntregaEstimada && (
                                                    <div className="text-xs text-gray-500">
                                                        Entrega: {format(parseISO(factura.fechaEntregaEstimada), 'dd/MM/yy', { locale: es })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{formatCurrency(factura.total)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-green-600 font-semibold">
                                                    {formatCurrency(factura.montoAbonado || 0)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm font-semibold ${pendiente > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {formatCurrency(pendiente)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${estado.clase}`}>
                                                    {estado.texto}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenDetail(factura.idFactura)}
                                                        className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all border border-blue-600 disabled:opacity-50"
                                                        title="Ver detalle"
                                                        disabled={isLoadingThisRow}
                                                    >
                                                        {isLoadingThisRow && actionType === 'detail'
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleImprimirRapido(factura.idFactura)}
                                                        className="p-2 text-gray-700 hover:text-white hover:bg-gray-700 rounded-lg transition-all border border-gray-600 disabled:opacity-50"
                                                        title="Imprimir"
                                                        disabled={isLoadingThisRow}
                                                    >
                                                        {isLoadingThisRow && actionType === 'print'
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <Printer className="h-4 w-4" />}
                                                    </button>
                                                    {pendiente > 0 && (
                                                        <button
                                                            onClick={() => abrirPagoModal(factura)}
                                                            className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all border border-green-600"
                                                            title="Registrar pago"
                                                        >
                                                            <DollarSign className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(factura.idFactura)}
                                                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-600"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Página {pagination.page} de {pagination.totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={goToPrevPage}
                                disabled={pagination.page === 1}
                                className={`p-2 rounded-lg border ${
                                    pagination.page === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex space-x-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (pagination.totalPages <= 5) pageNum = i + 1;
                                    else if (pagination.page <= 3) pageNum = i + 1;
                                    else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                                    else pageNum = pagination.page - 2 + i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => goToPage(pageNum)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                                pagination.page === pageNum
                                                    ? 'bg-cyan-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={goToNextPage}
                                disabled={pagination.page === pagination.totalPages}
                                className={`p-2 rounded-lg border ${
                                    pagination.page === pagination.totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                }`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-700">{pagination.total} facturas totales</div>
                    </div>
                )}
            </div>

            {/* MODALES */}
            <FacturasComponents
                showModal={showModal}
                showDetailModal={showDetailModal}
                showPagoModal={showPagoModal}
                showConfirmationModal={showConfirmationModal}
                showChangeModal={showChangeModal}
                showPagoChangeModal={showPagoChangeModal}
                showPrintModal={showPrintModal}
                preparedFacturaDto={preparedFacturaDto}
                facturaDetalles={facturaDetalles}
                selectedFactura={selectedFactura}
                pagoForm={pagoForm}
                dineroEntregado={dineroEntregado}
                clientes={clientes}
                loading={loading}
                confirmationForm={null}
                onFacturaCreada={handleFacturaCreada}
                setPreparedFacturaDto={setPreparedFacturaDto}
                setPagoForm={setPagoForm}
                setDineroEntregado={setDineroEntregado}
                setShowModal={setShowModal}
                setShowDetailModal={setShowDetailModal}
                setShowPagoModal={setShowPagoModal}
                setShowConfirmationModal={setShowConfirmationModal}
                setShowChangeModal={setShowChangeModal}
                setShowPagoChangeModal={setShowPagoChangeModal}
                setShowPrintModal={setShowPrintModal}
                handleCloseAllModals={handleCloseAllModals}
                handleRegistrarPago={handleRegistrarPago}
                handlePagoConCambio={handlePagoConCambio}
                fetchFacturasResumen={fetchFacturasResumen}
                fetchFacturaDetalles={fetchFacturaDetalles}
                cambiarEstadoFactura={cambiarEstadoFactura}
                handleCloseChangeModal={handleCloseChangeModal}
                handleClosePagoChangeModal={handleClosePagoChangeModal}
                getEstadoDetalleFactura={getEstadoDetalleFactura}
                formatCurrency={formatCurrency}
                abrirPagoModal={abrirPagoModal}
                getChangeAmountPago={getChangeAmountPago}
                onImprimirDesdeDetalle={() => {
                    if (facturaDetalles) {
                        setShowDetailModal(false);
                        setFacturaParaImprimir(facturaDetalles);
                        setShowPrintModal(true);
                    }
                }}
            />

            {/* MODAL IMPRESIÓN */}
            <PrintFactura
                factura={facturaParaImprimir}
                isOpen={showPrintModal}
                onClose={() => {
                    setShowPrintModal(false);
                    setFacturaParaImprimir(null);
                }}
            />

            {/* MODAL: ¿IMPRIMIR FACTURA CREADA? */}
            {showPrintPromptModal && facturaCreadaRecientemente && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Printer className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Factura {(facturaCreadaRecientemente.montoPendiente || 0) <= 0 ? 'Pagada' : 'Creada'} Exitosamente
                            </h3>
                            <p className="text-gray-600">
                                La factura <span className="font-semibold text-cyan-600">{facturaCreadaRecientemente.numeroFactura}</span> ha sido{' '}
                                {(facturaCreadaRecientemente.montoPendiente || 0) <= 0 ? 'pagada completamente' : 'creada'}.
                            </p>
                        </div>
                        <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200 mb-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cliente:</span>
                                    <span className="font-medium text-gray-900">{facturaCreadaRecientemente.nombreCliente}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-bold text-cyan-600">{formatCurrency(facturaCreadaRecientemente.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estado:</span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                        (facturaCreadaRecientemente.montoPendiente || 0) <= 0
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {(facturaCreadaRecientemente.montoPendiente || 0) <= 0 ? 'Pagado Completo' : 'Pendiente de Pago'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-center text-gray-700 font-medium">¿Deseas imprimir la factura ahora?</p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleImprimirFacturaCreada}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Printer className="h-4 w-4" /> Sí, Imprimir
                                </button>
                                <button
                                    onClick={handleNoImprimirFacturaCreada}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    No, Gracias
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Puedes imprimirla más tarde desde la lista de facturas
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR PAGO */}
            {showPagoModal && selectedFactura && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Registrar Pago - {selectedFactura.numeroFactura}
                        </h3>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cliente:</span>
                                    <span className="font-medium text-black">{selectedFactura.nombreCliente}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Factura:</span>
                                    <span className="font-medium text-black">{formatCurrency(selectedFactura.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ya Abonado:</span>
                                    <span className="font-medium text-green-600">{formatCurrency(selectedFactura.montoAbonado || 0)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1">
                                    <span className="font-medium text-gray-700">Pendiente:</span>
                                    <span className="font-bold text-orange-600">{formatCurrency(selectedFactura.montoPendiente || 0)}</span>
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
                                <p className="text-xs text-gray-500 mt-1">Máximo: {formatCurrency(selectedFactura.montoPendiente || 0)}</p>
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
                                />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handleRegistrarPago}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    Registrar Pago
                                </button>
                                <button
                                    onClick={() => setShowPagoModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CAMBIO PARA PAGOS EXISTENTES */}
            {showPagoChangeModal && selectedFactura && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Calcular Cambio - {selectedFactura.numeroFactura}
                        </h3>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Monto a Pagar:</span>
                                    <span className="font-bold text-cyan-600">{formatCurrency(parseFloat(pagoForm.monto) || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Método:</span>
                                    <span className="font-medium text-gray-900 capitalize">{pagoForm.metodoPago}</span>
                                </div>
                            </div>
                            {divisas.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Moneda de pago del cliente</label>
                                    <select
                                        value={divisaSeleccionadaPago}
                                        onChange={(e) => { setDivisaSeleccionadaPago(e.target.value); setDineroEntregado(''); }}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    >
                                        <option value="RD">Pesos Dominicanos (RD$)</option>
                                        {divisas.map(d => (
                                            <option key={d.clave} value={d.clave}>
                                                {d.clave.replace('DIVISA_', '')} (1 = RD$ {parseFloat(d.valor).toFixed(2)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Dinero Entregado
                                    {divisaSeleccionadaPago !== 'RD' && (
                                        <span className="ml-1 text-cyan-600 font-semibold">
                                            (en {divisaSeleccionadaPago.replace('DIVISA_', '')})
                                        </span>
                                    )} *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={dineroEntregado}
                                    onChange={(e) => setDineroEntregado(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    autoFocus
                                />
                                {divisaSeleccionadaPago !== 'RD' && dineroEntregado && (() => {
                                    const tasa = parseFloat(divisas.find(d => d.clave === divisaSeleccionadaPago)?.valor || '1');
                                    return (
                                        <p className="text-xs text-cyan-600 mt-1">
                                            Equivale a {formatCurrency(parseFloat(dineroEntregado) * tasa)} en RD$
                                        </p>
                                    );
                                })()}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Cambio a Devolver (RD$):</label>
                                <p className={`text-2xl font-bold ${getChangeAmountPago() >= 0 && parseFloat(dineroEntregado) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(getChangeAmountPago())}
                                </p>
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handlePagoConCambio}
                                    disabled={getChangeAmountPago() < 0 || !dineroEntregado}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md disabled:opacity-50"
                                >
                                    Confirmar Pago
                                </button>
                                <button
                                    onClick={handleClosePagoChangeModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCalculadoraCambio && (
                <CalculadoraCambioModal
                    divisas={divisas}
                    onClose={() => setShowCalculadoraCambio(false)}
                    formatCurrency={formatCurrency}
                />
            )}
        </div>
    );
}