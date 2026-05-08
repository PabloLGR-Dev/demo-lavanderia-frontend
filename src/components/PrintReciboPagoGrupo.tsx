'use client';

import { useRef, useState } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

export interface ReciboPagoGrupoData {
    tipo?: 'pago' | 'resumen';
    nombreGrupo: string;
    nombreCliente?: string;
    fechaPago: string;
    metodoPago: string;
    referencia?: string;
    montoTotal: number;
    distribucion: Array<{
        numeroFactura: string;
        montoAplicado: number;
        nuevoMontoPendiente: number;
    }>;
    saldoPendienteGrupo: number;
}

interface PrintReciboPagoGrupoProps {
    data: ReciboPagoGrupoData | null;
    isOpen: boolean;
    onClose: () => void;
}

const fmt = (n: number) => `RD$ ${n.toFixed(2)}`;

const METODO_LABELS: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    otro: 'Otro',
};

const PrintReciboPagoGrupo: React.FC<PrintReciboPagoGrupoProps> = ({ data, isOpen, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [copias, setCopias] = useState(2);
    const [isPrinting, setIsPrinting] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);

    const handlePrint = () => {
        if (!printRef.current || isPrinting || !data) return;
        setIsPrinting(true);

        const printWindow = document.createElement('iframe');
        printWindow.style.cssText = 'position:absolute;width:0;height:0;border:none;opacity:0;';
        document.body.appendChild(printWindow);

        const logoImg = document.getElementById('logo-recibo-grupo') as HTMLImageElement;
        const logoSrc = logoImg?.src || '';

        const content = printRef.current.innerHTML;
        let fullContent = '';
        for (let i = 0; i < copias; i++) {
            fullContent += content;
            if (i < copias - 1) {
                fullContent += `<div style="page-break-after:always;border-top:2px dashed #ccc;margin:30px 0;text-align:center;color:#666;font-size:12px;">--- COPIA ${i + 1} ---</div>`;
            }
        }

        printWindow.contentDocument?.write(`<!DOCTYPE html><html><head>
        <title>Recibo de Pago - ${data.nombreGrupo}</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;}
            body{width:80mm;max-width:80mm;padding:5mm;background:#fff;color:#000;line-height:1.4;}
            @media print{body{width:80mm!important;max-width:80mm!important;padding:5mm!important;margin:0!important;}}
            .header{text-align:center;margin-bottom:10px;border-bottom:2px solid #06b6d4;padding-bottom:10px;}
            .logo-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:5px;}
            .biz-name{font-size:13px;font-weight:700;color:#06b6d4;text-transform:uppercase;}
            .biz-info{font-size:9px;color:#666;margin-top:2px;}
            .title-badge{display:inline-block;background:#06b6d4;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;margin:8px 0 4px;}
            .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px;margin:8px 0;font-size:10px;}
            .info-row{display:flex;justify-content:space-between;padding:3px 0;}
            .info-label{color:#64748b;font-weight:500;}
            .info-value{color:#1e293b;font-weight:600;}
            .section-title{font-size:9px;color:#06b6d4;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;margin:10px 0 4px;}
            .dist-table{width:100%;border-collapse:collapse;font-size:10px;margin:4px 0;}
            .dist-table th{background:#06b6d4;color:#fff;padding:5px 4px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;}
            .dist-table td{padding:4px;border-bottom:1px solid #e2e8f0;color:#334155;}
            .dist-table tr:nth-child(even) td{background:#f8fafc;}
            .total-section{border-top:2px solid #06b6d4;margin-top:10px;padding-top:8px;}
            .total-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;}
            .total-grande{font-size:14px;font-weight:700;color:#06b6d4;}
            .pendiente{font-size:11px;font-weight:600;color:#f97316;}
            .pagado-badge{display:inline-block;background:#d1fae5;color:#065f46;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;text-transform:uppercase;}
            .pendiente-badge{display:inline-block;background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;text-transform:uppercase;}
            .footer{margin-top:16px;padding-top:8px;border-top:1px dashed #cbd5e1;text-align:center;font-size:9px;color:#64748b;}
            .gracias{margin-top:12px;text-align:center;font-size:11px;color:#06b6d4;font-weight:600;font-style:italic;}
        </style></head><body>${fullContent}</body></html>`);

        setTimeout(() => {
            const iframeDoc = printWindow.contentDocument;
            if (iframeDoc && logoSrc) {
                iframeDoc.querySelectorAll('.logo-placeholder-container').forEach(container => {
                    const img = iframeDoc.createElement('img');
                    img.src = logoSrc;
                    img.style.cssText = 'width:36px;height:36px;object-fit:contain;';
                    container.innerHTML = '';
                    container.appendChild(img);
                });
            }
            printWindow.contentDocument?.close();
        }, 100);

        printWindow.onload = () => {
            printWindow.contentWindow?.print();
            setTimeout(() => { printWindow.remove(); setIsPrinting(false); }, 1000);
        };
    };

    if (!isOpen || !data) return null;

    const fechaFmt = (() => {
        try { return format(parseISO(data.fechaPago), "dd/MM/yyyy HH:mm", { locale: es }); }
        catch { return data.fechaPago; }
    })();

    const estaPagado = data.saldoPendienteGrupo < 0.01;
    const esResumen = data.tipo === 'resumen';

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-cyan-200">
                    <div className="p-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10">
                                <Image src="/logo.jpeg" alt="Logo" fill className="object-contain" onLoad={() => setLogoLoaded(true)} />
                                {!logoLoaded && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 animate-pulse rounded-lg" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{esResumen ? 'Estado del Grupo' : 'Recibo de Pago'}</h3>
                                <p className="text-sm text-gray-500 truncate max-w-[220px]">{data.nombreGrupo}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monto pagado:</span>
                                <span className="font-bold text-cyan-700">RD$ {data.montoTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Saldo pendiente:</span>
                                <span className={`font-bold ${estaPagado ? 'text-green-600' : 'text-orange-600'}`}>
                                    {estaPagado ? 'SALDADO' : `RD$ ${data.saldoPendienteGrupo.toFixed(2)}`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Facturas cubiertas:</span>
                                <span className="font-medium text-gray-800">{data.distribucion.length}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Número de Copias</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setCopias(Math.max(1, copias - 1))} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 text-lg transition-colors">-</button>
                                <input
                                    type="number" min="1" max="10" value={copias}
                                    onChange={e => setCopias(Math.max(1, Math.min(10, parseInt(e.target.value) || 2)))}
                                    className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                />
                                <button onClick={() => setCopias(Math.min(10, copias + 1))} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 text-lg transition-colors">+</button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Recomendado: 2 copias (cliente y lavandería)</p>
                        </div>

                        <div className="flex flex-col gap-3 pt-1">
                            <button
                                onClick={handlePrint}
                                disabled={isPrinting}
                                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                            >
                                <Printer className="h-5 w-5" />
                                {isPrinting ? 'Imprimiendo...' : `Imprimir ${copias} ${copias === 1 ? 'copia' : 'copias'}`}
                            </button>
                            <button
                                onClick={handlePrint}
                                disabled={isPrinting}
                                className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Download className="h-5 w-5" /> Exportar como PDF
                            </button>
                            <button onClick={onClose} className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido imprimible oculto */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={printRef}>
                    <img id="logo-recibo-grupo" src="/logo.jpeg" alt="" style={{ display: 'none' }} onLoad={() => setLogoLoaded(true)} />

                    <div className="header">
                        <div className="logo-row">
                            <div className="logo-placeholder-container">
                                <div style={{ width: 36, height: 36, background: '#06b6d4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>LR</div>
                            </div>
                            <div>
                                <div className="biz-name">Lavandería Rodríguez #2</div>
                                <div className="biz-info">Bávaro, Calle Ramón Rodríguez</div>
                                <div className="biz-info">Tel: (829) 298-2059</div>
                            </div>
                        </div>
                        <div className="title-badge">{esResumen ? 'ESTADO DEL GRUPO' : 'RECIBO DE PAGO'}</div>
                    </div>

                    <div className="info-box">
                        <div className="info-row">
                            <span className="info-label">Grupo:</span>
                            <span className="info-value" style={{ maxWidth: '60%', textAlign: 'right' }}>{data.nombreGrupo}</span>
                        </div>
                        {data.nombreCliente && (
                            <div className="info-row">
                                <span className="info-label">Cliente:</span>
                                <span className="info-value">{data.nombreCliente}</span>
                            </div>
                        )}
                        <div className="info-row">
                            <span className="info-label">{esResumen ? 'Fecha de impresión:' : 'Fecha:'}</span>
                            <span className="info-value">{fechaFmt}</span>
                        </div>
                        {!esResumen && (
                            <>
                                <div className="info-row">
                                    <span className="info-label">Método:</span>
                                    <span className="info-value">{METODO_LABELS[data.metodoPago] || data.metodoPago}</span>
                                </div>
                                {data.referencia && (
                                    <div className="info-row">
                                        <span className="info-label">Referencia:</span>
                                        <span className="info-value">{data.referencia}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="section-title">{esResumen ? 'Estado por Factura' : 'Distribución por Factura'}</div>
                    <table className="dist-table">
                        <thead>
                            <tr>
                                <th>Factura</th>
                                <th style={{ textAlign: 'right' }}>{esResumen ? 'Abonado' : 'Pagado'}</th>
                                <th style={{ textAlign: 'right' }}>Pendiente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.distribucion.map((d, i) => (
                                <tr key={i}>
                                    <td>{d.numeroFactura}</td>
                                    <td style={{ textAlign: 'right', color: '#065f46', fontWeight: 600 }}>{fmt(d.montoAplicado)}</td>
                                    <td style={{ textAlign: 'right', color: d.nuevoMontoPendiente < 0.01 ? '#065f46' : '#92400e' }}>
                                        {d.nuevoMontoPendiente < 0.01 ? 'SALDADO' : fmt(d.nuevoMontoPendiente)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="total-section">
                        <div className="total-row">
                            <span style={{ fontWeight: 500, color: '#475569' }}>{esResumen ? 'TOTAL ABONADO:' : 'TOTAL PAGADO:'}</span>
                            <span className="total-grande">{fmt(data.montoTotal)}</span>
                        </div>
                        <div className="total-row" style={{ marginTop: 4 }}>
                            <span style={{ fontWeight: 500, color: '#475569' }}>SALDO PENDIENTE:</span>
                            {estaPagado
                                ? <span className="pagado-badge">SALDADO</span>
                                : <span className="pendiente">{fmt(data.saldoPendienteGrupo)}</span>}
                        </div>
                    </div>

                    <div className="gracias">¡Gracias por su preferencia!</div>
                    <div className="footer">
                        <div>Lavandería Rodríguez #2 - Bávaro, Calle Ramón Rodríguez</div>
                        <div>Tel: (829) 298-2059</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrintReciboPagoGrupo;
