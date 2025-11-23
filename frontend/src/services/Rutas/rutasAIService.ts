/**
 * Servicio de IA para optimización de rutas de entrega
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface DeliveryPoint {
  nombre: string;
  direccion: string;
  coordenadas?: { lat: number; lng: number };
  prioridad?: 'alta' | 'media' | 'baja';
  ventanaHoraria?: { inicio: string; fin: string };
  productos?: Array<{ nombre: string; cantidad: number }>;
}

export interface RouteOptimizationResult {
  resumen: string;
  rutaOptima: Array<{
    orden: number;
    destino: string;
    horaEstimada: string;
    distanciaAcumulada?: number;
  }>;
  metricas: {
    distanciaTotal: number;
    tiempoEstimado: number;
    costosEstimados: number;
  };
  recomendaciones: string[];
  alertas?: string[];
}

/**
 * Optimiza rutas de entrega usando IA
 */
export async function optimizeDeliveryRoute(
  points: DeliveryPoint[],
  startLocation: string
): Promise<RouteOptimizationResult> {
  try {
    const model = getModel();

    const prompt = `Eres un experto en logística y optimización de rutas de entrega farmacéutica. Optimiza la siguiente ruta:

Punto de partida: ${startLocation}

Destinos a visitar:
${points.map((p, idx) => `
${idx + 1}. ${p.nombre}
   - Dirección: ${p.direccion}
   ${p.prioridad ? `- Prioridad: ${p.prioridad}` : ''}
   ${p.ventanaHoraria ? `- Ventana horaria: ${p.ventanaHoraria.inicio} - ${p.ventanaHoraria.fin}` : ''}
   ${p.productos ? `- Productos: ${p.productos.length} items` : ''}
`).join('\n')}

Considera:
- Prioridades de entrega
- Ventanas horarias
- Eficiencia de combustible y tiempo

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen de la ruta optimizada",
  "rutaOptima": [
    {
      "orden": número de parada,
      "destino": "nombre del destino",
      "horaEstimada": "HH:MM",
      "distanciaAcumulada": kilómetros (estimado)
    }
  ],
  "metricas": {
    "distanciaTotal": kilómetros totales estimados,
    "tiempoEstimado": minutos totales estimados,
    "costosEstimados": costo estimado en pesos
  },
  "recomendaciones": ["recomendaciones para optimizar la ruta"],
  "alertas": ["alertas sobre restricciones o conflictos"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: RouteOptimizationResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'la optimización de rutas');
  }
}

/**
 * Sugiere agrupación óptima de entregas por zonas
 */
export async function suggestDeliveryZones(
  deliveries: Array<{ direccion: string; volumen: number; urgencia: string }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como experto en logística, sugiere cómo agrupar las siguientes entregas en zonas eficientes:

Total de entregas: ${deliveries.length}

Entregas pendientes:
${deliveries.slice(0, 20).map((d, idx) => `
${idx + 1}. ${d.direccion}
   - Volumen: ${d.volumen} unidades
   - Urgencia: ${d.urgencia}
`).join('\n')}

Proporciona:
1. Propuesta de zonificación
2. Criterios de agrupación aplicados
3. Beneficios esperados
4. Recomendaciones para implementación

Responde en formato markdown, conciso y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la sugerencia de zonas de entrega');
  }
}
