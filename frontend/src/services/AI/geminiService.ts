import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY no está configurada en el archivo .env');
}

// Inicializar el cliente de Gemini AI
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface PriceComparisonData {
  producto: string;
  empresa1: {
    nombre: string;
    precio: number;
    precioUnidad?: number;
    precioEmpaque?: number;
    tarifario?: string;
  };
  empresa2: {
    nombre: string;
    precio: number;
    precioUnidad?: number;
    precioEmpaque?: number;
    tarifario?: string;
  };
}

export interface AIAnalysisResult {
  resumen: string;
  ahorroPotencial: {
    monto: number;
    porcentaje: number;
    mejorOpcion: string;
  };
  recomendaciones: string[];
  analisisDetallado: string;
  patrones?: string[];
}

/**
 * Analiza comparación de precios entre dos empresas usando Gemini AI
 */
export async function analyzePriceComparison(
  data: PriceComparisonData | PriceComparisonData[]
): Promise<AIAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini AI no está configurado. Por favor, verifica la API key.');
  }

  try {
    // Usar Gemini Pro - modelo básico y estable
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convertir a array si es un solo elemento
    const comparisons = Array.isArray(data) ? data : [data];

    // Crear prompt estructurado
    const prompt = `Eres un experto analista de costos en el sector farmacéutico y de salud. Analiza la siguiente comparación de precios entre empresas:

${comparisons.map((comp, idx) => `
Producto ${idx + 1}: ${comp.producto}

Empresa 1: ${comp.empresa1.nombre}
- Precio: $${comp.empresa1.precio.toLocaleString('es-CO')}
${comp.empresa1.precioUnidad ? `- Precio por unidad: $${comp.empresa1.precioUnidad.toLocaleString('es-CO')}` : ''}
${comp.empresa1.precioEmpaque ? `- Precio por empaque: $${comp.empresa1.precioEmpaque.toLocaleString('es-CO')}` : ''}
${comp.empresa1.tarifario ? `- Tarifario: ${comp.empresa1.tarifario}` : ''}

Empresa 2: ${comp.empresa2.nombre}
- Precio: $${comp.empresa2.precio.toLocaleString('es-CO')}
${comp.empresa2.precioUnidad ? `- Precio por unidad: $${comp.empresa2.precioUnidad.toLocaleString('es-CO')}` : ''}
${comp.empresa2.precioEmpaque ? `- Precio por empaque: $${comp.empresa2.precioEmpaque.toLocaleString('es-CO')}` : ''}
${comp.empresa2.tarifario ? `- Tarifario: ${comp.empresa2.tarifario}` : ''}
`).join('\n---\n')}

Por favor, proporciona un análisis en formato JSON con la siguiente estructura:
{
  "resumen": "Un resumen ejecutivo de 2-3 líneas",
  "ahorroPotencial": {
    "monto": número con el ahorro total en pesos,
    "porcentaje": porcentaje de ahorro,
    "mejorOpcion": "nombre de la empresa más económica"
  },
  "recomendaciones": ["lista", "de", "recomendaciones", "específicas"],
  "analisisDetallado": "Análisis profundo de las diferencias de precio, calidad-precio, y consideraciones importantes",
  "patrones": ["patrones", "identificados", "en", "los", "precios"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Limpiar la respuesta para extraer solo el JSON
    let jsonText = text.trim();

    // Remover markdown code blocks si existen
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parsear el JSON
    const analysis: AIAnalysisResult = JSON.parse(jsonText);

    return analysis;
  } catch (error) {
    console.error('Error al analizar con Gemini:', error);
    throw new Error('No se pudo completar el análisis con IA. Por favor, intenta de nuevo.');
  }
}

/**
 * Genera sugerencias para optimizar compras basadas en múltiples productos
 */
export async function generatePurchaseOptimization(
  products: Array<{
    nombre: string;
    precioActual: number;
    precioAlternativo?: number;
    empresaActual: string;
    empresaAlternativa?: string;
  }>
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini AI no está configurado. Por favor, verifica la API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Como asesor de compras en el sector salud, genera recomendaciones estratégicas para optimizar las siguientes compras:

${products.map((p, idx) => `
${idx + 1}. ${p.nombre}
   - Proveedor actual: ${p.empresaActual} - $${p.precioActual.toLocaleString('es-CO')}
   ${p.empresaAlternativa ? `- Alternativa: ${p.empresaAlternativa} - $${p.precioAlternativo?.toLocaleString('es-CO')}` : ''}
`).join('\n')}

Proporciona:
1. Estrategia de negociación
2. Oportunidades de consolidación
3. Consideraciones de calidad y servicio
4. Plan de acción recomendado

Responde en formato markdown, de manera concisa y accionable.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error al generar optimización:', error);
    throw new Error('No se pudo generar la optimización con IA.');
  }
}

export interface ProductoParaReorden {
  descripcion: string;
  cum: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  precio_unidad: number;
  laboratorio: string;
}

export interface ReordenSugerencia {
  resumen: string;
  prioridades: {
    criticos: Array<{
      producto: string;
      razon: string;
      cantidadSugerida: number;
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
}

export interface TariffProduct {
  descripcion: string;
  cum?: string;
  precio_unidad: number;
  precio_presentacion: number;
  concentracion?: string;
  regulacion?: string;
}

export interface TariffAnalysisResult {
  resumen: string;
  estadisticas: {
    precioPromedio: number;
    precioMinimo: number;
    precioMaximo: number;
    totalProductos: number;
  };
  insights: string[];
  recomendaciones: string[];
  productosDestacados: {
    masCaros: string[];
    masEconomicos: string[];
    mejorRelacionCalidadPrecio?: string[];
  };
}

/**
 * Analiza un tarifario completo y genera insights sobre precios y productos
 */
export async function analyzeTariff(
  products: TariffProduct[]
): Promise<TariffAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini AI no está configurado. Por favor, verifica la API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Tomar una muestra representativa si hay demasiados productos
    const sampleSize = Math.min(products.length, 50);
    const sample = products.slice(0, sampleSize);

    const prompt = `Eres un experto analista de precios en el sector farmacéutico. Analiza el siguiente tarifario con ${products.length} productos (mostrando una muestra de ${sampleSize}):

${sample.map((p, idx) => `
${idx + 1}. ${p.descripcion}
   - CUM: ${p.cum || 'N/A'}
   - Concentración: ${p.concentracion || 'N/A'}
   - Precio por unidad: $${p.precio_unidad.toLocaleString('es-CO')}
   - Precio presentación: $${p.precio_presentacion.toLocaleString('es-CO')}
   ${p.regulacion ? `- Regulación: ${p.regulacion}` : ''}
`).join('\n')}

Por favor, proporciona un análisis en formato JSON con la siguiente estructura:
{
  "resumen": "Un resumen ejecutivo del tarifario en 2-3 líneas",
  "estadisticas": {
    "precioPromedio": número con el precio promedio,
    "precioMinimo": precio más bajo encontrado,
    "precioMaximo": precio más alto encontrado,
    "totalProductos": ${products.length}
  },
  "insights": ["lista", "de", "insights", "importantes", "sobre", "los", "precios"],
  "recomendaciones": ["recomendaciones", "estratégicas", "para", "optimizar", "compras"],
  "productosDestacados": {
    "masCaros": ["productos con precios más altos"],
    "masEconomicos": ["productos con precios más bajos"],
    "mejorRelacionCalidadPrecio": ["productos con mejor relación calidad-precio si aplicable"]
  }
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // Limpiar la respuesta para extraer solo el JSON
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const analysis: TariffAnalysisResult = JSON.parse(text);
    return analysis;
  } catch (error) {
    console.error('Error al analizar tarifario:', error);
    throw new Error('No se pudo completar el análisis del tarifario con IA.');
  }
}
