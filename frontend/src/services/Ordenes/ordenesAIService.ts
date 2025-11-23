/**
 * Servicio de IA para análisis de órdenes de compra
 */

import { getModel } from '../AI/client';
import { safeJsonParse, handleAIError } from '../AI/helpers';

export interface PurchaseOrder {
  id: number;
  proveedor: string;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  total: number;
  estado: string;
  fecha_creacion: string;
  fecha_entrega?: string;
}

export interface OrderAnalysisResult {
  resumen: string;
  metricas: {
    totalGastado: number;
    proveedorPrincipal: string;
    productoMasFrecuente: string;
    ahorrosPotenciales: number;
  };
  recomendaciones: string[];
  alertas?: string[];
  oportunidades?: string[];
}

/**
 * Analiza un conjunto de órdenes de compra y genera insights
 */
export async function analyzePurchaseOrders(
  orders: PurchaseOrder[]
): Promise<OrderAnalysisResult> {
  try {
    const model = getModel();

    // Calcular estadísticas básicas
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const providerCounts = orders.reduce((acc, o) => {
      acc[o.proveedor] = (acc[o.proveedor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProvider = Object.entries(providerCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    const prompt = `Eres un experto en compras y gestión de proveedores en el sector salud. Analiza las siguientes órdenes de compra:

Total de órdenes: ${orders.length}
Gasto total: $${totalSpent.toLocaleString('es-CO')}
Proveedor principal: ${topProvider}

Muestra de órdenes (últimas 10):
${orders.slice(0, 10).map((order, idx) => `
${idx + 1}. Orden #${order.id} - ${order.proveedor}
   - Total: $${order.total.toLocaleString('es-CO')}
   - Estado: ${order.estado}
   - Fecha: ${order.fecha_creacion}
   - Productos: ${order.productos.length} items
   ${order.productos.slice(0, 3).map(p => `     • ${p.nombre}: ${p.cantidad} x $${p.precio_unitario.toLocaleString('es-CO')}`).join('\n')}
`).join('\n')}

Proporciona análisis en formato JSON:
{
  "resumen": "Resumen ejecutivo del comportamiento de compras",
  "metricas": {
    "totalGastado": ${totalSpent},
    "proveedorPrincipal": "${topProvider}",
    "productoMasFrecuente": "nombre del producto más comprado",
    "ahorrosPotenciales": monto estimado de ahorros posibles
  },
  "recomendaciones": ["recomendaciones estratégicas para optimizar compras"],
  "alertas": ["alertas importantes sobre el proceso de compras"],
  "oportunidades": ["oportunidades de mejora identificadas"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const analysis: OrderAnalysisResult = safeJsonParse(text);

    return analysis;
  } catch (error) {
    handleAIError(error, 'el análisis de órdenes de compra');
  }
}

/**
 * Genera recomendaciones para consolidar órdenes y optimizar entregas
 */
export async function optimizeOrderConsolidation(
  pendingOrders: PurchaseOrder[]
): Promise<string> {
  try {
    const model = getModel();

    const byProvider = pendingOrders.reduce((acc, order) => {
      if (!acc[order.proveedor]) acc[order.proveedor] = [];
      acc[order.proveedor].push(order);
      return acc;
    }, {} as Record<string, PurchaseOrder[]>);

    const prompt = `Como experto en logística de compras, sugiere cómo consolidar las siguientes órdenes pendientes:

${Object.entries(byProvider).map(([provider, orders]) => `
Proveedor: ${provider}
- Órdenes pendientes: ${orders.length}
- Total: $${orders.reduce((s, o) => s + o.total, 0).toLocaleString('es-CO')}
- Productos únicos: ${new Set(orders.flatMap(o => o.productos.map(p => p.nombre))).size}
`).join('\n')}

Proporciona:
1. Estrategia de consolidación por proveedor
2. Beneficios esperados (costos, tiempos)
3. Riesgos y consideraciones
4. Plan de acción recomendado

Responde en formato markdown, conciso y accionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    handleAIError(error, 'la optimización de consolidación de órdenes');
  }
}
