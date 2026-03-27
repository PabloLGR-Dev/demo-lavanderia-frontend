'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/lib/roleConfig';

interface Categoria {
    idCategoria: number;
    nombre: string;
}

export default function CategoriasPage() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Categoria | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
    });

    useEffect(() => {
        fetchCategorias();
    }, [searchTerm]);

    const fetchCategorias = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const url = searchTerm
                ? `${API_ENDPOINTS.CATEGORIAS}?search=${searchTerm}`
                : API_ENDPOINTS.CATEGORIAS;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setCategorias(data);
            } else {
                toast.error('Error al cargar categorías');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        const token = localStorage.getItem('accessToken');
        const url = editing
            ? `${API_ENDPOINTS.CATEGORIAS}/${editing.idCategoria}`
            : API_ENDPOINTS.CATEGORIAS;

        try {
            const response = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(editing ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
                fetchCategorias();
                handleCloseModal();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar categoría');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al guardar categoría');
        }
    };

    const handleEdit = (categoria: Categoria) => {
        setEditing(categoria);
        setFormData({
            nombre: categoria.nombre,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta categoría?')) return;
        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch(`${API_ENDPOINTS.CATEGORIAS}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                toast.success('Categoría eliminada exitosamente');
                fetchCategorias();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al eliminar categoría');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al eliminar categoría');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setFormData({ nombre: '' });
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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Gestión de Categorías
                </h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                    + Nueva Categoría
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                <input
                    type="text"
                    placeholder="Buscar categorías..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black placeholder-gray-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cyan-100">
                <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {categorias.map((categoria) => (
                        <tr key={categoria.idCategoria} className="hover:bg-cyan-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{categoria.nombre}</td>
                            <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(categoria)}
                                        className="p-2 text-cyan-600 hover:text-white hover:bg-cyan-600 rounded-lg transition-all duration-200 border border-cyan-600"
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(categoria.idCategoria)}
                                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-600"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100 m-4">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            {editing ? 'Editar Categoría' : 'Nueva Categoría'}
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
                                    placeholder="Ej: Detergentes, Suavizantes..."
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
        </ProtectedRoute>
    );
}