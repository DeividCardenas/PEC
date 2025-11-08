/**
 * Servicio de Prueba de Entrega Digital (RF010)
 */

import { axiosInstance } from "../Shared/axiosInstance";
import { Entrega } from "../Entregas/entregasService";

// ============================================================================
// INTERFACES
// ============================================================================

export interface PruebaEntrega {
  id_entrega: number;
  numero_pedido: string;
  estado: string;
  firma_entrega?: string | null;
  foto_entrega?: string | null;
  nombre_receptor?: string | null;
  identificacion_receptor?: string | null;
  observaciones_entrega?: string | null;
  fecha_confirmacion_entrega?: string | null;
  fecha_entrega_real?: string | null;
  paciente?: {
    nombres: string;
    apellidos: string;
    numero_identificacion: string;
  };
}

export interface RegistrarPruebaEntregaData {
  nombre_receptor: string;
  identificacion_receptor: string;
  observaciones_entrega?: string;
  firma?: File;
  foto?: File;
}

export interface ConfirmarSinPruebaData {
  motivo: string;
}

export interface EstadisticasPruebaEntrega {
  total_entregadas: number;
  con_firma: number;
  con_foto: number;
  con_ambas: number;
  sin_prueba: number;
  porcentaje_con_prueba: string;
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Registrar prueba de entrega con firma y/o foto
 */
export const registrarPruebaEntrega = async (
  idEntrega: number,
  data: RegistrarPruebaEntregaData
): Promise<Entrega> => {
  const formData = new FormData();

  formData.append("nombre_receptor", data.nombre_receptor);
  formData.append("identificacion_receptor", data.identificacion_receptor);

  if (data.observaciones_entrega) {
    formData.append("observaciones_entrega", data.observaciones_entrega);
  }

  if (data.firma) {
    formData.append("firma", data.firma);
  }

  if (data.foto) {
    formData.append("foto", data.foto);
  }

  const response = await axiosInstance.post(`/prueba-entrega/${idEntrega}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data.entrega;
};

/**
 * Obtener prueba de entrega
 */
export const fetchPruebaEntrega = async (
  idEntrega: number
): Promise<{ entrega: PruebaEntrega; tiene_prueba: boolean }> => {
  const response = await axiosInstance.get(`/prueba-entrega/${idEntrega}`);
  return response.data.data;
};

/**
 * Confirmar entrega sin prueba digital
 */
export const confirmarEntregaSinPrueba = async (
  idEntrega: number,
  data: ConfirmarSinPruebaData
): Promise<Entrega> => {
  const response = await axiosInstance.post(
    `/prueba-entrega/${idEntrega}/confirmar-sin-prueba`,
    data
  );
  return response.data.data.entrega;
};

/**
 * Obtener URL de la firma
 */
export const getFirmaUrl = (idEntrega: number): string => {
  const baseURL = axiosInstance.defaults.baseURL || "";
  return `${baseURL}/prueba-entrega/${idEntrega}/firma`;
};

/**
 * Obtener URL de la foto
 */
export const getFotoUrl = (idEntrega: number): string => {
  const baseURL = axiosInstance.defaults.baseURL || "";
  return `${baseURL}/prueba-entrega/${idEntrega}/foto`;
};

/**
 * Obtener estadísticas de pruebas de entrega
 */
export const fetchEstadisticas = async (): Promise<{
  estadisticas: EstadisticasPruebaEntrega;
}> => {
  const response = await axiosInstance.get(`/prueba-entrega/estadisticas`);
  return response.data.data;
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validar tamaño de archivo (máximo 5MB)
 */
export const validarTamanoArchivo = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSize;
};

/**
 * Validar tipo de archivo (solo imágenes)
 */
export const validarTipoArchivo = (file: File): boolean => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  return allowedTypes.includes(file.type);
};

/**
 * Convertir imagen a base64 (para firma digital desde canvas)
 */
export const imagenABase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Convertir base64 a File
 */
export const base64AFile = (base64: string, filename: string): File => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

/**
 * Validar canvas de firma (verificar que no esté vacío)
 */
export const validarCanvasNoVacio = (canvas: HTMLCanvasElement): boolean => {
  const context = canvas.getContext("2d");
  if (!context) return false;

  const pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );

  return !pixelBuffer.every((color) => color === 0);
};

/**
 * Limpiar canvas de firma
 */
export const limpiarCanvas = (canvas: HTMLCanvasElement): void => {
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
};

/**
 * Formatear porcentaje
 */
export const formatearPorcentaje = (valor: string | number): string => {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  return `${numero.toFixed(1)}%`;
};

/**
 * Obtener color según porcentaje de pruebas
 */
export const getColorPorcentaje = (porcentaje: number): string => {
  if (porcentaje >= 90) return "text-green-600";
  if (porcentaje >= 70) return "text-blue-600";
  if (porcentaje >= 50) return "text-yellow-600";
  return "text-red-600";
};

/**
 * Verificar si la entrega puede registrar prueba
 */
export const puedeRegistrarPrueba = (estado: string): boolean => {
  return estado === "Despachado";
};

/**
 * Verificar si la entrega tiene prueba completa
 */
export const tienePruebaCompleta = (prueba: PruebaEntrega): boolean => {
  return !!(prueba.firma_entrega && prueba.foto_entrega);
};

/**
 * Verificar si la entrega tiene al menos una prueba
 */
export const tieneAlgunaPrueba = (prueba: PruebaEntrega): boolean => {
  return !!(prueba.firma_entrega || prueba.foto_entrega);
};

/**
 * Obtener mensaje de estado de prueba
 */
export const getMensajeEstadoPrueba = (prueba: PruebaEntrega): string => {
  if (tienePruebaCompleta(prueba)) {
    return "Prueba completa (firma y foto)";
  }
  if (prueba.firma_entrega) {
    return "Solo firma registrada";
  }
  if (prueba.foto_entrega) {
    return "Solo foto registrada";
  }
  return "Sin prueba de entrega";
};

/**
 * Obtener badge de estado de prueba
 */
export const getBadgeEstadoPrueba = (prueba: PruebaEntrega): {
  texto: string;
  clase: string;
} => {
  if (tienePruebaCompleta(prueba)) {
    return {
      texto: "Completa",
      clase: "bg-green-100 text-green-800",
    };
  }
  if (tieneAlgunaPrueba(prueba)) {
    return {
      texto: "Parcial",
      clase: "bg-yellow-100 text-yellow-800",
    };
  }
  return {
    texto: "Sin prueba",
    clase: "bg-red-100 text-red-800",
  };
};

// ============================================================================
// CONSTANTES
// ============================================================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 200;
