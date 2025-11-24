/**
 * Servicio de IA para análisis de empresas y clientes corporativos
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface CompanyData {
  nombre: string;
  tipo?: string;
  laboratorios_count?: number;
  productos_count?: number;
  tarifarios_count?: number;
  volumen_compras?: number;
  frecuencia_compras?: string;
  ubicacion?: string;
}

export interface CompanyAnalysisResult {
  resumen: string;
  perfilCliente: {
    segmento: 'corporativo_grande' | 'corporativo_medio' | 'pyme' | 'independiente';
    potencial: 'alto' | 'medio' | 'bajo';
    prioridad: number; // 1-10
  };
  fortalezasRelacion: string[];
  oportunidadesCrecimiento: string[];
  recomendaciones: string[];
  alertas?: string[];
}

/**
 * Analiza una empresa cliente y su potencial
 */
export async function analyzeCompany(
  company: CompanyData,
  purchaseHistory?: Array<{ fecha: string; monto: number; productos: number }>
): Promise<CompanyAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un analista de cuentas clave en el sector farmacéutico. Analiza la siguiente empresa cliente:

Empresa: ${company.nombre}
${company.tipo ? `Tipo: ${company.tipo}` : ''}
${company.laboratorios_count ? `Laboratorios asociados: ${company.laboratorios_count}` : ''}
${company.productos_count ? `Productos manejados: ${company.productos_count}` : ''}
${company.tarifarios_count ? `Tarifarios activos: ${company.tarifarios_count}` : ''}
${company.volumen_compras ? `Volumen de compras: $${company.volumen_compras.toLocaleString('es-CO')}` : ''}
${company.frecuencia_compras ? `Frecuencia: ${company.frecuencia_compras}` : ''}
${company.ubicacion ? `Ubicación: ${company.ubicacion}` : ''}

${purchaseHistory && purchaseHistory.length > 0 ? `
Historial de compras reciente:
${purchaseHistory.slice(0, 12).map(p => `
- ${p.fecha}: $${p.monto.toLocaleString('es-CO')} (${p.productos} productos)
`).join('\n')}
` : ''}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo de la empresa como cliente",
  "perfilCliente": {
    "segmento": "corporativo_grande | corporativo_medio | pyme | independiente",
    "potencial": "alto | medio | bajo",
    "prioridad": número de 1-10 (10 = máxima prioridad)
  },
  "fortalezasRelacion": ["fortalezas de la relación comercial actual"],
  "oportunidadesCrecimiento": ["oportunidades para incrementar el negocio"],
  "recomendaciones": ["recomendaciones estratégicas para la cuenta"],
  "alertas": ["alertas o riesgos en la relación comercial"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: CompanyAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de empresa');
  }
}

/**
 * Genera plan de cuenta para cliente corporativo
 */
export async function generateAccountPlan(
  company: CompanyData,
  goals: string[]
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como gerente de cuentas clave, genera un plan de cuenta estratégico para:

Empresa: ${company.nombre}
${company.tipo ? `Tipo: ${company.tipo}` : ''}
${company.volumen_compras ? `Volumen actual: $${company.volumen_compras.toLocaleString('es-CO')}` : ''}

Objetivos comerciales:
${goals.map(g => `- ${g}`).join('\n')}

Genera un plan que incluya:
1. Análisis FODA de la cuenta
2. Objetivos SMART específicos (3-5 objetivos)
3. Estrategias y tácticas para alcanzar cada objetivo
4. Cronograma de actividades (próximos 6-12 meses)
5. Recursos necesarios
6. KPIs para medir éxito
7. Riesgos y planes de mitigación
8. Próximos pasos inmediatos

Responde en formato markdown, profesional y detallado.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación de plan de cuenta');
  }
}

/**
 * Identifica oportunidades de cross-selling y upselling
 */
export async function identifySalesOpportunities(
  company: CompanyData,
  currentProducts: string[],
  availableProducts: Array<{ nombre: string; categoria: string; margen: number }>
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como especialista en desarrollo de negocios, identifica oportunidades de venta adicional para:

Cliente: ${company.nombre}
${company.volumen_compras ? `Volumen actual: $${company.volumen_compras.toLocaleString('es-CO')}` : ''}

Productos que actualmente compra (muestra):
${currentProducts.slice(0, 20).map(p => `- ${p}`).join('\n')}

Productos disponibles para ofrecer:
${availableProducts.slice(0, 30).map(p => `- ${p.nombre} (${p.categoria}) - Margen: ${p.margen}%`).join('\n')}

Identifica y prioriza:
1. Oportunidades de cross-selling (productos complementarios)
2. Oportunidades de upselling (productos de mayor valor)
3. Nuevas líneas de producto relevantes
4. Argumentos de venta para cada oportunidad
5. Timing recomendado para cada propuesta
6. ROI estimado de cada oportunidad

Responde en formato markdown, priorizado y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la identificación de oportunidades de venta');
  }
}
