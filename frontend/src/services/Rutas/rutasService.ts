/**
 * Servicio para Optimización de Rutas (RF009)
 */

import api from "../api";
import type { Domiciliario } from "../Domiciliarios/domiciliariosService";
import type { Entrega } from "../Entregas/entregasService";

// ============================================================================
// INTERFACES
// ============================================================================

export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
}

export interface Ruta {
  id_ruta: number;
  numero_ruta: string;
  id_domiciliario?: number | null;
  id_usuario_creador: number;
  fecha_creacion_ruta: string;
  fecha_programada?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  estado: string;
  distancia_total_km?: string | null;
  tiempo_estimado_min?: number | null;
  observaciones?: string | null;
  activo: boolean;
  domiciliario?: Domiciliario | null;
  usuario_creador?: Usuario;
  entregas?: Entrega[];
  _count?: {
    entregas: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CrearRutaData {
  id_domiciliario?: number;
  fecha_programada?: string;
  entregas_ids: number[];
  observaciones?: string;
}

export interface AsignarDomiciliarioData {
  id_domiciliario: number;
}

export interface CambiarEstadoRutaData {
  nuevo_estado: string;
}

export interface CancelarRutaData {
  motivo: string;
}

export interface RutasParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  id_domiciliario?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface RutasResponse {
  rutas: Ruta[];
  paginacion: {
    paginaActual: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
}

export interface RutaResponse {
  ruta: Ruta;
}

export interface EstadisticasRutas {
  totalRutas: number;
  rutasPendientes: number;
  rutasEnCurso: number;
  rutasCompletadas: number;
  rutasCanceladas: number;
  distribucionEstado: {
    estado: string;
    cantidad: number;
  }[];
}

export interface EstadisticasResponse {
  estadisticas: EstadisticasRutas;
}

// ============================================================================
// FUNCIONES DEL SERVICIO
// ============================================================================

/**
 * Obtener lista de rutas con paginación y filtros
 */
export const fetchRutas = async (params: RutasParams = {}): Promise<RutasResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.estado) queryParams.append("estado", params.estado);
  if (params.id_domiciliario) queryParams.append("id_domiciliario", params.id_domiciliario.toString());
  if (params.fecha_desde) queryParams.append("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) queryParams.append("fecha_hasta", params.fecha_hasta);

  const response = await api.get(`/rutas?${queryParams.toString()}`);
  return response.data.data;
};

/**
 * Obtener una ruta por ID
 */
export const fetchRuta = async (id: number): Promise<RutaResponse> => {
  const response = await api.get(`/rutas/${id}`);
  return response.data.data;
};

/**
 * Crear una ruta optimizada
 */
export const createRuta = async (data: CrearRutaData): Promise<RutaResponse> => {
  const response = await api.post("/rutas", data);
  return response.data.data;
};

/**
 * Asignar domiciliario a una ruta
 */
export const asignarDomiciliario = async (
  id: number,
  data: AsignarDomiciliarioData
): Promise<RutaResponse> => {
  const response = await api.put(`/rutas/${id}/asignar-domiciliario`, data);
  return response.data.data;
};

/**
 * Cambiar estado de una ruta
 */
export const cambiarEstadoRuta = async (
  id: number,
  data: CambiarEstadoRutaData
): Promise<RutaResponse> => {
  const response = await api.put(`/rutas/${id}/estado`, data);
  return response.data.data;
};

/**
 * Cancelar una ruta
 */
export const cancelarRuta = async (id: number, data: CancelarRutaData): Promise<RutaResponse> => {
  const response = await api.put(`/rutas/${id}/cancelar`, data);
  return response.data.data;
};

/**
 * Obtener estadísticas de rutas
 */
export const fetchEstadisticas = async (): Promise<EstadisticasResponse> => {
  const response = await api.get("/rutas/estadisticas");
  return response.data.data;
};

/**
 * Estados válidos para rutas
 */
export const ESTADOS_RUTA = ["Pendiente", "En Curso", "Completada", "Cancelada"] as const;

export type EstadoRuta = typeof ESTADOS_RUTA[number];

/**
 * Helper: Obtener color de badge según estado
 */
export const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800";
    case "En Curso":
      return "bg-blue-100 text-blue-800";
    case "Completada":
      return "bg-green-100 text-green-800";
    case "Cancelada":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Helper: Formatear fecha
 */
export const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return "No definida";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Helper: Formatear fecha y hora
 */
export const formatearFechaHora = (fecha: string | null | undefined): string => {
  if (!fecha) return "No definida";
  return new Date(fecha).toLocaleString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
