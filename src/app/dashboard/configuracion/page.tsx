'use client';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import { ConfiguracionesGenerales } from '@/types';
import { toast } from 'sonner';
import { Package, Truck, DollarSign, Plus, Edit2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DivisaConfig {
    clave: string;
    valor: string;
    descripcion: string;
}

export default function ConfiguracionPage() {
    const router = useRouter();

    const [config, setConfig] = useState<ConfiguracionesGenerales>({
        controlStockActivo: false,
        controlEntregasActivo: false,
    });
    const [divisas, setDivisas] = useState<DivisaConfig[]>([]);
    const [loading, setLoading] = useState(true);

    const [showDivisaModal, setShowDivisaModal] = useState(false);
    const [divisaForm, setDivisaForm] = useState({ clave: '', valor: '', descripcion: '', isEdit: false });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            
            const resConfig = await fetch(API_ENDPOINTS.CONFIGURACIONES_GENERALES, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resConfig.ok) {
                const dataConfig = await resConfig.json();
                setConfig(dataConfig);
            }

            const resAll = await fetch(API_ENDPOINTS.CONFIGURACIONES, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resAll.ok) {
                const dataAll = await resAll.json();
                const divisasEncontradas = dataAll.filter((c: any) => c.clave.startsWith('DIVISA_'));
                setDivisas(divisasEncontradas);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const toggleControlStock = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.TOGGLE_CONTROL_STOCK, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                toast.success(data.mensaje);
                fetchData();
                router.refresh();
            }
        } catch (error) {
            toast.error('Error al actualizar configuración');
        }
    };

    const toggleControlEntregas = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.TOGGLE_CONTROL_ENTREGAS, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                toast.success(data.mensaje);
                fetchData();
                router.refresh();
            }
        } catch (error) {
            toast.error('Error al actualizar configuración');
        }
    };

    const handleGuardarDivisa = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        
        let claveFinal = divisaForm.clave.toUpperCase();
        if (!claveFinal.startsWith('DIVISA_')) {
            claveFinal = `DIVISA_${claveFinal}`;
        }

        const payload = {
            clave: claveFinal,
            valor: divisaForm.valor,
            descripcion: divisaForm.descripcion || `Tasa de cambio para ${claveFinal.replace('DIVISA_', '')}`,
            tipodato: 'numero'
        };

        try {
            const endpoint = divisaForm.isEdit 
                ? API_ENDPOINTS.CONFIGURACION_BY_KEY(divisaForm.clave) 
                : API_ENDPOINTS.CONFIGURACIONES;
            const method = divisaForm.isEdit ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(`Divisa ${divisaForm.isEdit ? 'actualizada' : 'creada'} exitosamente`);
                setShowDivisaModal(false);
                fetchData();
            } else {
                toast.error('Error al guardar la divisa');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const abrirModalNuevaDivisa = () => {
        setDivisaForm({ clave: '', valor: '', descripcion: '', isEdit: false });
        setShowDivisaModal(true);
    };

    const abrirModalEditarDivisa = (divisa: DivisaConfig) => {
        setDivisaForm({ 
            clave: divisa.clave, 
            valor: divisa.valor, 
            descripcion: divisa.descripcion || '', 
            isEdit: true 
        });
        setShowDivisaModal(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-5xl space-y-6 pb-12">

                {/* ✅ CAMBIO 2: text-left añadido al div del encabezado */}
                <div className="text-left">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Configuración del Sistema
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Activa o desactiva funcionalidades y gestiona los parámetros globales.
                    </p>
                </div>

                {/* SECCIÓN 1: CONTROLES DEL SISTEMA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Control de Stock */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Package className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Control de Stock</h3>
                                    <p className="text-sm text-gray-500 mt-1">Valida disponibilidad</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleControlStock}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shadow-sm ${
                                        config.controlStockActivo ? 'bg-cyan-600' : 'bg-gray-400'
                                    }`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                                            config.controlStockActivo ? 'translate-x-7' : 'translate-x-0.5'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className={`p-3 rounded-lg ${config.controlStockActivo ? 'bg-green-50' : 'bg-gray-50'}`}>
                                <p className="font-medium text-gray-700">Estado: {config.controlStockActivo ? 'Activo' : 'Inactivo'}</p>
                                <p className="text-gray-600 mt-1">
                                    {config.controlStockActivo
                                        ? '✓ El sistema valida el stock antes de crear facturas'
                                        : '⨯ Se pueden crear facturas sin validar stock'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Control de Entregas */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Truck className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Control de Entregas</h3>
                                    <p className="text-sm text-gray-500 mt-1">Gestiona despachos</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleControlEntregas}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shadow-sm ${
                                        config.controlEntregasActivo ? 'bg-cyan-600' : 'bg-gray-400'
                                    }`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                                            config.controlEntregasActivo ? 'translate-x-7' : 'translate-x-0.5'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className={`p-3 rounded-lg ${config.controlEntregasActivo ? 'bg-green-50' : 'bg-gray-50'}`}>
                                <p className="font-medium text-gray-700">Estado: {config.controlEntregasActivo ? 'Activo' : 'Inactivo'}</p>
                                <p className="text-gray-600 mt-1">
                                    {config.controlEntregasActivo
                                        ? '✓ Se gestionan estados de entrega de pedidos'
                                        : '⨯ No se gestionan entregas separadamente'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: GESTIÓN DE DIVISAS */}
                <div className="bg-white rounded-xl shadow-lg border border-cyan-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-cyan-50 to-blue-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Tasas de Cambio (Divisas)</h3>
                                <p className="text-xs text-gray-500">Configura el valor en RD$ para cobros en otras monedas</p>
                            </div>
                        </div>
                        <button
                            onClick={abrirModalNuevaDivisa}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2 text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" /> Nueva Divisa
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {divisas.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p>No hay divisas configuradas.</p>
                                <p className="text-xs mt-1">El sistema operará y cobrará exclusivamente en Pesos Dominicanos (RD$).</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {divisas.map((divisa) => (
                                    <div key={divisa.clave} className="border border-gray-200 rounded-xl p-4 hover:border-cyan-300 transition-colors shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-cyan-700">
                                                {divisa.clave.replace('DIVISA_', '')}
                                            </h4>
                                            <button 
                                                onClick={() => abrirModalEditarDivisa(divisa)}
                                                className="p-1.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors"
                                                title="Editar Tasa"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm text-gray-500">1 = RD$</span>
                                            <span className="text-2xl font-bold text-gray-900">{parseFloat(divisa.valor).toFixed(2)}</span>
                                        </div>
                                        {divisa.descripcion && (
                                            <p className="text-xs text-gray-400 mt-2 truncate" title={divisa.descripcion}>
                                                {divisa.descripcion}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL AGREGAR/EDITAR DIVISA */}
                {showDivisaModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {divisaForm.isEdit ? 'Editar Tasa de Cambio' : 'Nueva Divisa'}
                                </h3>
                                <button onClick={() => setShowDivisaModal(false)} className="text-gray-400 hover:text-red-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleGuardarDivisa} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Moneda (Ej: USD, EUR) *
                                    </label>
                                    {/* ✅ CAMBIO 1: text-gray-900 añadido */}
                                    <input
                                        type="text"
                                        required
                                        maxLength={5}
                                        disabled={divisaForm.isEdit}
                                        value={divisaForm.clave.replace('DIVISA_', '')}
                                        onChange={(e) => setDivisaForm({ ...divisaForm, clave: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 uppercase disabled:bg-gray-100 disabled:text-gray-500 text-gray-900"
                                        placeholder="USD"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valor en Pesos (RD$) *
                                    </label>
                                    {/* ✅ CAMBIO 1: text-gray-900 añadido */}
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={divisaForm.valor}
                                        onChange={(e) => setDivisaForm({ ...divisaForm, valor: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold text-gray-900"
                                        placeholder="60.50"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción (Opcional)
                                    </label>
                                    {/* ✅ CAMBIO 1: text-gray-900 añadido */}
                                    <input
                                        type="text"
                                        value={divisaForm.descripcion}
                                        onChange={(e) => setDivisaForm({ ...divisaForm, descripcion: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm text-gray-900"
                                        placeholder="Tasa oficial de cobro"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="submit" className="flex-1 bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700 font-medium">
                                        Guardar
                                    </button>
                                    <button type="button" onClick={() => setShowDivisaModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}