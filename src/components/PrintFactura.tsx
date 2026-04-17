// src/components/PrintFactura.tsx
'use client';

import { FacturaDetallesCompletos } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import { Printer, X, Copy, Check, Download } from 'lucide-react';
import { toast } from "sonner";
import Image from 'next/image';

interface PrintFacturaProps {
    factura: FacturaDetallesCompletos | null;
    isOpen: boolean;
    onClose: () => void;
}

const PrintFactura: React.FC<PrintFacturaProps> = ({ factura, isOpen, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [copias, setCopias] = useState<number>(1);
    const [isPrinting, setIsPrinting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);

    // Formatear moneda
    const formatCurrency = (amount: number): string => {
        return `RD$ ${amount.toFixed(2)}`;
    };

    // Función para imprimir
    const handlePrint = () => {
        if (!printRef.current || isPrinting) return;

        setIsPrinting(true);

        // Crear un iframe para imprimir múltiples copias
        const printWindow = document.createElement('iframe');
        printWindow.style.position = 'absolute';
        printWindow.style.width = '0';
        printWindow.style.height = '0';
        printWindow.style.border = 'none';
        printWindow.style.opacity = '0';

        document.body.appendChild(printWindow);

        // Obtener el Data URL del logo
        const getLogoBase64 = () => {
            const logoImg = document.getElementById('logo-print') as HTMLImageElement;
            if (logoImg && logoImg.src) {
                return logoImg.src;
            }

            // Fallback: Crear un canvas con el logo simple
            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Fondo gradiente
                const gradient = ctx.createLinearGradient(0, 0, 40, 40);
                gradient.addColorStop(0, '#06b6d4');
                gradient.addColorStop(1, '#3b82f6');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 40, 40);

                // Texto "LR"
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('LR', 20, 20);

                return canvas.toDataURL('image/png');
            }

            return '';
        };

        const logoBase64 = getLogoBase64();
        const content = printRef.current.innerHTML;
        let fullContent = '';

        // Generar contenido para cada copia
        for (let i = 0; i < copias; i++) {
            fullContent += content;

            // Agregar separador entre copias (excepto la última)
            if (i < copias - 1) {
                fullContent += `
                    <div style="page-break-after: always; border-top: 2px dashed #ccc; margin: 40px 0; padding: 20px 0;">
                        <div style="text-align: center; color: #666; font-size: 12px;">
                            --- COPIA ${i + 1} ---
                        </div>
                    </div>
                `;
            }
        }

        printWindow.contentDocument?.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Factura ${factura?.numeroFactura || ''}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    
                    body {
                        width: 80mm;
                        max-width: 80mm;
                        padding: 5mm;
                        background: white;
                        color: #000;
                        line-height: 1.4;
                    }
                    
                    @media print {
                        body {
                            width: 80mm !important;
                            max-width: 80mm !important;
                            padding: 5mm !important;
                            margin: 0 !important;
                        }
                        
                        .no-print {
                            display: none !important;
                        }
                        
                        .page-break {
                            page-break-after: always;
                        }
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #06b6d4;
                        padding-bottom: 10px;
                    }
                    
                    .logo-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        margin-bottom: 5px;
                    }
                    
                    .logo-print {
                        width: 40px;
                        height: 40px;
                        object-fit: contain;
                    }
                    
                    .business-name {
                        font-size: 14px;
                        font-weight: 700;
                        color: #06b6d4;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .business-info {
                        font-size: 9px;
                        color: #666;
                        margin-top: 2px;
                    }
                    
                    .factura-info {
                        display: flex;
                        justify-content: space-between;
                        margin: 10px 0;
                        padding: 8px;
                        background: #f8fafc;
                        border-radius: 6px;
                        border: 1px solid #e2e8f0;
                    }
                    
                    .info-column {
                        flex: 1;
                    }
                    
                    .info-label {
                        font-size: 9px;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        font-weight: 600;
                    }
                    
                    .info-value {
                        font-size: 11px;
                        color: #1e293b;
                        font-weight: 600;
                        margin-top: 2px;
                    }
                    
                    .cliente-info {
                        margin: 12px 0;
                        padding: 10px;
                        background: #f0f9ff;
                        border-radius: 6px;
                        border: 1px solid #bae6fd;
                    }
                    
                    .cliente-title {
                        font-size: 10px;
                        color: #0369a1;
                        font-weight: 600;
                        margin-bottom: 5px;
                        text-transform: uppercase;
                    }
                    
                    .cliente-data {
                        font-size: 11px;
                        color: #0c4a6e;
                        font-weight: 500;
                    }
                    
                    .detalles-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        font-size: 10px;
                    }
                    
                    .detalles-table th {
                        background: #06b6d4;
                        color: white;
                        padding: 6px 4px;
                        text-align: left;
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 9px;
                    }
                    
                    .detalles-table td {
                        padding: 5px 4px;
                        border-bottom: 1px solid #e2e8f0;
                        color: #334155;
                    }
                    
                    .detalles-table tr:nth-child(even) {
                        background: #f8fafc;
                    }
                    
                    .item-tipo {
                        display: inline-block;
                        width: 18px;
                        height: 18px;
                        text-align: center;
                        line-height: 18px;
                        border-radius: 4px;
                        font-size: 10px;
                        margin-right: 4px;
                        background: #06b6d4;
                        color: white;
                    }
                    
                    .servicio { background: #06b6d4; }
                    .producto { background: #3b82f6; }
                    
                    .totales-section {
                        margin-top: 15px;
                        border-top: 2px solid #06b6d4;
                        padding-top: 10px;
                    }
                    
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 0;
                        font-size: 11px;
                    }
                    
                    .total-label {
                        color: #475569;
                        font-weight: 500;
                    }
                    
                    .total-value {
                        color: #1e293b;
                        font-weight: 600;
                    }
                    
                    .total-grande {
                        font-size: 14px;
                        color: #06b6d4;
                        font-weight: 700;
                    }
                    
                    .estado-badge {
                        display: inline-block;
                        padding: 4px 10px;
                        border-radius: 20px;
                        font-size: 10px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .pagado { background: #d1fae5; color: #065f46; }
                    .pendiente { background: #fef3c7; color: #92400e; }
                    .parcial { background: #fef3c7; color: #92400e; }
                    
                    .footer {
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 1px dashed #cbd5e1;
                        text-align: center;
                        font-size: 9px;
                        color: #64748b;
                    }
                    
                    .copy-info {
                        margin-top: 5px;
                        padding: 4px;
                        background: #f1f5f9;
                        border-radius: 4px;
                        font-size: 8px;
                        color: #475569;
                    }
                    
                    .gracias {
                        margin-top: 15px;
                        text-align: center;
                        font-size: 11px;
                        color: #06b6d4;
                        font-weight: 600;
                        font-style: italic;
                    }
                    
                    .notas {
                        margin-top: 10px;
                        padding: 8px;
                        background: #fefce8;
                        border-radius: 6px;
                        border: 1px solid #fef08a;
                        font-size: 10px;
                        color: #854d0e;
                    }
                    
                    .pagos-info {
                        margin: 10px 0;
                        padding: 8px;
                        background: #f0fdf4;
                        border-radius: 6px;
                        border: 1px solid #bbf7d0;
                        font-size: 10px;
                    }
                    
                    .pago-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 3px 0;
                        border-bottom: 1px dashed #bbf7d0;
                    }
                    
                    .pago-item:last-child {
                        border-bottom: none;
                    }
                </style>
            </head>
            <body>
                ${fullContent}
            </body>
            </html>
        `);

        // Escribir el contenido específico de cada factura en el iframe
        setTimeout(() => {
            const iframeDoc = printWindow.contentDocument;
            if (iframeDoc) {
                // Reemplazar el placeholder del logo con el logo real
                const logoPlaceholders = iframeDoc.querySelectorAll('.logo-placeholder-container');
                logoPlaceholders.forEach(container => {
                    const logoImg = iframeDoc.createElement('img');
                    logoImg.src = logoBase64;
                    logoImg.alt = 'Logo Lavandería Rodríguez';
                    logoImg.style.width = '40px';
                    logoImg.style.height = '40px';
                    logoImg.style.objectFit = 'contain';
                    container.innerHTML = '';
                    container.appendChild(logoImg);
                });

                // Reemplazar todos los placeholders de logo en el contenido
                iframeDoc.body.innerHTML = iframeDoc.body.innerHTML.replace(
                    /<div class="logo-placeholder">LR<\/div>/g,
                    `<img src="${logoBase64}" alt="Logo Lavandería Rodríguez" class="logo-print" style="width: 40px; height: 40px; object-fit: contain;">`
                );
            }

            printWindow.contentDocument?.close();
        }, 100);

        printWindow.onload = () => {
            printWindow.contentWindow?.print();
            setTimeout(() => {
                printWindow.remove();
                setIsPrinting(false);
            }, 1000);
        };
    };

    // Función para exportar a PDF (simulada)
    const handleExportPDF = () => {
        if (!printRef.current) return;

        // En un entorno real, aquí se integraría con una librería como jsPDF
        // Por ahora, solo abrimos la ventana de impresión
        handlePrint();

        toast.success('PDF generado (simulación) - Use la función de imprimir como PDF');
    };

    // Copiar número de factura
    const copyFacturaNumber = () => {
        if (!factura) return;

        navigator.clipboard.writeText(factura.numeroFactura)
            .then(() => {
                setCopied(true);
                toast.success('Número de factura copiado al portapapeles');
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('Error al copiar:', err);
                toast.error('Error al copiar el número de factura');
            });
    };

    // Determinar estado de pago
    const getEstadoPago = () => {
        if (!factura) return { texto: '', clase: '' };

        const pendiente = factura.montoPendiente || 0;
        const total = factura.total;
        const abonado = factura.montoAbonado || 0;

        if (pendiente <= 0) {
            return { texto: 'PAGADO COMPLETO', clase: 'pagado' };
        } else if (abonado > 0) {
            return { texto: 'PAGO PARCIAL', clase: 'parcial' };
        } else {
            return { texto: 'PENDIENTE DE PAGO', clase: 'pendiente' };
        }
    };

    if (!isOpen || !factura) return null;

    const estadoPago = getEstadoPago();
    const fechaCreacion = format(parseISO(factura.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es });
    const fechaEntrega = factura.fechaEntregaEstimada
        ? format(parseISO(factura.fechaEntregaEstimada), 'dd/MM/yyyy', { locale: es })
        : 'No especificada';

    return (
        <>
            {/* Modal de control de impresión */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-cyan-200">
                    {/* Header */}
                    <div className="p-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10">
                                <Image
                                    src="/logo.jpeg"
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                    onLoad={() => setLogoLoaded(true)}
                                />
                                {!logoLoaded && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 animate-pulse rounded-lg"></div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Imprimir Factura
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    {factura.numeroFactura}
                                    <button
                                        onClick={copyFacturaNumber}
                                        className="text-cyan-600 hover:text-cyan-700 p-1 rounded hover:bg-cyan-50 transition-colors"
                                        title="Copiar número"
                                    >
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Controles */}
                    <div className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    Número de Copias
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCopias(Math.max(1, copias - 1))}
                                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={copias}
                                        onChange={(e) => setCopias(Math.max(1, Math.min(10, parseInt(e.target.value) || 2)))}
                                        className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    />
                                    <button
                                        onClick={() => setCopias(Math.min(10, copias + 1))}
                                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Recomendado: 2 copias (cliente y lavandería)
                                </p>
                            </div>

                            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                                <h4 className="font-medium text-cyan-700 text-sm mb-2">Resumen</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cliente:</span>
                                        <span className="font-medium text-gray-900">{factura.nombreCliente}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total:</span>
                                        <span className="font-bold text-cyan-600">{formatCurrency(factura.total)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Estado:</span>
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium text-black ${estadoPago.clase}`}>
                                            {estadoPago.texto}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={handlePrint}
                                    disabled={isPrinting}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Printer className="h-5 w-5" />
                                    {isPrinting ? 'Imprimiendo...' : `Imprimir ${copias} ${copias === 1 ? 'copia' : 'copias'}`}
                                </button>

                                <button
                                    onClick={handleExportPDF}
                                    disabled={isPrinting}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="h-5 w-5" />
                                    Exportar como PDF
                                </button>

                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido imprimible (oculto visualmente pero disponible para imprimir) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={printRef}>
                    {/* Logo oculto para capturar en Data URL */}
                    <img
                        id="logo-print"
                        src="/logo.jpeg"
                        alt="Logo Lavandería Rodríguez"
                        style={{ display: 'none' }}
                        onLoad={() => setLogoLoaded(true)}
                    />

                    {/* Contenido de la factura */}
                    <div className="header">
                        <div className="logo-container">
                            <div className="logo-placeholder-container">
                                <div className="logo-placeholder">LR</div>
                            </div>
                            <div>
                                <div className="business-name">Lavandería Rodríguez #2</div>
                                <div className="business-info">Bávaro, Calle Ramón Rodríguez</div>
                                <div className="business-info">Tel: (829) 298-2059</div>
                            </div>
                        </div>
                    </div>

                    <div className="factura-info">
                        <div className="info-column">
                            <div className="info-label">Factura No.</div>
                            <div className="info-value">{factura.numeroFactura}</div>
                        </div>
                        <div className="info-column">
                            <div className="info-label">Fecha</div>
                            <div className="info-value">{fechaCreacion}</div>
                        </div>
                    </div>

                    <div className="cliente-info">
                        <div className="cliente-title">Cliente</div>
                        <div className="cliente-data">
                            <div><strong>Nombre:</strong> {factura.nombreCliente}</div>
                            {factura.telefonoCliente && (
                                <div><strong>Teléfono:</strong> {factura.telefonoCliente}</div>
                            )}
                            {factura.cliente?.email && (
                                <div><strong>Email:</strong> {factura.cliente.email}</div>
                            )}
                        </div>
                    </div>

                    <div className="factura-info">
                        <div className="info-column">
                            <div className="info-label">Entrega Estimada</div>
                            <div className="info-value">{fechaEntrega}</div>
                        </div>
                        <div className="info-column">
                            <div className="info-label">Estado de Pago</div>
                            <div className="info-value">
                                <span className={`estado-badge ${estadoPago.clase}`}>
                                    {estadoPago.texto}
                                </span>
                            </div>
                        </div>
                    </div>

                    <table className="detalles-table">
                        <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Descripción</th>
                            <th style={{ width: '15%' }}>Cant.</th>
                            <th style={{ width: '20%' }}>P. Unit.</th>
                            <th style={{ width: '25%' }}>Subtotal</th>
                        </tr>
                        </thead>
                        <tbody>
                        {factura.detalles && factura.detalles.map((detalle, index) => (
                            <tr key={index}>
                                <td>
                                        <span className={`item-tipo ${detalle.tipo === 'servicio' ? 'servicio' : 'producto'}`}>
                                            {detalle.tipo === 'servicio' ? 'S' : 'P'}
                                        </span>
                                    {detalle.descripcion ||
                                        (detalle.tipo === 'servicio'
                                            ? `${detalle.servicio?.prenda || ''} - ${detalle.servicio?.servicio || ''}`
                                            : detalle.producto?.nombre || 'Producto')}
                                </td>
                                <td>{detalle.cantidad}</td>
                                <td>{formatCurrency(detalle.precioUnitario)}</td>
                                <td><strong>{formatCurrency(detalle.subtotal)}</strong></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div className="totales-section">
                        <div className="total-row">
                            <span className="total-label">Subtotal:</span>
                            <span className="total-value">{formatCurrency(factura.subtotal)}</span>
                        </div>

                        {factura.descuento > 0 && (
                            <div className="total-row">
                                <span className="total-label">Descuento:</span>
                                <span className="total-value" style={{ color: '#dc2626' }}>
                                    -{formatCurrency(factura.descuento)}
                                </span>
                            </div>
                        )}

                        <div className="total-row">
                            <span className="total-label">Impuestos:</span>
                            <span className="total-value">{formatCurrency(factura.impuestos)}</span>
                        </div>

                        <div className="total-row" style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
                            <span className="total-label total-grande">TOTAL:</span>
                            <span className="total-value total-grande">{formatCurrency(factura.total)}</span>
                        </div>
                    </div>

                    {factura.pagos && factura.pagos.length > 0 && (
                        <div className="pagos-info">
                            <div style={{ fontSize: '10px', color: '#065f46', fontWeight: '600', marginBottom: '5px' }}>
                                PAGOS REGISTRADOS:
                            </div>
                            {factura.pagos.map((pago, index) => (
                                <div key={index} className="pago-item">
                                    <div>
                                        {format(parseISO(pago.fechaPago), 'dd/MM/yy HH:mm', { locale: es })}
                                        <div style={{ fontSize: '9px', color: '#475569' }}>
                                            {pago.metodoPago} {pago.referencia && `- Ref: ${pago.referencia}`}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '600', color: '#065f46' }}>
                                        {formatCurrency(pago.monto)}
                                    </div>
                                </div>
                            ))}
                            <div className="pago-item" style={{ borderTop: '1px solid #86efac', paddingTop: '5px', marginTop: '5px' }}>
                                <div style={{ fontWeight: '600' }}>Total Abonado:</div>
                                <div style={{ fontWeight: '700', color: '#065f46' }}>
                                    {formatCurrency(factura.montoAbonado || 0)}
                                </div>
                            </div>
                            {(factura.montoPendiente || 0) > 0 && (
                                <div className="pago-item">
                                    <div style={{ fontWeight: '600', color: '#92400e' }}>Saldo Pendiente:</div>
                                    <div style={{ fontWeight: '700', color: '#92400e' }}>
                                        {formatCurrency(factura.montoPendiente || 0)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {factura.notas && (
                        <div className="notas">
                            <strong>Notas:</strong> {factura.notas}
                        </div>
                    )}

                    <div className="gracias">
                        ¡Gracias por su preferencia!
                    </div>

                    <div className="footer">
                        <div>Lavandería Rodríguez #2 - Bávaro, Calle Ramón Rodríguez</div>
                        <div>Tel: (829) 298-2059</div>
                        <div>Horario: Lunes a Viernes 8:00 AM - 7:00 PM | Sábado 8:00 AM - 7:00 PM</div>
                        <div className="copy-info">
                            Esta es una copia {factura.montoPendiente && factura.montoPendiente > 0 ? 'CON SALDO PENDIENTE' : 'PAGADA COMPLETAMENTE'}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrintFactura;