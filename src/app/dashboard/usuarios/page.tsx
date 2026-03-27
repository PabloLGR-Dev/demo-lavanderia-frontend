'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { toast } from 'sonner';
import { Pencil, Trash2, UserPlus, Shield } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/lib/roleConfig';

interface Rol {
    idRol: number;
    nombre: string;
}

interface Usuario {
    idUsuario: number;
    nombre: string;
    apellido?: string;
    email?: string;
    username: string;
    idEstado: number;
    fechaCreacion: string;
    fechaUltimoLogin?: string;
    roles: Array<{ idRol: number; nombre: string }>;
}

interface CreateUserDto {
    nombre: string;
    apellido?: string;
    email?: string;
    username: string;
    password: string;
    confirmPassword: string;
    idRol?: number;
    idEstado?: number;
}

interface UpdateUserDto {
    nombre?: string;
    apellido?: string;
    email?: string;
    idEstado?: number;
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRolModal, setShowRolModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<CreateUserDto>({
        nombre: '',
        apellido: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        idRol: undefined,
        idEstado: 1,
    });

    const [editFormData, setEditFormData] = useState<UpdateUserDto>({
        nombre: '',
        apellido: '',
        email: '',
        idEstado: 1,
    });

    const [selectedRol, setSelectedRol] = useState<number>(0);

    useEffect(() => {
        fetchUsuarios();
        fetchRoles();
    }, [searchTerm]);

    const fetchUsuarios = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const url = searchTerm
                ? `${API_ENDPOINTS.USERS}?search=${searchTerm}`
                : API_ENDPOINTS.USERS;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_ENDPOINTS.USERS.replace('/users', '/roles')}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (error) {
            console.error('Error cargando roles:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim() || !formData.username.trim()) {
            toast.error('Nombre y usuario son requeridos');
            return;
        }

        if (!formData.password || formData.password.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (!formData.idRol) {
            toast.error('Debes seleccionar un rol');
            return;
        }

        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch(API_ENDPOINTS.USERS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('Usuario creado exitosamente');
                fetchUsuarios();
                handleCloseModal();
            } else {
                const error = await response.text();
                toast.error(error || 'Error al crear usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al crear usuario');
        }
    };

    const handleEdit = (usuario: Usuario) => {
        setEditingUser(usuario);
        setEditFormData({
            nombre: usuario.nombre,
            apellido: usuario.apellido || '',
            email: usuario.email || '',
            idEstado: usuario.idEstado,
        });
        setShowEditModal(true);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch(API_ENDPOINTS.USER_BY_ID(editingUser.idUsuario), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(editFormData),
            });

            if (response.ok) {
                toast.success('Usuario actualizado exitosamente');
                fetchUsuarios();
                setShowEditModal(false);
                setEditingUser(null);
            } else {
                const error = await response.text();
                toast.error(error || 'Error al actualizar usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleEditRol = (usuario: Usuario) => {
        setEditingUser(usuario);
        setSelectedRol(usuario.roles[0]?.idRol || 0);
        setShowRolModal(true);
    };

    const handleUpdateRol = async () => {
        if (!editingUser || !selectedRol) {
            toast.error('Debes seleccionar un rol');
            return;
        }

        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch(`${API_ENDPOINTS.USER_BY_ID(editingUser.idUsuario)}/rol`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ idRol: selectedRol }),
            });

            if (response.ok) {
                toast.success('Rol actualizado exitosamente');
                fetchUsuarios();
                setShowRolModal(false);
                setEditingUser(null);
            } else {
                toast.error('Error al actualizar rol');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este usuario?')) return;

        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch(API_ENDPOINTS.USER_BY_ID(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success('Usuario eliminado exitosamente');
                fetchUsuarios();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            nombre: '',
            apellido: '',
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
            idRol: undefined,
            idEstado: 1,
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
        <ProtectedRoute requiredRole={ROLES.ADMIN}>
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Gestión de Usuarios
                </h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                >
                    <UserPlus className="inline h-4 w-4 mr-1" /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-cyan-100">
                <input
                    type="text"
                    placeholder="Buscar usuarios por nombre o username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black"
                />
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cyan-100">
                <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {usuarios.map((usuario) => (
                        <tr key={usuario.idUsuario} className="hover:bg-cyan-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">
                                {usuario.nombre} {usuario.apellido}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{usuario.username}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{usuario.email || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    {usuario.roles[0]?.nombre || 'Sin rol'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    usuario.idEstado === 1
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {usuario.idEstado === 1 ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(usuario)}
                                        className="p-2 text-cyan-600 hover:text-white hover:bg-cyan-600 rounded-lg transition-all border border-cyan-600"
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEditRol(usuario)}
                                        className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all border border-blue-600"
                                        title="Cambiar rol"
                                    >
                                        <Shield className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(usuario.idUsuario)}
                                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-600"
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

            {/* Modal Nuevo Usuario */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Nuevo Usuario
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Apellido</label>
                                    <input
                                        type="text"
                                        value={formData.apellido}
                                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Rol *</label>
                                <select
                                    required
                                    value={formData.idRol || ''}
                                    onChange={(e) => setFormData({ ...formData, idRol: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                >
                                    <option value="">Seleccionar rol...</option>
                                    {roles.map((rol) => (
                                        <option key={rol.idRol} value={rol.idRol}>
                                            {rol.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Contraseña * (min. 8 caracteres)</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Confirmar Contraseña *</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    Crear Usuario
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

            {/* Modal Editar Usuario */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Editar Usuario
                        </h3>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.nombre}
                                        onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Apellido</label>
                                    <input
                                        type="text"
                                        value={editFormData.apellido}
                                        onChange={(e) => setEditFormData({ ...editFormData, apellido: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Estado</label>
                                <select
                                    value={editFormData.idEstado}
                                    onChange={(e) => setEditFormData({ ...editFormData, idEstado: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                >
                                    <option value={1}>Activo</option>
                                    <option value={2}>Inactivo</option>
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    Actualizar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingUser(null);
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

            {/* Modal Editar Rol */}
            {showRolModal && editingUser && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border border-cyan-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Cambiar Rol de Usuario
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Usuario</label>
                                <p className="text-gray-900 font-medium">{editingUser.nombre} {editingUser.apellido}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nuevo Rol *</label>
                                <select
                                    value={selectedRol}
                                    onChange={(e) => setSelectedRol(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                >
                                    <option value={0}>Seleccionar rol...</option>
                                    {roles.map((rol) => (
                                        <option key={rol.idRol} value={rol.idRol}>
                                            {rol.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handleUpdateRol}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    Actualizar Rol
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRolModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </ProtectedRoute>
    );
}