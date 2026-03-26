'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { Cliente } from '@/types';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { useRolePermissions } from '@/hooks/Userolepermissions';

export default function ClientesPage() {
    const { canDelete } = useRolePermissions();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        direccion: '',
        telefono: '',
        email: '',
        notas: '',
    });

    useEffect(() => {
        fetchClientes();
    }, [searchTerm]);

    const fetchClientes = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const url = searchTerm
                ? `${API_ENDPOINTS.CLIENTES}?search=${searchTerm}`
                : API_ENDPOINTS.CLIENTES;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const result = await response.json();
                setClientes(result.data || result);
            } else {
                toast.error('Error al cargar los clientes');
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
            toast.error('Error de conexión al cargar clientes');
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

        try {
            const url = editingCliente
                ? API_ENDPOINTS.CLIENTE_BY_ID(editingCliente.idCliente)
                : API_ENDPOINTS.CLIENTES;

            const response = await fetch(url, {
                method: editingCliente ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(editingCliente ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente');
                fetchClientes();
                handleCloseModal();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar el cliente');
            }
        } catch (error) {
            console.error('Error guardando cliente:', error);
            toast.error('Error de conexión al guardar el cliente');
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) {
            toast.error('No tienes permisos para eliminar clientes');
            return;
        }

        if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.CLIENTE_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success('Cliente eliminado exitosamente');
                fetchClientes();
            } else {
                toast.error('Error al eliminar el cliente');
            }
        } catch (error) {
            console.error('Error eliminando cliente:', error);
            toast.error('Error de conexión al eliminar el cliente');
        }
    };

    const handleEdit = (cliente: Cliente) => {
        setEditingCliente(cliente);
        setFormData({
            nombre: cliente.nombre,
            apellido: cliente.apellido || '',
            direccion: cliente.direccion || '',
            telefono: cliente.telefono || '',
            email: cliente.email || '',
            notas: cliente.notas || '',
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCliente(null);
        setFormData({
            nombre: '',
            apellido: '',
            direccion: '',
            telefono: '',
            email: '',
            notas: '',
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Gestión de Clientes</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                    + Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-black placeholder-gray-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cyan-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Fecha Registro</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {clientes.map((cliente) => (
                        <tr key={cliente.idCliente} className="hover:bg-cyan-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">
                                {cliente.nombre} {cliente.apellido}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{cliente.telefono || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{cliente.email || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                {new Date(cliente.fechaRegistro).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(cliente)}
                                        className="p-2 text-cyan-600 hover:text-white hover:bg-cyan-600 rounded-lg transition-all duration-200 border border-cyan-600"
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(cliente.idCliente)}
                                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-600"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100 m-4">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                                <label className="block text-sm font-medium mb-1 text-gray-700">Apellido</label>
                                <input
                                    type="text"
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Dirección</label>
                                <input
                                    type="text"
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Notas</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                                    rows={3}
                                />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    {editingCliente ? 'Actualizar' : 'Crear'}
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
    );
}