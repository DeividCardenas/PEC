/**
 * Servicio de Seguimiento en Tiempo Real (RF010)
 */

import { axiosInstance } from "../Shared/axiosInstance";
import { Domiciliario } from "../Domiciliarios/domiciliariosService";
import { Entrega } from "../Entregas/entregasService";
import { Ruta } from "../Rutas/rutasService";

// ============================================================================
// INTERFACES
// ============================================================================

export interface UbicacionDomiciliario {
  latitud: number;
  longitud: number;
  ultima_actualizacion: string;
}

export interface DomiciliarioConUbicacion extends Domiciliario {
  latitud_actual?: string | null;
  longitud_actual?: string | null;
  ultima_actualizacion_ubicacion?: string | null;
  _count?: {
    rutas: number;
  };
}

export interface RutaConSeguimiento extends Ruta {
  progreso: number;
  totalEntregas: number;
  entregasCompletadas: number;
  entregasPendientes: number;
  siguienteEntrega?: Entrega;
}

export interface ActualizarUbicacionData {
  latitud: number;
  longitud: number;
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Actualizar ubicación de un domiciliario
 */
export const actualizarUbicacion = async (
  idDomiciliario: number,
  data: ActualizarUbicacionData
): Promise<UbicacionDomiciliario> => {
  const response = await axiosInstance.put(
    `/seguimiento/domiciliario/${idDomiciliario}/ubicacion`,
    data
  );
  return response.data.data;
};

/**
 * Obtener ubicación de un domiciliario específico
 */
export const fetchUbicacionDomiciliario = async (
  idDomiciliario: number
): Promise<DomiciliarioConUbicacion> => {
  const response = await axiosInstance.get(
    `/seguimiento/domiciliario/${idDomiciliario}/ubicacion`
  );
  return response.data.data.domiciliario;
};

/**
 * Obtener ubicaciones de todos los domiciliarios activos
 */
export const fetchUbicacionesDomiciliarios = async (
  activosSolo?: boolean
): Promise<{ domiciliarios: DomiciliarioConUbicacion[]; total: number }> => {
  const params = new URLSearchParams();
  if (activosSolo !== undefined) {
    params.append("activos_solo", activosSolo.toString());
  }

  const response = await axiosInstance.get(`/seguimiento/domiciliarios?${params.toString()}`);
  return response.data.data;
};

/**
 * Obtener información de seguimiento de una ruta
 */
export const fetchSeguimientoRuta = async (
  idRuta: number
): Promise<{ ruta: RutaConSeguimiento }> => {
  const response = await axiosInstance.get(`/seguimiento/ruta/${idRuta}`);
  return response.data.data;
};

/**
 * Obtener todas las rutas activas con ubicaciones
 */
export const fetchRutasActivas = async (): Promise<{
  rutas: RutaConSeguimiento[];
  total: number;
}> => {
  const response = await axiosInstance.get(`/seguimiento/rutas-activas`);
  return response.data.data;
};

/**
 * Simular movimiento de un domiciliario (desarrollo/testing)
 */
export const simularMovimiento = async (
  idDomiciliario: number
): Promise<UbicacionDomiciliario> => {
  const response = await axiosInstance.post(
    `/seguimiento/domiciliario/${idDomiciliario}/simular-movimiento`
  );
  return response.data.data;
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcular distancia entre dos puntos (fórmula de Haversine)
 * Retorna distancia en kilómetros
 */
export const calcularDistancia = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return distancia;
};

/**
 * Formatear tiempo desde última actualización
 */
export const formatearTiempoDesdeActualizacion = (fecha: string | null): string => {
  if (!fecha) return "Sin actualización";

  const ahora = new Date();
  const actualizacion = new Date(fecha);
  const diferencia = ahora.getTime() - actualizacion.getTime();

  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);

  if (segundos < 60) return `Hace ${segundos}s`;
  if (minutos < 60) return `Hace ${minutos}m`;
  if (horas < 24) return `Hace ${horas}h`;
  return actualizacion.toLocaleDateString("es-CO");
};

/**
 * Obtener color según antigüedad de la ubicación
 */
export const getColorActualizacion = (fecha: string | null): string => {
  if (!fecha) return "text-dark-text-secondary";

  const ahora = new Date();
  const actualizacion = new Date(fecha);
  const minutos = Math.floor((ahora.getTime() - actualizacion.getTime()) / 60000);

  if (minutos < 5) return "text-green-400"; // Muy reciente
  if (minutos < 15) return "text-blue-400"; // Reciente
  if (minutos < 60) return "text-yellow-400"; // Algo antiguo
  return "text-red-400"; // Muy antiguo
};

/**
 * Verificar si la ubicación está disponible
 */
export const tieneUbicacion = (
  domiciliario: DomiciliarioConUbicacion
): boolean => {
  return (
    domiciliario.latitud_actual !== null &&
    domiciliario.latitud_actual !== undefined &&
    domiciliario.longitud_actual !== null &&
    domiciliario.longitud_actual !== undefined
  );
};

/**
 * Obtener coordenadas como números
 */
export const obtenerCoordenadas = (
  domiciliario: DomiciliarioConUbicacion
): { lat: number; lng: number } | null => {
  if (!tieneUbicacion(domiciliario)) return null;

  return {
    lat: parseFloat(domiciliario.latitud_actual!),
    lng: parseFloat(domiciliario.longitud_actual!),
  };
};

// ============================================================================
// CONSTANTES
// ============================================================================

export const INTERVALO_ACTUALIZACION_MAPA = 30000; // 30 segundos
export const LIMITE_ANTIGUEDAD_UBICACION = 300000; // 5 minutos
export const ZOOM_MAPA_DEFECTO = 13;
export const CENTRO_MAPA_DEFECTO = { lat: 4.60971, lng: -74.08175 }; // Bogotá
