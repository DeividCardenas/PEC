/**
 * Servicio de optimización de compras con IA
 */

import { getModel } from './client';
import { createPurchaseOptimizationPrompt } from './prompts';
import { handleAIError } from './helpers';
import type { PurchaseProduct } from './types';

/**
 * Genera sugerencias para optimizar compras basadas en múltiples productos
 */
export async function generatePurchaseOptimization(
  products: PurchaseProduct[]
): Promise<string> {
  try {
    const model = getModel();
    const prompt = createPurchaseOptimizationPrompt(products);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    return response.text();
  } catch (error) {
    handleAIError(error, 'la generación de optimización de compras');
  }
}
