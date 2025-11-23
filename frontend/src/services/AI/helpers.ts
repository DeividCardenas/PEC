/**
 * Funciones auxiliares para procesamiento de respuestas de IA
 */

/**
 * Limpia y extrae JSON de una respuesta de texto que puede contener markdown
 */
export function cleanJsonResponse(text: string): string {
  let jsonText = text.trim();

  // Remover markdown code blocks si existen
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  return jsonText;
}

/**
 * Intenta parsear JSON de forma segura
 */
export function safeJsonParse<T>(text: string): T {
  try {
    const cleaned = cleanJsonResponse(text);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error al parsear JSON:', error);
    throw new Error('La respuesta de IA no tiene el formato esperado.');
  }
}

/**
 * Maneja errores comunes de las llamadas a IA
 */
export function handleAIError(error: unknown, context: string): never {
  console.error(`Error en ${context}:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      throw new Error('API key de IA no configurada correctamente.');
    }
    if (error.message.includes('quota') || error.message.includes('limit')) {
      throw new Error('Se ha alcanzado el límite de uso de la API de IA.');
    }
  }
  
  throw new Error(`No se pudo completar ${context}. Por favor, intenta de nuevo.`);
}
