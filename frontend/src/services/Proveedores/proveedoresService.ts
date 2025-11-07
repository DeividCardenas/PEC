import { axiosInstance, setBaseURL } from "../Shared/axiosInstance";

// ==================== TIPOS ====================

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  laboratorio?: string | null;
  tipo?: string | null;
  titular?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  nit?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  activo: boolean;
  notas?: string | null;
  creado_en: string;
  actualizado_en: string;
  _count?: {
    transacciones: number;
  };
}

export interface Transaccion {
  id_transaccion: number;
  id_proveedor: number;
  tipo: string; // "compra", "devolucion", "pago"
  concepto: string;
  monto: number | string;
  cantidad?: number | null;
  numero_factura?: string | null;
  fecha_emision: string;
  fecha_vencimiento?: string | null;
  estado: string; // "pendiente", "completada", "cancelada"
  notas?: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ProveedoresResponse {
  proveedores: Proveedor[];
  paginaActual: number;
  totalPaginas: number;
  tamanoPagina: number;
  total: number;
}

export interface ProveedorDetailResponse {
  proveedor: Proveedor & {
    transacciones: Transaccion[];
  };
  estadisticas: {
    totalTransacciones: number;
    montoTotal: number | string;
  };
}

export interface TransaccionesResponse {
  transacciones: Transaccion[];
  paginaActual: number;
  totalPaginas: number;
  tamanoPagina: number;
  total: number;
  totales: {
    total: number;
    montoTotal: number | string;
  };
}

export interface ProveedoresParams {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean | string;
}

export interface TransaccionesParams {
  page?: number;
  limit?: number;
  tipo?: string;
  estado?: string;
}

export interface CrearProveedorData {
  nombre: string;
  laboratorio?: string;
  tipo?: string;
  titular?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  nit?: string;
  ciudad?: string;
  pais?: string;
  notas?: string;
}

export interface EditarProveedorData extends Partial<CrearProveedorData> {
  activo?: boolean;
}

export interface CrearTransaccionData {
  tipo: string;
  concepto: string;
  monto: number;
  cantidad?: number;
  numero_factura?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  estado?: string;
  notas?: string;
}

export interface EditarTransaccionData extends Partial<CrearTransaccionData> {}

// ==================== FUNCIONES DE PROVEEDORES ====================

/**
 * Obtener todos los proveedores con paginación y búsqueda
 */
export const fetchProveedores = async (
  params: ProveedoresParams = {}
): Promise<ProveedoresResponse> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.get<ProveedoresResponse>("/", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || undefined,
        activo: params.activo !== undefined ? params.activo : undefined,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    throw error;
  }
};

/**
 * Obtener un proveedor específico por ID
 */
export const fetchProveedor = async (
  id_proveedor: number
): Promise<ProveedorDetailResponse> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.get<ProveedorDetailResponse>(
      `/${id_proveedor}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener proveedor:", error);
    throw error;
  }
};

/**
 * Crear un nuevo proveedor
 */
export const createProveedor = async (
  data: CrearProveedorData
): Promise<{ msg: string; data: { proveedor: Proveedor } }> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.post("/", data);
    return response.data;
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    throw error;
  }
};

/**
 * Editar un proveedor existente
 */
export const updateProveedor = async (
  id_proveedor: number,
  data: EditarProveedorData
): Promise<{ msg: string; data: { proveedor: Proveedor } }> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.put(`/${id_proveedor}`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    throw error;
  }
};

/**
 * Eliminar un proveedor
 */
export const deleteProveedor = async (
  id_proveedor: number
): Promise<{ msg: string }> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.delete(`/${id_proveedor}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    throw error;
  }
};

// ==================== FUNCIONES DE TRANSACCIONES ====================

/**
 * Obtener historial de transacciones de un proveedor
 */
export const fetchTransacciones = async (
  id_proveedor: number,
  params: TransaccionesParams = {}
): Promise<TransaccionesResponse> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.get<TransaccionesResponse>(
      `/${id_proveedor}/transacciones`,
      {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          tipo: params.tipo || undefined,
          estado: params.estado || undefined,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    throw error;
  }
};

/**
 * Crear una nueva transacción para un proveedor
 */
export const createTransaccion = async (
  id_proveedor: number,
  data: CrearTransaccionData
): Promise<{ msg: string; data: { transaccion: Transaccion } }> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.post(
      `/${id_proveedor}/transacciones`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error al crear transacción:", error);
    throw error;
  }
};

/**
 * Editar una transacción existente
 */
export const updateTransaccion = async (
  id_transaccion: number,
  data: EditarTransaccionData
): Promise<{ msg: string; data: { transaccion: Transaccion } }> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.put(
      `/transacciones/${id_transaccion}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error al actualizar transacción:", error);
    throw error;
  }
};

/**
 * Eliminar una transacción
 */
export const deleteTransaccion = async (
  id_transaccion: number
): Promise<{ msg: string }> => {
  setBaseURL("proveedores");
  try {
    const response = await axiosInstance.delete(
      `/transacciones/${id_transaccion}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar transacción:", error);
    throw error;
  }
};
