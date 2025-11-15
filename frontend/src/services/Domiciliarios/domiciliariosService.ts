/**
 * Servicio para Gestión de Domiciliarios (RF009)
 */

import axios from "axios";

// Crear instancia dedicada para domiciliarios
const domiciliariosAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/domiciliarios`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
domiciliariosAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// INTERFACES
// ============================================================================

export interface Domiciliario {
  id_domiciliario: number;
  nombres: string;
  apellidos: string;
  numero_identificacion: string;
  telefono: string;
  email?: string | null;
  tipo_vehiculo?: string | null;
  placa_vehiculo?: string | null;
  activo: boolean;
  disponible: boolean;
  observaciones?: string | null;
  latitud_actual?: string | null;
  longitud_actual?: string | null;
  ultima_actualizacion_ubicacion?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rutas: number;
  };
}

export interface CrearDomiciliarioData {
  nombres: string;
  apellidos: string;
  numero_identificacion: string;
  telefono: string;
  email?: string;
  tipo_vehiculo?: string;
  placa_vehiculo?: string;
  observaciones?: string;
}

export interface ActualizarDomiciliarioData {
  nombres?: string;
  apellidos?: string;
  numero_identificacion?: string;
  telefono?: string;
  email?: string;
  tipo_vehiculo?: string;
  placa_vehiculo?: string;
  disponible?: boolean;
  activo?: boolean;
  observaciones?: string;
}

export interface DomiciliariosParams {
  page?: number;
  limit?: number;
  search?: string;
  activo?: string;
  disponible?: string;
}

export interface DomiciliariosResponse {
  domiciliarios: Domiciliario[];
  paginacion: {
    paginaActual: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
}

export interface DomiciliarioResponse {
  domiciliario: Domiciliario;
}

export interface EstadisticasDomiciliarios {
  totalDomiciliarios: number;
  domiciliariosActivos: number;
  domiciliariosDisponibles: number;
  domiciliariosOcupados: number;
  distribucionVehiculo: {
    tipoVehiculo: string;
    cantidad: number;
  }[];
}

export interface EstadisticasResponse {
  estadisticas: EstadisticasDomiciliarios;
}

// ============================================================================
// FUNCIONES DEL SERVICIO
// ============================================================================

/**
 * Obtener lista de domiciliarios con paginación y filtros
 */
export const fetchDomiciliarios = async (params: DomiciliariosParams = {}): Promise<DomiciliariosResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.activo !== undefined && params.activo !== "") {
    queryParams.append("activo", params.activo);
  }
  if (params.disponible !== undefined && params.disponible !== "") {
    queryParams.append("disponible", params.disponible);
  }

  const response = await domiciliariosAxios.get(`?${queryParams.toString()}`);
  return response.data;
};

/**
 * Obtener un domiciliario por ID
 */
export const fetchDomiciliario = async (id: number): Promise<DomiciliarioResponse> => {
  const response = await domiciliariosAxios.get(`/${id}`);
  return response.data;
};

/**
 * Crear un nuevo domiciliario
 */
export const createDomiciliario = async (data: CrearDomiciliarioData): Promise<DomiciliarioResponse> => {
  const response = await domiciliariosAxios.post("", data);
  return response.data;
};

/**
 * Actualizar un domiciliario
 */
export const updateDomiciliario = async (
  id: number,
  data: ActualizarDomiciliarioData
): Promise<DomiciliarioResponse> => {
  const response = await domiciliariosAxios.put(`/${id}`, data);
  return response.data;
};

/**
 * Eliminar un domiciliario (soft delete)
 */
export const deleteDomiciliario = async (id: number): Promise<void> => {
  await domiciliariosAxios.delete(`/${id}`);
};

/**
 * Reactivar un domiciliario
 */
export const reactivarDomiciliario = async (id: number): Promise<DomiciliarioResponse> => {
  const response = await domiciliariosAxios.put(`/${id}/reactivar`);
  return response.data;
};

/**
 * Cambiar disponibilidad de un domiciliario
 */
export const cambiarDisponibilidad = async (
  id: number,
  disponible: boolean
): Promise<DomiciliarioResponse> => {
  const response = await domiciliariosAxios.put(`/${id}/disponibilidad`, { disponible });
  return response.data;
};

/**
 * Obtener estadísticas de domiciliarios
 */
export const fetchEstadisticas = async (): Promise<EstadisticasResponse> => {
  const response = await domiciliariosAxios.get("/estadisticas");
  return response.data;
};

/**
 * Tipos de vehículo válidos
 */
export const TIPOS_VEHICULO = ["Moto", "Bicicleta", "Auto", "A pie"] as const;

export type TipoVehiculo = typeof TIPOS_VEHICULO[number];
