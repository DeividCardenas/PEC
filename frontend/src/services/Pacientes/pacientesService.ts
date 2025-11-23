/**
 * Servicio para Gestión de Pacientes (RF007)
 */

import { axiosInstance, setBaseURL } from "../Shared/axiosInstance";

// Interfaces
export interface Paciente {
  id_paciente: number;
  tipo_identificacion: string;
  numero_identificacion: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  telefono_principal: string;
  telefono_secundario?: string | null;
  email?: string | null;
  direccion: string;
  ciudad: string;
  departamento: string;
  codigo_postal?: string | null;
  barrio?: string | null;
  eps?: string | null;
  tipo_afiliacion?: string | null;
  observaciones?: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearPacienteData {
  tipo_identificacion: string;
  numero_identificacion: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono_principal: string;
  telefono_secundario?: string;
  email?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  codigo_postal?: string;
  barrio?: string;
  eps?: string;
  tipo_afiliacion?: string;
  observaciones?: string;
}

export interface ActualizarPacienteData {
  tipo_identificacion?: string;
  numero_identificacion?: string;
  nombres?: string;
  apellidos?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono_principal?: string;
  telefono_secundario?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  codigo_postal?: string;
  barrio?: string;
  eps?: string;
  tipo_afiliacion?: string;
  observaciones?: string;
  activo?: boolean;
}

export interface PacientesParams {
  page?: number;
  limit?: number;
  search?: string;
  activo?: string;
}

export interface PacientesResponse {
  pacientes: Paciente[];
  paginacion: {
    paginaActual: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
}

export interface PacienteResponse {
  paciente: Paciente;
}

export interface EstadisticasPacientes {
  totalPacientes: number;
  pacientesActivos: number;
  pacientesInactivos: number;
  distribucionGenero: {
    genero: string;
    cantidad: number;
  }[];
  topEPS: {
    eps: string;
    cantidad: number;
  }[];
}

export interface EstadisticasResponse {
  estadisticas: EstadisticasPacientes;
}

/**
 * Obtener lista de pacientes con paginación
 */
export const fetchPacientes = async (params: PacientesParams = {}): Promise<PacientesResponse> => {
  setBaseURL("pacientes");
  
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.activo !== undefined && params.activo !== "") {
    queryParams.append("activo", params.activo);
  }

  const response = await axiosInstance.get(`?${queryParams.toString()}`);
  return response.data;
};

/**
 * Obtener un paciente por ID
 */
export const fetchPaciente = async (id: number): Promise<PacienteResponse> => {
  setBaseURL("pacientes");
  const response = await axiosInstance.get(`/${id}`);
  return response.data;
};

/**
 * Crear un nuevo paciente
 */
export const createPaciente = async (data: CrearPacienteData): Promise<PacienteResponse> => {
  setBaseURL("pacientes");
  const response = await axiosInstance.post("", data);
  return response.data;
};

/**
 * Actualizar un paciente
 */
export const updatePaciente = async (
  id: number,
  data: ActualizarPacienteData
): Promise<PacienteResponse> => {
  setBaseURL("pacientes");
  const response = await axiosInstance.put(`/${id}`, data);
  return response.data;
};

/**
 * Eliminar un paciente (soft delete)
 */
export const deletePaciente = async (id: number): Promise<void> => {
  setBaseURL("pacientes");
  await axiosInstance.delete(`/${id}`);
};

/**
 * Reactivar un paciente
 */
export const reactivarPaciente = async (id: number): Promise<PacienteResponse> => {
  setBaseURL("pacientes");
  const response = await axiosInstance.put(`/${id}/reactivar`);
  return response.data;
};

/**
 * Obtener estadísticas de pacientes
 */
export const fetchEstadisticas = async (): Promise<EstadisticasResponse> => {
  setBaseURL("pacientes");
  const response = await axiosInstance.get("/estadisticas");
  return response.data;
};

/**
 * Buscar paciente por número de identificación
 */
export const buscarPorIdentificacion = async (
  numero_identificacion: string
): Promise<PacienteResponse> => {
  setBaseURL("pacientes");
  const response = await axiosInstance.get(`/buscar/${numero_identificacion}`);
  return response.data;
};
