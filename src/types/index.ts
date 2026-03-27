// Auth Types
export interface LoginCredentials {
    usernameOrEmail: string;
    password: string;
}

export interface UserAuthDto {
    idUsuario: number;
    nombre: string;
    apellido?: string;
    email?: string;
    username: string;
    fechaUltimoLogin?: string;
    fechaCreacion?: string;
    idEstado: number;
    estaActivo: boolean;
}

export interface LoginResponse {
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expires: string;
    user: UserAuthDto;
    roles: string[];
    idRol?: number;
    message: string;
}

//Recuperar Contraseña
export interface ForgotPasswordDto {
    email: string;
}

export interface ValidateResetTokenDto {
    email: string;
    token: string;
}

export interface ResetPasswordDto {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
}

// Usuario Types
export interface Usuario {
    idUsuario: number;
    nombre: string;
    apellido?: string;
    email?: string;
    username: string;
    idEstado: number;
    fechaCreacion: string;
    fechaUltimoLogin?: string;
    roles?: Rol[];
}

// Rol Types
export interface Rol {
    idRol: number;
    nombre: string;
    descripcion?: string;
    idEstado: number;
    fechaCreacion?: string;
}

// Estado Types
export interface Estado {
    idEstado: number;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
    fechaCreacion?: string;
}

// Cliente Types
export interface Cliente {
    idCliente: number;
    nombre: string;
    apellido?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    idEstado: number;
    fechaRegistro: string;
    fechaUltimaActualizacion?: string;
    notas?: string;
}

// Prenda Types
export interface Prenda {
    idPrenda: number;
    nombre: string;
    descripcion?: string;
    prendaServicios?: PrendaServicio[];
}

export interface PrendaListDto {
    idPrenda: number;
    nombre: string;
    descripcion?: string;
    cantidadServicios: number;
    servicios: PrendaServicioSimpleDto[];
}

// Tipo simple para servicios dentro de prenda
export interface PrendaServicioSimpleDto {
    idPrendaServicio: number;
    idServicio: number;
    nombreServicio: string;
    precioUnitario: number;
}

// Tipo ligero para dropdown de servicios
export interface ServicioSimpleDto {
    idServicio: number;
    nombre: string;
    idEstado: number;
}

// Servicio Types
export interface Servicio {
    idServicio: number;
    nombre: string;
    descripcion?: string;
    duracionEstimada?: number;
    idEstado: number;
    fechaCreacion?: string;
    fechaUltimaActualizacion?: string;
}

// PrendaServicio Types
export interface PrendaServicio {
    idPrendaServicio: number;
    idPrenda: number;
    idServicio: number;
    precioUnitario: number;
    idPrendaNavigation?: Prenda;
    idServicioNavigation?: Servicio;
}

// Factura Types
export interface Factura {
    idFactura: number;
    numeroFactura: string;
    idCliente?: number;
    nombreCliente: string;
    telefonoCliente?: string;
    idUsuario: number;
    idEstado: number;
    fechaCreacion: string;
    fechaUltimaActualizacion: string;
    fechaEntregaEstimada?: string;
    fechaEntregaReal?: string;
    subtotal: number;
    impuestos: number;
    descuento: number;
    total: number;
    metodoPago: string;
    notas?: string;
    montoAbonado?: number;
    montoPendiente?: number;
    idClienteNavigation?: Cliente;
    idEstadoNavigation?: Estado;
    idUsuarioNavigation?: Usuario;
    detalleFacturas: DetalleFactura[];
    pagos: Pago[];
}

// Nuevos tipos para Facturas Resumen
export interface FacturaResumen {
    idFactura: number;
    numeroFactura: string;
    nombreCliente: string;
    telefonoCliente?: string;
    fechaCreacion: string;
    fechaEntregaEstimada?: string;
    total: number;
    montoAbonado?: number;
    montoPendiente?: number;
    estado: {
        idEstado: number;
        nombre: string;
    };
    totalItems: number;
}

export interface ProximaEntregaFactura {
    idFactura: number;
    numeroFactura: string;
    nombreCliente: string;
    telefonoCliente?: string;
    fechaEntregaEstimada?: string;
    total: number;
    montoPendiente?: number;
    estado: string;
    diasRestantes: number;
}

