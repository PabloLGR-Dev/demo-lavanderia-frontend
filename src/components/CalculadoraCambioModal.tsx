'use client';

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface CalculadoraCambioModalProps {
    divisas: { clave: string; valor: string }[];
    onClose: () => void;
    formatCurrency: (amount: number) => string;
}

export default function CalculadoraCambioModal({ divisas, onClose, formatCurrency }: CalculadoraCambioModalProps) {
    const [divisaSeleccionada, setDivisaSeleccionada] = useState('RD');
    const [montoCobrar, setMontoCobrar] = useState('');
    const [montoEntregado, setMontoEntregado] = useState('');

    const tasa = divisaSeleccionada !== 'RD'
        ? parseFloat(divisas.find(d => d.clave === divisaSeleccionada)?.valor || '1')
        : 1;

    const montoCobrarNum = parseFloat(montoCobrar) || 0;
    const montoEntregadoNum = parseFloat(montoEntregado) || 0;
    const entregadoEnRD = montoEntregadoNum * tasa;
    const cambio = entregadoEnRD - montoCobrarNum;
    const insuficiente = montoEntregado !== '' && cambio < 0;
    const exacto = montoEntregado !== '' && cambio === 0;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border border-cyan-100">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-cyan-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Calculadora de Cambio</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1 rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Divisa */}
                    {divisas.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                Moneda del cliente
                            </label>
                            <select
                                value={divisaSeleccionada}
                                onChange={(e) => {
                                    setDivisaSeleccionada(e.target.value);
                                    setMontoEntregado('');
                                }}
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

                    {/* Monto a cobrar */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Monto a cobrar (RD$) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            autoFocus
                            value={montoCobrar}
                            onChange={(e) => setMontoCobrar(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Monto entregado */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Entregado por el cliente
                            {divisaSeleccionada !== 'RD' && (
                                <span className="ml-1 font-semibold text-cyan-600">
                                    (en {divisaSeleccionada.replace('DIVISA_', '')})
                                </span>
                            )}
                            *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={montoEntregado}
                            onChange={(e) => setMontoEntregado(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                            placeholder="0.00"
                        />
                        {divisaSeleccionada !== 'RD' && montoEntregado && (
                            <p className="text-xs text-cyan-600 mt-1">
                                Equivale a {formatCurrency(entregadoEnRD)} en RD$
                            </p>
                        )}
                    </div>

                    {/* Resultado */}
                    {montoEntregado !== '' && montoCobrar !== '' && (
                        <div className={`p-4 rounded-xl border-2 ${
                            insuficiente
                                ? 'bg-red-50 border-red-300'
                                : exacto
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-green-50 border-green-300'
                        }`}>
                            <p className="text-xs font-medium text-gray-500 mb-1">Cambio a devolver (RD$)</p>
                            <p className={`text-3xl font-bold ${
                                insuficiente ? 'text-red-600' : exacto ? 'text-blue-600' : 'text-green-600'
                            }`}>
                                {insuficiente ? '-' : ''}{formatCurrency(Math.abs(cambio))}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${
                                insuficiente ? 'text-red-500' : exacto ? 'text-blue-500' : 'text-green-600'
                            }`}>
                                {insuficiente
                                    ? `Faltan ${formatCurrency(Math.abs(cambio))} para cubrir el cobro`
                                    : exacto
                                        ? 'Pago exacto, sin cambio'
                                        : 'Devolver al cliente'}
                            </p>
                        </div>
                    )}

                    {/* Botón limpiar */}
                    <button
                        onClick={() => {
                            setMontoCobrar('');
                            setMontoEntregado('');
                            setDivisaSeleccionada('RD');
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                    >
                        Limpiar
                    </button>
                </div>
            </div>
        </div>
    );
}