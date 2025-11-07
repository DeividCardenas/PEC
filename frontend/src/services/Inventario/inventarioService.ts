import { axiosInstance } from "../Shared/axiosInstance";

// ==================== TIPOS ====================

export interface ProductoInventario {
  id_producto: number;
  cum: string;
  descripcion: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo?: number | null;
  unidad_medida: string;
  laboratorio?: {
    id_laboratorio: number;
    nombre: string;
  };
  deficit?: number; // Calculado: stock_minimo - stock_actual
  porcentaje_stock?: number; // Calculado: (stock_actual / stock_minimo) * 100
}

export interface Usuario {
  id_usuario: number;
  username: string;
  email?: string;
}

export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  tipo_movimiento: string; // "entrada", "salida", "ajuste", "devolucion"
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  id_orden_compra?: number | null;
  id_usuario?: number | null;
  motivo?: string | null;
  numero_referencia?: string | null;
  producto?: {
    id_producto: number;
    descripcion: string;
    cum: string;
    unidad_medida: string;
  };
  usuario?: Usuario | null;
  orden_compra?: {
    id_orden_compra: number;
    numero_orden: string;
  } | null;
  creado_en: string;
}

export interface AlertasStockResponse {
  data: {
    productos: ProductoInventario[];
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

export interface MovimientosResponse {
  data: {
    movimientos: MovimientoInventario[];
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

export interface MovimientosProductoResponse {
  data: {
    producto: ProductoInventario;
    movimientos: MovimientoInventario[];
    total_movimientos: number;
  };
}

export interface EstadisticasInventario {
  total_productos: number;
  productos_con_stock: number;
  productos_sin_stock: number;
  productos_stock_bajo: number;
  unidades_totales_stock: number;
  movimientos_hoy: number;
  productos_mas_movidos: {
    id_producto: number;
    descripcion: string;
    stock_actual: number;
    unidad_medida: string;
    total_movimientos: number;
  }[];
}

export interface EstadisticasResponse {
  data: EstadisticasInventario;
}

export interface AjustarStockRequest {
  id_producto: number;
  cantidad: number;
  motivo: string;
  tipo_ajuste?: "ajuste" | "salida" | "devolucion";
}

export interface ActualizarStockMinimoRequest {
  stock_minimo: number;
  stock_maximo?: number;
}

// ==================== FUNCIONES DE SERVICIO ====================

/**
 * Obtener alertas de productos con stock bajo
 * GET /inventario/alertas
 */
export const obtenerAlertasStockBajo = async (
  pagina: number = 1,
  limite: number = 20,
  ordenar_por: string = "stock_actual",
  orden: "asc" | "desc" = "asc"
): Promise<AlertasStockResponse> => {
  const response = await axiosInstance.get("/inventario/alertas", {
    params: { pagina, limite, ordenar_por, orden },
  });
  return response.data;
};

/**
 * Obtener movimientos de inventario
 * GET /inventario/movimientos
 */
export const obtenerMovimientosInventario = async (
  pagina: number = 1,
  limite: number = 50,
  tipo_movimiento?: string,
  id_producto?: number,
  fecha_inicio?: string,
  fecha_fin?: string
): Promise<MovimientosResponse> => {
  const response = await axiosInstance.get("/inventario/movimientos", {
    params: {
      pagina,
      limite,
      tipo_movimiento,
      id_producto,
      fecha_inicio,
      fecha_fin,
    },
  });
  return response.data;
};

/**
 * Obtener movimientos de un producto específico
 * GET /inventario/productos/:id_producto/movimientos
 */
export const obtenerMovimientosProducto = async (
  id_producto: number,
  limite: number = 20
): Promise<MovimientosProductoResponse> => {
  const response = await axiosInstance.get(
    `/inventario/productos/${id_producto}/movimientos`,
    {
      params: { limite },
    }
  );
  return response.data;
};

/**
 * Ajustar stock de un producto manualmente
 * POST /inventario/ajustar
 */
export const ajustarStock = async (
  datos: AjustarStockRequest
): Promise<any> => {
  const response = await axiosInstance.post("/inventario/ajustar", datos);
  return response.data;
};

/**
 * Actualizar stock mínimo de un producto
 * PUT /inventario/productos/:id_producto/stock-minimo
 */
export const actualizarStockMinimo = async (
  id_producto: number,
  datos: ActualizarStockMinimoRequest
): Promise<any> => {
  const response = await axiosInstance.put(
    `/inventario/productos/${id_producto}/stock-minimo`,
    datos
  );
  return response.data;
};

/**
 * Obtener estadísticas de inventario
 * GET /inventario/estadisticas
 */
export const obtenerEstadisticasInventario =
  async (): Promise<EstadisticasResponse> => {
    const response = await axiosInstance.get("/inventario/estadisticas");
    return response.data;
  };
