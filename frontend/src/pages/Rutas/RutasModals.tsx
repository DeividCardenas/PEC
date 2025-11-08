/**
 * Componentes de Modales para Rutas (RF009)
 */

import React from "react";
import { type Ruta } from "../../services/Rutas/rutasService";
import { type Domiciliario } from "../../services/Domiciliarios/domiciliariosService";
import { type Entrega } from "../../services/Entregas/entregasService";
import { ESTADOS_RUTA, getEstadoColor } from "../../services/Rutas/rutasService";

// ============================================================================
// INTERFACES DE PROPS
// ============================================================================

interface FormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  entregasPendientes: Entrega[];
  entregasSeleccionadas: number[];
  domiciliarios: Domiciliario[];
  domiciliarioSeleccionado: number | null;
  setDomiciliarioSeleccionado: (id: number | null) => void;
  fechaProgramada: string;
  setFechaProgramada: (fecha: string) => void;
  observaciones: string;
  setObservaciones: (obs: string) => void;
  onToggleEntrega: (id: number) => void;
  onSeleccionarTodas: () => void;
}

interface DetailsModalProps {
  show: boolean;
  ruta: Ruta | null;
  onClose: () => void;
}

interface AssignDomiciliarioModalProps {
  show: boolean;
  ruta: Ruta | null;
  domiciliarios: Domiciliario[];
  nuevoDomiciliarioId: number | null;
  setNuevoDomiciliarioId: (id: number | null) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface ChangeStatusModalProps {
  show: boolean;
  ruta: Ruta | null;
  nuevoEstado: string;
  setNuevoEstado: (estado: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface CancelModalProps {
  show: boolean;
  ruta: Ruta | null;
  motivoCancelacion: string;
  setMotivoCancelacion: (motivo: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

// ============================================================================
// MODAL: CREAR RUTA OPTIMIZADA
// ============================================================================

export const FormModal: React.FC<FormModalProps> = ({
  show,
  onClose,
  onSubmit,
  entregasPendientes,
  entregasSeleccionadas,
  domiciliarios,
  domiciliarioSeleccionado,
  setDomiciliarioSeleccionado,
  fechaProgramada,
  setFechaProgramada,
  observaciones,
  setObservaciones,
  onToggleEntrega,
  onSeleccionarTodas,
}) => {
  if (!show) return null;

  const formatearMoneda = (valor: number | string): string => {
    const numero = typeof valor === "string" ? parseFloat(valor) : valor;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numero);
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString("es-CO");
  };

  const domiciliariosDisponibles = domiciliarios.filter((d) => d.disponible && d.activo);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Nueva Ruta Optimizada</h2>
              <p className="text-blue-100 mt-1">
                Seleccione las entregas y el sistema optimizará la ruta
              </p>
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

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-6">
            {/* Información de la Ruta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Domiciliario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domiciliario (Opcional)
                </label>
                <select
                  value={domiciliarioSeleccionado || ""}
                  onChange={(e) =>
                    setDomiciliarioSeleccionado(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin asignar</option>
                  {domiciliariosDisponibles.map((dom) => (
                    <option key={dom.id_domiciliario} value={dom.id_domiciliario}>
                      {dom.nombres} {dom.apellidos}
                      {dom.tipo_vehiculo && ` - ${dom.tipo_vehiculo}`}
                    </option>
                  ))}
                </select>
                {domiciliariosDisponibles.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    No hay domiciliarios disponibles
                  </p>
                )}
              </div>

              {/* Fecha Programada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Programada (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales sobre la ruta..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Selección de Entregas */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Seleccionar Entregas Pendientes *
                </label>
                <button
                  type="button"
                  onClick={onSeleccionarTodas}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {entregasSeleccionadas.length === entregasPendientes.length
                    ? "Deseleccionar todas"
                    : "Seleccionar todas"}
                </button>
              </div>

              {entregasPendientes.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <svg
                    className="w-12 h-12 text-amber-500 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-amber-800 font-medium">
                    No hay entregas pendientes de despacho
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    Debe crear entregas primero en el módulo de Entregas
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Sel.
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
                            Ciudad
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {entregasPendientes.map((entrega) => (
                          <tr
                            key={entrega.id_entrega}
                            className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                              entregasSeleccionadas.includes(entrega.id_entrega)
                                ? "bg-blue-100"
                                : ""
                            }`}
                            onClick={() => onToggleEntrega(entrega.id_entrega)}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={entregasSeleccionadas.includes(
                                  entrega.id_entrega
                                )}
                                onChange={() => onToggleEntrega(entrega.id_entrega)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {entrega.numero_pedido}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {entrega.paciente
                                ? `${entrega.paciente.nombres} ${entrega.paciente.apellidos}`
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {entrega.direccion_entrega}
                              {entrega.barrio_entrega && (
                                <div className="text-xs text-gray-500">
                                  {entrega.barrio_entrega}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {entrega.ciudad_entrega}
                              {entrega.departamento_entrega && (
                                <div className="text-xs text-gray-500">
                                  {entrega.departamento_entrega}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatearMoneda(entrega.total)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {formatearFecha(entrega.fecha_pedido)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {entregasSeleccionadas.length > 0 && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">
                      {entregasSeleccionadas.length}
                    </span>{" "}
                    {entregasSeleccionadas.length === 1
                      ? "entrega seleccionada"
                      : "entregas seleccionadas"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    El sistema calculará automáticamente la ruta óptima
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={entregasSeleccionadas.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Ruta Optimizada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: VER DETALLE DE RUTA
// ============================================================================

export const DetailsModal: React.FC<DetailsModalProps> = ({
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
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{ruta.numero_ruta}</h2>
              <p className="text-blue-100 mt-1">Detalle de la Ruta</p>
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
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Fecha Programada
                </h3>
                <p className="text-gray-900">
                  {formatearFecha(ruta.fecha_programada)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Fecha Inicio
                </h3>
                <p className="text-gray-900">{formatearFecha(ruta.fecha_inicio)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Fecha Finalización
                </h3>
                <p className="text-gray-900">
                  {formatearFecha(ruta.fecha_finalizacion)}
                </p>
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Número de Entregas
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {entregasOrdenadas.length}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Distancia Total Estimada
                </h3>
                <p className="text-2xl font-bold text-cyan-600">
                  {ruta.distancia_total_km
                    ? `${parseFloat(ruta.distancia_total_km).toFixed(1)} km`
                    : "N/A"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Tiempo Estimado
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {ruta.tiempo_estimado_min
                    ? `${ruta.tiempo_estimado_min} min`
                    : "N/A"}
                </p>
              </div>

              {ruta.observaciones && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Observaciones
                  </h3>
                  <p className="text-gray-900">{ruta.observaciones}</p>
                </div>
              )}

              {ruta.motivo_cancelacion && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Motivo de Cancelación
                  </h3>
                  <p className="text-red-700 font-medium">
                    {ruta.motivo_cancelacion}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Entregas Ordenadas */}
          {entregasOrdenadas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Ruta Optimizada ({entregasOrdenadas.length} paradas)
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
                          Ciudad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {entregasOrdenadas.map((entrega) => (
                        <tr key={entrega.id_entrega} className="hover:bg-blue-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
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
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {entrega.direccion_entrega}
                            {entrega.barrio_entrega && (
                              <div className="text-xs text-gray-500">
                                {entrega.barrio_entrega}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {entrega.ciudad_entrega}
                            {entrega.departamento_entrega && (
                              <div className="text-xs text-gray-500">
                                {entrega.departamento_entrega}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatearMoneda(entrega.total)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
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

// ============================================================================
// MODAL: ASIGNAR DOMICILIARIO
// ============================================================================

export const AssignDomiciliarioModal: React.FC<
  AssignDomiciliarioModalProps
> = ({
  show,
  ruta,
  domiciliarios,
  nuevoDomiciliarioId,
  setNuevoDomiciliarioId,
  onClose,
  onSubmit,
}) => {
  if (!show || !ruta) return null;

  const domiciliariosDisponibles = domiciliarios.filter(
    (d) => d.activo && (d.disponible || d.id_domiciliario === ruta.id_domiciliario)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Asignar Domiciliario</h2>
          <p className="text-purple-100 mt-1">{ruta.numero_ruta}</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Domiciliario *
              </label>
              <select
                value={nuevoDomiciliarioId || ""}
                onChange={(e) =>
                  setNuevoDomiciliarioId(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Seleccione un domiciliario --</option>
                {domiciliariosDisponibles.map((dom) => (
                  <option key={dom.id_domiciliario} value={dom.id_domiciliario}>
                    {dom.nombres} {dom.apellidos}
                    {dom.tipo_vehiculo && ` - ${dom.tipo_vehiculo}`}
                    {!dom.disponible && " (Ocupado)"}
                  </option>
                ))}
              </select>
              {domiciliariosDisponibles.length === 0 && (
                <p className="text-sm text-red-600 mt-2">
                  No hay domiciliarios disponibles
                </p>
              )}
            </div>

            {nuevoDomiciliarioId && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  El domiciliario será marcado como ocupado al asignar esta ruta
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nuevoDomiciliarioId}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Asignar Domiciliario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: CAMBIAR ESTADO
// ============================================================================

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  show,
  ruta,
  nuevoEstado,
  setNuevoEstado,
  onClose,
  onSubmit,
}) => {
  if (!show || !ruta) return null;

  // Estados válidos según el estado actual
  const getEstadosPermitidos = (): string[] => {
    switch (ruta.estado) {
      case "Pendiente":
        return ["En Curso"];
      case "En Curso":
        return ["Completada"];
      default:
        return [];
    }
  };

  const estadosPermitidos = getEstadosPermitidos();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Cambiar Estado</h2>
          <p className="text-green-100 mt-1">{ruta.numero_ruta}</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Actual
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(
                  ruta.estado
                )}`}
              >
                {ruta.estado}
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevo Estado *
              </label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">-- Seleccione un estado --</option>
                {estadosPermitidos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            {nuevoEstado === "En Curso" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Se registrará la fecha de inicio de la ruta
                </p>
              </div>
            )}

            {nuevoEstado === "Completada" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Se registrará la fecha de finalización y el domiciliario quedará
                  disponible
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nuevoEstado || nuevoEstado === ruta.estado}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cambiar Estado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: CANCELAR RUTA
// ============================================================================

export const CancelModal: React.FC<CancelModalProps> = ({
  show,
  ruta,
  motivoCancelacion,
  setMotivoCancelacion,
  onClose,
  onSubmit,
}) => {
  if (!show || !ruta) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Cancelar Ruta</h2>
          <p className="text-red-100 mt-1">{ruta.numero_ruta}</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de Cancelación *
              </label>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                required
                rows={4}
                placeholder="Ingrese el motivo de cancelación de la ruta..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">
                    ¡Advertencia!
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Las entregas volverán a estado "Pendiente de Despacho"</li>
                    <li>• El domiciliario quedará disponible</li>
                    <li>• Esta acción no se puede deshacer</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              No, Mantener
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 font-medium transition-all shadow-lg"
            >
              Sí, Cancelar Ruta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
