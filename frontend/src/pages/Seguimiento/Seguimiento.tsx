/**
 * Página de Seguimiento en Tiempo Real (RF010)
 */

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  fetchRutasActivas,
  fetchUbicacionesDomiciliarios,
  fetchSeguimientoRuta,
  simularMovimiento,
  formatearTiempoDesdeActualizacion,
  getColorActualizacion,
  tieneUbicacion,
  obtenerCoordenadas,
  INTERVALO_ACTUALIZACION_MAPA,
  type DomiciliarioConUbicacion,
  type RutaConSeguimiento,
} from "../../services/Seguimiento/seguimientoService";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../../components/PermissionGuard";
import { RutaDetailsModal } from "./SeguimientoModals";

const Seguimiento: React.FC = () => {
  // ============================================================================
  // PERMISOS
  // ============================================================================
  const { hasPermission } = usePermissions();

  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [rutasActivas, setRutasActivas] = useState<RutaConSeguimiento[]>([]);
  const [domiciliarios, setDomiciliarios] = useState<DomiciliarioConUbicacion[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaConSeguimiento | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filtros
  const [filtroActivos, setFiltroActivos] = useState(true);

  // ============================================================================
  // EFECTOS
  // ============================================================================
  useEffect(() => {
    cargarDatos();
  }, [filtroActivos]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      cargarDatos(false); // false para no mostrar loading en refresh automático
    }, INTERVALO_ACTUALIZACION_MAPA);

    return () => clearInterval(interval);
  }, [autoRefresh, filtroActivos]);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================
  const cargarDatos = async (mostrarLoading = true) => {
    if (mostrarLoading) setLoading(true);
    try {
      await Promise.all([cargarRutasActivas(), cargarDomiciliarios()]);
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      if (mostrarLoading) {
        toast.error("Error al cargar datos de seguimiento");
      }
    } finally {
      if (mostrarLoading) setLoading(false);
    }
  };

  const cargarRutasActivas = async () => {
    try {
      const response = await fetchRutasActivas();
      setRutasActivas(response.rutas);
    } catch (error: any) {
      console.error("Error al cargar rutas activas:", error);
    }
  };

  const cargarDomiciliarios = async () => {
    try {
      const response = await fetchUbicacionesDomiciliarios(filtroActivos);
      setDomiciliarios(response.domiciliarios);
    } catch (error: any) {
      console.error("Error al cargar domiciliarios:", error);
    }
  };

  const cargarDetalleRuta = async (idRuta: number) => {
    try {
      const response = await fetchSeguimientoRuta(idRuta);
      setRutaSeleccionada(response.ruta);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error("Error al cargar detalle de ruta:", error);
      toast.error("Error al cargar detalle de ruta");
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleSimularMovimiento = async (idDomiciliario: number) => {
    try {
      await simularMovimiento(idDomiciliario);
      toast.success("Movimiento simulado");
      cargarDomiciliarios();
    } catch (error: any) {
      console.error("Error al simular movimiento:", error);
      toast.error("Error al simular movimiento");
    }
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(autoRefresh ? "Auto-actualización desactivada" : "Auto-actualización activada");
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Seguimiento en Tiempo Real
            </h1>
            <p className="text-gray-600">
              Monitoreo de domiciliarios y rutas activas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => cargarDatos()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualizar
            </button>
            <button
              onClick={handleToggleAutoRefresh}
              className={`${
                autoRefresh
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {autoRefresh ? "Auto-Actualización ON" : "Auto-Actualización OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rutas Activas */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rutas Activas</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {rutasActivas.length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Domiciliarios en Ruta */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Domiciliarios en Ruta
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {domiciliarios.filter((d) => !d.disponible).length}
                </p>
              </div>
              <div className="bg-cyan-100 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-cyan-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Entregas en Curso */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Entregas en Curso
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {rutasActivas.reduce((sum, ruta) => sum + ruta.entregasPendientes, 0)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Rutas Activas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Rutas en Curso
              </h2>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando...</span>
                </div>
              ) : rutasActivas.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <p className="text-gray-500">No hay rutas activas en este momento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rutasActivas.map((ruta) => (
                    <div
                      key={ruta.id_ruta}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => cargarDetalleRuta(ruta.id_ruta)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {ruta.numero_ruta}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {ruta.domiciliario
                              ? `${ruta.domiciliario.nombres} ${ruta.domiciliario.apellidos}`
                              : "Sin domiciliario asignado"}
                          </p>
                          {ruta.domiciliario?.tipo_vehiculo && (
                            <p className="text-xs text-gray-500">
                              {ruta.domiciliario.tipo_vehiculo}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {ruta.estado}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progreso</span>
                          <span>{ruta.progreso.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${ruta.progreso}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Estadísticas */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-800">
                            {ruta.totalEntregas}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completadas</p>
                          <p className="text-lg font-bold text-green-600">
                            {ruta.entregasCompletadas}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pendientes</p>
                          <p className="text-lg font-bold text-orange-600">
                            {ruta.entregasPendientes}
                          </p>
                        </div>
                      </div>

                      {/* Ubicación */}
                      {ruta.domiciliario && tieneUbicacion(ruta.domiciliario) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            <span
                              className={`text-xs ${getColorActualizacion(
                                ruta.domiciliario.ultima_actualizacion_ubicacion || null
                              )}`}
                            >
                              Última actualización:{" "}
                              {formatearTiempoDesdeActualizacion(
                                ruta.domiciliario.ultima_actualizacion_ubicacion || null
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel de Domiciliarios */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Domiciliarios</h2>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filtroActivos}
                    onChange={(e) => setFiltroActivos(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Solo en ruta</span>
                </label>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : domiciliarios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No hay domiciliarios activos</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {domiciliarios.map((dom) => (
                    <div
                      key={dom.id_domiciliario}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {dom.nombres} {dom.apellidos}
                          </h4>
                          {dom.tipo_vehiculo && (
                            <p className="text-xs text-gray-500">{dom.tipo_vehiculo}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            dom.disponible
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {dom.disponible ? "Disponible" : "Ocupado"}
                        </span>
                      </div>

                      {tieneUbicacion(dom) && (
                        <div className="text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            <span
                              className={getColorActualizacion(
                                dom.ultima_actualizacion_ubicacion || null
                              )}
                            >
                              {formatearTiempoDesdeActualizacion(
                                dom.ultima_actualizacion_ubicacion || null
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Lat: {parseFloat(dom.latitud_actual!).toFixed(4)}, Lng:{" "}
                            {parseFloat(dom.longitud_actual!).toFixed(4)}
                          </div>
                        </div>
                      )}

                      <PermissionGuard permission="actualizar_ubicacion">
                        <button
                          onClick={() => handleSimularMovimiento(dom.id_domiciliario)}
                          className="w-full mt-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-3 rounded transition-colors"
                        >
                          Simular Movimiento
                        </button>
                      </PermissionGuard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Ruta */}
      <RutaDetailsModal
        show={showDetailsModal}
        ruta={rutaSeleccionada}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
};

export default Seguimiento;
