/**
 * Servicio de IA para análisis de pacientes y gestión de datos
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface PatientData {
  nombre: string;
  edad?: number;
  diagnostico?: string;
  medicamentos: Array<{
    nombre: string;
    dosis: string;
    frecuencia: string;
  }>;
  alergias?: string[];
  historial?: string;
}

export interface PatientAnalysisResult {
  resumen: string;
  alertasMedicas: Array<{
    tipo: 'interaccion' | 'alergia' | 'contraindicacion' | 'dosificacion';
    severidad: 'alta' | 'media' | 'baja';
    descripcion: string;
    recomendacion: string;
  }>;
  recomendaciones: string[];
  consideracionesEspeciales?: string[];
}

/**
 * Analiza interacciones medicamentosas y genera alertas
 */
export async function analyzeMedicationInteractions(
  patient: PatientData
): Promise<PatientAnalysisResult> {
  try {
    const model = getModel();

    const prompt = `Eres un farmacéutico clínico experto. Analiza la siguiente información del paciente y sus medicamentos:

Paciente: ${patient.nombre}
${patient.edad ? `Edad: ${patient.edad} años` : ''}
${patient.diagnostico ? `Diagnóstico: ${patient.diagnostico}` : ''}

Medicamentos prescritos:
${patient.medicamentos.map((m, idx) => `
${idx + 1}. ${m.nombre}
   - Dosis: ${m.dosis}
   - Frecuencia: ${m.frecuencia}
`).join('\n')}

${patient.alergias && patient.alergias.length > 0 ? `
Alergias conocidas: ${patient.alergias.join(', ')}
` : ''}

${patient.historial ? `Historial relevante: ${patient.historial}` : ''}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen del análisis farmacológico",
  "alertasMedicas": [
    {
      "tipo": "interaccion | alergia | contraindicacion | dosificacion",
      "severidad": "alta | media | baja",
      "descripcion": "descripción detallada del problema",
      "recomendacion": "acción recomendada"
    }
  ],
  "recomendaciones": ["recomendaciones generales para el seguimiento"],
  "consideracionesEspeciales": ["consideraciones especiales según edad/diagnóstico"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional. Este análisis es informativo y no sustituye la evaluación médica profesional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: PatientAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de interacciones medicamentosas');
  }
}

/**
 * Genera recomendaciones de adherencia al tratamiento
 */
export async function generateAdherenceRecommendations(
  patient: PatientData,
  adherenceIssues: string[]
): Promise<string> {
  try {
    const model = getModel();

    const prompt = `Como especialista en adherencia terapéutica, genera recomendaciones para mejorar el cumplimiento del tratamiento:

Paciente: ${patient.nombre}
${patient.edad ? `Edad: ${patient.edad} años` : ''}

Medicamentos:
${patient.medicamentos.map(m => `- ${m.nombre} (${m.frecuencia})`).join('\n')}

Problemas de adherencia identificados:
${adherenceIssues.map(issue => `- ${issue}`).join('\n')}

Proporciona:
1. Estrategias personalizadas para mejorar adherencia
2. Herramientas y recordatorios sugeridos
3. Educación al paciente (puntos clave)
4. Seguimiento recomendado

Responde en formato markdown, empático y accionable.

NOTA: Este es un apoyo informativo y no sustituye la consulta con profesionales de la salud.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la generación de recomendaciones de adherencia');
  }
}
