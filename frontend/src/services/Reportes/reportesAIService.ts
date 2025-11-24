/**
 * Servicio de IA para análisis de reportes y generación de insights
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface ReportData {
  periodo: string;
  ventas?: {
    total: number;
    promedioDiario: number;
    crecimiento?: number;
  };
  compras?: {
    total: number;
    proveedores: number;
    ordenesCompletadas: number;
  };
  inventario?: {
    valorTotal: number;
    productosStockBajo: number;
    rotacion: number;
  };
  entregas?: {
    total: number;
    completadas: number;
    tasaExito: number;
  };
}

export interface ReportAnalysisResult {
  resumen: string;
  indicadoresClave: Array<{
    nombre: string;
    valor: string | number;
    tendencia: 'positiva' | 'negativa' | 'neutral';
    interpretacion: string;
  }>;
  insights: string[];
  recomendaciones: string[];
  alertas?: string[];
  proyecciones?: string[];
}

/**
 * Analiza datos de reportes y genera insights ejecutivos
 */
export async function analyzeReport(
  data: ReportData
): Promise<ReportAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un analista de negocios experto en el sector farmacéutico y de salud. Analiza el siguiente reporte de gestión:

Período: ${data.periodo}

${data.ventas ? `
VENTAS:
- Total: $${data.ventas.total.toLocaleString('es-CO')}
- Promedio diario: $${data.ventas.promedioDiario.toLocaleString('es-CO')}
${data.ventas.crecimiento ? `- Crecimiento: ${data.ventas.crecimiento.toFixed(1)}%` : ''}
` : ''}

${data.compras ? `
COMPRAS:
- Total: $${data.compras.total.toLocaleString('es-CO')}
- Proveedores activos: ${data.compras.proveedores}
- Órdenes completadas: ${data.compras.ordenesCompletadas}
` : ''}

${data.inventario ? `
INVENTARIO:
- Valor total: $${data.inventario.valorTotal.toLocaleString('es-CO')}
- Productos con stock bajo: ${data.inventario.productosStockBajo}
- Rotación de inventario: ${data.inventario.rotacion.toFixed(2)}
` : ''}

${data.entregas ? `
ENTREGAS:
- Total: ${data.entregas.total}
- Completadas: ${data.entregas.completadas}
- Tasa de éxito: ${data.entregas.tasaExito.toFixed(1)}%
` : ''}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo del período",
  "indicadoresClave": [
    {
      "nombre": "nombre del KPI",
      "valor": "valor del indicador",
      "tendencia": "positiva | negativa | neutral",
      "interpretacion": "qué significa este valor"
    }
  ],
  "insights": ["insights importantes extraídos de los datos"],
  "recomendaciones": ["recomendaciones estratégicas basadas en el análisis"],
  "alertas": ["situaciones que requieren atención inmediata"],
  "proyecciones": ["proyecciones para los próximos períodos"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: ReportAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de reportes');
  }
}

/**
 * Genera resumen ejecutivo narrativo de un reporte
 */
export async function generateExecutiveSummary(
  data: ReportData,
  highlights: string[]
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como analista senior, genera un resumen ejecutivo del siguiente reporte para presentar a la dirección:

Período: ${data.periodo}

Datos clave:
${JSON.stringify(data, null, 2)}

Puntos destacados:
${highlights.map(h => `- ${h}`).join('\n')}

Genera un resumen ejecutivo profesional que incluya:
1. Situación general del período
2. Logros principales
3. Desafíos identificados
4. Recomendaciones estratégicas
5. Próximos pasos sugeridos

Responde en formato markdown, profesional y conciso (máximo 500 palabras).`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación del resumen ejecutivo');
  }
}
