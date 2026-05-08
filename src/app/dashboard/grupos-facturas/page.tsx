'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import {
    GrupoFacturasResumen,
    GrupoFacturasDetalle,
    FacturaDisponible,
    CreateGrupoDto,
    PagarGrupoDto,
} from '@/types';
import { toast } from 'sonner';
import {
    Plus,
    Search,
    Eye,
    Edit2,
    Trash2,
    X,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Layers,
    Receipt,
    CheckCircle2,
    Clock,
    Minus,
    FileText,
    History,
    AlertTriangle,
    Printer,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRolePermissions } from '@/hooks/Userolepermissions';
import PrintReciboPagoGrupo, { ReciboPagoGrupoData } from '@/components/PrintReciboPagoGrupo';

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
        return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
    } catch {
        return dateStr;
    }
};

const formatEstado = (nombre: string) =>
    nombre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const METODOS_PAGO = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'otro', label: 'Otro' },
] as const;

// ─── Modal: Crear / Editar Grupo ─────────────────────────────────────────────

interface ModalGrupoProps {
    grupo?: GrupoFacturasResumen;
    onClose: () => void;
    onSaved: () => void;
}

function ModalGrupo({ grupo, onClose, onSaved }: ModalGrupoProps) {
    const [nombre, setNombre] = useState(grupo?.nombre ?? '');
    const [notas, setNotas] = useState(grupo?.notas ?? '');
    const [saving, setSaving] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) { toast.error('El nombre es requerido'); return; }

        setSaving(true);
        try {
            const body: CreateGrupoDto = { nombre: nombre.trim(), notas: notas.trim() || undefined };
            const url = grupo
                ? API_ENDPOINTS.GRUPO_FACTURAS_BY_ID(grupo.idGrupo)
                : API_ENDPOINTS.GRUPOS_FACTURAS;
            const method = grupo ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al guardar');
            }

            toast.success(grupo ? 'Grupo actualizado' : 'Grupo creado exitosamente');
            onSaved();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {grupo ? 'Editar Grupo' : 'Nuevo Grupo de Facturas'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo *</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            placeholder="Ej: Facturas de Juan Pérez — Mayo"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={3}
                            placeholder="Observaciones opcionales..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 transition-all"
                        >
                            {saving ? 'Guardando...' : (grupo ? 'Actualizar' : 'Crear Grupo')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Modal: Agregar Facturas al Grupo ────────────────────────────────────────

interface ModalAgregarFacturasProps {
    idGrupo: number;
    onClose: () => void;
    onSaved: () => void;
}

function ModalAgregarFacturas({ idGrupo, onClose, onSaved }: ModalAgregarFacturasProps) {
    const [facturas, setFacturas] = useState<FacturaDisponible[]>([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const fetchFacturas = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.append('search', search.trim());
            const res = await fetch(`${API_ENDPOINTS.GRUPOS_FACTURAS_DISPONIBLES}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setFacturas(await res.json());
        } finally {
            setLoading(false);
        }
    }, [search, token]);

    useEffect(() => {
        const t = setTimeout(fetchFacturas, 350);
        return () => clearTimeout(t);
    }, [fetchFacturas]);

    const toggle = (id: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleAgregar = async () => {
        if (selected.size === 0) { toast.error('Selecciona al menos una factura'); return; }
        setSaving(true);
        try {
            const res = await fetch(API_ENDPOINTS.GRUPO_FACTURAS_AGREGAR(idGrupo), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ idsFacturas: Array.from(selected) }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            toast.success(`${selected.size} factura(s) agregada(s) al grupo`);
            onSaved();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Agregar Facturas al Grupo</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por número o cliente..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    {selected.size > 0 && (
                        <p className="mt-2 text-xs text-cyan-600 font-medium">{selected.size} factura(s) seleccionada(s)</p>
                    )}
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
                        </div>
                    ) : facturas.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No hay facturas disponibles</p>
                        </div>
                    ) : (
                        facturas.map(f => (
                            <label key={f.idFactura} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.has(f.idFactura) ? 'border-cyan-400 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="checkbox"
                                    checked={selected.has(f.idFactura)}
                                    onChange={() => toggle(f.idFactura)}
                                    className="h-4 w-4 text-cyan-600 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-800">{f.numeroFactura}</span>
                                        <span className="text-xs text-gray-500">—</span>
                                        <span className="text-sm text-gray-600 truncate">{f.nombreCliente}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(f.fechaCreacion)}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-bold text-orange-600">{formatCurrency(f.montoPendiente)}</div>
                                    <div className="text-xs text-gray-400">pendiente</div>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                <div className="p-4 border-t flex-shrink-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleAgregar}
                        disabled={saving || selected.size === 0}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 transition-all"
                    >
                        {saving ? 'Agregando...' : `Agregar ${selected.size > 0 ? `(${selected.size})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Modal: Pagar Grupo ───────────────────────────────────────────────────────

interface ModalPagoProps {
    grupo: GrupoFacturasResumen;
    onClose: () => void;
    onPaid: (reciboData: ReciboPagoGrupoData) => void;
}

function ModalPago({ grupo, onClose, onPaid }: ModalPagoProps) {
    const [monto, setMonto] = useState('');
    const [metodoPago, setMetodoPago] = useState<PagarGrupoDto['metodoPago']>('efectivo');
    const [referencia, setReferencia] = useState('');
    const [notas, setNotas] = useState('');
    const [saving, setSaving] = useState(false);
    const [paso, setPaso] = useState<'form' | 'cambio'>('form');
    const [divisas, setDivisas] = useState<{ clave: string; valor: string }[]>([]);
    const [divisaSeleccionada, setDivisaSeleccionada] = useState('RD');
    const [dineroEntregado, setDineroEntregado] = useState('');

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const montoNum = parseFloat(monto) || 0;
    const excede = montoNum > grupo.totalPendiente;

    useEffect(() => {
        const fetchDivisas = async () => {
            const res = await fetch(API_ENDPOINTS.CONFIGURACIONES, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDivisas(data.filter((c: any) => c.clave.startsWith('DIVISA_')));
            }
        };
        fetchDivisas();
    }, [token]);

    const tasa = divisaSeleccionada !== 'RD'
        ? parseFloat(divisas.find(d => d.clave === divisaSeleccionada)?.valor || '1')
        : 1;
    const entregadoEnRD = (parseFloat(dineroEntregado) || 0) * tasa;
    const cambioADevolver = Math.max(0, entregadoEnRD - montoNum);
    const insuficiente = dineroEntregado !== '' && entregadoEnRD < montoNum;

    const procesarPago = async () => {
        setSaving(true);
        try {
            const body: PagarGrupoDto = {
                monto: montoNum,
                metodoPago,
                referencia: referencia.trim() || undefined,
                notas: notas.trim() || undefined,
            };
            const res = await fetch(API_ENDPOINTS.GRUPO_FACTURAS_PAGAR(grupo.idGrupo), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            const data = await res.json();
            toast.success(data.message || 'Pago registrado exitosamente');
            const reciboData: ReciboPagoGrupoData = {
                nombreGrupo: grupo.nombre,
                nombreCliente: grupo.nombreCliente,
                fechaPago: new Date().toISOString(),
                metodoPago,
                referencia: referencia.trim() || undefined,
                montoTotal: montoNum,
                distribucion: data.distribucion || [],
                saldoPendienteGrupo: Math.max(0, grupo.totalPendiente - montoNum),
            };
            onPaid(reciboData);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (montoNum <= 0) { toast.error('El monto debe ser mayor a 0'); return; }
        if (metodoPago === 'efectivo') {
            setPaso('cambio');
        } else {
            await procesarPago();
        }
    };

    if (paso === 'cambio') {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Calcular Cambio</h2>
                        <button onClick={() => setPaso('form')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monto a cobrar:</span>
                                <span className="font-bold text-cyan-700">{formatCurrency(montoNum)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Grupo:</span>
                                <span className="font-medium text-gray-800 truncate max-w-[60%] text-right">{grupo.nombre}</span>
                            </div>
                        </div>

                        {divisas.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda del cliente</label>
                                <select
                                    value={divisaSeleccionada}
                                    onChange={e => { setDivisaSeleccionada(e.target.value); setDineroEntregado(''); }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dinero entregado{divisaSeleccionada !== 'RD' && <span className="ml-1 text-cyan-600 font-semibold">({divisaSeleccionada.replace('DIVISA_', '')})</span>} *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                autoFocus
                                value={dineroEntregado}
                                onChange={e => setDineroEntregado(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="0.00"
                            />
                            {divisaSeleccionada !== 'RD' && dineroEntregado && (
                                <p className="text-xs text-cyan-600 mt-1">Equivale a {formatCurrency(entregadoEnRD)} en RD$</p>
                            )}
                        </div>

                        {dineroEntregado && (
                            <div className={`p-4 rounded-xl border-2 ${insuficiente ? 'bg-red-50 border-red-300' : cambioADevolver === 0 ? 'bg-blue-50 border-blue-300' : 'bg-green-50 border-green-300'}`}>
                                <p className="text-xs font-medium text-gray-500 mb-1">Cambio a devolver (RD$)</p>
                                <p className={`text-3xl font-bold ${insuficiente ? 'text-red-600' : cambioADevolver === 0 ? 'text-blue-600' : 'text-green-600'}`}>
                                    {insuficiente ? `-${formatCurrency(montoNum - entregadoEnRD)}` : formatCurrency(cambioADevolver)}
                                </p>
                                <p className={`text-xs mt-1 font-medium ${insuficiente ? 'text-red-500' : cambioADevolver === 0 ? 'text-blue-500' : 'text-green-600'}`}>
                                    {insuficiente
                                        ? `Faltan ${formatCurrency(montoNum - entregadoEnRD)} para cubrir el cobro`
                                        : cambioADevolver === 0 ? 'Pago exacto, sin cambio' : 'Devolver al cliente'}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPaso('form')}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                onClick={procesarPago}
                                disabled={saving || insuficiente || !dineroEntregado}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 transition-all"
                            >
                                {saving ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Registrar Pago</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="px-6 pt-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Total pendiente del grupo</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(grupo.totalPendiente)}</p>
                        <p className="text-xs text-gray-500 mt-1">{grupo.nombre}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a pagar *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">RD$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={monto}
                                onChange={e => setMonto(e.target.value)}
                                className={`w-full pl-12 pr-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 ${excede ? 'border-orange-400 focus:ring-orange-400' : 'border-gray-300 focus:ring-cyan-500'}`}
                                placeholder="0.00"
                            />
                        </div>
                        {excede && (
                            <p className="mt-1 text-xs text-orange-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                El monto supera el saldo pendiente
                            </p>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setMonto(grupo.totalPendiente.toFixed(2))}
                                className="text-xs text-cyan-600 hover:underline"
                            >
                                Pagar total ({formatCurrency(grupo.totalPendiente)})
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago *</label>
                        <select
                            value={metodoPago}
                            onChange={e => setMetodoPago(e.target.value as PagarGrupoDto['metodoPago'])}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {METODOS_PAGO.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input
                            type="text"
                            value={referencia}
                            onChange={e => setReferencia(e.target.value)}
                            placeholder="Número de transacción, cheque, etc."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || montoNum <= 0}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 transition-all"
                        >
                            {saving ? 'Procesando...' : metodoPago === 'efectivo' ? 'Calcular Cambio →' : 'Registrar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Vista Detalle de Grupo ───────────────────────────────────────────────────

interface DetalleGrupoProps {
    idGrupo: number;
    onBack: () => void;
    onRefreshList: () => void;
}

function DetalleGrupo({ idGrupo, onBack, onRefreshList }: DetalleGrupoProps) {
    const [detalle, setDetalle] = useState<GrupoFacturasDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAgregarFacturas, setShowAgregarFacturas] = useState(false);
    const [showPago, setShowPago] = useState(false);
    const [showRecibo, setShowRecibo] = useState(false);
    const [reciboData, setReciboData] = useState<ReciboPagoGrupoData | null>(null);
    const [vistaTab, setVistaTab] = useState<'facturas' | 'pagos'>('facturas');
    const [removiendo, setRemoviendo] = useState<number | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const fetchDetalle = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.GRUPO_FACTURAS_BY_ID(idGrupo), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setDetalle(await res.json());
            else toast.error('Error al cargar el grupo');
        } finally {
            setLoading(false);
        }
    }, [idGrupo, token]);

    useEffect(() => { fetchDetalle(); }, [fetchDetalle]);

    const handleRemoverFactura = async (idFactura: number) => {
        if (!confirm('¿Quitar esta factura del grupo?')) return;
        setRemoviendo(idFactura);
        try {
            const res = await fetch(API_ENDPOINTS.GRUPO_FACTURAS_QUITAR(idGrupo, idFactura), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            toast.success('Factura removida del grupo');
            fetchDetalle();
            onRefreshList();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setRemoviendo(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600" />
            </div>
        );
    }

    if (!detalle) return null;

    const esCerrado = detalle.idEstado === 5;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-700">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">{detalle.nombre}</h2>
                    {detalle.nombreCliente && <p className="text-sm text-gray-500">{detalle.nombreCliente}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${esCerrado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {formatEstado(detalle.estadoNombre)}
                </span>
            </div>

            {/* Tarjetas de totales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Facturas', value: detalle.totalFacturas.toString(), icon: <Receipt className="h-5 w-5 text-blue-500" />, bg: 'bg-blue-50 border border-blue-100' },
                    { label: 'Total Acumulado', value: formatCurrency(detalle.totalMonto), icon: <Layers className="h-5 w-5 text-purple-500" />, bg: 'bg-purple-50 border border-purple-100' },
                    { label: 'Total Abonado', value: formatCurrency(detalle.totalAbonado), icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, bg: 'bg-green-50 border border-green-100' },
                    { label: 'Saldo Pendiente', value: formatCurrency(detalle.totalPendiente), icon: <Clock className="h-5 w-5 text-orange-500" />, bg: 'bg-orange-50 border border-orange-100' },
                ].map(item => (
                    <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                            {item.icon}
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{item.label}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 break-words">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3">
                {!esCerrado && (
                    <>
                        <button
                            onClick={() => setShowAgregarFacturas(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar Facturas
                        </button>
                        {detalle.totalPendiente > 0 && (
                            <button
                                onClick={() => setShowPago(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
                            >
                                <CreditCard className="h-4 w-4" />
                                Registrar Pago
                            </button>
                        )}
                        <button
                            onClick={fetchDetalle}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Actualizar
                        </button>
                    </>
                )}
                <button
                    onClick={() => {
                        const resumenData: ReciboPagoGrupoData = {
                            tipo: 'resumen',
                            nombreGrupo: detalle.nombre,
                            nombreCliente: detalle.nombreCliente,
                            fechaPago: new Date().toISOString(),
                            metodoPago: '',
                            montoTotal: detalle.totalAbonado,
                            distribucion: detalle.facturas.map(f => ({
                                numeroFactura: f.numeroFactura,
                                montoAplicado: f.montoAbonado,
                                nuevoMontoPendiente: f.montoPendiente,
                            })),
                            saldoPendienteGrupo: detalle.totalPendiente,
                        };
                        setReciboData(resumenData);
                        setShowRecibo(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <Printer className="h-4 w-4" />
                    Imprimir
                </button>
            </div>

            {/* Notas */}
            {detalle.notas && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                    <FileText className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">{detalle.notas}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b">
                    <button
                        onClick={() => setVistaTab('facturas')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${vistaTab === 'facturas' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Receipt className="h-4 w-4" />
                        Facturas ({detalle.facturas.length})
                    </button>
                    <button
                        onClick={() => setVistaTab('pagos')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${vistaTab === 'pagos' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <History className="h-4 w-4" />
                        Historial de Pagos ({detalle.historialPagos.length})
                    </button>
                </div>

                {vistaTab === 'facturas' && (
                    <div>
                        {detalle.facturas.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No hay facturas en este grupo</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        <tr>
                                            <th className="text-left px-4 py-3">Factura</th>
                                            <th className="text-left px-4 py-3">Cliente</th>
                                            <th className="text-left px-4 py-3">Fecha</th>
                                            <th className="text-right px-4 py-3">Total</th>
                                            <th className="text-right px-4 py-3">Abonado</th>
                                            <th className="text-right px-4 py-3">Pendiente</th>
                                            <th className="text-center px-4 py-3">Estado</th>
                                            {!esCerrado && <th className="px-4 py-3" />}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {detalle.facturas.map(f => (
                                            <tr key={f.idFactura} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-800">{f.numeroFactura}</td>
                                                <td className="px-4 py-3 text-gray-600">{f.nombreCliente}</td>
                                                <td className="px-4 py-3 text-gray-500">{formatDate(f.fechaCreacion)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(f.total)}</td>
                                                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(f.montoAbonado)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(f.montoPendiente)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${f.estado.idEstado === 5 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {formatEstado(f.estado.nombre)}
                                                    </span>
                                                </td>
                                                {!esCerrado && (
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handleRemoverFactura(f.idFactura)}
                                                            disabled={removiendo === f.idFactura}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Quitar del grupo"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {vistaTab === 'pagos' && (
                    <div>
                        {detalle.historialPagos.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No hay pagos registrados</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        <tr>
                                            <th className="text-left px-4 py-3">Fecha</th>
                                            <th className="text-left px-4 py-3">Factura</th>
                                            <th className="text-right px-4 py-3">Monto</th>
                                            <th className="text-left px-4 py-3">Método</th>
                                            <th className="text-left px-4 py-3">Referencia</th>
                                            <th className="text-left px-4 py-3">Usuario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {detalle.historialPagos.map(p => (
                                            <tr key={p.idPago} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-500">{formatDate(p.fechaPago)}</td>
                                                <td className="px-4 py-3 font-medium text-gray-700">{p.numeroFactura}</td>
                                                <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(p.monto)}</td>
                                                <td className="px-4 py-3 capitalize text-gray-600">{p.metodoPago}</td>
                                                <td className="px-4 py-3 text-gray-500">{p.referencia || '—'}</td>
                                                <td className="px-4 py-3 text-gray-600">{p.usuario}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showAgregarFacturas && (
                <ModalAgregarFacturas
                    idGrupo={idGrupo}
                    onClose={() => setShowAgregarFacturas(false)}
                    onSaved={() => { setShowAgregarFacturas(false); fetchDetalle(); onRefreshList(); }}
                />
            )}
            {showPago && detalle && (
                <ModalPago
                    grupo={detalle}
                    onClose={() => setShowPago(false)}
                    onPaid={(recibo) => {
                        setShowPago(false);
                        setReciboData(recibo);
                        setShowRecibo(true);
                        fetchDetalle();
                        onRefreshList();
                    }}
                />
            )}
            <PrintReciboPagoGrupo
                data={reciboData}
                isOpen={showRecibo}
                onClose={() => { setShowRecibo(false); setReciboData(null); }}
            />
        </div>
    );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function GruposFacturasPage() {
    const { canDelete } = useRolePermissions();

    const [grupos, setGrupos] = useState<GrupoFacturasResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'' | '4' | '5'>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
    const [showModalGrupo, setShowModalGrupo] = useState(false);
    const [editandoGrupo, setEditandoGrupo] = useState<GrupoFacturasResumen | undefined>(undefined);
    const [showPagoRapido, setShowPagoRapido] = useState<GrupoFacturasResumen | null>(null);
    const [showRecibo, setShowRecibo] = useState(false);
    const [reciboData, setReciboData] = useState<ReciboPagoGrupoData | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const fetchGrupos = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: '15' });
            if (search.trim()) params.append('search', search.trim());
            if (filtroEstado) params.append('estadoId', filtroEstado);

            const res = await fetch(`${API_ENDPOINTS.GRUPOS_FACTURAS_RESUMEN}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setGrupos(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalRecords(data.pagination.totalRecords);
                setCurrentPage(page);
            }
        } finally {
            setLoading(false);
        }
    }, [search, filtroEstado, token]);

    useEffect(() => {
        const t = setTimeout(() => fetchGrupos(1), 350);
        return () => clearTimeout(t);
    }, [fetchGrupos]);

    const handleImprimirResumen = async (g: GrupoFacturasResumen) => {
        try {
            const res = await fetch(API_ENDPOINTS.GRUPO_FACTURAS_BY_ID(g.idGrupo), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { toast.error('Error al cargar los detalles del grupo'); return; }
            const det: GrupoFacturasDetalle = await res.json();
            const resumenData: ReciboPagoGrupoData = {
                tipo: 'resumen',
                nombreGrupo: det.nombre,
                nombreCliente: det.nombreCliente,
                fechaPago: new Date().toISOString(),
                metodoPago: '',
                montoTotal: det.totalAbonado,
                distribucion: det.facturas.map(f => ({
                    numeroFactura: f.numeroFactura,
                    montoAplicado: f.montoAbonado,
                    nuevoMontoPendiente: f.montoPendiente,
                })),
                saldoPendienteGrupo: det.totalPendiente,
            };
            setReciboData(resumenData);
            setShowRecibo(true);
        } catch {
            toast.error('Error al preparar la impresión');
        }
    };

    const handleDeleteGrupo = async (grupo: GrupoFacturasResumen) => {
        if (!confirm(`¿Eliminar el grupo "${grupo.nombre}"? Las facturas no serán eliminadas.`)) return;
        try {
            const res = await fetch(API_ENDPOINTS.GRUPO_FACTURAS_BY_ID(grupo.idGrupo), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            toast.success('Grupo eliminado exitosamente');
            fetchGrupos(currentPage);
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (grupoSeleccionado !== null) {
        return (
            <DetalleGrupo
                idGrupo={grupoSeleccionado}
                onBack={() => setGrupoSeleccionado(null)}
                onRefreshList={() => fetchGrupos(currentPage)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500">{totalRecords} grupo(s) encontrado(s)</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => fetchGrupos(currentPage)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button
                        onClick={() => { setEditandoGrupo(undefined); setShowModalGrupo(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Grupo
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nombre o cliente..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <select
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value as '' | '4' | '5')}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="4">Activos</option>
                        <option value="5">Cerrados</option>
                    </select>
                </div>
            </div>

            {/* Lista de grupos */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600" />
                    </div>
                ) : grupos.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Layers className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-base font-medium mb-1">No hay grupos de facturas</p>
                        <p className="text-sm">Crea un grupo para agrupar facturas de un cliente</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    <tr>
                                        <th className="text-left px-4 py-3">Grupo</th>
                                        <th className="text-left px-4 py-3">Cliente</th>
                                        <th className="text-center px-4 py-3">Facturas</th>
                                        <th className="text-right px-4 py-3">Total</th>
                                        <th className="text-right px-4 py-3">Abonado</th>
                                        <th className="text-right px-4 py-3">Pendiente</th>
                                        <th className="text-center px-4 py-3">Estado</th>
                                        <th className="text-left px-4 py-3">Creado</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {grupos.map(g => (
                                        <tr key={g.idGrupo} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{g.nombre}</div>
                                                {g.notas && <div className="text-xs text-gray-400 truncate max-w-[200px]">{g.notas}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{g.nombreCliente || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{g.totalFacturas}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(g.totalMonto)}</td>
                                            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(g.totalAbonado)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(g.totalPendiente)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${g.idEstado === 5 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {formatEstado(g.estadoNombre)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(g.fechaCreacion)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => setGrupoSeleccionado(g.idGrupo)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleImprimirResumen(g)}
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Imprimir resumen"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                    {g.totalPendiente > 0 && g.idEstado !== 5 && (
                                                        <button
                                                            onClick={() => setShowPagoRapido(g)}
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Registrar pago"
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setEditandoGrupo(g); setShowModalGrupo(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteGrupo(g)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {grupos.map(g => (
                                <div key={g.idGrupo} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{g.nombre}</p>
                                            {g.nombreCliente && <p className="text-sm text-gray-500 truncate">{g.nombreCliente}</p>}
                                        </div>
                                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${g.idEstado === 5 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {formatEstado(g.estadoNombre)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <p className="text-xs text-gray-400">Total</p>
                                            <p className="text-sm font-bold text-gray-700">{formatCurrency(g.totalMonto)}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-2">
                                            <p className="text-xs text-gray-400">Abonado</p>
                                            <p className="text-sm font-bold text-green-600">{formatCurrency(g.totalAbonado)}</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-2">
                                            <p className="text-xs text-gray-400">Pendiente</p>
                                            <p className="text-sm font-bold text-orange-600">{formatCurrency(g.totalPendiente)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setGrupoSeleccionado(g.idGrupo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                                            <Eye className="h-3.5 w-3.5" /> Ver
                                        </button>
                                        <button onClick={() => handleImprimirResumen(g)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-purple-200 bg-purple-50 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-100">
                                            <Printer className="h-3.5 w-3.5" /> Imprimir
                                        </button>
                                        {g.totalPendiente > 0 && g.idEstado !== 5 && (
                                            <button onClick={() => setShowPagoRapido(g)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-600 hover:bg-green-100">
                                                <CreditCard className="h-3.5 w-3.5" /> Pagar
                                            </button>
                                        )}
                                        <button onClick={() => { setEditandoGrupo(g); setShowModalGrupo(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                                            <Edit2 className="h-3.5 w-3.5" /> Editar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Página {currentPage} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchGrupos(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => fetchGrupos(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {showModalGrupo && (
                <ModalGrupo
                    grupo={editandoGrupo}
                    onClose={() => { setShowModalGrupo(false); setEditandoGrupo(undefined); }}
                    onSaved={() => { setShowModalGrupo(false); setEditandoGrupo(undefined); fetchGrupos(currentPage); }}
                />
            )}

            {showPagoRapido && (
                <ModalPago
                    grupo={showPagoRapido}
                    onClose={() => setShowPagoRapido(null)}
                    onPaid={(recibo) => {
                        setShowPagoRapido(null);
                        setReciboData(recibo);
                        setShowRecibo(true);
                        fetchGrupos(currentPage);
                    }}
                />
            )}

            <PrintReciboPagoGrupo
                data={reciboData}
                isOpen={showRecibo}
                onClose={() => { setShowRecibo(false); setReciboData(null); }}
            />
        </div>
    );
}
