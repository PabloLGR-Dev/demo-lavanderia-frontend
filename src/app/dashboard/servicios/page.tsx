'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { Servicio } from '@/types';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/lib/roleConfig';

export default function ServiciosPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Servicio | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        duracionEstimada: '',
    });

    useEffect(() => {
        fetchServicios();
    }, [searchTerm]);

    const fetchServicios = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const url = searchTerm
                ? `${API_ENDPOINTS.SERVICIOS}?search=${searchTerm}`
                : API_ENDPOINTS.SERVICIOS;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setServicios(data);
            } else {
                toast.error('Error al cargar servicios');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al cargar servicios');
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
            ? API_ENDPOINTS.SERVICIO_BY_ID(editing.idServicio)
            : API_ENDPOINTS.SERVICIOS;

        try {
            const response = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    duracionEstimada: formData.duracionEstimada ? parseInt(formData.duracionEstimada) : null,
                }),
            });

            if (response.ok) {
                toast.success(editing ? 'Servicio actualizado exitosamente' : 'Servicio creado exitosamente');
                fetchServicios();
                handleCloseModal();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar servicio');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al guardar servicio');
        }
    };

    const handleEdit = (servicio: Servicio) => {
        setEditing(servicio);
        setFormData({
            nombre: servicio.nombre,
            descripcion: servicio.descripcion || '',
            duracionEstimada: servicio.duracionEstimada?.toString() || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este servicio?')) return;
        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch(API_ENDPOINTS.SERVICIO_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                toast.success('Servicio eliminado exitosamente');
                fetchServicios();
            } else {
                toast.error('Error al eliminar servicio');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al eliminar servicio');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setFormData({ nombre: '', descripcion: '', duracionEstimada: '' });
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
                    Gestión de Servicios
                </h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                    + Nuevo Servicio
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                <input
                    type="text"
                    placeholder="Buscar servicios..."
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Duración (min)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {servicios.map((servicio) => (
                        <tr key={servicio.idServicio} className="hover:bg-cyan-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{servicio.nombre}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{servicio.descripcion || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{servicio.duracionEstimada || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(servicio)}
                                        className="p-2 text-cyan-600 hover:text-white hover:bg-cyan-600 rounded-lg transition-all duration-200 border border-cyan-600"
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(servicio.idServicio)}
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
                            {editing ? 'Editar Servicio' : 'Nuevo Servicio'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Duración Estimada (minutos)</label>
                                <input
                                    type="number"
                                    value={formData.duracionEstimada}
                                    onChange={(e) => setFormData({ ...formData, duracionEstimada: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                    placeholder="Ej: 60"
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