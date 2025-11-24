/**
 * Servicio de IA para análisis de inventario
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface InventoryItem {
  descripcion: string;
  cum: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  precio_unidad: number;
  laboratorio: string;
}

export interface InventoryAnalysisResult {
  resumen: string;
  alertas: {
    criticos: Array<{
      producto: string;
      razon: string;
      cantidadSugerida: number;
      prioridad: 'alta' | 'media' | 'baja';
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
  tendencias?: string[];
}

/**
 * Analiza el estado del inventario y genera recomendaciones de reorden
 */
export async function analyzeInventoryStatus(
  items: InventoryItem[]
): Promise<InventoryAnalysisResult> {
  try {
    const model = getModel();

    // Filtrar productos con stock bajo o crítico
    const lowStock = items.filter(item => item.stock_actual <= item.stock_minimo);
    const critical = lowStock.filter(item => item.stock_actual === 0 || item.stock_actual < item.stock_minimo * 0.3);

    const prompt = `Eres un experto en gestión de inventarios farmacéuticos. Analiza el siguiente estado de inventario:

Total de productos: ${items.length}
Productos con stock bajo: ${lowStock.length}
Productos críticos: ${critical.length}

Productos con stock bajo o crítico:
${lowStock.slice(0, 30).map((item, idx) => `
${idx + 1}. ${item.descripcion}
   - CUM: ${item.cum}
   - Laboratorio: ${item.laboratorio}
   - Stock actual: ${item.stock_actual} ${item.unidad_medida}
   - Stock mínimo: ${item.stock_minimo} ${item.unidad_medida}
   - Precio unitario: $${item.precio_unidad.toLocaleString('es-CO')}
   - Nivel: ${item.stock_actual === 0 ? 'AGOTADO' : item.stock_actual < item.stock_minimo * 0.3 ? 'CRÍTICO' : 'BAJO'}
`).join('\n')}

Por favor, proporciona un análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo del estado del inventario",
  "alertas": {
    "criticos": [{"producto": "nombre", "razon": "explicación", "cantidadSugerida": número, "prioridad": "alta"}],
    "medios": [{"producto": "nombre", "razon": "explicación", "cantidadSugerida": número}],
    "bajos": [{"producto": "nombre", "razon": "explicación", "cantidadSugerida": número}]
  },
  "recomendaciones": ["recomendaciones estratégicas para gestión de inventario"],
  "presupuestoEstimado": monto estimado para reposición prioritaria,
  "tendencias": ["patrones identificados en el inventario"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: InventoryAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de inventario');
  }
}

/**
 * Genera predicciones de demanda basadas en histórico
 */
export async function predictDemand(
  productName: string,
  historicalData: Array<{ fecha: string; cantidad: number }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Eres un analista de demanda en el sector farmacéutico. Analiza el histórico de consumo del siguiente producto:

Producto: ${productName}

Histórico de consumo:
${historicalData.map(d => `- ${d.fecha}: ${d.cantidad} unidades`).join('\n')}

Genera una predicción de demanda para los próximos 3 meses, incluyendo:
1. Tendencia general
2. Estacionalidad detectada (si aplica)
3. Cantidad sugerida de reorden
4. Factores de riesgo

Responde en formato markdown, conciso y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la predicción de demanda');
  }
}
