/**
 * Servicio de IA para seguimiento y análisis de entregas
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface TrackingData {
  numeroOrden: string;
  estado: string;
  ubicacionActual?: string;
  horaEstimadaEntrega?: string;
  eventos: Array<{
    fecha: string;
    descripcion: string;
    ubicacion?: string;
  }>;
  destinatario: string;
  productos: Array<{ nombre: string; cantidad: number }>;
}

export interface TrackingAnalysisResult {
  resumen: string;
  estadoGeneral: 'en_tiempo' | 'demorado' | 'en_riesgo' | 'completado';
  alertas: Array<{
    tipo: 'retraso' | 'ubicacion' | 'ruta' | 'clima' | 'otro';
    severidad: 'alta' | 'media' | 'baja';
    mensaje: string;
  }>;
  tiempoEstimadoRestante?: string;
  recomendaciones: string[];
  proximasAcciones?: string[];
}

/**
 * Analiza el estado de seguimiento y genera predicciones
 */
export async function analyzeTrackingStatus(
  tracking: TrackingData
): Promise<TrackingAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un especialista en logística y seguimiento de entregas. Analiza el siguiente estado de envío:

Orden: ${tracking.numeroOrden}
Estado actual: ${tracking.estado}
${tracking.ubicacionActual ? `Ubicación: ${tracking.ubicacionActual}` : ''}
${tracking.horaEstimadaEntrega ? `Hora estimada de entrega: ${tracking.horaEstimadaEntrega}` : ''}
Destinatario: ${tracking.destinatario}

Productos:
${tracking.productos.map(p => `- ${p.nombre} (x${p.cantidad})`).join('\n')}

Historial de eventos:
${tracking.eventos.map((e, idx) => `
${idx + 1}. ${e.fecha} - ${e.descripcion}
   ${e.ubicacion ? `Ubicación: ${e.ubicacion}` : ''}
`).join('\n')}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen del estado de la entrega",
  "estadoGeneral": "en_tiempo | demorado | en_riesgo | completado",
  "alertas": [
    {
      "tipo": "retraso | ubicacion | ruta | clima | otro",
      "severidad": "alta | media | baja",
      "mensaje": "descripción de la alerta"
    }
  ],
  "tiempoEstimadoRestante": "tiempo estimado (ej: '2 horas', '1 día')",
  "recomendaciones": ["acciones sugeridas para asegurar entrega exitosa"],
  "proximasAcciones": ["próximos pasos esperados en el proceso"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: TrackingAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de seguimiento');
  }
}

/**
 * Predice problemas potenciales en entregas basándose en patrones
 */
export async function predictDeliveryIssues(
  trackings: TrackingData[]
): Promise<string> {
  try {
    const model = getModel();

    const delayed = trackings.filter(t => t.estado.toLowerCase().includes('retraso'));
    const inTransit = trackings.filter(t => t.estado.toLowerCase().includes('tránsito'));

    const prompt = `Como analista de operaciones logísticas, identifica patrones y predice problemas potenciales:

Total de envíos activos: ${trackings.length}
En tránsito: ${inTransit.length}
Con retrasos: ${delayed.length}

${delayed.length > 0 ? `
Envíos con retrasos:
${delayed.slice(0, 10).map(t => `
- Orden ${t.numeroOrden}: ${t.destinatario}
  Estado: ${t.estado}
  ${t.ubicacionActual ? `Ubicación: ${t.ubicacionActual}` : ''}
  Último evento: ${t.eventos[t.eventos.length - 1]?.descripcion || 'N/A'}
`).join('\n')}
` : ''}

Proporciona:
1. Patrones identificados en los retrasos
2. Factores de riesgo comunes
3. Predicciones de problemas potenciales
4. Acciones preventivas recomendadas
5. Priorización de intervenciones

Responde en formato markdown, conciso y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la predicción de problemas de entrega');
  }
}

/**
 * Genera notificaciones proactivas para el cliente
 */
export async function generateProactiveNotification(
  tracking: TrackingData,
  issueType: 'retraso' | 'cambio_ruta' | 'requiere_accion'
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Genera un mensaje de notificación profesional y empático para el cliente sobre su entrega:

Tipo de notificación: ${issueType}
Orden: ${tracking.numeroOrden}
Destinatario: ${tracking.destinatario}
Estado actual: ${tracking.estado}
${tracking.horaEstimadaEntrega ? `Hora estimada: ${tracking.horaEstimadaEntrega}` : ''}

Último evento: ${tracking.eventos[tracking.eventos.length - 1]?.descripcion || 'N/A'}

Genera un mensaje que:
1. Sea claro y directo
2. Muestre empatía por cualquier inconveniente
3. Proporcione información útil y específica
4. Ofrezca opciones o alternativas si aplica
5. Incluya datos de contacto para consultas

Responde SOLO con el texto del mensaje, en formato amigable y profesional (máximo 150 palabras).`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación de notificación proactiva');
  }
}
