/**
 * Tipos compartidos para servicios de IA
 */

export interface PriceComparisonData {
  producto: string;
  empresa1: {
    nombre: string;
    precio: number;
    precioUnidad?: number;
    precioEmpaque?: number;
    tarifario?: string;
  };
  empresa2: {
    nombre: string;
    precio: number;
    precioUnidad?: number;
    precioEmpaque?: number;
    tarifario?: string;
  };
}

export interface AIAnalysisResult {
  resumen: string;
  ahorroPotencial: {
    monto: number;
    porcentaje: number;
    mejorOpcion: string;
  };
  recomendaciones: string[];
  analisisDetallado: string;
  patrones?: string[];
}

export interface ProductoParaReorden {
  descripcion: string;
  cum: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  precio_unidad: number;
  laboratorio: string;
}

export interface ReordenSugerencia {
  resumen: string;
  prioridades: {
    criticos: Array<{
      producto: string;
      razon: string;
      cantidadSugerida: number;
    }>;
    medios: Array<{
      producto: string;
      razon: string;
      cantidadSugerida: number;
    }>;
    bajos: Array<{
      producto: string;
      razon: string;
      cantidadSugerida: number;
    }>;
  };
  recomendaciones: string[];
  presupuestoEstimado: number;
}

export interface TariffProduct {
  descripcion: string;
  cum?: string;
  precio_unidad: number;
  precio_presentacion: number;
  concentracion?: string;
  regulacion?: string;
}

export interface TariffAnalysisResult {
  resumen: string;
  estadisticas: {
    precioPromedio: number;
    precioMinimo: number;
    precioMaximo: number;
    totalProductos: number;
  };
  insights: string[];
  recomendaciones: string[];
  productosDestacados: {
    masCaros: string[];
    masEconomicos: string[];
    mejorRelacionCalidadPrecio?: string[];
  };
}

export interface PurchaseProduct {
  nombre: string;
  precioActual: number;
  precioAlternativo?: number;
  empresaActual: string;
  empresaAlternativa?: string;
}
