/**
 * Servicio de IA para análisis de laboratorios y fabricantes
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface LaboratoryData {
  nombre: string;
  productos_count?: number;
  productos_activos?: number;
  precio_promedio?: number;
  categorias?: string[];
  pais_origen?: string;
  certificaciones?: string[];
}

export interface LaboratoryAnalysisResult {
  resumen: string;
  fortalezas: string[];
  debilidades?: string[];
  posicionamiento: {
    mercado: 'premium' | 'medio' | 'economico';
    especializacion?: string[];
    competitividad: number; // 0-100
  };
  recomendaciones: string[];
  oportunidades?: string[];
}

/**
 * Analiza un laboratorio y su cartera de productos
 */
export async function analyzeLaboratory(
  laboratory: LaboratoryData,
  products?: Array<{ nombre: string; precio: number; categoria?: string }>
): Promise<LaboratoryAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un analista de la industria farmacéutica. Analiza el siguiente laboratorio:

Laboratorio: ${laboratory.nombre}
${laboratory.pais_origen ? `País de origen: ${laboratory.pais_origen}` : ''}
${laboratory.productos_count ? `Total de productos: ${laboratory.productos_count}` : ''}
${laboratory.productos_activos ? `Productos activos: ${laboratory.productos_activos}` : ''}
${laboratory.precio_promedio ? `Precio promedio: $${laboratory.precio_promedio.toLocaleString('es-CO')}` : ''}
${laboratory.categorias && laboratory.categorias.length > 0 ? `Categorías: ${laboratory.categorias.join(', ')}` : ''}
${laboratory.certificaciones && laboratory.certificaciones.length > 0 ? `Certificaciones: ${laboratory.certificaciones.join(', ')}` : ''}

${products && products.length > 0 ? `
Muestra de productos:
${products.slice(0, 15).map(p => `- ${p.nombre}: $${p.precio.toLocaleString('es-CO')}${p.categoria ? ` (${p.categoria})` : ''}`).join('\n')}
` : ''}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo del laboratorio",
  "fortalezas": ["fortalezas identificadas del laboratorio"],
  "debilidades": ["áreas de oportunidad o debilidades"],
  "posicionamiento": {
    "mercado": "premium | medio | economico",
    "especializacion": ["áreas terapéuticas en las que se especializa"],
    "competitividad": número de 0-100 representando competitividad en el mercado
  },
  "recomendaciones": ["recomendaciones estratégicas para trabajar con este laboratorio"],
  "oportunidades": ["oportunidades de negocio o expansión"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: LaboratoryAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de laboratorio');
  }
}

/**
 * Compara múltiples laboratorios
 */
export async function compareLaboratories(
  laboratories: Array<LaboratoryData & { productos?: Array<{ nombre: string; precio: number }> }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como analista de mercado farmacéutico, compara los siguientes laboratorios:

${laboratories.map((lab, idx) => `
${idx + 1}. ${lab.nombre}
   ${lab.pais_origen ? `- País: ${lab.pais_origen}` : ''}
   ${lab.productos_count ? `- Productos: ${lab.productos_count}` : ''}
   ${lab.precio_promedio ? `- Precio promedio: $${lab.precio_promedio.toLocaleString('es-CO')}` : ''}
   ${lab.categorias && lab.categorias.length > 0 ? `- Categorías: ${lab.categorias.join(', ')}` : ''}
   ${lab.productos && lab.productos.length > 0 ? `- Muestra de productos: ${lab.productos.slice(0, 3).map(p => p.nombre).join(', ')}` : ''}
`).join('\n')}

Proporciona una comparación detallada que incluya:
1. Análisis comparativo de posicionamiento
2. Ventajas competitivas de cada laboratorio
3. Recomendaciones de con cuál trabajar según diferentes escenarios:
   - Compras de alto volumen
   - Productos especializados
   - Mejor relación calidad-precio
4. Matriz de decisión
5. Consideraciones adicionales

Responde en formato markdown, estructurado y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la comparación de laboratorios');
  }
}

/**
 * Sugiere nuevos productos para incluir del laboratorio
 */
export async function suggestProductExpansion(
  laboratory: LaboratoryData,
  currentProducts: string[],
  marketDemand?: Array<{ categoria: string; demanda: number }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como estratega de compras farmacéuticas, sugiere productos adicionales del siguiente laboratorio que deberíamos considerar incluir:

Laboratorio: ${laboratory.nombre}
${laboratory.categorias ? `Especialidades: ${laboratory.categorias.join(', ')}` : ''}

Productos que ya manejamos:
${currentProducts.slice(0, 20).map(p => `- ${p}`).join('\n')}

${marketDemand && marketDemand.length > 0 ? `
Demanda del mercado por categoría:
${marketDemand.map(d => `- ${d.categoria}: ${d.demanda} unidades/mes`).join('\n')}
` : ''}

Proporciona:
1. Productos recomendados para ampliar el portafolio
2. Justificación de cada recomendación
3. Potencial de ventas estimado
4. Priorización (alta/media/baja)
5. Consideraciones para la negociación

Responde en formato markdown, conciso y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la sugerencia de expansión de productos');
  }
}