export interface FacturaDetallesCompletos {
    idFactura: number;
    numeroFactura: string;
    nombreCliente: string;
    telefonoCliente?: string;
    fechaCreacion: string;
    fechaEntregaEstimada?: string;
    fechaEntregaReal?: string;
    subtotal: number;
    impuestos: number;
    descuento: number;
    total: number;
    montoAbonado?: number;
    montoPendiente?: number;
    metodoPago?: string;
    notas?: string;
    cliente?: {
        idCliente: number;
        nombre: string;
        telefono?: string;
        email?: string;
    };
    estado: {
        idEstado: number;
        nombre: string;
    };
    usuario: {
        idUsuario: number;
        nombre: string;
    };
    detalles: Array<{
        idDetalle: number;
        cantidad: number;
        precioUnitario: number;
        descripcion?: string;
        subtotal: number;
        tipo: 'servicio' | 'producto';
        servicio?: {
            idPrendaServicio: number;
            prenda: string;
            servicio: string;
        };
        producto?: {
            idProducto: number;
            nombre: string;
            codigoBarras?: string;
            categoria: string;
        };
    }>;
    pagos: Array<{
        idPago: number;
        monto: number;
        fechaPago: string;
        metodoPago: string;
        referencia?: string;
        notas?: string;
        usuario: string;
    }>;
}

export interface RegistrarPagoFacturaDto {
    monto: number;
    metodoPago: string;
    referencia?: string;
    notas?: string;
}

export interface DetalleFactura {
    idDetalleFactura: number;
    idFactura: number;
    idPrendaServicio?: number;
    idProducto?: number;
    cantidad: number;
    precioUnitario: number;
    descripcion?: string;
    fechaCreacion: string;
    idPrendaServicioNavigation?: PrendaServicio & {
        idPrendaNavigation: Prenda;
        idServicioNavigation: Servicio;
    };
    idProductoNavigation?: Producto;
}

// Tipos para validación de items
export interface ValidarItemDto {
    idPrendaServicio?: number;
    idProducto?: number;
    cantidad: number;
}

export interface ValidarItemResultado {
    valido: boolean;
    mensaje?: string;
    tipo?: 'servicio' | 'producto';
    idPrendaServicio?: number;
    idProducto?: number;
    nombre?: string;
    precioUnitario?: number;
    stockDisponible?: number;
    categoria?: string;
}

// Pago Types
export interface Pago {
    idPago: number;
    idFactura: number;
    monto: number;
    idEstado: number;
    fechaPago: string;
    fechaUltimaActualizacion: string;
    metodoPago: string;
    referencia?: string;
    idUsuario: number;
    notas?: string;
    idFacturaNavigation?: Factura;
    idEstadoNavigation?: Estado;
    idUsuarioNavigation?: Usuario;
}

// Producto Types
export interface Producto {
    idProducto: number;
    nombre: string;
    descripcion?: string;
    codigoBarras?: string;
    precioVenta: number;
    costo?: number;
    stockActual: number;
    stockMinimo?: number;
    idCategoria?: number;
    idEstado: number;
    fechaCreacion?: string;
    idCategoriaNavigation?: Categoria;
}

// Categoria Types
export interface Categoria {
    idCategoria: number;
    nombre: string;
    idCategoriaNavigation?: {
        nombre: string;
    };
}

// Categoría de Gasto Types
export interface CategoriaGasto {
    idCategoriaGasto: number;
    nombre: string;
    descripcion?: string;
    color?: string;
    idEstado: number;
    fechaCreacion: string;
    gastos?: Gasto[];
    idEstadoNavigation?: Estado;
}

// Gasto Types
export interface Gasto {
    idGasto: number;
    idCategoriaGasto: number;
    monto: number;
    fechaGasto: string;
    descripcion?: string;
    referencia?: string;
    comprobanteUrl?: string;
    idUsuario: number;
    idEstado: number;
    fechaCreacion: string;
    fechaUltimaActualizacion: string;
    idCategoriaGastoNavigation?: CategoriaGasto;
    idEstadoNavigation?: Estado;
    idUsuarioNavigation?: Usuario;
}

