import { axiosInstance, setBaseURL } from "../Shared/axiosInstance";

// ==================== TIPOS ====================

export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
}

export interface ProveedorBasic {
  id_proveedor: number;
  nombre: string;
  nit?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface ProductoBasic {
  id_producto: number;
  cum: string;
  descripcion: string;
  concentracion: string;
  presentacion: string;
  precio_unidad: number | string;
  precio_presentacion: number | string;
  iva: number | string;
  laboratorio?: {
    id_laboratorio: number;
    nombre: string;
  };
}

export interface DetalleOrden {
  id_detalle: number;
  id_orden_compra: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
  producto?: ProductoBasic;
  creado_en: string;
  actualizado_en: string;
}

export interface OrdenCompra {
  id_orden_compra: number;
  numero_orden: string;
  id_proveedor: number;
  id_creado_por: number;
  id_aprobado_por?: number | null;
  fecha_orden: string;
  fecha_entrega_estimada?: string | null;
  fecha_aprobacion?: string | null;
  estado: string; // "pendiente", "aprobada", "rechazada", "completada", "cancelada"
  subtotal: number | string;
  impuestos: number | string;
  total: number | string;
  notas?: string | null;
  motivo_rechazo?: string | null;
  proveedor?: ProveedorBasic;
  creado_por?: Usuario;
  aprobado_por?: Usuario | null;
  detalles?: DetalleOrden[];
  _count?: {
    detalles: number;
  };
  creado_en: string;
  actualizado_en: string;
}

export interface OrdenesResponse {
  ordenes: OrdenCompra[];
  paginaActual: number;
  totalPaginas: number;
  tamanoPagina: number;
  total: number;
}

export interface OrdenDetailResponse {
  orden: OrdenCompra;
}

export interface EstadisticasOrdenes {
  totalOrdenes: number;
  ordenesPendientes: number;
  ordenesAprobadas: number;
  ordenesRechazadas: number;
  ordenesCompletadas: number;
  montoTotal: number | string;
}

export interface EstadisticasResponse {
  estadisticas: EstadisticasOrdenes;
}

export interface OrdenesParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  id_proveedor?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface CrearOrdenData {
  id_proveedor: number;
  id_creado_por: number;
  fecha_entrega_estimada?: string;
  notas?: string;
  detalles: {
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export interface EditarOrdenData {
  fecha_entrega_estimada?: string;
  notas?: string;
  detalles?: {
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export interface AprobarOrdenData {
  id_usuario: number;
}

export interface RechazarOrdenData {
  id_usuario: number;
  motivo_rechazo: string;
}

// ==================== FUNCIONES DE ÓRDENES ====================

/**
 * Obtener todas las órdenes de compra con paginación y filtros
 */
export const fetchOrdenes = async (
  params: OrdenesParams = {}
): Promise<OrdenesResponse> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.get<OrdenesResponse>("/", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || undefined,
        estado: params.estado || undefined,
        id_proveedor: params.id_proveedor || undefined,
        fecha_desde: params.fecha_desde || undefined,
        fecha_hasta: params.fecha_hasta || undefined,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes de compra:", error);
    throw error;
  }
};

/**
 * Obtener una orden de compra específica por ID
 */
export const fetchOrden = async (
  id_orden_compra: number
): Promise<OrdenDetailResponse> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.get<OrdenDetailResponse>(
      `/${id_orden_compra}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener orden de compra:", error);
    throw error;
  }
};

/**
 * Crear una nueva orden de compra
 */
export const createOrden = async (
  data: CrearOrdenData
): Promise<{ msg: string; data: { orden: OrdenCompra } }> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.post("/", data);
    return response.data;
  } catch (error) {
    console.error("Error al crear orden de compra:", error);
    throw error;
  }
};

/**
 * Editar una orden de compra existente (solo si está pendiente)
 */
export const updateOrden = async (
  id_orden_compra: number,
  data: EditarOrdenData
): Promise<{ msg: string; data: { orden: OrdenCompra } }> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.put(`/${id_orden_compra}`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar orden de compra:", error);
    throw error;
  }
};

/**
 * Eliminar una orden de compra (solo si está pendiente)
 */
export const deleteOrden = async (
  id_orden_compra: number
): Promise<{ msg: string }> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.delete(`/${id_orden_compra}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar orden de compra:", error);
    throw error;
  }
};

/**
 * Aprobar una orden de compra
 */
export const aprobarOrden = async (
  id_orden_compra: number,
  data: AprobarOrdenData
): Promise<{ msg: string; data: { orden: OrdenCompra } }> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.put(
      `/${id_orden_compra}/aprobar`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error al aprobar orden de compra:", error);
    throw error;
  }
};

/**
 * Rechazar una orden de compra
 */
export const rechazarOrden = async (
  id_orden_compra: number,
  data: RechazarOrdenData
): Promise<{ msg: string; data: { orden: OrdenCompra } }> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.put(
      `/${id_orden_compra}/rechazar`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error al rechazar orden de compra:", error);
    throw error;
  }
};

/**
 * Completar una orden de compra (marcar como recibida)
 */
export const completarOrden = async (
  id_orden_compra: number
): Promise<{ msg: string; data: { orden: OrdenCompra } }> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.put(`/${id_orden_compra}/completar`);
    return response.data;
  } catch (error) {
    console.error("Error al completar orden de compra:", error);
    throw error;
  }
};

/**
 * Obtener estadísticas de órdenes de compra
 */
export const fetchEstadisticas = async (): Promise<EstadisticasResponse> => {
  setBaseURL("ordenes-compra");
  try {
    const response = await axiosInstance.get<EstadisticasResponse>(
      "/estadisticas"
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    throw error;
  }
};
