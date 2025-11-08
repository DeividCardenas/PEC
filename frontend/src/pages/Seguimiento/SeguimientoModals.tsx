/**
 * Componentes de Modales para Seguimiento (RF010)
 */

import React from "react";
import {
  type RutaConSeguimiento,
  formatearTiempoDesdeActualizacion,
  getColorActualizacion,
  tieneUbicacion,
} from "../../services/Seguimiento/seguimientoService";
import { getEstadoColor } from "../../services/Rutas/rutasService";

// ============================================================================
// INTERFACES DE PROPS
// ============================================================================

interface RutaDetailsModalProps {
  show: boolean;
  ruta: RutaConSeguimiento | null;
  onClose: () => void;
}

// ============================================================================
// MODAL: VER DETALLE DE RUTA EN SEGUIMIENTO
// ============================================================================

export const RutaDetailsModal: React.FC<RutaDetailsModalProps> = ({
  show,
  ruta,
  onClose,
}) => {
  if (!show || !ruta) return null;

  const formatearFecha = (fecha: string | null | undefined): string => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearMoneda = (valor: number | string): string => {
    const numero = typeof valor === "string" ? parseFloat(valor) : valor;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numero);
  };

  // Ordenar entregas por orden_en_ruta
  const entregasOrdenadas = ruta.entregas
    ? [...ruta.entregas].sort((a, b) => {
        const ordenA = a.orden_en_ruta || 0;
        const ordenB = b.orden_en_ruta || 0;
        return ordenA - ordenB;
      })
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{ruta.numero_ruta}</h2>
              <p className="text-purple-100 mt-1">Seguimiento en Tiempo Real</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(
                    ruta.estado
                  )}`}
                >
                  {ruta.estado}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Domiciliario
                </h3>
                <p className="text-gray-900 font-medium">
                  {ruta.domiciliario
                    ? `${ruta.domiciliario.nombres} ${ruta.domiciliario.apellidos}`
                    : "Sin asignar"}
                </p>
                {ruta.domiciliario?.tipo_vehiculo && (
                  <p className="text-sm text-gray-600">
                    {ruta.domiciliario.tipo_vehiculo}
                  </p>
                )}
                {ruta.domiciliario?.telefono && (
                  <p className="text-sm text-gray-600">
                    Tel: {ruta.domiciliario.telefono}
                  </p>
                )}
              </div>

              {ruta.domiciliario && tieneUbicacion(ruta.domiciliario) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Última Ubicación
                  </h3>
                  <div className="text-sm text-gray-700">
                    <p>
                      Lat: {parseFloat(ruta.domiciliario.latitud_actual!).toFixed(6)}
                    </p>
                    <p>
                      Lng: {parseFloat(ruta.domiciliario.longitud_actual!).toFixed(6)}
                    </p>
                    <p
                      className={`mt-1 ${getColorActualizacion(
                        ruta.domiciliario.ultima_actualizacion_ubicacion || null
                      )}`}
                    >
                      {formatearTiempoDesdeActualizacion(
                        ruta.domiciliario.ultima_actualizacion_ubicacion || null
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Fecha de Inicio
                </h3>
                <p className="text-gray-900">{formatearFecha(ruta.fecha_inicio)}</p>
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Progreso</h3>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {ruta.entregasCompletadas} / {ruta.totalEntregas} entregas
                    </span>
                    <span>{ruta.progreso.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-600 to-teal-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${ruta.progreso}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {ruta.totalEntregas}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {ruta.entregasCompletadas}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {ruta.entregasPendientes}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Estimaciones
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    Distancia:{" "}
                    {ruta.distancia_total_km
                      ? `${parseFloat(ruta.distancia_total_km).toFixed(1)} km`
                      : "N/A"}
                  </p>
                  <p>
                    Tiempo estimado:{" "}
                    {ruta.tiempo_estimado_min ? `${ruta.tiempo_estimado_min} min` : "N/A"}
                  </p>
                </div>
              </div>

              {ruta.siguienteEntrega && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                    Próxima Entrega
                  </h4>
                  <p className="text-sm text-yellow-900">
                    {ruta.siguienteEntrega.paciente
                      ? `${ruta.siguienteEntrega.paciente.nombres} ${ruta.siguienteEntrega.paciente.apellidos}`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-yellow-700">
                    {ruta.siguienteEntrega.direccion_entrega}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Entregas Ordenadas */}
          {entregasOrdenadas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Entregas en la Ruta ({entregasOrdenadas.length})
              </h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Orden
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Número
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Paciente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Dirección
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {entregasOrdenadas.map((entrega) => (
                        <tr
                          key={entrega.id_entrega}
                          className={`${
                            entrega.estado === "Entregado"
                              ? "bg-green-50"
                              : "hover:bg-blue-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                entrega.estado === "Entregado"
                                  ? "bg-green-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {entrega.orden_en_ruta}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {entrega.numero_pedido}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {entrega.paciente
                              ? `${entrega.paciente.nombres} ${entrega.paciente.apellidos}`
                              : "N/A"}
                            {entrega.paciente?.telefono_principal && (
                              <div className="text-xs text-gray-500">
                                {entrega.paciente.telefono_principal}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {entrega.direccion_entrega}
                            {entrega.barrio_entrega && (
                              <div className="text-xs text-gray-500">
                                {entrega.barrio_entrega}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {entrega.ciudad_entrega}, {entrega.departamento_entrega}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                entrega.estado === "Entregado"
                                  ? "bg-green-100 text-green-800"
                                  : entrega.estado === "Despachado"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {entrega.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
