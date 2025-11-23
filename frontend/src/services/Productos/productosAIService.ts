/**
 * Servicio de IA para análisis de productos y recomendaciones
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface ProductData {
  descripcion: string;
  cum?: string;
  concentracion?: string;
  presentacion?: string;
  laboratorio: string;
  precio_unidad: number;
  precio_presentacion: number;
  stock_actual?: number;
  ventas_mensuales?: number;
  categoria?: string;
}

export interface ProductAnalysisResult {
  resumen: string;
  clasificacion: {
    categoria: string;
    subcategoria?: string;
    riesgo: 'alto' | 'medio' | 'bajo';
  };
  insights: string[];
  recomendaciones: string[];
  comparables?: string[];
  alertas?: string[];
}

/**
 * Analiza un producto y genera recomendaciones
 */
export async function analyzeProduct(
  product: ProductData,
  marketData?: Array<{ nombre: string; precio: number }>
): Promise<ProductAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un analista farmacéutico experto. Analiza el siguiente producto:

${product.descripcion}
${product.cum ? `CUM: ${product.cum}` : ''}
${product.concentracion ? `Concentración: ${product.concentracion}` : ''}
${product.presentacion ? `Presentación: ${product.presentacion}` : ''}
Laboratorio: ${product.laboratorio}
Precio por unidad: $${product.precio_unidad.toLocaleString('es-CO')}
Precio presentación: $${product.precio_presentacion.toLocaleString('es-CO')}
${product.stock_actual !== undefined ? `Stock actual: ${product.stock_actual}` : ''}
${product.ventas_mensuales ? `Ventas mensuales: ${product.ventas_mensuales}` : ''}
${product.categoria ? `Categoría: ${product.categoria}` : ''}

${marketData && marketData.length > 0 ? `
Productos comparables en el mercado:
${marketData.map(p => `- ${p.nombre}: $${p.precio.toLocaleString('es-CO')}`).join('\n')}
` : ''}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen del análisis del producto",
  "clasificacion": {
    "categoria": "categoría farmacéutica principal",
    "subcategoria": "subcategoría si aplica",
    "riesgo": "alto | medio | bajo (basado en disponibilidad, demanda, etc.)"
  },
  "insights": ["insights sobre el producto, su mercado y posicionamiento"],
  "recomendaciones": ["recomendaciones estratégicas de gestión"],
  "comparables": ["nombres de productos similares o sustitutos"],
  "alertas": ["alertas importantes sobre el producto"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: ProductAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de producto');
  }
}

/**
 * Sugiere productos complementarios para cross-selling
 */
export async function suggestComplementaryProducts(
  product: ProductData,
  availableProducts: ProductData[]
): Promise<Array<{ nombre: string; razon: string; prioridad: number }>> {
  try {
    const model = getModel();

    const prompt = `Como farmacéutico especialista, sugiere productos complementarios para el siguiente producto:

Producto principal:
${product.descripcion}
${product.concentracion ? `Concentración: ${product.concentracion}` : ''}
${product.categoria ? `Categoría: ${product.categoria}` : ''}

Productos disponibles en inventario:
${availableProducts.slice(0, 50).map(p => `- ${p.descripcion} (${p.laboratorio})`).join('\n')}

Proporciona análisis en formato JSON con productos complementarios:
{
  "sugerencias": [
    {
      "nombre": "nombre del producto complementario",
      "razon": "razón de la recomendación (sinergia terapéutica, protocolo, etc.)",
      "prioridad": número de 1-10 (10 = más relevante)
    }
  ]
}

Considera:
- Protocolos de tratamiento comunes
- Sinergias terapéuticas
- Manejo de efectos secundarios
- Productos de soporte (ej: protectores gástricos, suplementos)

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeJsonParse<{ sugerencias: Array<{ nombre: string; razon: string; prioridad: number }> }>(text);
    
    return parsed.sugerencias || [];
  } catch (error) {
    handleAIError(error, 'la sugerencia de productos complementarios');
  }
}

/**
 * Genera descripción optimizada del producto
 */
export async function generateProductDescription(
  product: ProductData,
  targetAudience: 'profesionales' | 'pacientes' | 'compradores'
): Promise<string> {
  try {
    const model = getModel();

    const audienceContext = {
      profesionales: 'profesionales de la salud, enfocándote en indicaciones, posología y consideraciones clínicas',
      pacientes: 'pacientes, usando lenguaje claro, empático y enfocándote en beneficios y uso correcto',
      compradores: 'compradores institucionales, enfatizando valor, costo-efectividad y especificaciones técnicas'
    };

    const prompt = `Genera una descripción profesional y persuasiva del siguiente producto, dirigida a ${audienceContext[targetAudience]}:

${product.descripcion}
${product.concentracion ? `Concentración: ${product.concentracion}` : ''}
${product.presentacion ? `Presentación: ${product.presentacion}` : ''}
Laboratorio: ${product.laboratorio}
${product.categoria ? `Categoría: ${product.categoria}` : ''}

Genera una descripción que:
1. Sea clara y precisa
2. Destaque características clave
3. Use lenguaje apropiado para la audiencia
4. Sea persuasiva sin exagerar
5. Incluya información de valor

Responde SOLO con la descripción del producto (máximo 200 palabras).`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación de descripción de producto');
  }
}
