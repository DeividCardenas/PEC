/**
 * Servicio para Reportes de Compras (RF005)
 */

import { axiosInstance } from "../Shared/axiosInstance";

// Interfaces
export interface FiltrosReporte {
  fecha_desde?: string;
  fecha_hasta?: string;
  id_proveedor?: number;
  id_laboratorio?: number;
  estado?: string;
  agrupar_por?: "proveedor" | "laboratorio" | "mes" | "estado";
  page?: number;
  limit?: number;
}

export interface EstadisticasReporte {
  totalOrdenes: number;
  montoTotal: number;
  subtotalTotal: number;
  impuestosTotal: number;
  promedioOrden: number;
  distribucionEstados: {
    estado: string;
    cantidad: number;
    monto: number;
  }[];
}

export interface DatosAgrupados {
  proveedor?: any;
  laboratorio?: any;
  periodo?: string;
  mes?: number;
  anio?: number;
  estado?: string;
  cantidadOrdenes?: number;
  cantidadProductos?: number;
  cantidadUnidades?: number;
  montoTotal: number;
  ordenes?: any[];
}

export interface ReporteComprasResponse {
  ordenes: any[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
  estadisticas: EstadisticasReporte;
  datosAgrupados: DatosAgrupados[] | null;
  filtrosAplicados: FiltrosReporte;
}

export interface TopProveedorData {
  proveedor: {
    id_proveedor: number;
    nombre: string;
    nit?: string;
  };
  cantidadOrdenes: number;
  montoTotal: number;
}

export interface TendenciaData {
  periodo: string;
  mes: number;
  anio: number;
  cantidadOrdenes: number;
  montoTotal: number;
  ordenesCompletadas: number;
  ordenesRechazadas: number;
  ordenesPendientes: number;
}

export interface ResumenEjecutivoResponse {
  periodo: {
    desde: string;
    hasta: string;
  };
  estadisticasGenerales: EstadisticasReporte;
  topProveedores: DatosAgrupados[];
  topLaboratorios: DatosAgrupados[];
  distribucionEstados: {
    estado: string;
    cantidadOrdenes: number;
    montoTotal: number;
    subtotal: number;
    impuestos: number;
  }[];
}

/**
 * Obtener reporte de compras con filtros
 */
export const fetchReporteCompras = async (
  filtros: FiltrosReporte = {}
): Promise<ReporteComprasResponse> => {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await axiosInstance.get(`/reportes/compras?${params.toString()}`);
  return response.data.data;
};

/**
 * Obtener top proveedores
 */
export const fetchTopProveedores = async (
  fecha_desde?: string,
  fecha_hasta?: string,
  limite: number = 10
): Promise<{ topProveedores: TopProveedorData[] }> => {
  const params = new URLSearchParams();
  if (fecha_desde) params.append("fecha_desde", fecha_desde);
  if (fecha_hasta) params.append("fecha_hasta", fecha_hasta);
  params.append("limite", limite.toString());

  const response = await axiosInstance.get(`/reportes/top-proveedores?${params.toString()}`);
  return response.data.data;
};

/**
 * Obtener tendencias de compras
 */
export const fetchTendencias = async (
  fecha_desde?: string,
  fecha_hasta?: string,
  id_proveedor?: number
): Promise<{ tendencias: TendenciaData[] }> => {
  const params = new URLSearchParams();
  if (fecha_desde) params.append("fecha_desde", fecha_desde);
  if (fecha_hasta) params.append("fecha_hasta", fecha_hasta);
  if (id_proveedor) params.append("id_proveedor", id_proveedor.toString());

  const response = await axiosInstance.get(`/reportes/tendencias?${params.toString()}`);
  return response.data.data;
};

/**
 * Exportar reporte a CSV
 */
export const exportarReporteCSV = async (filtros: FiltrosReporte = {}): Promise<Blob> => {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && key !== "page" && key !== "limit") {
      params.append(key, value.toString());
    }
  });

  const response = await axiosInstance.get(`/reportes/exportar-csv?${params.toString()}`, {
    responseType: "blob",
  });

  return response.data;
};

/**
 * Obtener resumen ejecutivo
 */
export const fetchResumenEjecutivo = async (
  fecha_desde?: string,
  fecha_hasta?: string
): Promise<ResumenEjecutivoResponse> => {
  const params = new URLSearchParams();
  if (fecha_desde) params.append("fecha_desde", fecha_desde);
  if (fecha_hasta) params.append("fecha_hasta", fecha_hasta);

  const response = await axiosInstance.get(`/reportes/resumen-ejecutivo?${params.toString()}`);
  return response.data.data;
};
