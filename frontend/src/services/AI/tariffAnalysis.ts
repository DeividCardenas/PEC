/**
 * Servicio de análisis de tarifarios con IA
 */

import { getModel } from './client';
import { createTariffAnalysisPrompt } from './prompts';
import { safeJsonParse, handleAIError } from './helpers';
import type { TariffProduct, TariffAnalysisResult } from './types';

/**
 * Analiza un tarifario completo y genera insights sobre precios y productos
 */
export async function analyzeTariff(
  products: TariffProduct[]
): Promise<TariffAnalysisResult> {
  try {
    const model = getModel();
    
    // Tomar una muestra representativa si hay demasiados productos
    const sampleSize = Math.min(products.length, 50);
    
    const prompt = createTariffAnalysisPrompt(products, sampleSize);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parsear el JSON de forma segura
    const analysis: TariffAnalysisResult = safeJsonParse(text);
    
    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis del tarifario');
  }
}
