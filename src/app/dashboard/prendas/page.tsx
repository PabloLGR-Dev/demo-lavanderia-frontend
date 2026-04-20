// FRONTEND - page.tsx OPTIMIZADO

'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { PrendaListDto, ServicioSimpleDto, PrendaServicioSimpleDto } from '@/types';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, DollarSign, Package } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/lib/roleConfig';

export default function PrendasPage() {
    const [prendas, setPrendas] = useState<PrendaListDto[]>([]);
    const [servicios, setServicios] = useState<ServicioSimpleDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPrendaModal, setShowPrendaModal] = useState(false);
    const [showServicioModal, setShowServicioModal] = useState(false);
    const [editingPrenda, setEditingPrenda] = useState<PrendaListDto | null>(null);
    const [selectedPrenda, setSelectedPrenda] = useState<PrendaListDto | null>(null);
    const [editingPrendaServicio, setEditingPrendaServicio] = useState<PrendaServicioSimpleDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [prendaFormData, setPrendaFormData] = useState({
        nombre: '',
        descripcion: '',
    });
    const [servicioFormData, setServicioFormData] = useState({
        idServicio: '',
        precioUnitario: '',
    });

    // ✅ OPTIMIZACIÓN 1: Cargar servicios solo una vez al inicio
    useEffect(() => {
        fetchServicios();
    }, []);

    // ✅ OPTIMIZACIÓN 2: Cargar prendas cuando cambie el searchTerm (con debounce implícito)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPrendas();
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ✅ OPTIMIZACIÓN 3: Separar fetch de servicios (solo se llama una vez)
    const fetchServicios = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.SERVICIOS_SIMPLES, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setServicios(data);
            }
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            toast.error('Error al cargar servicios');
        }
    };

    // ✅ OPTIMIZACIÓN 4: Fetch de prendas mejorado
    const fetchPrendas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            const url = searchTerm
                ? `${API_ENDPOINTS.PRENDAS}?search=${encodeURIComponent(searchTerm)}`
                : API_ENDPOINTS.PRENDAS;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPrendas(data);
            } else {
                toast.error('Error al cargar prendas');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    // ✅ OPTIMIZACIÓN 5: Callback optimizado para refrescar
    const refreshData = useCallback(() => {
        fetchPrendas();
    }, [searchTerm]);

    const handleSubmitPrenda = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prendaFormData.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        const token = localStorage.getItem('accessToken');
        const url = editingPrenda
            ? API_ENDPOINTS.PRENDA_BY_ID(editingPrenda.idPrenda)
            : API_ENDPOINTS.PRENDAS;

        try {
            const response = await fetch(url, {
                method: editingPrenda ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(prendaFormData),
            });

            if (response.ok) {
                toast.success(editingPrenda ? 'Prenda actualizada' : 'Prenda creada');
                refreshData();
                handleClosePrendaModal();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar prenda');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleEditPrenda = (prenda: PrendaListDto) => {
        setEditingPrenda(prenda);
        setPrendaFormData({
            nombre: prenda.nombre,
            descripcion: prenda.descripcion || '',
        });
        setShowPrendaModal(true);
    };

    const handleDeletePrenda = async (id: number) => {
        if (!confirm('¿Eliminar esta prenda? Se eliminarán también sus servicios asociados.')) return;

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.PRENDA_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success('Prenda eliminada');
                refreshData();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleAddServicio = (prenda: PrendaListDto) => {
        setSelectedPrenda(prenda);
        setEditingPrendaServicio(null);
        setServicioFormData({ idServicio: '', precioUnitario: '' });
        setShowServicioModal(true);
    };

    const handleEditPrendaServicio = (prenda: PrendaListDto, servicio: PrendaServicioSimpleDto) => {
        setSelectedPrenda(prenda);
        setEditingPrendaServicio(servicio);
        setServicioFormData({ 
            idServicio: servicio.idServicio.toString(), 
            precioUnitario: servicio.precioUnitario.toString() 
        });
        setShowServicioModal(true);
    };

    const handleSubmitServicio = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!servicioFormData.precioUnitario || (!editingPrendaServicio && !servicioFormData.idServicio)) {
            toast.error('Todos los campos son requeridos');
            return;
        }

        const token = localStorage.getItem('accessToken');
        const isEditing = !!editingPrendaServicio;
        
        const url = isEditing 
            ? API_ENDPOINTS.PRENDA_SERVICIO_BY_ID(editingPrendaServicio.idPrendaServicio)
            : API_ENDPOINTS.PRENDAS_SERVICIOS;

        try {
            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(
                    isEditing 
                        ? { precioUnitario: parseFloat(servicioFormData.precioUnitario) }
                        : {
                              idPrenda: selectedPrenda?.idPrenda,
                              idServicio: parseInt(servicioFormData.idServicio),
                              precioUnitario: parseFloat(servicioFormData.precioUnitario),
                          }
                ),
            });

            if (response.ok) {
                toast.success(isEditing ? 'Precio actualizado exitosamente' : 'Servicio agregado a la prenda');
                refreshData();
                handleCloseServicioModal();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar el servicio');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleDeletePrendaServicio = async (idPrendaServicio: number) => {
        if (!confirm('¿Eliminar este servicio de la prenda?')) return;

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.PRENDA_SERVICIO_BY_ID(idPrendaServicio), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success('Servicio eliminado');
                refreshData();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleClosePrendaModal = () => {
        setShowPrendaModal(false);
        setEditingPrenda(null);
        setPrendaFormData({ nombre: '', descripcion: '' });
    };

    const handleCloseServicioModal = () => {
        setShowServicioModal(false);
        setSelectedPrenda(null);
        setEditingPrendaServicio(null);
        setServicioFormData({ idServicio: '', precioUnitario: '' });
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
    );

    return (
        <ProtectedRoute requiredRole={ROLES.ADMIN}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Gestión de Prendas y Servicios
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Administra las prendas y asigna servicios con sus precios
                        </p>
                    </div>
                    <button
                        onClick={() => setShowPrendaModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Nueva Prenda
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                    <input
                        type="text"
                        placeholder="Buscar prendas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black placeholder-gray-500"
                    />
                </div>

                {/* Prendas Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prendas.map((prenda) => (
                        <div
                            key={prenda.idPrenda}
                            className="bg-white rounded-xl shadow-lg border border-cyan-100 overflow-hidden hover:shadow-xl transition-all"
                        >
                            {/* Prenda Header */}
                            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 border-b border-cyan-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{prenda.nombre}</h3>
                                            {prenda.descripcion && (
                                                <p className="text-xs text-gray-600">{prenda.descripcion}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEditPrenda(prenda)}
                                            className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-lg transition-colors"
                                            title="Editar prenda"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePrenda(prenda.idPrenda)}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Eliminar prenda"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Servicios List */}
                            <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-700">
                                        Servicios ({prenda.cantidadServicios})
                                    </span>
                                    <button
                                        onClick={() => handleAddServicio(prenda)}
                                        className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                        title="Agregar servicio"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>

                                {prenda.servicios && prenda.servicios.length > 0 ? (
                                    <div className="space-y-2">
                                        {prenda.servicios.map((ps) => (
                                            <div
                                                key={ps.idPrendaServicio}
                                                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-cyan-50 rounded-lg border border-cyan-100 group hover:border-cyan-300 transition-all"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {ps.nombreServicio}
                                                    </p>
                                                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                                        <DollarSign className="h-3 w-3" />
                                                        ${ps.precioUnitario.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditPrendaServicio(prenda, ps)}
                                                        className="p-1.5 text-cyan-600 hover:bg-cyan-100 rounded-lg transition-colors"
                                                        title="Editar precio"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePrendaServicio(ps.idPrendaServicio)}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Eliminar servicio"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                                        Sin servicios asignados
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {prendas.length === 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-cyan-100">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No hay prendas registradas</p>
                        <button
                            onClick={() => setShowPrendaModal(true)}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
                        >
                            Crear primera prenda
                        </button>
                    </div>
                )}

                {/* Modal Prenda */}
                {showPrendaModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                {editingPrenda ? 'Editar Prenda' : 'Nueva Prenda'}
                            </h3>
                            <form onSubmit={handleSubmitPrenda} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        value={prendaFormData.nombre}
                                        onChange={(e) => setPrendaFormData({ ...prendaFormData, nombre: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                        placeholder="Ej: Camisa, Pantalón, Sábana"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Descripción</label>
                                    <textarea
                                        value={prendaFormData.descripcion}
                                        onChange={(e) => setPrendaFormData({ ...prendaFormData, descripcion: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                        rows={3}
                                        placeholder="Descripción opcional"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                    >
                                        {editingPrenda ? 'Actualizar' : 'Crear'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClosePrendaModal}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Agregar / Editar Servicio */}
                {showServicioModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                {editingPrendaServicio 
                                    ? `Editar precio: ${editingPrendaServicio.nombreServicio}`
                                    : `Agregar Servicio a ${selectedPrenda?.nombre}`
                                }
                            </h3>
                            <form onSubmit={handleSubmitServicio} className="space-y-4">
                                
                                {/* Solo mostramos el selector si NO estamos editando */}
                                {!editingPrendaServicio && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Servicio *</label>
                                        <select
                                            required
                                            value={servicioFormData.idServicio}
                                            onChange={(e) => setServicioFormData({ ...servicioFormData, idServicio: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                        >
                                            <option value="">Seleccionar servicio...</option>
                                            {servicios.map((servicio) => (
                                                <option key={servicio.idServicio} value={servicio.idServicio}>
                                                    {servicio.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Precio Unitario *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={servicioFormData.precioUnitario}
                                            onChange={(e) => setServicioFormData({ ...servicioFormData, precioUnitario: e.target.value })}
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                    >
                                        {editingPrendaServicio ? 'Actualizar Precio' : 'Agregar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseServicioModal}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}