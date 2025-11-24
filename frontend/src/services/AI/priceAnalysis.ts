/**
 * Servicio de análisis de precios con IA
 */

import { getModel } from './client';
import { createPriceComparisonPrompt } from './prompts';
import { safeJsonParse, handleAIError } from './helpers';
import type { PriceComparisonData, AIAnalysisResult } from './types';

/**
 * Analiza comparación de precios entre dos empresas usando Gemini AI
 */
export async function analyzePriceComparison(
  data: PriceComparisonData | PriceComparisonData[]
): Promise<AIAnalysisResult> {
  try {
    const model = getModel();
    
    // Convertir a array si es un solo elemento
    const comparisons = Array.isArray(data) ? data : [data];
    
    // Crear prompt estructurado
    const prompt = createPriceComparisonPrompt(comparisons);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parsear el JSON de forma segura
    const analysis: AIAnalysisResult = safeJsonParse(text);
    
    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de precios');
  }
}
