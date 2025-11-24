/**
 * Generadores de prompts para diferentes análisis de IA
 */

import type { PriceComparisonData, TariffProduct, PurchaseProduct } from './types';

/**
 * Genera prompt para comparación de precios
 */
export function createPriceComparisonPrompt(
  comparisons: PriceComparisonData[]
): string {
  return `Eres un experto analista de costos en el sector farmacéutico y de salud. Analiza la siguiente comparación de precios entre empresas:

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
}

/**
 * Genera prompt para optimización de compras
 */
export function createPurchaseOptimizationPrompt(
  products: PurchaseProduct[]
): string {
  return `Como asesor de compras en el sector salud, genera recomendaciones estratégicas para optimizar las siguientes compras:

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
}

/**
 * Genera prompt para análisis de tarifario
 */
export function createTariffAnalysisPrompt(
  products: TariffProduct[],
  sampleSize: number
): string {
  const sample = products.slice(0, sampleSize);
  
  return `Eres un experto analista de precios en el sector farmacéutico. Analiza el siguiente tarifario con ${products.length} productos (mostrando una muestra de ${sampleSize}):

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
}
