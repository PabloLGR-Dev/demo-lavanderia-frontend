'use client';

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import {
    GastoResumen,
    CategoriaGasto,
    CreateGastoDto,
    UpdateGastoDto,
} from '@/types';
import { toast } from 'sonner';
import {
    Plus,
    Search,
    Eye,
    Edit2,
    Trash2,
    X,
    Calendar,
    Tag,
    FileText,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    DollarSign,
    TrendingUp,
    Package
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRolePermissions } from '@/hooks/Userolepermissions';

// Formatear moneda dominicana con separadores de miles
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

// Colores predefinidos para categorías
const COLORES_CATEGORIAS = [
    { nombre: 'Rojo', valor: '#EF4444' },
    { nombre: 'Naranja', valor: '#F97316' },
    { nombre: 'Amarillo', valor: '#F59E0B' },
    { nombre: 'Verde', valor: '#10B981' },
    { nombre: 'Azul', valor: '#3B82F6' },
    { nombre: 'Índigo', valor: '#6366F1' },
    { nombre: 'Púrpura', valor: '#8B5CF6' },
    { nombre: 'Rosa', valor: '#EC4899' },
    { nombre: 'Gris', valor: '#6B7280' },
    { nombre: 'Cyan', valor: '#06B6D4' },
];

type VistaActual = 'gastos' | 'categorias';

interface CategoriaResumen {
    idCategoriaGasto: number;
    nombre: string;
    descripcion?: string;
    color?: string;
    idEstado: number;
    estado: string;
    fechaCreacion: string;
    montoPredefinido?: number | null;
    totalGastos: number;
    montoTotalGastos: number;
}

