/**
 * Servicio de IA para evaluación de domiciliarios
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface DriverPerformance {
  nombre: string;
  entregas_completadas: number;
  entregas_fallidas: number;
  tiempo_promedio_entrega: number;
  calificacion_promedio?: number;
  zonas_asignadas?: string[];
  incidentes?: number;
  disponibilidad?: number; // porcentaje
}

export interface DriverEvaluationResult {
  resumen: string;
  evaluaciones: Array<{
    domiciliario: string;
    puntuacionGlobal: number;
    fortalezas: string[];
    areasDeOportunidad: string[];
    recomendaciones: string[];
  }>;
  rankingGeneral: Array<{ nombre: string; posicion: number; puntuacion: number }>;
  accionesRecomendadas: string[];
}

/**
 * Evalúa el desempeño de domiciliarios y genera recomendaciones
 */
export async function evaluateDrivers(
  drivers: DriverPerformance[]
): Promise<DriverEvaluationResult> {
  try {
    const model = getModel();

    const prompt = `Eres un experto en gestión de talento y evaluación de desempeño en operaciones logísticas. Evalúa a los siguientes domiciliarios:

${drivers.map((d, idx) => `
${idx + 1}. ${d.nombre}
   - Entregas completadas: ${d.entregas_completadas}
   - Entregas fallidas: ${d.entregas_fallidas}
   - Tasa de éxito: ${((d.entregas_completadas / (d.entregas_completadas + d.entregas_fallidas)) * 100).toFixed(1)}%
   - Tiempo promedio: ${d.tiempo_promedio_entrega} minutos
   ${d.calificacion_promedio ? `- Calificación promedio: ${d.calificacion_promedio.toFixed(1)}/5.0` : ''}
   ${d.zonas_asignadas ? `- Zonas: ${d.zonas_asignadas.join(', ')}` : ''}
   ${d.incidentes ? `- Incidentes: ${d.incidentes}` : ''}
   ${d.disponibilidad ? `- Disponibilidad: ${d.disponibilidad}%` : ''}
`).join('\n')}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo de la evaluación del equipo",
  "evaluaciones": [
    {
      "domiciliario": "nombre",
      "puntuacionGlobal": número de 0-100,
      "fortalezas": ["lista de fortalezas"],
      "areasDeOportunidad": ["áreas a mejorar"],
      "recomendaciones": ["recomendaciones específicas"]
    }
  ],
  "rankingGeneral": [
    { "nombre": "nombre", "posicion": número, "puntuacion": número }
  ],
  "accionesRecomendadas": ["acciones para mejorar el equipo en general"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const evaluation: DriverEvaluationResult = safeJsonParse(text);

    return evaluation;
  } catch (error) {
    handleAIError(error, 'la evaluación de domiciliarios');
  }
}

/**
 * Genera plan de capacitación personalizado para un domiciliario
 */
export async function generateTrainingPlan(
  driver: DriverPerformance,
  weakAreas: string[]
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como experto en capacitación de personal logístico, genera un plan de mejora para el siguiente domiciliario:

Domiciliario: ${driver.nombre}

Desempeño actual:
- Entregas completadas: ${driver.entregas_completadas}
- Tasa de éxito: ${((driver.entregas_completadas / (driver.entregas_completadas + driver.entregas_fallidas)) * 100).toFixed(1)}%
- Tiempo promedio: ${driver.tiempo_promedio_entrega} minutos
${driver.calificacion_promedio ? `- Calificación: ${driver.calificacion_promedio.toFixed(1)}/5.0` : ''}

Áreas a mejorar:
${weakAreas.map(area => `- ${area}`).join('\n')}

Proporciona un plan que incluya:
1. Objetivos específicos y medibles (SMART)
2. Módulos de capacitación recomendados
3. Duración y cronograma sugerido
4. Métricas para evaluar mejora
5. Seguimiento y retroalimentación

Responde en formato markdown, estructurado y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación del plan de capacitación');
  }
}
