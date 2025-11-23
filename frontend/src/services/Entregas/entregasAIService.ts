/**
 * Servicio de IA para análisis de entregas y desempeño
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface DeliveryRecord {
  id: number;
  fecha: string;
  domiciliario: string;
  destino: string;
  estado: 'completada' | 'pendiente' | 'fallida' | 'en_transito';
  tiempo_entrega?: number;
  productos: Array<{ nombre: string; cantidad: number }>;
  observaciones?: string;
}

export interface DeliveryAnalysisResult {
  resumen: string;
  metricas: {
    tasaExito: number;
    tiempoPromedioEntrega: number;
    entregasCompletadas: number;
    entregasFallidas: number;
  };
  desempenoDomiciliarios: Array<{
    nombre: string;
    entregas: number;
    tasaExito: number;
    tiempoPromedio: number;
    puntuacion: number;
  }>;
  recomendaciones: string[];
  problemasIdentificados?: string[];
}

/**
 * Analiza el desempeño de entregas y domiciliarios
 */
export async function analyzeDeliveryPerformance(
  deliveries: DeliveryRecord[]
): Promise<DeliveryAnalysisResult> {
  try {
    const model = getModel();

    // Agrupar por domiciliario
    const byDriver = deliveries.reduce((acc, d) => {
      if (!acc[d.domiciliario]) acc[d.domiciliario] = [];
      acc[d.domiciliario].push(d);
      return acc;
    }, {} as Record<string, DeliveryRecord[]>);

    const completed = deliveries.filter(d => d.estado === 'completada');
    const failed = deliveries.filter(d => d.estado === 'fallida');

    const prompt = `Eres un experto en análisis de operaciones logísticas. Analiza el siguiente desempeño de entregas:

Total de entregas: ${deliveries.length}
Completadas: ${completed.length} (${((completed.length / deliveries.length) * 100).toFixed(1)}%)
Fallidas: ${failed.length} (${((failed.length / deliveries.length) * 100).toFixed(1)}%)

Desempeño por domiciliario:
${Object.entries(byDriver).map(([driver, records]) => {
  const driverCompleted = records.filter(r => r.estado === 'completada');
  const avgTime = driverCompleted.reduce((sum, r) => sum + (r.tiempo_entrega || 0), 0) / driverCompleted.length;
  return `
- ${driver}
  • Entregas: ${records.length}
  • Completadas: ${driverCompleted.length} (${((driverCompleted.length / records.length) * 100).toFixed(1)}%)
  • Tiempo promedio: ${avgTime.toFixed(0)} minutos
`;
}).join('\n')}

${failed.length > 0 ? `
Entregas fallidas (muestra):
${failed.slice(0, 5).map(d => `
- ${d.destino} (${d.fecha})
  • Domiciliario: ${d.domiciliario}
  • Observaciones: ${d.observaciones || 'N/A'}
`).join('\n')}
` : ''}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo del desempeño de entregas",
  "metricas": {
    "tasaExito": porcentaje de entregas completadas,
    "tiempoPromedioEntrega": minutos promedio,
    "entregasCompletadas": ${completed.length},
    "entregasFallidas": ${failed.length}
  },
  "desempenoDomiciliarios": [
    {
      "nombre": "nombre del domiciliario",
      "entregas": número total,
      "tasaExito": porcentaje,
      "tiempoPromedio": minutos,
      "puntuacion": de 0-100
    }
  ],
  "recomendaciones": ["recomendaciones para mejorar el servicio"],
  "problemasIdentificados": ["problemas recurrentes detectados"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: DeliveryAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de entregas');
  }
}

/**
 * Genera sugerencias para mejorar tiempos de entrega
 */
export async function suggestDeliveryImprovements(
  slowDeliveries: Array<{ destino: string; tiempoEntrega: number; razon?: string }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como experto en mejora de procesos logísticos, analiza estas entregas lentas y sugiere mejoras:

Entregas con tiempos elevados:
${slowDeliveries.map((d, idx) => `
${idx + 1}. ${d.destino}
   - Tiempo: ${d.tiempoEntrega} minutos
   ${d.razon ? `- Razón: ${d.razon}` : ''}
`).join('\n')}

Proporciona:
1. Causas raíz identificadas
2. Acciones correctivas específicas
3. Impacto esperado de las mejoras
4. Plan de implementación

Responde en formato markdown, conciso y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'las sugerencias de mejora de entregas');
  }
}
