// src/components/FacturasComponents.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api';
import {
    FacturaResumen,
    FacturaDetallesCompletos,
    ValidarItemDto,
    ValidarItemResultado,
    Cliente
} from '@/types';
import { toast } from 'sonner';
import {
    Eye,
    Trash2,
    FileText,
    X,
    DollarSign,
    Plus,
    Minus,
    CreditCard,
    Filter,
    Calendar,
    Search,
    RefreshCw,
    CheckCircle,
    Clock,
    AlertCircle,
    Printer,
    Download,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    User,
    ShoppingBag,
    ShoppingCart,
    Package,
    Shirt,
    Tag
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

// Constantes para estados de factura
const ESTADOS_FACTURA = {
    PENDIENTE: 4,
    PAGADO: 5,
    ENTREGADO: 6,
    ANULADO: 7
};

const normalizeText = (text: string): string => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

// Formatear moneda dominicana con separadores de miles
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

interface FacturasComponentsProps {
    showModal: boolean;
    showDetailModal: boolean;
    showPagoModal: boolean;
    showConfirmationModal: boolean;
    showChangeModal: boolean;
    showPagoChangeModal: boolean;
    showPrintModal: boolean;
    preparedFacturaDto: any;
    facturaDetalles: FacturaDetallesCompletos | null;
    selectedFactura: FacturaResumen | null;
    pagoForm: {
        monto: string;
        metodoPago: string;
        referencia?: string;
        notas?: string;
    };
    dineroEntregado: string;
    clientes: Cliente[];
    loading: {
        facturas: boolean;
        detalles: boolean;
        estadisticas: boolean;
        proximas: boolean;
    };
    confirmationForm: any;
    onFacturaCreada: (factura: FacturaDetallesCompletos) => void;
    onImprimirDesdeDetalle: () => void; // Nueva prop para manejar impresión desde detalle

    // Funciones
    setPreparedFacturaDto: (dto: any) => void;
    setPagoForm: (form: any) => void;
    setDineroEntregado: (value: string) => void;
    setShowModal: (value: boolean) => void;
    setShowDetailModal: (value: boolean) => void;
    setShowPagoModal: (value: boolean) => void;
    setShowConfirmationModal: (value: boolean) => void;
    setShowChangeModal: (value: boolean) => void;
    setShowPagoChangeModal: (value: boolean) => void;
    setShowPrintModal: (value: boolean) => void;
    handleCloseAllModals: () => void;
    handleRegistrarPago: () => void;
    handlePagoConCambio: () => void;
    fetchFacturasResumen: () => void;
    fetchFacturaDetalles: (id: number) => Promise<FacturaDetallesCompletos | null>;
    cambiarEstadoFactura: (idFactura: number, idEstado: number, notas?: string) => void;
    handleCloseChangeModal: () => void;
    handleClosePagoChangeModal: () => void;
    getEstadoDetalleFactura: (factura: FacturaDetallesCompletos) => { texto: string; clase: string };
    formatCurrency: (amount: number) => string;
    abrirPagoModal: (factura: FacturaResumen) => void;
    getChangeAmountPago: () => number;
}

export default function FacturasComponents({
                                               showModal,
                                               showDetailModal,
                                               showPagoModal,
                                               showConfirmationModal,
                                               showChangeModal,
                                               showPagoChangeModal,
                                               showPrintModal,
                                               preparedFacturaDto,
                                               facturaDetalles,
                                               selectedFactura,
                                               pagoForm,
                                               dineroEntregado,
                                               clientes,
                                               loading,
                                               confirmationForm,
                                               onFacturaCreada,
                                               onImprimirDesdeDetalle, // Nueva prop

                                               setPreparedFacturaDto,
                                               setPagoForm,
                                               setDineroEntregado,
                                               setShowModal,
                                               setShowDetailModal,
                                               setShowPagoModal,
                                               setShowConfirmationModal,
                                               setShowChangeModal,
                                               setShowPagoChangeModal,
                                               setShowPrintModal,
                                               handleCloseAllModals,
                                               handleRegistrarPago,
                                               handlePagoConCambio,
                                               fetchFacturasResumen,
                                               fetchFacturaDetalles,
                                               cambiarEstadoFactura,
                                               handleCloseChangeModal,
                                               handleClosePagoChangeModal,
                                               getEstadoDetalleFactura,
                                               formatCurrency: propFormatCurrency,
                                               abrirPagoModal,
                                               getChangeAmountPago
                                           }: FacturasComponentsProps) {
    // Estados para búsqueda unificada
    const [resultadosBusqueda, setResultadosBusqueda] = useState<{
        servicios: Array<any>;
        productos: Array<any>;
    }>({ servicios: [], productos: [] });
    const [buscandoItems, setBuscandoItems] = useState(false);
    const [searchTermItems, setSearchTermItems] = useState('');

    // Referencias
    const agregarButtonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchInputFocused, setSearchInputFocused] = useState(false);

    // Formulario de nueva factura
    const [facturaForm, setFacturaForm] = useState<{
        clienteExistente: boolean;
        idCliente: string;
        nombreCliente: string;
        telefonoCliente: string;
        fechaEntregaEstimada: string;
        notas: string;
        idGrupo: string;
        detalles: Array<{
            tipo: 'servicio' | 'producto';
            searchTerm: string;
            idPrendaServicio?: string;
            idProducto?: string;
            cantidad: string;
            precioUnitario: string;
            descripcion: string;
            showDropdown: boolean;
            data?: any;
        }>;
    }>({
        clienteExistente: false,
        idCliente: '',
        nombreCliente: '',
        telefonoCliente: '',
        fechaEntregaEstimada: '',
        notas: '',
        idGrupo: '',
        detalles: [],
    });

    const [gruposActivos, setGruposActivos] = useState<{ idGrupo: number; nombre: string }[]>([]);

    // Formulario de confirmación
    const [confirmationFormLocal, setConfirmationFormLocal] = useState<{
        pagoInmediato: boolean;
        metodoPago: string;
        montoAbonado: string;
        referenciaPago: string;
        descuentoTipo: 'porcentaje' | 'monto';
        descuentoPorcentaje: string;
        descuentoMonto: string;
    }>({
        pagoInmediato: false,
        metodoPago: 'efectivo',
        montoAbonado: '',
        referenciaPago: '',
        descuentoTipo: 'porcentaje',
        descuentoPorcentaje: '',
        descuentoMonto: '',
    });

    // Item nuevo
    const [nuevoItem, setNuevoItem] = useState<{
        tipo: 'servicio' | 'producto';
        searchTerm: string;
        idPrendaServicio?: string;
        idProducto?: string;
        cantidad: string;
        precioUnitario: string;
        descripcion: string;
        showDropdown: boolean;
        data?: any;
    } | null>(null);

    // Divisas
    const [divisas, setDivisas] = useState<{ clave: string; valor: string; descripcion: string }[]>([]);
    const [divisaSeleccionada, setDivisaSeleccionada] = useState<string>('RD');

    // ==================== EFECTOS ====================
    // Efecto para resetear formularios cuando se abre el modal
    useEffect(() => {
        if (showModal) {
            resetFacturaForm();
        }
    }, [showModal]);

    // Cargar divisas al montar el componente
    useEffect(() => {
        const fetchDivisas = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(API_ENDPOINTS.CONFIGURACIONES, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setDivisas(data.filter((c: any) => c.clave.startsWith('DIVISA_')));
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchDivisas();
    }, []);

    // Efecto para actualizar confirmationForm cuando cambia preparedFacturaDto
    useEffect(() => {
        if (showConfirmationModal && preparedFacturaDto) {
            setConfirmationFormLocal({
                pagoInmediato: false,
                metodoPago: 'efectivo',
                montoAbonado: preparedFacturaDto.subtotal.toFixed(2),
                referenciaPago: '',
                descuentoTipo: 'porcentaje',
                descuentoPorcentaje: '',
                descuentoMonto: '',
            });
        }
    }, [showConfirmationModal, preparedFacturaDto]);

    // ==================== BÚSQUEDA UNIFICADA ====================
    const buscarItemsUnificados = useCallback(async (search: string) => {
        if (!search.trim()) {
            setResultadosBusqueda({ servicios: [], productos: [] });
            return;
        }

        try {
            setBuscandoItems(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_ENDPOINTS.PRODUCTOS_BUSQUEDA_UNIFICADA}?search=${encodeURIComponent(search)}&incluirServicios=true&incluirProductos=true&limite=10`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setResultadosBusqueda(data);
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
        } finally {
            setBuscandoItems(false);
        }
    }, []);

    // Debounced search para items
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (nuevoItem?.searchTerm && searchInputFocused) {
                buscarItemsUnificados(nuevoItem.searchTerm);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [nuevoItem?.searchTerm, buscarItemsUnificados, searchInputFocused]);

    // ==================== VALIDACIÓN DE ITEMS ====================
    const validarItemsAntesDeCrear = async (items: ValidarItemDto[]): Promise<ValidarItemResultado[]> => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.FACTURAS_VALIDAR_ITEMS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(items),
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Error en validación');
            }
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    };

    // Cargar grupos activos cuando se abre el modal de nueva factura
    useEffect(() => {
        if (!showModal) return;
        const fetchGrupos = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`${API_ENDPOINTS.GRUPOS_FACTURAS_RESUMEN}?estadoId=4&pageSize=100`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setGruposActivos(data.data.map((g: any) => ({ idGrupo: g.idGrupo, nombre: g.nombre })));
                }
            } catch { /* silencioso */ }
        };
        fetchGrupos();
    }, [showModal]);

    // ==================== RESET FORMULARIOS ====================
    const resetFacturaForm = () => {
        setFacturaForm({
            clienteExistente: false,
            idCliente: '',
            nombreCliente: '',
            telefonoCliente: '',
            fechaEntregaEstimada: '',
            notas: '',
            idGrupo: '',
            detalles: [],
        });
        setNuevoItem(null);
        setResultadosBusqueda({ servicios: [], productos: [] });
        setSearchTermItems('');
        setSearchInputFocused(false);
    };

    // ==================== MANEJO DE ITEMS ====================
    const iniciarAgregarServicio = () => {
        setNuevoItem({
            tipo: 'servicio',
            searchTerm: '',
            cantidad: '1',
            precioUnitario: '',
            descripcion: '',
            showDropdown: false
        });
        setResultadosBusqueda({ servicios: [], productos: [] });
        setSearchTermItems('');
        // Enfocar el input después de un breve delay
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
                setSearchInputFocused(true);
            }
        }, 100);
    };

    const iniciarAgregarProducto = () => {
        setNuevoItem({
            tipo: 'producto',
            searchTerm: '',
            cantidad: '1',
            precioUnitario: '',
            descripcion: '',
            showDropdown: false
        });
        setResultadosBusqueda({ servicios: [], productos: [] });
        setSearchTermItems('');
        // Enfocar el input después de un breve delay
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
                setSearchInputFocused(true);
            }
        }, 100);
    };

    const agregarItemAlCarrito = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!nuevoItem) return;

        // Validaciones básicas
        if (nuevoItem.tipo === 'servicio' && !nuevoItem.idPrendaServicio) {
            toast.error('Selecciona un servicio');
            return;
        }

        if (nuevoItem.tipo === 'producto' && !nuevoItem.idProducto) {
            toast.error('Selecciona un producto');
            return;
        }

        if (!nuevoItem.cantidad || parseFloat(nuevoItem.cantidad) <= 0) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        if (!nuevoItem.precioUnitario || parseFloat(nuevoItem.precioUnitario) <= 0) {
            toast.error('El precio debe ser mayor a 0');
            return;
        }

        // Agregar al carrito
        setFacturaForm({
            ...facturaForm,
            detalles: [...facturaForm.detalles, {
                ...nuevoItem,
                showDropdown: false,
                data: nuevoItem.data
            }]
        });

        // Resetear nuevo item completamente
        setNuevoItem({
            tipo: nuevoItem.tipo,
            searchTerm: '',
            idPrendaServicio: undefined,
            idProducto: undefined,
            cantidad: '1',
            precioUnitario: '',
            descripcion: '',
            showDropdown: false,
            data: undefined
        });

        setResultadosBusqueda({ servicios: [], productos: [] });
        setSearchTermItems('');
        setSearchInputFocused(false);
        toast.success('Item agregado al carrito');
    };

    const cancelarAgregarItem = () => {
        setNuevoItem(null);
        setResultadosBusqueda({ servicios: [], productos: [] });
        setSearchTermItems('');
        setSearchInputFocused(false);
    };

    const eliminarDetalle = (index: number) => {
        const nuevosDetalles = facturaForm.detalles.filter((_, i) => i !== index);
        setFacturaForm({ ...facturaForm, detalles: nuevosDetalles });
    };

    const actualizarDetalleCarrito = (index: number, campo: string, valor: any) => {
        const nuevosDetalles = [...facturaForm.detalles];
        (nuevosDetalles[index] as any)[campo] = valor;
        setFacturaForm({ ...facturaForm, detalles: nuevosDetalles });
    };

    const actualizarNuevoItem = (campo: string, valor: any) => {
        if (!nuevoItem) return;

        const itemActualizado = { ...nuevoItem };

        if (campo === 'searchTerm') {
            itemActualizado.searchTerm = valor;
            itemActualizado.showDropdown = valor.length > 0 && searchInputFocused;
            setSearchTermItems(valor);
        }
        else if (campo === 'selectItem') {
            const item = valor;
            if (nuevoItem.tipo === 'servicio') {
                itemActualizado.searchTerm = `${item.prendaNombre} - ${item.servicioNombre}`;
                itemActualizado.idPrendaServicio = item.idPrendaServicio.toString();
                itemActualizado.precioUnitario = item.precioUnitario.toString();
                itemActualizado.data = item;
            } else {
                itemActualizado.searchTerm = item.nombre;
                itemActualizado.idProducto = item.idProducto.toString();
                itemActualizado.precioUnitario = item.precioUnitario.toString();
                itemActualizado.data = item;
            }
            itemActualizado.showDropdown = false;
            setResultadosBusqueda({ servicios: [], productos: [] });
            setSearchInputFocused(false);

            setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.blur();
                }
            }, 0);
        }
        else if (campo === 'showDropdown') {
            itemActualizado.showDropdown = valor && searchInputFocused;
        }
        else {
            (itemActualizado as any)[campo] = valor;
        }

        setNuevoItem(itemActualizado);
    };

    // ==================== CÁLCULOS ====================
    const calcularSubtotal = () => {
        return facturaForm.detalles.reduce((sum, detalle) => {
            const cantidad = parseFloat(detalle.cantidad) || 0;
            const precio = parseFloat(detalle.precioUnitario) || 0;
            return sum + (cantidad * precio);
        }, 0);
    };

    const calcularDescuentoEnConfirmacion = () => {
        const subtotal = preparedFacturaDto?.subtotal || 0;
        if (confirmationFormLocal.descuentoTipo === 'porcentaje') {
            const porcentaje = parseFloat(confirmationFormLocal.descuentoPorcentaje) || 0;
            return Math.min(subtotal * (porcentaje / 100), subtotal);
        } else {
            const monto = parseFloat(confirmationFormLocal.descuentoMonto) || 0;
            return Math.min(monto, subtotal);
        }
    };

    const calcularTotalEnConfirmacion = () => {
        const subtotal = preparedFacturaDto?.subtotal || 0;
        const descuento = calcularDescuentoEnConfirmacion();
        return Math.max(0, subtotal - descuento);
    };

    const getChangeAmount = () => {
        if (!preparedFacturaDto) return 0;
        const montoAbonado = parseFloat(confirmationFormLocal.montoAbonado) || 0;
        const entregado = parseFloat(dineroEntregado) || 0;
        return Math.max(0, entregado - montoAbonado);
    };

    // ==================== PREPARACIÓN Y CREACIÓN ====================
    const prepareFacturaDto = async () => {
        // Validaciones básicas
        if (!facturaForm.clienteExistente && !facturaForm.nombreCliente.trim()) {
            toast.error('Debes ingresar el nombre del cliente');
            return null;
        }

        if (facturaForm.clienteExistente && !facturaForm.idCliente) {
            toast.error('Selecciona un cliente');
            return null;
        }

        if (facturaForm.detalles.length === 0) {
            toast.error('Debes agregar al menos un servicio o producto');
            return null;
        }

        // Validar items antes de crear
        const itemsParaValidar: ValidarItemDto[] = facturaForm.detalles.map(detalle => ({
            idPrendaServicio: detalle.idPrendaServicio ? parseInt(detalle.idPrendaServicio) : undefined,
            idProducto: detalle.idProducto ? parseInt(detalle.idProducto) : undefined,
            cantidad: parseInt(detalle.cantidad)
        }));

        const resultadosValidacion = await validarItemsAntesDeCrear(itemsParaValidar);

        // Verificar si hay errores en la validación
        const errores = resultadosValidacion.filter(r => !r.valido);
        if (errores.length > 0) {
            errores.forEach(error => {
                toast.error(error.mensaje || 'Error en validación de item');
            });
            return null;
        }

        // Preparar datos del cliente
        let nombreCliente = facturaForm.nombreCliente;
        let telefonoCliente = facturaForm.telefonoCliente;

        if (facturaForm.clienteExistente && facturaForm.idCliente) {
            const cliente = clientes.find(c => c.idCliente === parseInt(facturaForm.idCliente));
            if (cliente) {
                nombreCliente = `${cliente.nombre} ${cliente.apellido || ''}`.trim();
                telefonoCliente = cliente.telefono || '';
            }
        }

        const subtotal = calcularSubtotal();
        const fechaEntregaEstimada = facturaForm.fechaEntregaEstimada ||
            new Date().toISOString().split('T')[0];

        return {
            idCliente: facturaForm.clienteExistente ? parseInt(facturaForm.idCliente) : null,
            nombreCliente,
            telefonoCliente: telefonoCliente || null,
            fechaEntregaEstimada,
            subtotal,
            impuestos: 0,
            descuento: 0,
            total: subtotal,
            notas: facturaForm.notas || null,
            detalles: facturaForm.detalles.map(d => ({
                idPrendaServicio: d.tipo === 'servicio' && d.idPrendaServicio
                    ? parseInt(d.idPrendaServicio)
                    : null,
                idProducto: d.tipo === 'producto' && d.idProducto
                    ? parseInt(d.idProducto)
                    : null,
                cantidad: parseInt(d.cantidad),
                precioUnitario: parseFloat(d.precioUnitario),
                descripcion: d.descripcion || null,
            }))
        };
    };

    const handlePrepareConfirmation = async (e: React.FormEvent) => {
        e.preventDefault();
        const dto = await prepareFacturaDto();
        if (dto) {
            setPreparedFacturaDto(dto);
            setConfirmationFormLocal({
                pagoInmediato: false,
                metodoPago: 'efectivo',
                montoAbonado: dto.subtotal.toFixed(2),
                referenciaPago: '',
                descuentoTipo: 'porcentaje',
                descuentoPorcentaje: '',
                descuentoMonto: '',
            });
            setShowConfirmationModal(true);
        }
    };

    const handlePostFacturaCreada = async (idFactura: number) => {
        const facturaCompleta = await fetchFacturaDetalles(idFactura);
        if (facturaCompleta) {
            onFacturaCreada(facturaCompleta);
            return;
        }

        // Fallback: creation succeeded, but detail fetch failed
        toast.warning('La factura se creó, pero no se pudieron cargar los detalles. Ábrela desde la lista.');
        fetchFacturasResumen();
    };


    const handleConfirmCreation = async () => {
        if (!preparedFacturaDto) return;

        const descuento = calcularDescuentoEnConfirmacion();
        const total = calcularTotalEnConfirmacion();

        if (total <= 0) {
            toast.error('El total debe ser mayor a cero');
            return;
        }

        const dto = {
            ...preparedFacturaDto,
            descuento,
            total,
        };

        if (confirmationFormLocal.pagoInmediato) {
            const montoAbonado = parseFloat(confirmationFormLocal.montoAbonado) || 0;
            if (montoAbonado <= 0 || montoAbonado > dto.total) {
                toast.error('Monto a abonar inválido');
                return;
            }

            dto.pagoInmediato = true;
            dto.metodoPago = confirmationFormLocal.metodoPago;
            dto.montoAbonado = montoAbonado;
            dto.referenciaPago = confirmationFormLocal.referenciaPago || null;
        } else {
            dto.pagoInmediato = false;
            dto.metodoPago = null;
            dto.montoAbonado = 0;
            dto.referenciaPago = null;
        }

        if (confirmationFormLocal.pagoInmediato && confirmationFormLocal.metodoPago === 'efectivo') {
            setShowConfirmationModal(false);
            setShowChangeModal(true);
            setDineroEntregado('');
            return;
        }

        // AQUÍ ESTÁ EL CAMBIO 👇
        const responseData = await createFactura(dto);
        if (responseData?.idFactura) {
            await handlePostFacturaCreada(responseData.idFactura);
        }
    };

    const handleCalculateChange = async (entregadoEnRDOverride?: number) => {
        if (!preparedFacturaDto) return;

        const montoAbonado = parseFloat(confirmationFormLocal.montoAbonado) || 0;
        const entregado = entregadoEnRDOverride ?? (parseFloat(dineroEntregado) || 0);

        if (entregado < montoAbonado) {
            toast.error('El monto entregado debe ser al menos el monto a abonar');
            return;
        }

        const descuento = calcularDescuentoEnConfirmacion();
        const total = calcularTotalEnConfirmacion();

        const dto = {
            ...preparedFacturaDto,
            descuento,
            total,
            pagoInmediato: true,
            metodoPago: confirmationFormLocal.metodoPago,
            montoAbonado,
            referenciaPago: confirmationFormLocal.referenciaPago || null,
        };

        // AQUÍ ESTÁ EL CAMBIO 👇
        const responseData = await createFactura(dto);
        if (responseData?.idFactura) {
            await handlePostFacturaCreada(responseData.idFactura);
        }
    };

    const createFactura = async (dto: any) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(API_ENDPOINTS.FACTURAS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dto),
            });

            if (response.ok) {
                const data = await response.json();

                // Asignar al grupo si fue seleccionado
                if (facturaForm.idGrupo && data?.idFactura) {
                    try {
                        await fetch(API_ENDPOINTS.GRUPO_FACTURAS_AGREGAR(parseInt(facturaForm.idGrupo)), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ idsFacturas: [data.idFactura] }),
                        });
                        const grupoNombre = gruposActivos.find(g => g.idGrupo === parseInt(facturaForm.idGrupo))?.nombre;
                        toast.success(`Factura creada y agregada al grupo "${grupoNombre}"`);
                    } catch {
                        toast.success('Factura creada exitosamente');
                        toast.warning('No se pudo asignar al grupo seleccionado');
                    }
                } else {
                    toast.success('Factura creada exitosamente');
                }

                fetchFacturasResumen();
                handleCloseAllModals();
                return data;
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al crear factura');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
            return null;
        }
    };

    // ==================== HANDLERS PARA INPUTS ====================
    const handleSearchInputFocus = () => {
        setSearchInputFocused(true);
        if (nuevoItem && nuevoItem.searchTerm) {
            actualizarNuevoItem('showDropdown', true);
        }
    };

    const handleSearchInputBlur = () => {
        setTimeout(() => {
            setSearchInputFocused(false);
            if (nuevoItem) {
                actualizarNuevoItem('showDropdown', false);
            }
        }, 200);
    };

    // ==================== FUNCIÓN PARA ABRIR MODAL DE PAGO DESDE DETALLE ====================
    const handleAbrirPagoDesdeDetalle = () => {
        if (!facturaDetalles) return;
        setShowDetailModal(false);
        // Simular un objeto FacturaResumen para usar con abrirPagoModal
        const facturaResumen: FacturaResumen = {
            idFactura: facturaDetalles.idFactura,
            numeroFactura: facturaDetalles.numeroFactura,
            nombreCliente: facturaDetalles.nombreCliente,
            telefonoCliente: facturaDetalles.telefonoCliente || '',
            fechaCreacion: facturaDetalles.fechaCreacion,
            fechaEntregaEstimada: facturaDetalles.fechaEntregaEstimada || '',
            total: facturaDetalles.total,
            montoAbonado: facturaDetalles.montoAbonado || 0,
            montoPendiente: facturaDetalles.montoPendiente || facturaDetalles.total - (facturaDetalles.montoAbonado || 0),
            estado: facturaDetalles.estado,
            totalItems: facturaDetalles.detalles.length
        };
        abrirPagoModal(facturaResumen);
    };

    return (
        <>
            {/* MODAL NUEVA FACTURA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-7xl my-8 shadow-2xl border border-cyan-100 max-h-[95vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-cyan-50 to-blue-50">
                            <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                Nueva Factura
                            </h3>
                            <button
                                type="button"
                                onClick={handleCloseAllModals}
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePrepareConfirmation} className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
                                {/* COLUMNA IZQUIERDA - FORMULARIO */}
                                <div className="w-full lg:w-1/2 p-4 lg:p-6 lg:overflow-y-auto border-b-2 lg:border-b-0 lg:border-r border-gray-200">
                                    <div className="space-y-6 text-sm">
                                        {/* Información del Cliente */}
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4" /> Datos del Cliente
                                            </h4>
                                            <div className="flex items-center gap-4 mb-3">
                                                <label className="flex items-center gap-2 text-xs">
                                                    <input
                                                        type="radio"
                                                        checked={facturaForm.clienteExistente}
                                                        onChange={() => setFacturaForm({
                                                            ...facturaForm,
                                                            clienteExistente: true,
                                                            nombreCliente: '',
                                                            telefonoCliente: ''
                                                        })}
                                                        className="text-cyan-600"
                                                    />
                                                    <span className="text-gray-700">Cliente Registrado</span>
                                                </label>
                                                <label className="flex items-center gap-2 text-xs">
                                                    <input
                                                        type="radio"
                                                        checked={!facturaForm.clienteExistente}
                                                        onChange={() => setFacturaForm({
                                                            ...facturaForm,
                                                            clienteExistente: false,
                                                            idCliente: ''
                                                        })}
                                                        className="text-cyan-600"
                                                    />
                                                    <span className="text-gray-700">Cliente Temporal</span>
                                                </label>
                                            </div>
                                            {facturaForm.clienteExistente ? (
                                                <select
                                                    required
                                                    value={facturaForm.idCliente}
                                                    onChange={(e) => setFacturaForm({ ...facturaForm, idCliente: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                >
                                                    <option value="">Seleccionar cliente...</option>
                                                    {clientes.map((c) => (
                                                        <option key={c.idCliente} value={c.idCliente}>
                                                            {c.nombre} {c.apellido} {c.telefono ? `- ${c.telefono}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700">Nombre *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={facturaForm.nombreCliente}
                                                            onChange={(e) => setFacturaForm({ ...facturaForm, nombreCliente: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700">Teléfono (Opcional)</label>
                                                        <input
                                                            type="tel"
                                                            value={facturaForm.telefonoCliente}
                                                            onChange={(e) => setFacturaForm({ ...facturaForm, telefonoCliente: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Sección para Agregar Items */}
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                                                <ShoppingBag className="h-4 w-4" /> Items
                                            </h4>
                                            {!nuevoItem ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={iniciarAgregarServicio}
                                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Agregar Servicio
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={iniciarAgregarProducto}
                                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Agregar Producto
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border-2 border-cyan-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs font-semibold text-cyan-700 uppercase flex items-center gap-1">
                                                            {nuevoItem.tipo === 'servicio'
                                                                ? <><Shirt className="h-3.5 w-3.5" /> Nuevo Servicio</>
                                                                : <><Package className="h-3.5 w-3.5" /> Nuevo Producto</>}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={cancelarAgregarItem}
                                                            className="text-red-600 hover:bg-red-100 p-1 rounded text-sm"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                {nuevoItem.tipo === 'servicio' ? 'Buscar Prenda y Servicio *' : 'Buscar Producto *'}
                                                            </label>
                                                            <input
                                                                ref={searchInputRef}
                                                                type="text"
                                                                value={nuevoItem.searchTerm}
                                                                onChange={(e) => actualizarNuevoItem('searchTerm', e.target.value)}
                                                                onFocus={handleSearchInputFocus}
                                                                onBlur={handleSearchInputBlur}
                                                                placeholder={nuevoItem.tipo === 'servicio' ? 'Ej: pantalon lavado' : 'Ej: detergente'}
                                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                                autoFocus
                                                            />
                                                            {nuevoItem.showDropdown && searchInputFocused && (
                                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                    {buscandoItems ? (
                                                                        <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-600"></div>
                                                                            Buscando...
                                                                        </div>
                                                                    ) : resultadosBusqueda.servicios.length === 0 && resultadosBusqueda.productos.length === 0 ? (
                                                                        <div className="px-4 py-3 text-xs text-gray-500">
                                                                            {nuevoItem.searchTerm.trim() ? 'No se encontraron resultados' : 'Escribe para buscar...'}
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {nuevoItem.tipo === 'servicio' && resultadosBusqueda.servicios.length > 0 && (
                                                                                <div>
                                                                                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 border-b">
                                                                                        Servicios
                                                                                    </div>
                                                                                    {resultadosBusqueda.servicios.slice(0, 5).map((item, idx) => (
                                                                                        <button
                                                                                            key={idx}
                                                                                            type="button"
                                                                                            onMouseDown={(e) => {
                                                                                                e.preventDefault();
                                                                                                actualizarNuevoItem('selectItem', item);
                                                                                            }}
                                                                                            className="w-full px-4 py-2 text-left hover:bg-cyan-50 text-xs text-gray-900 border-b last:border-b-0"
                                                                                        >
                                                                                            <div className="font-medium text-xs">
                                                                                                {item.prendaNombre} - {item.servicioNombre}
                                                                                            </div>
                                                                                            <div className="text-xs text-gray-500">
                                                                                                Precio: {propFormatCurrency(item.precioUnitario || 0)}
                                                                                            </div>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            {nuevoItem.tipo === 'producto' && resultadosBusqueda.productos.length > 0 && (
                                                                                <div>
                                                                                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 border-b">
                                                                                        Productos
                                                                                    </div>
                                                                                    {resultadosBusqueda.productos.slice(0, 5).map((item, idx) => (
                                                                                        <button
                                                                                            key={idx}
                                                                                            type="button"
                                                                                            onMouseDown={(e) => {
                                                                                                e.preventDefault();
                                                                                                actualizarNuevoItem('selectItem', item);
                                                                                            }}
                                                                                            className="w-full px-4 py-2 text-left hover:bg-cyan-50 text-xs text-gray-900 border-b last:border-b-0"
                                                                                        >
                                                                                            <div className="font-medium text-xs">{item.nombre}</div>
                                                                                            <div className="text-xs text-gray-500">
                                                                                                Precio: {propFormatCurrency(item.precioUnitario || 0)} |
                                                                                                Stock: {item.stockDisponible || 0} |
                                                                                                {item.categoria && ` ${item.categoria}`}
                                                                                            </div>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad *</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={nuevoItem.cantidad}
                                                                    onChange={(e) => actualizarNuevoItem('cantidad', e.target.value)}
                                                                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Precio Unit.</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={nuevoItem.precioUnitario}
                                                                    onChange={(e) => actualizarNuevoItem('precioUnitario', e.target.value)}
                                                                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nota (Opcional)</label>
                                                            <input
                                                                type="text"
                                                                value={nuevoItem.descripcion}
                                                                onChange={(e) => actualizarNuevoItem('descripcion', e.target.value)}
                                                                className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                                placeholder="Notas adicionales..."
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <button
                                                                ref={agregarButtonRef}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    agregarItemAlCarrito(e);
                                                                }}
                                                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md text-sm"
                                                            >
                                                                Agregar al Carrito
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelarAgregarItem}
                                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Fecha de Entrega */}
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4" /> Fecha de Entrega
                                            </h4>
                                            <input
                                                type="date"
                                                value={facturaForm.fechaEntregaEstimada}
                                                onChange={(e) => setFacturaForm({ ...facturaForm, fechaEntregaEstimada: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Si no se especifica, se usará la fecha actual
                                            </p>
                                        </div>
                                        {/* Grupo de Facturas */}
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                                                <Tag className="h-4 w-4" /> Grupo de Facturas
                                            </h4>
                                            <select
                                                value={facturaForm.idGrupo}
                                                onChange={(e) => setFacturaForm({ ...facturaForm, idGrupo: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                            >
                                                <option value="">Sin grupo (opcional)</option>
                                                {gruposActivos.map(g => (
                                                    <option key={g.idGrupo} value={g.idGrupo}>{g.nombre}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Agrega esta factura a un grupo de facturas existente
                                            </p>
                                        </div>
                                        {/* Notas */}
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                                                <FileText className="h-4 w-4" /> Notas
                                            </h4>
                                            <textarea
                                                value={facturaForm.notas}
                                                onChange={(e) => setFacturaForm({ ...facturaForm, notas: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                rows={3}
                                                placeholder="Notas adicionales sobre la factura..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* COLUMNA DERECHA - CARRITO */}
                                <div className="w-full lg:w-1/2 bg-white lg:overflow-y-auto relative">
                                    <div className="sticky top-0 bg-white z-[40] pb-4 mb-4 border-b shadow-sm px-4 lg:px-6 pt-4 lg:pt-6">
                                        <h4 className="font-bold text-md text-gray-800 flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4" /> Items Facturados
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {facturaForm.detalles.length} {facturaForm.detalles.length === 1 ? 'item' : 'items'}
                                        </p>
                                    </div>
                                    <div className="space-y-2 pb-24">
                                        {facturaForm.detalles.length === 0 ? (
                                            <div
                                                className="flex flex-col items-center justify-center py-12 text-center">
                                                <ShoppingBag className="h-12 w-12 mb-3 text-gray-300" />
                                                <p className="text-gray-500 font-medium text-sm">El carrito está
                                                    vacío</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Agrega servicios o productos desde el panel izquierdo
                                                </p>
                                            </div>
                                        ) : (
                                            facturaForm.detalles.map((detalle, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-cyan-300 transition-all shadow-sm mb-2"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-gray-500">
                                                                    {detalle.tipo === 'servicio'
                                                                        ? <Shirt className="h-4 w-4" />
                                                                        : <Package className="h-4 w-4" />}
                                                                </span>
                                                                <span
                                                                    className="font-semibold text-gray-900 text-xs truncate max-w-[200px]">
                                                                    {detalle.searchTerm}
                                                                </span>
                                                            </div>
                                                            {detalle.descripcion && (
                                                                <p className="text-xs text-gray-500 ml-6">{detalle.descripcion}</p>
                                                            )}
                                                            {/* Info adicional del item */}
                                                            {detalle.data && (
                                                                <div className="ml-6 mt-1 text-xs text-gray-500">
                                                                    {detalle.tipo === 'producto' && detalle.data.stockDisponible !== undefined && (
                                                                        <span>Stock: {detalle.data.stockDisponible} | </span>
                                                                    )}
                                                                    {detalle.data.categoria && (
                                                                        <span>{detalle.data.categoria}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarDetalle(index)}
                                                            className="text-red-600 hover:bg-red-100 p-1 rounded transition-all ml-2"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-3 w-3"/>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label
                                                                className="block text-xs text-gray-600 mb-1">Cantidad</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={detalle.cantidad}
                                                                onChange={(e) => actualizarDetalleCarrito(index, 'cantidad', e.target.value)}
                                                                className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-600 mb-1">Precio
                                                                Unit.</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={detalle.precioUnitario}
                                                                onChange={(e) => actualizarDetalleCarrito(index, 'precioUnitario', e.target.value)}
                                                                className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label
                                                                className="block text-xs text-gray-600 mb-1">Subtotal</label>
                                                            <div
                                                                className="w-full px-2 py-1 bg-cyan-50 border border-cyan-200 rounded text-xs font-bold text-cyan-700 text-center">
                                                                {propFormatCurrency(parseFloat(detalle.cantidad || '0') * parseFloat(detalle.precioUnitario || '0'))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {/* Totales - Sticky al final */}
                                    <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 pt-4 pb-6 mt-4">
                                        <div
                                            className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border-2 border-cyan-200 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-700 font-medium">Subtotal:</span>
                                                <span className="font-bold text-gray-900 text-sm">
                                                    {propFormatCurrency(calcularSubtotal())}
                                                </span>
                                            </div>
                                            <div
                                                className="flex justify-between items-center border-t-2 border-cyan-300 pt-2">
                                                <span
                                                    className="font-bold text-gray-800 text-sm">TOTAL (sin desc.):</span>
                                                <span className="font-bold text-cyan-600 text-lg">
                                                    {propFormatCurrency(calcularSubtotal())}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                type="submit"
                                                disabled={facturaForm.detalles.length === 0}
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Ver Resumen y Crear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCloseAllModals}
                                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-sm"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMACIÓN / RESUMEN */}
            {showConfirmationModal && preparedFacturaDto && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl border border-cyan-100 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-5 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Resumen de Factura
                        </h3>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Cliente:</span>
                                    <p className="font-medium text-gray-900">{preparedFacturaDto.nombreCliente}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Teléfono:</span>
                                    <p className="font-medium text-gray-900">{preparedFacturaDto.telefonoCliente || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Entrega Estimada:</span>
                                    <p className="font-medium text-gray-900">
                                        {preparedFacturaDto.fechaEntregaEstimada.substring(0, 10).split('-').reverse().join('/')}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Notas:</span>
                                    <p className="font-medium text-gray-900">{preparedFacturaDto.notas || '-'}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-700 mb-2">Detalles</h4>
                                <div className="space-y-2">
                                    {preparedFacturaDto.detalles.map((detalle: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm bg-gray-50 p-3 rounded">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {facturaForm.detalles[index]?.searchTerm || '—'}
                                                </p>
                                                {detalle.descripcion && (
                                                    <p className="text-xs text-gray-500 mt-1">{detalle.descripcion}</p>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-gray-600">
                                                    {detalle.cantidad} × {propFormatCurrency(detalle.precioUnitario)}
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                    {propFormatCurrency(detalle.cantidad * detalle.precioUnitario)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Descuento */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Tag className="h-4 w-4" /> Descuento
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                    <div className="sm:col-span-1">
                                        <select
                                            value={confirmationFormLocal.descuentoTipo}
                                            onChange={(e) => setConfirmationFormLocal({
                                                ...confirmationFormLocal,
                                                descuentoTipo: e.target.value as 'porcentaje' | 'monto',
                                                descuentoPorcentaje: '',
                                                descuentoMonto: ''
                                            })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                        >
                                            <option value="porcentaje">Porcentaje (%)</option>
                                            <option value="monto">Monto Fijo ($)</option>
                                        </select>
                                    </div>
                                    {confirmationFormLocal.descuentoTipo === 'porcentaje' ? (
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={confirmationFormLocal.descuentoPorcentaje}
                                                onChange={(e) => setConfirmationFormLocal({
                                                    ...confirmationFormLocal,
                                                    descuentoPorcentaje: e.target.value
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                placeholder="% de descuento"
                                            />
                                        </div>
                                    ) : (
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={confirmationFormLocal.descuentoMonto}
                                                onChange={(e) => setConfirmationFormLocal({
                                                    ...confirmationFormLocal,
                                                    descuentoMonto: e.target.value
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 text-sm"
                                                placeholder="Monto del descuento"
                                            />
                                        </div>
                                    )}
                                </div>
                                {calcularDescuentoEnConfirmacion() > 0 && (
                                    <div className="flex justify-between text-sm py-1 px-3 bg-red-50 rounded border border-red-200">
                                        <span className="text-red-700">Descuento aplicado:</span>
                                        <span className="font-semibold text-red-700">
                                            -{propFormatCurrency(calcularDescuentoEnConfirmacion())}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Totales finales */}
                            <div className="border-t border-cyan-200 pt-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium text-gray-900">
                                            {propFormatCurrency(preparedFacturaDto.subtotal)}
                                        </span>
                                    </div>
                                    {calcularDescuentoEnConfirmacion() > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Descuento:</span>
                                            <span className="font-medium text-red-600">
                                                -{propFormatCurrency(calcularDescuentoEnConfirmacion())}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-cyan-300 pt-2 text-base">
                                        <span className="font-bold text-gray-800">Total a pagar:</span>
                                        <span className="font-bold text-cyan-600 text-xl">
                                            {propFormatCurrency(calcularTotalEnConfirmacion())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Pago inmediato */}
                            <div className="border-2 border-dashed border-green-300 bg-green-50/50 rounded-xl p-4 mt-4">
                                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={confirmationFormLocal.pagoInmediato}
                                            onChange={(e) => setConfirmationFormLocal({
                                                ...confirmationFormLocal,
                                                pagoInmediato: e.target.checked,
                                                montoAbonado: e.target.checked ? calcularTotalEnConfirmacion().toFixed(2) : ''
                                            })}
                                            className="sr-only"
                                            id="pagoInmediato"
                                        />
                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                            confirmationFormLocal.pagoInmediato
                                                ? 'bg-green-500 border-green-500'
                                                : 'bg-white border-gray-300'
                                        }`}>
                                            {confirmationFormLocal.pagoInmediato && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-green-600" />
                                        <span className="font-bold text-green-700 text-sm">PAGAR AHORA</span>
                                    </div>
                                </label>
                                {confirmationFormLocal.pagoInmediato && (
                                    <div className="space-y-4 bg-white p-4 rounded-lg border border-green-200 animate-slideDown">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold mb-1 text-green-700">Monto a Abonar *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={calcularTotalEnConfirmacion()}
                                                    value={confirmationFormLocal.montoAbonado}
                                                    onChange={(e) => setConfirmationFormLocal({ ...confirmationFormLocal, montoAbonado: e.target.value })}
                                                    className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                                                    placeholder={`Máximo: ${propFormatCurrency(calcularTotalEnConfirmacion())}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1 text-green-700">Método de Pago</label>
                                                <select
                                                    value={confirmationFormLocal.metodoPago}
                                                    onChange={(e) => setConfirmationFormLocal({ ...confirmationFormLocal, metodoPago: e.target.value })}
                                                    className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                                                >
                                                    <option value="efectivo">Efectivo</option>
                                                    <option value="tarjeta">Tarjeta</option>
                                                    <option value="transferencia">Transferencia</option>
                                                    <option value="cheque">Cheque</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1 text-green-700">
                                                Referencia de Pago (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={confirmationFormLocal.referenciaPago}
                                                onChange={(e) => setConfirmationFormLocal({ ...confirmationFormLocal, referenciaPago: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                                                placeholder="Número de transacción, etc."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                onClick={handleConfirmCreation}
                                className="flex-1 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md font-medium"
                            >
                                Confirmar y Crear
                            </button>
                            <button
                                onClick={() => setShowConfirmationModal(false)}
                                className="flex-1 px-5 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                            >
                                Volver a Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CAMBIO (para nueva factura) */}
            {showChangeModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-cyan-100">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Calcular Cambio
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Monto a Abonar: {propFormatCurrency(parseFloat(confirmationFormLocal.montoAbonado) || 0)}
                                </label>
                            </div>

                            {/* Selector de divisa */}
                            {divisas.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">
                                        Moneda de pago del cliente
                                    </label>
                                    <select
                                        value={divisaSeleccionada}
                                        onChange={(e) => {
                                            setDivisaSeleccionada(e.target.value);
                                            setDineroEntregado('');
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

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Dinero Entregado por el Cliente
                                    {divisaSeleccionada !== 'RD' && (
                                        <span className="ml-1 text-cyan-600 font-semibold">
                                            (en {divisaSeleccionada.replace('DIVISA_', '')})
                                        </span>
                                    )}
                                    *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={dineroEntregado}
                                    onChange={(e) => setDineroEntregado(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                                    autoFocus
                                />
                                {/* Mostrar equivalencia en RD$ si se usa otra divisa */}
                                {divisaSeleccionada !== 'RD' && dineroEntregado && (() => {
                                    const tasa = parseFloat(divisas.find(d => d.clave === divisaSeleccionada)?.valor || '1');
                                    const enRD = parseFloat(dineroEntregado) * tasa;
                                    return (
                                        <p className="text-xs text-cyan-600 mt-1">
                                            Equivale a {propFormatCurrency(enRD)} en RD$
                                        </p>
                                    );
                                })()}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Cambio a Devolver (en RD$):
                                </label>
                                {(() => {
                                    const montoAbonado = parseFloat(confirmationFormLocal.montoAbonado) || 0;
                                    const entregadoRaw = parseFloat(dineroEntregado) || 0;
                                    const tasa = divisaSeleccionada !== 'RD'
                                        ? parseFloat(divisas.find(d => d.clave === divisaSeleccionada)?.valor || '1')
                                        : 1;
                                    const entregadoEnRD = entregadoRaw * tasa;
                                    const cambio = Math.max(0, entregadoEnRD - montoAbonado);
                                    const insuficiente = entregadoEnRD < montoAbonado;
                                    return (
                                        <p className={`text-2xl font-bold ${insuficiente ? 'text-red-600' : 'text-green-600'}`}>
                                            {propFormatCurrency(cambio)}
                                            {insuficiente ? ' (Insuficiente)' : ''}
                                        </p>
                                    );
                                })()}
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => {
                                        const montoAbonado = parseFloat(confirmationFormLocal.montoAbonado) || 0;
                                        const entregadoRaw = parseFloat(dineroEntregado) || 0;
                                        const tasa = divisaSeleccionada !== 'RD'
                                            ? parseFloat(divisas.find(d => d.clave === divisaSeleccionada)?.valor || '1')
                                            : 1;
                                        const entregadoEnRD = entregadoRaw * tasa;

                                        if (entregadoEnRD < montoAbonado) {
                                            toast.error('El monto entregado es insuficiente');
                                            return;
                                        }

                                        handleCalculateChange(entregadoEnRD);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    Crear Factura
                                </button>
                                <button
                                    onClick={handleCloseChangeModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE FACTURA */}
            {showDetailModal && facturaDetalles && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl border border-cyan-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Factura {facturaDetalles.numeroFactura}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Creada el {format(parseISO(facturaDetalles.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={onImprimirDesdeDetalle}  // Usar la nueva prop
                                    className="p-2 text-gray-600 hover:text-white hover:bg-gray-600 rounded-lg transition-all border border-gray-600"
                                    title="Imprimir"
                                    disabled={loading.detalles}
                                >
                                    <Printer className="h-4 w-4"/>
                                </button>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        {loading.detalles ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Información General */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="col-span-1">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-gray-700 mb-2">Cliente</h4>
                                            <p className="font-medium text-gray-900">{facturaDetalles.nombreCliente}</p>
                                            {facturaDetalles.telefonoCliente && (
                                                <p className="text-sm text-gray-600 mt-1">{facturaDetalles.telefonoCliente}</p>
                                            )}
                                            {facturaDetalles.cliente && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    {facturaDetalles.cliente.email && <p>Email: {facturaDetalles.cliente.email}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-gray-700 mb-2">Información de Entrega</h4>
                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Estimada:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {facturaDetalles.fechaEntregaEstimada
                                                            ? facturaDetalles.fechaEntregaEstimada.substring(0, 10).split('-').reverse().join('/')
                                                            : 'Sin fecha'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Real:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {facturaDetalles.fechaEntregaReal
                                                            ? format(parseISO(facturaDetalles.fechaEntregaReal), 'dd/MM/yyyy', { locale: es })
                                                            : 'No entregada'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Detalles de Items */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">Detalles de la Factura</h4>
                                    <div className="border rounded-lg overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                            {facturaDetalles.detalles.map((detalle, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-900 flex items-center gap-1.5">
                                                                {detalle.tipo === 'servicio' ? <Shirt className="h-4 w-4 text-gray-500 flex-shrink-0" /> : <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                                                                {detalle.descripcion ||
                                                                (detalle.tipo === 'servicio' ? detalle.servicio?.prenda + ' - ' + detalle.servicio?.servicio :
                                                                    detalle.producto?.nombre)}
                                                            </p>
                                                            {detalle.tipo === 'servicio' && detalle.servicio && (
                                                                <p className="text-xs text-gray-500">
                                                                    {detalle.servicio.prenda} - {detalle.servicio.servicio}
                                                                </p>
                                                            )}
                                                            {detalle.tipo === 'producto' && detalle.producto && (
                                                                <p className="text-xs text-gray-500">
                                                                    {detalle.producto.categoria} {detalle.producto.codigoBarras && `| ${detalle.producto.codigoBarras}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{detalle.cantidad}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{propFormatCurrency(detalle.precioUnitario)}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                        {propFormatCurrency(detalle.subtotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Totales */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-3">Resumen de Pagos</h4>
                                        <div className="space-y-2">
                                            {facturaDetalles.pagos.length === 0 ? (
                                                <p className="text-sm text-gray-500">No hay pagos registrados</p>
                                            ) : (
                                                facturaDetalles.pagos.map((pago, index) => (
                                                    <div key={index} className="bg-green-50 p-3 rounded border border-green-200">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-medium text-gray-700">{propFormatCurrency(pago.monto)}</span>
                                                            <span className="text-gray-600">
                                                                {format(parseISO(pago.fechaPago), 'dd/MM/yy HH:mm', { locale: es })}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {pago.metodoPago} {pago.referencia && `| Ref: ${pago.referencia}`}
                                                            {pago.notas && ` | ${pago.notas}`}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            Registrado por: {pago.usuario}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-3">Totales</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-medium text-gray-900">{propFormatCurrency(facturaDetalles.subtotal)}</span>
                                            </div>
                                            {facturaDetalles.descuento > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Descuento:</span>
                                                    <span className="font-medium text-red-600">-{propFormatCurrency(facturaDetalles.descuento)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                                                <span className="font-bold text-gray-700">Total Factura:</span>
                                                <span className="font-bold text-gray-900">{propFormatCurrency(facturaDetalles.total)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-gray-600">Total Abonado:</span>
                                                <span className="font-semibold text-green-600">
                                                    {propFormatCurrency(facturaDetalles.montoAbonado || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                                                <span className="font-bold text-gray-700">Saldo Pendiente:</span>
                                                <span className={`font-bold text-lg ${
                                                    (facturaDetalles.montoPendiente || 0) <= 0
                                                        ? 'text-green-600'
                                                        : 'text-orange-600'
                                                }`}>
                                                    {propFormatCurrency(facturaDetalles.montoPendiente || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Información Adicional */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Estado</h4>
                                        {(() => {
                                            const estado = getEstadoDetalleFactura(facturaDetalles);
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 text-sm rounded-full ${estado.clase}`}>
                                                        {estado.texto}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Método de Pago</h4>
                                        <p className="text-gray-900 capitalize">{facturaDetalles.metodoPago || 'No especificado'}</p>
                                    </div>
                                    {facturaDetalles.notas && (
                                        <div className="col-span-2">
                                            <h4 className="font-semibold text-gray-700 mb-2">Notas</h4>
                                            <p className="text-gray-900 bg-gray-50 p-3 rounded">{facturaDetalles.notas}</p>
                                        </div>
                                    )}
                                </div>
                                {/* Acciones - SOLO Registrar Pago y Cerrar */}
                                <div className="flex space-x-3 pt-4 border-t">
                                    {(facturaDetalles.montoPendiente || 0) > 0 && (
                                        <button
                                            onClick={handleAbrirPagoDesdeDetalle}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            <DollarSign className="h-4 w-4" /> Registrar Pago
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}