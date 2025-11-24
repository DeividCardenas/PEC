/**
 * Cliente de Gemini AI
 * Centraliza la inicialización y configuración del cliente
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY no está configurada en el archivo .env');
}

// Inicializar el cliente de Gemini AI
export const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Obtiene una instancia del modelo Gemini
 */
export function getModel(modelName: string = "gemini-2.0-flash") {
  if (!genAI) {
    throw new Error('Gemini AI no está configurado. Por favor, verifica la API key.');
  }
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Verifica si el cliente está disponible
 */
export function isAIAvailable(): boolean {
  return genAI !== null;
}
