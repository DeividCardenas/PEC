/**
 * Componente Timeline para mostrar el historial de una orden de compra (RF004)
 */

import React from "react";
import { HistorialCambio } from "../services/Ordenes/ordenesService";

interface TimelineOrdenProps {
  historial: HistorialCambio[];
}

const TimelineOrden: React.FC<TimelineOrdenProps> = ({ historial }) => {
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "bg-yellow-500";
      case "aprobada":
        return "bg-green-500";
      case "en_proceso":
        return "bg-blue-500";
      case "completada":
        return "bg-purple-500";
      case "rechazada":
        return "bg-red-500";
      case "cancelada":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "⏳";
      case "aprobada":
        return "✓";
      case "en_proceso":
        return "🔄";
      case "completada":
        return "✅";
      case "rechazada":
        return "✗";
      case "cancelada":
        return "🚫";
      default:
        return "•";
    }
  };

  const obtenerNombreEstado = (estado: string) => {
    const nombres: { [key: string]: string } = {
      pendiente: "Pendiente",
      aprobada: "Aprobada",
      en_proceso: "En Proceso",
      completada: "Completada",
      rechazada: "Rechazada",
      cancelada: "Cancelada",
    };
    return nombres[estado.toLowerCase()] || estado;
  };

  if (historial.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay historial de cambios disponible
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea vertical del timeline */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {/* Eventos del timeline */}
      <div className="space-y-6">
        {historial.map((cambio, index) => (
          <div key={cambio.id_historial} className="relative pl-16 pr-4">
            {/* Punto del timeline */}
            <div
              className={`absolute left-0 w-12 h-12 rounded-full ${obtenerColorEstado(
                cambio.estado_nuevo
              )} flex items-center justify-center text-white text-xl font-bold shadow-md`}
            >
              {obtenerIconoEstado(cambio.estado_nuevo)}
            </div>

            {/* Contenido del evento */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Header del evento */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  {cambio.estado_anterior ? (
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700`}
                      >
                        {obtenerNombreEstado(cambio.estado_anterior)}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${obtenerColorEstado(
                          cambio.estado_nuevo
                        )}`}
                      >
                        {obtenerNombreEstado(cambio.estado_nuevo)}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium text-white ${obtenerColorEstado(
                        cambio.estado_nuevo
                      )}`}
                    >
                      {obtenerNombreEstado(cambio.estado_nuevo)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formatearFecha(cambio.creado_en)}
                </div>
              </div>

              {/* Usuario */}
              {cambio.usuario && (
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Usuario:</span>{" "}
                  {cambio.usuario.username}
                  {cambio.usuario.email && (
                    <span className="text-gray-400 ml-1">
                      ({cambio.usuario.email})
                    </span>
                  )}
                </div>
              )}

              {/* Comentario/Motivo */}
              {cambio.comentario && (
                <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                  <span className="font-medium">Comentario:</span>{" "}
                  {cambio.comentario}
                </div>
              )}

              {/* Tipo de cambio */}
              <div className="text-xs text-gray-400 mt-2">
                Tipo: {cambio.tipo_cambio}
              </div>
            </div>

            {/* Línea conectora al siguiente evento */}
            {index < historial.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineOrden;
