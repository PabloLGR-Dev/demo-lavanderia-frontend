const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7298/api';

export const API_ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE_URL}/auth/login`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    ME: `${API_BASE_URL}/auth/me`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    VALIDATE_RESET_TOKEN: `${API_BASE_URL}/auth/validate-reset-token`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,

    // Users
    USERS: `${API_BASE_URL}/users`,
    USER_BY_ID: (id: number) => `${API_BASE_URL}/users/${id}`,
    USER_ROL: (id: number) => `${API_BASE_URL}/users/${id}/rol`,

    // Roles
    ROLES: `${API_BASE_URL}/roles`,
    ROL_BY_ID: (id: number) => `${API_BASE_URL}/roles/${id}`,

    // Estados
    ESTADOS: `${API_BASE_URL}/estados`,
    ESTADO_BY_ID: (id: number) => `${API_BASE_URL}/estados/${id}`,

    // Clientes
    CLIENTES: `${API_BASE_URL}/clientes`,
    CLIENTE_BY_ID: (id: number) => `${API_BASE_URL}/clientes/${id}`,
    CLIENTE_INFO_FACTURA: (id: number) => `${API_BASE_URL}/clientes/${id}/info-factura`,

    // Facturas - ENDPOINTS OPTIMIZADOS
    FACTURAS: `${API_BASE_URL}/facturas`,
    FACTURA_BY_ID: (id: number) => `${API_BASE_URL}/facturas/${id}`,
    FACTURA_PAGAR: (id: number) => `${API_BASE_URL}/facturas/${id}/pagar`,

    // Nuevos endpoints optimizados para Facturas
    FACTURAS_RESUMEN: `${API_BASE_URL}/facturas/resumen`,
    FACTURAS_DETALLES_COMPLETOS: (id: number) => `${API_BASE_URL}/facturas/${id}/detalles-completos`,
    FACTURAS_VALIDAR_ITEMS: `${API_BASE_URL}/facturas/validar-items`,
    FACTURAS_CAMBIAR_ESTADO: (id: number) => `${API_BASE_URL}/facturas/${id}/estado`,
    FACTURAS_PROXIMAS_ENTREGA: `${API_BASE_URL}/facturas/proximas-entrega`,
    FACTURAS_PENDIENTES_PAGO: `${API_BASE_URL}/facturas/pendientes-pago`,
    FACTURAS_ESTADISTICAS: `${API_BASE_URL}/facturas/estadisticas`,

    // Categorías
    CATEGORIAS: `${API_BASE_URL}/Categorias`,
    CATEGORIA_BY_ID: (id: number) => `${API_BASE_URL}/Categorias/${id}`,

    // Productos
    PRODUCTOS: `${API_BASE_URL}/productos`,
    PRODUCTO_BY_ID: (id: number) => `${API_BASE_URL}/productos/${id}`,

    // Nuevos endpoints optimizados para Productos
    PRODUCTOS_BUSQUEDA_UNIFICADA: `${API_BASE_URL}/productos/busqueda-unificada`,
    PRODUCTOS_PAGINADOS: `${API_BASE_URL}/productos/paginados`,
    PRODUCTOS_OBTENER_MULTIPLE: `${API_BASE_URL}/productos/obtener-multiple`,
    PRODUCTOS_COMBINACIONES: `${API_BASE_URL}/productos/combinaciones`,
    PRODUCTOS_BUSQUEDA: `${API_BASE_URL}/productos/productos`,
    PRODUCTOS_BAJO_STOCK: `${API_BASE_URL}/productos/bajo-stock`,

    // Servicios
    SERVICIOS: `${API_BASE_URL}/servicios`,
    SERVICIOS_SIMPLES: `${API_BASE_URL}/servicios/simples`,
    SERVICIO_BY_ID: (id: number) => `${API_BASE_URL}/servicios/${id}`,

    // Prendas
    PRENDAS: `${API_BASE_URL}/prendas`,
    PRENDA_BY_ID: (id: number) => `${API_BASE_URL}/prendas/${id}`,

    // Prendas Servicios
    PRENDAS_SERVICIOS: `${API_BASE_URL}/prendasservicios`,
    PRENDA_SERVICIO_BY_ID: (id: number) => `${API_BASE_URL}/prendasservicios/${id}`,
    SERVICIOS_BY_PRENDA: (idPrenda: number) => `${API_BASE_URL}/prendasservicios/prenda/${idPrenda}`,

    // Pagos
    PAGOS: `${API_BASE_URL}/pagos`,
    PAGO_BY_ID: (id: number) => `${API_BASE_URL}/pagos/${id}`,

    // Órdenes
    ORDENES: `${API_BASE_URL}/Ordenes`,
    ORDEN_BY_ID: (id: number) => `${API_BASE_URL}/Ordenes/${id}`,
    ORDEN_ESTADO: (id: number, estadoId: number) => `${API_BASE_URL}/Ordenes/${id}/estado/${estadoId}`,

    // Reportes
    REPORTES: `${API_BASE_URL}/reportes`,
    REPORTE_DIARIO: `${API_BASE_URL}/reportes/diario`,
    REPORTE_RANGO: `${API_BASE_URL}/reportes/rango`,

    // Categorías de Gastos
    CATEGORIAS_GASTOS: `${API_BASE_URL}/categoriasgastos`,
    CATEGORIA_GASTO_BY_ID: (id: number) => `${API_BASE_URL}/categoriasgastos/${id}`,
    CATEGORIAS_GASTOS_ACTIVAS: `${API_BASE_URL}/categoriasgastos/activas`,
    CATEGORIAS_GASTOS_RESUMEN: `${API_BASE_URL}/categoriasgastos/resumen`,
    CATEGORIA_GASTO_TOGGLE_ESTADO: (id: number) => `${API_BASE_URL}/categoriasgastos/${id}/toggle-estado`,

    // Gastos
    GASTOS: `${API_BASE_URL}/gastos`,
    GASTO_BY_ID: (id: number) => `${API_BASE_URL}/gastos/${id}`,
    GASTOS_RESUMEN: `${API_BASE_URL}/gastos/resumen`,
    GASTOS_ESTADISTICAS: `${API_BASE_URL}/gastos/estadisticas`,
    GASTOS_RESUMEN_FINANCIERO: `${API_BASE_URL}/gastos/resumen-financiero`,

    // Dashboard
    DASHBOARD_RESUMEN: `${API_BASE_URL}/dashboard/resumen`,
    DASHBOARD_RESUMEN_FINANCIERO: `${API_BASE_URL}/dashboard/resumen-financiero`,
    DASHBOARD_ESTADISTICAS_FACTURAS: `${API_BASE_URL}/dashboard/estadisticas-facturas`,
    DASHBOARD_ULTIMOS_MOVIMIENTOS: `${API_BASE_URL}/dashboard/ultimos-movimientos`,

    // Reportes
    REPORTES_FINANCIERO_COMPLETO: `${API_BASE_URL}/reportes/financiero-completo`,
    REPORTES_RESUMEN_FINANCIERO: `${API_BASE_URL}/reportes/resumen-financiero`,
    REPORTES_ESTADISTICAS_GASTOS: `${API_BASE_URL}/reportes/estadisticas-gastos`,
    REPORTES_ESTADISTICAS_FACTURAS: `${API_BASE_URL}/reportes/estadisticas-facturas`,

    // Configuraciones
    CONFIGURACIONES: `${API_BASE_URL}/configuraciones`,
    CONFIGURACIONES_GENERALES: `${API_BASE_URL}/configuraciones/generales`,
    CONFIGURACION_BY_KEY: (clave: string) => `${API_BASE_URL}/configuraciones/${clave}`,
    TOGGLE_CONTROL_STOCK: `${API_BASE_URL}/configuraciones/toggle-control-stock`,
    TOGGLE_CONTROL_ENTREGAS: `${API_BASE_URL}/configuraciones/toggle-control-entregas`,

    // Entregas
    FACTURAS_ENTREGAS_RESUMEN: `${API_BASE_URL}/facturas/entregas-resumen`,
    FACTURAS_CONTADORES_ENTREGAS: `${API_BASE_URL}/facturas/contadores-entregas`,
    FACTURAS_PENDIENTES_ENTREGA: `${API_BASE_URL}/facturas/pendientes-entrega`,
    FACTURA_MARCAR_ENTREGA: (id: number) => `${API_BASE_URL}/facturas/${id}/marcar-entrega`,
    FACTURA_ACTUALIZAR_ESTADO_ENTREGA: (id: number) => `${API_BASE_URL}/facturas/${id}/estado-entrega`,
} as const;

export default API_BASE_URL;