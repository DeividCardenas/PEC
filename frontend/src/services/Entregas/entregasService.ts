/**
 * Servicio para Gestión de Entregas (RF008)
 */

import axios from "axios";

// Crear instancia específica para entregas
const entregasAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/entregas`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir token de autenticación
entregasAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// INTERFACES
// ============================================================================

export interface Paciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
  numero_identificacion: string;
  telefono_principal: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  barrio?: string | null;
}

export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
}

export interface Producto {
  id_producto: number;
  descripcion: string;
  cum: string;
  presentacion: string;
  precio_unidad: number;
  precio_presentacion: number;
  stock_actual: number;
}

export interface DetalleEntrega {
  id_detalle_entrega: number;
  id_entrega: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  observaciones?: string | null;
  producto: Producto;
  createdAt: string;
  updatedAt: string;
}

export interface Entrega {
  id_entrega: number;
  numero_pedido: string;
  id_paciente: number;
  fecha_pedido: string;
  fecha_entrega_programada?: string | null;
  fecha_entrega_real?: string | null;
  estado: string;
  direccion_entrega: string;
  ciudad_entrega: string;
  departamento_entrega: string;
  barrio_entrega?: string | null;
  observaciones_direccion?: string | null;
  observaciones?: string | null;
  observaciones_despacho?: string | null;
  id_usuario_creador: number;
  id_usuario_despachador?: number | null;
  total: string;
  activo: boolean;
  paciente?: Paciente;
  usuario_creador?: Usuario;
  usuario_despachador?: Usuario | null;
  detalles?: DetalleEntrega[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductoEntrega {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string;
}

export interface CrearEntregaData {
  id_paciente: number;
  fecha_entrega_programada?: string;
  direccion_entrega: string;
  ciudad_entrega: string;
  departamento_entrega: string;
  barrio_entrega?: string;
  observaciones_direccion?: string;
  observaciones?: string;
  productos: ProductoEntrega[];
}

export interface ActualizarEntregaData {
  fecha_entrega_programada?: string;
  direccion_entrega?: string;
  ciudad_entrega?: string;
  departamento_entrega?: string;
  barrio_entrega?: string;
  observaciones_direccion?: string;
  observaciones?: string;
}

export interface CambiarEstadoData {
  nuevo_estado: string;
  observaciones_despacho?: string;
}

export interface CancelarEntregaData {
  motivo: string;
}

export interface EntregasParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  id_paciente?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface EntregasResponse {
  entregas: Entrega[];
  paginacion: {
    paginaActual: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
}

export interface EntregaResponse {
  entrega: Entrega;
}

export interface EstadisticasEntregas {
  totalEntregas: number;
  entregasPendientes: number;
  entregasEnPreparacion: number;
  entregasDespachadas: number;
  entregasEntregadas: number;
  entregasCanceladas: number;
  distribucionEstado: {
    estado: string;
    cantidad: number;
  }[];
  entregasPorMes: {
    mes: string;
    cantidad: number;
    valorTotal: number;
  }[];
  valorTotal: number;
}

export interface EstadisticasResponse {
  estadisticas: EstadisticasEntregas;
}

// ============================================================================
// FUNCIONES DEL SERVICIO
// ============================================================================

/**
 * Obtener lista de entregas con paginación y filtros
 */
export const fetchEntregas = async (params: EntregasParams = {}): Promise<EntregasResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.estado) queryParams.append("estado", params.estado);
  if (params.id_paciente) queryParams.append("id_paciente", params.id_paciente.toString());
  if (params.fecha_desde) queryParams.append("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) queryParams.append("fecha_hasta", params.fecha_hasta);

  const response = await entregasAxios.get(`?${queryParams.toString()}`);
  return response.data;
};

/**
 * Obtener una entrega por ID
 */
export const fetchEntrega = async (id: number): Promise<EntregaResponse> => {
  const response = await entregasAxios.get(`/${id}`);
  return response.data;
};

/**
 * Crear una nueva entrega
 */
export const createEntrega = async (data: CrearEntregaData): Promise<EntregaResponse> => {
  const response = await entregasAxios.post("", data);
  return response.data;
};

/**
 * Actualizar una entrega
 */
export const updateEntrega = async (
  id: number,
  data: ActualizarEntregaData
): Promise<EntregaResponse> => {
  const response = await entregasAxios.put(`/${id}`, data);
  return response.data;
};

/**
 * Cambiar estado de una entrega
 */
export const cambiarEstadoEntrega = async (
  id: number,
  data: CambiarEstadoData
): Promise<EntregaResponse> => {
  const response = await entregasAxios.put(`/${id}/estado`, data);
  return response.data;
};

/**
 * Cancelar una entrega
 */
export const cancelarEntrega = async (
  id: number,
  data: CancelarEntregaData
): Promise<EntregaResponse> => {
  const response = await entregasAxios.put(`/${id}/cancelar`, data);
  return response.data;
};

/**
 * Obtener estadísticas de entregas
 */
export const fetchEstadisticas = async (): Promise<EstadisticasResponse> => {
  const response = await entregasAxios.get("/estadisticas");
  return response.data;
};

/**
 * Obtener entregas de un paciente específico
 */
export const fetchEntregasPorPaciente = async (
  id_paciente: number,
  params: { page?: number; limit?: number } = {}
): Promise<EntregasResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  const response = await entregasAxios.get(`/paciente/${id_paciente}?${queryParams.toString()}`);
  return response.data;
};

/**
 * Estados válidos para entregas
 */
export const ESTADOS_ENTREGA = [
  "Pendiente de Despacho",
  "En Preparación",
  "Despachado",
  "Entregado",
  "Cancelado",
] as const;

export type EstadoEntrega = typeof ESTADOS_ENTREGA[number];

/**
 * Helper: Obtener color de badge según estado
 */
export const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case "Pendiente de Despacho":
      return "bg-yellow-100 text-yellow-800";
    case "En Preparación":
      return "bg-blue-100 text-blue-800";
    case "Despachado":
      return "bg-purple-100 text-purple-800";
    case "Entregado":
      return "bg-green-100 text-green-800";
    case "Cancelado":
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

/**
 * Helper: Formatear moneda
 */
export const formatearMoneda = (valor: string | number): string => {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero);
};
