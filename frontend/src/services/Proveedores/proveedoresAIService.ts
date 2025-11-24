/**
 * Servicio de IA para evaluación de proveedores
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface ProviderData {
  nombre: string;
  tipo?: string;
  laboratorio?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ordenes_completadas?: number;
  ordenes_totales?: number;
  monto_total_compras?: number;
  tiempo_promedio_entrega?: number;
  calificacion_promedio?: number;
}

export interface ProviderAnalysisResult {
  resumen: string;
  ranking: Array<{
    proveedor: string;
    puntuacion: number;
    fortalezas: string[];
    debilidades: string[];
  }>;
  recomendaciones: string[];
  alertas?: string[];
  mejoresOpciones: {
    confiabilidad: string;
    precio: string;
    tiempoEntrega: string;
  };
}

/**
 * Analiza y compara múltiples proveedores
 */
export async function analyzeProviders(
  providers: ProviderData[]
): Promise<ProviderAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un experto en gestión de proveedores en el sector farmacéutico. Analiza y compara los siguientes proveedores:

${providers.map((p, idx) => `
${idx + 1}. ${p.nombre}
   - Tipo: ${p.tipo || 'N/A'}
   - Laboratorio: ${p.laboratorio || 'N/A'}
   ${p.ordenes_completadas ? `- Órdenes completadas: ${p.ordenes_completadas} de ${p.ordenes_totales} (${((p.ordenes_completadas / (p.ordenes_totales || 1)) * 100).toFixed(1)}%)` : ''}
   ${p.monto_total_compras ? `- Monto total de compras: $${p.monto_total_compras.toLocaleString('es-CO')}` : ''}
   ${p.tiempo_promedio_entrega ? `- Tiempo promedio de entrega: ${p.tiempo_promedio_entrega} días` : ''}
   ${p.calificacion_promedio ? `- Calificación promedio: ${p.calificacion_promedio.toFixed(1)}/5.0` : ''}
`).join('\n')}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo de la evaluación de proveedores",
  "ranking": [
    {
      "proveedor": "nombre",
      "puntuacion": número de 0-100,
      "fortalezas": ["lista de fortalezas"],
      "debilidades": ["lista de debilidades"]
    }
  ],
  "recomendaciones": ["recomendaciones estratégicas para gestión de proveedores"],
  "alertas": ["alertas importantes sobre riesgos"],
  "mejoresOpciones": {
    "confiabilidad": "proveedor más confiable",
    "precio": "proveedor con mejores precios",
    "tiempoEntrega": "proveedor más rápido"
  }
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: ProviderAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de proveedores');
  }
}

/**
 * Genera recomendaciones para negociación con un proveedor específico
 */
export async function generateNegotiationStrategy(
  provider: ProviderData,
  historicalPrices?: Array<{ producto: string; precio_actual: number; precio_mercado?: number }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como experto en negociación de compras farmacéuticas, genera una estrategia de negociación para el siguiente proveedor:

Proveedor: ${provider.nombre}
${provider.tipo ? `Tipo: ${provider.tipo}` : ''}
${provider.monto_total_compras ? `Historial de compras: $${provider.monto_total_compras.toLocaleString('es-CO')}` : ''}
${provider.calificacion_promedio ? `Calificación: ${provider.calificacion_promedio}/5.0` : ''}

${historicalPrices ? `
Comparación de precios (muestra):
${historicalPrices.slice(0, 10).map(p => `
- ${p.producto}: $${p.precio_actual.toLocaleString('es-CO')}${p.precio_mercado ? ` (mercado: $${p.precio_mercado.toLocaleString('es-CO')})` : ''}
`).join('\n')}
` : ''}

Proporciona:
1. Puntos de apalancamiento para la negociación
2. Rangos de descuento realistas por volumen
3. Términos de pago favorables a proponer
4. Alternativas y plan B
5. Argumentos clave y contraofertas posibles

Responde en formato markdown, conciso y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación de estrategia de negociación');
  }
}
