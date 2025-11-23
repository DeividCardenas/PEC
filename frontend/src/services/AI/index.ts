/**
 * Punto de entrada principal para servicios de IA
 * Re-exporta todas las funcionalidades desde módulos especializados
 */

// Tipos
export type {
  PriceComparisonData,
  AIAnalysisResult,
  ProductoParaReorden,
  ReordenSugerencia,
  TariffProduct,
  TariffAnalysisResult,
  PurchaseProduct,
} from './types';

// Cliente
export { genAI, getModel, isAIAvailable } from './client';

// Análisis de precios
export { analyzePriceComparison } from './priceAnalysis';

// Optimización de compras
export { generatePurchaseOptimization } from './purchaseOptimization';

// Análisis de tarifarios
export { analyzeTariff } from './tariffAnalysis';