export default function GastosPage() {
    // Hook de permisos
    const { canDelete } = useRolePermissions();

    // Estados principales
    const [vistaActual, setVistaActual] = useState<VistaActual>('gastos');
    const [gastos, setGastos] = useState<GastoResumen[]>([]);
    const [categoriasResumen, setCategoriasResumen] = useState<CategoriaResumen[]>([]);
    const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados para modales
    const [showModalGasto, setShowModalGasto] = useState(false);
    const [showModalCategoria, setShowModalCategoria] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingGasto, setEditingGasto] = useState<GastoResumen | null>(null);
    const [editingCategoria, setEditingCategoria] = useState<CategoriaResumen | null>(null);
    const [selectedGasto, setSelectedGasto] = useState<GastoResumen | null>(null);

    // Estados para filtros
    const [filtrosGastos, setFiltrosGastos] = useState({
        search: '',
        categoriaId: null as number | null,
        fechaDesde: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        fechaHasta: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });

    const [filtrosCategorias, setFiltrosCategorias] = useState({
        search: '',
        estadoId: null as number | null,
    });

    // Estados para control de filtros desplegables
    const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

    // Estados para paginación
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
    });

    // Formulario de gasto
    const [gastoForm, setGastoForm] = useState<CreateGastoDto>({
        idCategoriaGasto: 0,
        monto: 0,
        fechaGasto: format(new Date(), 'yyyy-MM-dd'),
        descripcion: '',
        referencia: '',
        comprobanteUrl: '',
        idEstado: 1,
    });

    // Formulario de categoría
    const [categoriaForm, setCategoriaForm] = useState({
        nombre: '',
        descripcion: '',
        color: '#6B7280',
        idEstado: 1,
        montoPredefinido: '',
    });

    // ==================== EFECTOS ====================
    useEffect(() => {
        fetchCategorias();
        if (vistaActual === 'gastos') {
            fetchGastos();
        } else {
            fetchCategoriasResumen();
        }
    }, [vistaActual]);

    useEffect(() => {
        if (vistaActual === 'gastos') {
            const delaySearch = setTimeout(() => {
                fetchGastos();
            }, 500);
            return () => clearTimeout(delaySearch);
        }
    }, [
        filtrosGastos.search,
        filtrosGastos.categoriaId,
        filtrosGastos.fechaDesde,
        filtrosGastos.fechaHasta,
        pagination.page,
        pagination.pageSize
    ]);

    useEffect(() => {
        if (vistaActual === 'categorias') {
            const delaySearch = setTimeout(() => {
                fetchCategoriasResumen();
            }, 500);
            return () => clearTimeout(delaySearch);
        }
    }, [
        filtrosCategorias.search,
        filtrosCategorias.estadoId,
        pagination.page,
        pagination.pageSize
    ]);

    // ==================== FUNCIONES DE FETCH ====================
    const fetchGastos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            let url = API_ENDPOINTS.GASTOS_RESUMEN;
            const params = new URLSearchParams();

            if (filtrosGastos.search) params.append('search', filtrosGastos.search);
            if (filtrosGastos.categoriaId) params.append('categoriaId', filtrosGastos.categoriaId.toString());
            if (filtrosGastos.fechaDesde) params.append('fechaDesde', filtrosGastos.fechaDesde);
            if (filtrosGastos.fechaHasta) params.append('fechaHasta', filtrosGastos.fechaHasta);
            params.append('page', pagination.page.toString());
            params.append('pageSize', pagination.pageSize.toString());

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setGastos(data.data || []);
                if (data.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: data.pagination.totalRecords,
                        totalPages: data.pagination.totalPages
                    }));
                }
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar gastos');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriasResumen = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            let url = API_ENDPOINTS.CATEGORIAS_GASTOS_RESUMEN;
            const params = new URLSearchParams();

            if (filtrosCategorias.search) params.append('search', filtrosCategorias.search);
            if (filtrosCategorias.estadoId) params.append('estadoId', filtrosCategorias.estadoId.toString());
            params.append('page', pagination.page.toString());
            params.append('pageSize', pagination.pageSize.toString());

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setCategoriasResumen(data.data || []);
                if (data.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: data.pagination.totalRecords,
                        totalPages: data.pagination.totalPages
                    }));
                }
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategorias = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.CATEGORIAS_GASTOS_ACTIVAS, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setCategorias(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // ==================== MANEJO DE GASTOS ====================
    const handleCreateGasto = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!gastoForm.idCategoriaGasto) {
            toast.error('Selecciona una categoría');
            return;
        }

        if (gastoForm.monto <= 0) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.GASTOS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(gastoForm),
            });

            if (response.ok) {
                toast.success('Gasto registrado exitosamente');
                setShowModalGasto(false);
                resetGastoForm();
                fetchGastos();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al registrar gasto');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleUpdateGasto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGasto) return;

        const token = localStorage.getItem('accessToken');
        try {
            const updateDto: UpdateGastoDto = {
                idCategoriaGasto: gastoForm.idCategoriaGasto,
                monto: gastoForm.monto,
                fechaGasto: gastoForm.fechaGasto,
                descripcion: gastoForm.descripcion,
                referencia: gastoForm.referencia || undefined,
                comprobanteUrl: gastoForm.comprobanteUrl || undefined,
            };

            const response = await fetch(API_ENDPOINTS.GASTO_BY_ID(editingGasto.idGasto), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateDto),
            });

            if (response.ok) {
                toast.success('Gasto actualizado exitosamente');
                setShowModalGasto(false);
                setEditingGasto(null);
                resetGastoForm();
                fetchGastos();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al actualizar gasto');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleDeleteGasto = async (id: number) => {
        // Verificar permisos antes de eliminar
        if (!canDelete) {
            toast.error('No tienes permisos para eliminar gastos');
            return;
        }

        if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.GASTO_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success('Gasto eliminado exitosamente');
                fetchGastos();
            } else {
                toast.error('Error al eliminar gasto');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    // ==================== MANEJO DE CATEGORÍAS ====================

    // Helper para serializar montoPredefinido de forma consistente
    const serializeMontoPredefinido = (value: string): number | null => {
        return value !== '' && value != null ? parseFloat(value) : null;
    };

    const handleCreateCategoria = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoriaForm.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        const token = localStorage.getItem('accessToken');
        try {
            // FIX: Serialize montoPredefinido consistently instead of sending raw form
            const response = await fetch(API_ENDPOINTS.CATEGORIAS_GASTOS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre: categoriaForm.nombre,
                    descripcion: categoriaForm.descripcion || undefined,
                    color: categoriaForm.color,
                    idEstado: categoriaForm.idEstado,
                    montoPredefinido: serializeMontoPredefinido(categoriaForm.montoPredefinido),
                }),
            });

            if (response.ok) {
                toast.success('Categoría creada exitosamente');
                setShowModalCategoria(false);
                resetCategoriaForm();
                fetchCategorias();
                fetchCategoriasResumen();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al crear categoría');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleUpdateCategoria = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategoria) return;

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.CATEGORIA_GASTO_BY_ID(editingCategoria.idCategoriaGasto), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre: categoriaForm.nombre,
                    descripcion: categoriaForm.descripcion || undefined,
                    color: categoriaForm.color,
                    idEstado: categoriaForm.idEstado,
                    // FIX: Use explicit null check instead of truthy check so 0 is preserved
                    montoPredefinido: serializeMontoPredefinido(categoriaForm.montoPredefinido),
                }),
            });

            if (response.ok) {
                toast.success('Categoría actualizada exitosamente');
                setShowModalCategoria(false);
                setEditingCategoria(null);
                resetCategoriaForm();
                fetchCategorias();
                fetchCategoriasResumen();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al actualizar categoría');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleDeleteCategoria = async (id: number) => {
        // Verificar permisos antes de eliminar
        if (!canDelete) {
            toast.error('No tienes permisos para eliminar categorías');
            return;
        }

        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.CATEGORIA_GASTO_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success('Categoría eliminada exitosamente');
                fetchCategorias();
                fetchCategoriasResumen();
            } else {
                const error = await response.json();
                toast.error(error.message || 'No se puede eliminar la categoría porque tiene gastos asociados');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleToggleEstadoCategoria = async (id: number) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.CATEGORIA_GASTO_TOGGLE_ESTADO(id), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success('Estado actualizado exitosamente');
                fetchCategorias();
                fetchCategoriasResumen();
            } else {
                toast.error('Error al actualizar estado');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    // ==================== HELPERS ====================
    const resetGastoForm = () => {
        setGastoForm({
            idCategoriaGasto: 0,
            monto: 0,
            fechaGasto: format(new Date(), 'yyyy-MM-dd'),
            descripcion: '',
            referencia: '',
            comprobanteUrl: '',
            idEstado: 1,
        });
    };

    const resetCategoriaForm = () => {
        setCategoriaForm({
            nombre: '',
            descripcion: '',
            color: '#6B7280',
            idEstado: 1,
            montoPredefinido: '',
        });
    };

    const abrirModalEditarGasto = (gasto: GastoResumen) => {
        setEditingGasto(gasto);
        const categoria = categorias.find(c => c.nombre === gasto.categoria);
        setGastoForm({
            idCategoriaGasto: categoria?.idCategoriaGasto || 0,
            monto: gasto.monto,
            fechaGasto: format(parseISO(gasto.fechaGasto), 'yyyy-MM-dd'),
            descripcion: gasto.descripcion,
            referencia: gasto.referencia || '',
            comprobanteUrl: gasto.comprobanteUrl || '',
            idEstado: 1,
        });
        setShowModalGasto(true);
    };

    const abrirModalEditarCategoria = (categoria: CategoriaResumen) => {
        setEditingCategoria(categoria);
        setCategoriaForm({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || '',
            color: categoria.color || '#6B7280',
            idEstado: categoria.idEstado,
            montoPredefinido: categoria.montoPredefinido != null ? categoria.montoPredefinido.toString() : '',
        });
        setShowModalCategoria(true);
    };

    const resetFiltrosGastos = () => {
        setFiltrosGastos({
            search: '',
            categoriaId: null,
            fechaDesde: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            fechaHasta: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const resetFiltrosCategorias = () => {
        setFiltrosCategorias({
            search: '',
            estadoId: null,
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const cambiarVista = (nuevaVista: VistaActual) => {
        setVistaActual(nuevaVista);
        setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
        setMostrarFiltrosAvanzados(false);
    };

    // ==================== PAGINACIÓN ====================
    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page }));
        }
    };

    if (loading && gastos.length === 0 && categoriasResumen.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        {vistaActual === 'gastos' ? 'Gestión de Gastos' : 'Gestión de Categorías'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {vistaActual === 'gastos'
                            ? 'Control de gastos operativos del negocio'
                            : 'Administra las categorías de gastos'
                        }
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button
                        onClick={() => cambiarVista(vistaActual === 'gastos' ? 'categorias' : 'gastos')}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        {vistaActual === 'gastos' ? (
                            <>
                                <Tag className="h-4 w-4" />
                                Gestionar Categorías
                            </>
                        ) : (
                            <>
                                <DollarSign className="h-4 w-4" />
                                Gestionar Gastos
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            if (vistaActual === 'gastos') {
                                setShowModalGasto(true);
                            } else {
                                setShowModalCategoria(true);
                            }
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {vistaActual === 'gastos' ? 'Nuevo Gasto' : 'Nueva Categoría'}
                    </button>
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-white rounded-xl shadow-lg border border-cyan-100">
                {vistaActual === 'gastos' ? (
                    <div className="p-4">
                        {/* Barra de búsqueda principal */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por descripción o referencia..."
                                    value={filtrosGastos.search}
                                    onChange={(e) => setFiltrosGastos({ ...filtrosGastos, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black text-sm"
                                />
                            </div>
                            <button
                                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                            >
                                {mostrarFiltrosAvanzados ? (
                                    <>
                                        <ChevronUp className="h-4 w-4" />
                                        Ocultar Filtros
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4" />
                                        Más Filtros
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Filtros avanzados colapsables */}
                        {mostrarFiltrosAvanzados && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                        <select
                                            value={filtrosGastos.categoriaId || ''}
                                            onChange={(e) => setFiltrosGastos({ ...filtrosGastos, categoriaId: e.target.value ? parseInt(e.target.value) : null })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                        >
                                            <option value="">Todas las categorías</option>
                                            {categorias.map((c) => (
                                                <option key={c.idCategoriaGasto} value={c.idCategoriaGasto}>
                                                    {c.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
                                        <input
                                            type="date"
                                            value={filtrosGastos.fechaDesde}
                                            onChange={(e) => setFiltrosGastos({ ...filtrosGastos, fechaDesde: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
                                        <input
                                            type="date"
                                            value={filtrosGastos.fechaHasta}
                                            onChange={(e) => setFiltrosGastos({ ...filtrosGastos, fechaHasta: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={resetFiltrosGastos}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <RefreshCw className="h-4 w-4" /> Limpiar Filtros
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4">
                        {/* Barra de búsqueda para categorías */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar categoría por nombre o descripción..."
                                    value={filtrosCategorias.search}
                                    onChange={(e) => setFiltrosCategorias({ ...filtrosCategorias, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black text-sm"
                                />
                            </div>
                            <button
                                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                            >
                                {mostrarFiltrosAvanzados ? (
                                    <>
                                        <ChevronUp className="h-4 w-4" />
                                        Ocultar Filtros
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4" />
                                        Más Filtros
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Filtros avanzados para categorías */}
                        {mostrarFiltrosAvanzados && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        <select
                                            value={filtrosCategorias.estadoId || ''}
                                            onChange={(e) => setFiltrosCategorias({ ...filtrosCategorias, estadoId: e.target.value ? parseInt(e.target.value) : null })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                        >
                                            <option value="">Todos los estados</option>
                                            <option value="1">Activo</option>
                                            <option value="2">Inactivo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={resetFiltrosCategorias}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <RefreshCw className="h-4 w-4" /> Limpiar Filtros
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TABLA DE GASTOS */}
            {vistaActual === 'gastos' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cyan-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Referencia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {gastos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p>No se encontraron gastos</p>
                                    </td>
                                </tr>
                            ) : (
                                gastos.map((gasto) => (
                                    <tr key={gasto.idGasto} className="hover:bg-cyan-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {format(parseISO(gasto.fechaGasto), 'dd/MM/yyyy', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <span
                                                className="inline-block px-3 py-1 rounded-full text-white text-xs font-medium truncate max-w-[120px] sm:max-w-none text-center"
                                                style={{ backgroundColor: gasto.categoriaColor }}
                                                title={gasto.categoria}
                                            >
                                                {gasto.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{gasto.descripcion}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{gasto.referencia || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-red-600">
                                            {formatCurrency(gasto.monto)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{gasto.usuario}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedGasto(gasto);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all border border-blue-600"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => abrirModalEditarGasto(gasto)}
                                                    className="p-2 text-orange-600 hover:text-white hover:bg-orange-600 rounded-lg transition-all border border-orange-600"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                {/* Botón de eliminar condicionado por permisos */}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteGasto(gasto.idGasto)}
                                                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-600"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Página {pagination.page} de {pagination.totalPages} • Total: {pagination.total} gastos
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className={`p-2 rounded-lg border ${
                                        pagination.page === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className={`p-2 rounded-lg border ${
                                        pagination.page === pagination.totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TABLA DE CATEGORÍAS */}
            {vistaActual === 'categorias' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cyan-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Color</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Monto Predef.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Total Gastos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Monto Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {categoriasResumen.length === 0 ? (
                                <tr>
                                    {/* FIX: colSpan updated from 7 to 8 to match the 8-column header */}
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p>No se encontraron categorías</p>
                                    </td>
                                </tr>
                            ) : (
                                categoriasResumen.map((categoria) => (
                                    <tr key={categoria.idCategoriaGasto} className="hover:bg-cyan-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div
                                                className="w-8 h-8 rounded-full border-2 border-gray-300"
                                                style={{ backgroundColor: categoria.color || '#6B7280' }}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                            {categoria.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {categoria.descripcion || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {categoria.montoPredefinido != null ? (
                                                <span className="font-semibold text-cyan-600">
                                                    {formatCurrency(categoria.montoPredefinido)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Variable</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-cyan-600" />
                                                {categoria.totalGastos} gastos
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-red-600">
                                            {formatCurrency(categoria.montoTotalGastos)}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleEstadoCategoria(categoria.idCategoriaGasto)}
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    categoria.idEstado === 1
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                            >
                                                {categoria.estado}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => abrirModalEditarCategoria(categoria)}
                                                    className="p-2 text-orange-600 hover:text-white hover:bg-orange-600 rounded-lg transition-all border border-orange-600"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                {/* Botón de eliminar condicionado por permisos */}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteCategoria(categoria.idCategoriaGasto)}
                                                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-600"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Página {pagination.page} de {pagination.totalPages} • Total: {pagination.total} categorías
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className={`p-2 rounded-lg border ${
                                        pagination.page === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className={`p-2 rounded-lg border ${
                                        pagination.page === pagination.totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL NUEVO/EDITAR GASTO */}
            {showModalGasto && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModalGasto(false);
                                    setEditingGasto(null);
                                    resetGastoForm();
                                }}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={editingGasto ? handleUpdateGasto : handleCreateGasto} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Categoría *</label>
                                <select
                                    required
                                    value={gastoForm.idCategoriaGasto}
                                    onChange={(e) => {
                                        const catId = parseInt(e.target.value);
                                        const categoriaSeleccionada = categorias.find(c => c.idCategoriaGasto === catId);
                                        
                                        setGastoForm({ 
                                            ...gastoForm, 
                                            idCategoriaGasto: catId,
                                            // CORRECCIÓN: Si hay monto predefinido lo usa, si no, se limpia a 0
                                            monto: categoriaSeleccionada?.montoPredefinido || 0
                                        });
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                >
                                    <option value={0}>Seleccionar categoría...</option>
                                    {categorias.map((c) => (
                                        <option key={c.idCategoriaGasto} value={c.idCategoriaGasto}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Monto *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={gastoForm.monto || ''}
                                    onChange={(e) => setGastoForm({ ...gastoForm, monto: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Fecha de Gasto *</label>
                                <input
                                    type="date"
                                    required
                                    value={gastoForm.fechaGasto}
                                    onChange={(e) => setGastoForm({ ...gastoForm, fechaGasto: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Descripción *</label>
                                <textarea
                                    value={gastoForm.descripcion}
                                    onChange={(e) => setGastoForm({ ...gastoForm, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    rows={3}
                                    placeholder="Describe el gasto..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Referencia (Opcional)</label>
                                <input
                                    type="text"
                                    value={gastoForm.referencia}
                                    onChange={(e) => setGastoForm({ ...gastoForm, referencia: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    placeholder="Factura #, recibo, etc."
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    {editingGasto ? 'Actualizar' : 'Crear'} Gasto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModalGasto(false);
                                        setEditingGasto(null);
                                        resetGastoForm();
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL NUEVA/EDITAR CATEGORÍA */}
            {showModalCategoria && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModalCategoria(false);
                                    setEditingCategoria(null);
                                    resetCategoriaForm();
                                }}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={editingCategoria ? handleUpdateCategoria : handleCreateCategoria} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={categoriaForm.nombre}
                                    onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    placeholder="Ej: Servicios Públicos"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Descripción (Opcional)</label>
                                <textarea
                                    value={categoriaForm.descripcion}
                                    onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    rows={2}
                                    placeholder="Descripción de la categoría..."
                                />
                            </div>

                            {/* INPUT DE MONTO PREDEFINIDO */}
                            <div>
                                {/* FIX: Added htmlFor to associate label with input */}
                                <label
                                    htmlFor="categoria-monto-predefinido"
                                    className="block text-sm font-medium mb-1 text-gray-700"
                                >
                                    Monto Predefinido (Opcional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    {/* FIX: Added id to associate with label */}
                                    <input
                                        id="categoria-monto-predefinido"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={categoriaForm.montoPredefinido}
                                        onChange={(e) => setCategoriaForm({ ...categoriaForm, montoPredefinido: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                        placeholder="Ej: 1500.00"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Si se establece, se autocompletará al registrar un gasto en esta categoría.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORES_CATEGORIAS.map((color) => (
                                        <button
                                            key={color.valor}
                                            type="button"
                                            onClick={() => setCategoriaForm({ ...categoriaForm, color: color.valor })}
                                            className={`w-10 h-10 rounded-full border-2 transition-all ${
                                                categoriaForm.color === color.valor
                                                    ? 'border-cyan-600 ring-2 ring-cyan-300 scale-110'
                                                    : 'border-gray-300 hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: color.valor }}
                                            title={color.nombre}
                                        />
                                    ))}
                                </div>
                            </div>

                            {editingCategoria && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Estado</label>
                                    <select
                                        value={categoriaForm.idEstado}
                                        onChange={(e) => setCategoriaForm({ ...categoriaForm, idEstado: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    >
                                        <option value={1}>Activo</option>
                                        <option value={2}>Inactivo</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    {editingCategoria ? 'Actualizar' : 'Crear'} Categoría
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModalCategoria(false);
                                        setEditingCategoria(null);
                                        resetCategoriaForm();
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE GASTO */}
            {showDetailModal && selectedGasto && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl border border-cyan-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                Detalle del Gasto
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedGasto(null);
                                }}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Categoría:</span>
                                        <div className="mt-1">
                                            <span
                                                className="px-3 py-1 rounded-full text-white text-xs font-medium"
                                                style={{ backgroundColor: selectedGasto.categoriaColor }}
                                            >
                                                {selectedGasto.categoria}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Monto:</span>
                                        <p className="font-bold text-red-600 text-lg mt-1">
                                            {formatCurrency(selectedGasto.monto)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Fecha:</span>
                                        <p className="font-medium text-gray-900 mt-1">
                                            {format(parseISO(selectedGasto.fechaGasto), 'dd/MM/yyyy', { locale: es })}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Usuario:</span>
                                        <p className="font-medium text-gray-900 mt-1">{selectedGasto.usuario}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600">Descripción:</span>
                                        <p className="font-medium text-gray-900 mt-1">{selectedGasto.descripcion}</p>
                                    </div>
                                    {selectedGasto.referencia && (
                                        <div className="col-span-2">
                                            <span className="text-gray-600">Referencia:</span>
                                            <p className="font-medium text-gray-900 mt-1">{selectedGasto.referencia}</p>
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <span className="text-gray-600">Registrado:</span>
                                        <p className="font-medium text-gray-900 mt-1">
                                            {format(parseISO(selectedGasto.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedGasto(null);
                                }}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}