export interface CreateGastoDto {
    idCategoriaGasto: number;
    monto: number;
    fechaGasto: string;
    descripcion?: string;
    referencia?: string;
    comprobanteUrl?: string;
    idEstado?: number;
}

export interface UpdateGastoDto {
    idCategoriaGasto?: number;
    monto?: number;
    fechaGasto?: string;
    descripcion?: string;
    referencia?: string;
    comprobanteUrl?: string;
    idEstado?: number;
}

export interface GastoResumen {
    idGasto: number;
    categoria: string;
    categoriaColor: string;
    monto: number;
    fechaGasto: string;
    descripcion: string;
    referencia?: string;
    comprobanteUrl?: string;
    usuario: string;
    estado: string;
    fechaCreacion: string;
}

export interface GastoPorCategoria {
    categoria: string;
    color: string;
    total: number;
    cantidad: number;
    porcentaje: number;
}

export interface GastoPorMes {
    año: number;
    mes: number;
    mesNombre: string;
    total: number;
    cantidad: number;
}

// ============ DASHBOARD TYPES ============

export interface DashboardResumen {
    resumenFinanciero: ResumenFinancieroMes;
    estadisticasFacturas: EstadisticasFacturasMes;
    ultimosMovimientos: UltimoMovimiento[];
    fechaConsulta: string;
    periodoConsultado: string;
}

export interface ResumenFinancieroMes {
    totalIngresos: number;
    totalGastos: number;
    gananciaNeta: number;
    margenGanancia: number;
    fechaDesde: string;
    fechaHasta: string;
}

export interface EstadisticasFacturasMes {
    totalFacturas: number;
    facturasPagadas: number;
    facturasPendientes: number;
    promedioVenta: number;
    totalAbonado: number;
    totalPendiente: number;
}

export interface UltimoMovimiento {
    id: number;
    tipo: 'ingreso' | 'gasto';
    descripcion: string;
    monto: number;
    fecha: string;
    categoria?: string;
    color?: string;
}

// ============ CONFIGURACIONES TYPES ============

export interface ConfiguracionesGenerales {
    controlStockActivo: boolean;
    controlEntregasActivo: boolean;
}

// ============ ENTREGAS TYPES ============
export interface MarcarEntregaDto {
    recogidoPor?: string;
    notasEntrega?: string;
    entregaParcial?: boolean;
}

export interface FacturaPendienteEntrega {
    idFactura: number;
    numeroFactura: string;
    nombreCliente: string;
    telefonoCliente?: string;
    fechaCreacion: string;
    fechaEntregaEstimada?: string;
    fechaEntregaReal?: string;
    total: number;
    montoAbonado?: number;
    montoPendiente?: number;
    estado: {
        idEstado: number;
        nombre: string;
    };
    totalItems: number;
    diasDesdeCreacion: number;
    recogidoPor?: string;
    notasEntrega?: string;
    idEstadoEntrega?: number;
}

// ============ REPORTES TYPES ============

export interface ReporteFinancieroCompleto {
    resumenFinanciero: ResumenFinancieroReporte;
    estadisticasGastos: EstadisticasGastosReporte;
    estadisticasFacturas: EstadisticasFacturasReporte;
    recomendaciones: Recomendacion[];
    fechaGeneracion: string;
}

export interface ResumenFinancieroReporte {
    totalIngresos: number;
    totalGastos: number;
    gananciaNeta: number;
    margenGanancia: number;
    fechaDesde: string;
    fechaHasta: string;
}

export interface EstadisticasGastosReporte {
    totalGastos: number;
    promedioGasto: number;
    totalRegistros: number;
    gastosPorCategoria: GastoPorCategoria[];
    gastosPorMes: GastoPorMes[];
}

export interface EstadisticasFacturasReporte {
    totalFacturas: number;
    totalVentas: number;
    totalAbonado: number;
    totalPendiente: number;
    facturasPagadas: number;
    facturasPendientes: number;
    promedioVenta: number;
}

export interface Recomendacion {
    tipo: 'warning' | 'success' | 'info';
    mensaje: string;
    icono?: string;
}
