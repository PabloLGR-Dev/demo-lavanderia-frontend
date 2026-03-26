'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { Producto } from '@/types';
import { toast } from 'sonner';
import { Pencil, Trash2, Search } from 'lucide-react';
import { useRolePermissions } from '@/hooks/Userolepermissions';

interface Categoria {
    idCategoria: number;
    nombre: string;
}

// Hook personalizado para debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function ProductosPage() {
    const { canDelete } = useRolePermissions();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Producto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoria, setSelectedCategoria] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    // Debounce del término de búsqueda (espera 500ms después de que el usuario deje de escribir)
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        codigoBarras: '',
        precioVenta: '',
        costo: '',
        stockActual: '',
        stockMinimo: '',
        idCategoria: '',
    });

    // Cargar categorías solo una vez al montar el componente
    useEffect(() => {
        fetchCategorias();
    }, []);

    // Cargar productos cuando cambie el término de búsqueda debounced o la categoría
    useEffect(() => {
        setCurrentPage(1); // Reset a la primera página cuando cambia la búsqueda
        fetchProductos();
    }, [debouncedSearchTerm, selectedCategoria]);

    // Cargar productos cuando cambie la página
    useEffect(() => {
        if (currentPage > 1) {
            fetchProductos();
        }
    }, [currentPage]);

    const fetchCategorias = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.CATEGORIAS, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setCategorias(data);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
            toast.error('Error al cargar categorías');
        }
    };

    const fetchProductos = async () => {
        try {
            setSearching(true);
            const token = localStorage.getItem('accessToken');

            // Construir parámetros de consulta
            const params = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: itemsPerPage.toString(),
            });

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            if (selectedCategoria) {
                params.append('idCategoria', selectedCategoria);
            }

            const url = `${API_ENDPOINTS.PRODUCTOS_PAGINADOS}?${params.toString()}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setProductos(data.items);
                setTotalPages(Math.ceil(data.total / itemsPerPage));
            } else {
                toast.error('Error al cargar productos');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al cargar productos');
        } finally {
            setLoading(false);
            setSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }
        if (!formData.precioVenta || parseFloat(formData.precioVenta) <= 0) {
            toast.error('El precio de venta debe ser mayor a 0');
            return;
        }
        if (!formData.idCategoria) {
            toast.error('Debes seleccionar una categoría');
            return;
        }

        const token = localStorage.getItem('accessToken');
        const url = editing
            ? API_ENDPOINTS.PRODUCTO_BY_ID(editing.idProducto)
            : API_ENDPOINTS.PRODUCTOS;

        try {
            const response = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    precioVenta: parseFloat(formData.precioVenta),
                    costo: formData.costo ? parseFloat(formData.costo) : null,
                    stockActual: formData.stockActual ? parseInt(formData.stockActual) : 0,
                    stockMinimo: formData.stockMinimo ? parseInt(formData.stockMinimo) : 0,
                    idCategoria: parseInt(formData.idCategoria),
                }),
            });

            if (response.ok) {
                toast.success(editing ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
                fetchProductos();
                handleCloseModal();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar producto');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al guardar producto');
        }
    };

    const handleEdit = (producto: Producto) => {
        setEditing(producto);
        setFormData({
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            codigoBarras: producto.codigoBarras || '',
            precioVenta: producto.precioVenta.toString(),
            costo: producto.costo?.toString() || '',
            stockActual: producto.stockActual.toString(),
            stockMinimo: producto.stockMinimo?.toString() || '',
            idCategoria: producto.idCategoria?.toString() || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) {
            toast.error('No tienes permisos para eliminar productos');
            return;
        }

        if (!confirm('¿Eliminar este producto?')) return;
        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch(API_ENDPOINTS.PRODUCTO_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                toast.success('Producto eliminado exitosamente');
                fetchProductos();
            } else {
                toast.error('Error al eliminar producto');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al eliminar producto');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setFormData({
            nombre: '',
            descripcion: '',
            codigoBarras: '',
            precioVenta: '',
            costo: '',
            stockActual: '',
            stockMinimo: '',
            idCategoria: '',
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategoria('');
        setCurrentPage(1);
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Gestión de Productos
                </h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                    + Nuevo Producto
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código de barras o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black placeholder-gray-500"
                        />
                        {searching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600"></div>
                            </div>
                        )}
                    </div>
                    <select
                        value={selectedCategoria}
                        onChange={(e) => setSelectedCategoria(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map((cat) => (
                            <option key={cat.idCategoria} value={cat.idCategoria}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                {(searchTerm || selectedCategoria) && (
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Tabla de productos */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cyan-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {productos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No se encontraron productos
                                </td>
                            </tr>
                        ) : (
                            productos.map((producto) => (
                                <tr key={producto.idProducto} className="hover:bg-cyan-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-900">{producto.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {producto.idCategoriaNavigation?.nombre || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">${producto.precioVenta.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm">
                                            <span className={producto.stockActual <= (producto.stockMinimo || 0) ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                                {producto.stockActual}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{producto.codigoBarras || '-'}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(producto)}
                                                className="p-2 text-cyan-600 hover:text-white hover:bg-cyan-600 rounded-lg transition-all duration-200 border border-cyan-600"
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(producto.idProducto)}
                                                    className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-600"
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

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md my-8 shadow-2xl border border-cyan-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            {editing ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Categoría *</label>
                                <select
                                    required
                                    value={formData.idCategoria}
                                    onChange={(e) => setFormData({ ...formData, idCategoria: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                >
                                    <option value="">Seleccionar categoría...</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.idCategoria} value={cat.idCategoria}>
                                            {cat.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Precio Venta *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.precioVenta}
                                        onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Costo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.costo}
                                        onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stockActual}
                                        onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        value={formData.stockMinimo}
                                        onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Código de Barras</label>
                                <input
                                    type="text"
                                    value={formData.codigoBarras}
                                    onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    rows={2}
                                />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    {editing ? 'Actualizar' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}