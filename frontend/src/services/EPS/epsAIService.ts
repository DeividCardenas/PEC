/**
 * Servicio de IA para análisis de EPS y entidades de salud
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface EPSData {
  nombre: string;
  tipo?: 'contributivo' | 'subsidiado' | 'especial';
  tarifarios_count?: number;
  productos_cubiertos?: number;
  cobertura_geografica?: string[];
  nivel_atencion?: string;
}

export interface EPSAnalysisResult {
  resumen: string;
  perfilOperativo: {
    tipo: string;
    alcance: 'nacional' | 'regional' | 'local';
    complejidad: 'alta' | 'media' | 'baja';
  };
  oportunidadesComerciales: string[];
  consideracionesEspeciales: string[];
  recomendaciones: string[];
  riesgos?: string[];
}

/**
 * Analiza una EPS y genera recomendaciones comerciales
 */
export async function analyzeEPS(
  eps: EPSData,
  tariffData?: Array<{ nombre: string; productos: number; precioPromedio: number }>
): Promise<EPSAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un analista de negocios en el sector salud. Analiza la siguiente EPS:

EPS: ${eps.nombre}
${eps.tipo ? `Tipo: ${eps.tipo}` : ''}
${eps.tarifarios_count ? `Número de tarifarios: ${eps.tarifarios_count}` : ''}
${eps.productos_cubiertos ? `Productos cubiertos: ${eps.productos_cubiertos}` : ''}
${eps.cobertura_geografica && eps.cobertura_geografica.length > 0 ? `Cobertura: ${eps.cobertura_geografica.join(', ')}` : ''}
${eps.nivel_atencion ? `Nivel de atención: ${eps.nivel_atencion}` : ''}

${tariffData && tariffData.length > 0 ? `
Tarifarios asociados:
${tariffData.map(t => `
- ${t.nombre}
  • Productos: ${t.productos}
  • Precio promedio: $${t.precioPromedio.toLocaleString('es-CO')}
`).join('\n')}
` : ''}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo de la EPS",
  "perfilOperativo": {
    "tipo": "contributivo | subsidiado | especial | mixto",
    "alcance": "nacional | regional | local",
    "complejidad": "alta | media | baja"
  },
  "oportunidadesComerciales": ["oportunidades de negocio identificadas"],
  "consideracionesEspeciales": ["aspectos especiales a considerar en la relación comercial"],
  "recomendaciones": ["recomendaciones estratégicas para trabajar con esta EPS"],
  "riesgos": ["riesgos potenciales en la relación comercial"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: EPSAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de EPS');
  }
}

/**
 * Compara tarifarios de diferentes EPS
 */
export async function compareTariffs(
  epsName: string,
  tariffs: Array<{
    nombre: string;
    productos: Array<{ nombre: string; precio: number }>;
  }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como analista de precios en salud, compara los siguientes tarifarios de ${epsName}:

${tariffs.map((tariff, idx) => `
Tarifario ${idx + 1}: ${tariff.nombre}
Total de productos: ${tariff.productos.length}

Muestra de productos (primeros 10):
${tariff.productos.slice(0, 10).map(p => `- ${p.nombre}: $${p.precio.toLocaleString('es-CO')}`).join('\n')}
`).join('\n---\n')}

Proporciona:
1. Análisis comparativo de precios
2. Identificación de diferencias significativas
3. Recomendaciones sobre qué tarifario usar según el tipo de producto
4. Oportunidades de optimización de costos
5. Alertas sobre precios fuera de mercado

Responde en formato markdown, estructurado y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la comparación de tarifarios');
  }
}

/**
 * Genera estrategia de negociación con EPS
 */
export async function generateEPSNegotiationStrategy(
  eps: EPSData,
  historicalData?: {
    montoAnual: number;
    productos: number;
    tendencia: 'creciente' | 'estable' | 'decreciente';
  }
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como experto en negociación con entidades de salud, genera una estrategia para negociar con la siguiente EPS:

EPS: ${eps.nombre}
${eps.tipo ? `Tipo: ${eps.tipo}` : ''}
${eps.tarifarios_count ? `Tarifarios activos: ${eps.tarifarios_count}` : ''}

${historicalData ? `
Datos históricos:
- Monto anual: $${historicalData.montoAnual.toLocaleString('es-CO')}
- Productos suministrados: ${historicalData.productos}
- Tendencia: ${historicalData.tendencia}
` : ''}

Proporciona una estrategia que incluya:
1. Propuesta de valor principal
2. Puntos de negociación clave
3. Rangos de precios y descuentos sugeridos
4. Términos de pago favorables
5. Alternativas y plan B
6. Argumentos y contraofertas esperadas
7. Criterios de éxito de la negociación

Responde en formato markdown, profesional y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación de estrategia de negociación con EPS');
  }
}
