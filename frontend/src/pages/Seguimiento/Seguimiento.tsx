/**
 * Página de Seguimiento en Tiempo Real (RF010)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { analyzeTrackingStatus, predictDeliveryIssues } from "../../services/Seguimiento/seguimientoAIService";
import { usePermissions } from "../../hooks/usePermissions";
import { RutaDetailsModal } from "./SeguimientoModals";

const Seguimiento: React.FC = () => {
  // ============================================================================
  // NAVIGATION Y PERMISOS
  // ============================================================================
  const navigate = useNavigate();
  const { tienePermiso } = usePermissions();

  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [rutasActivas, setRutasActivas] = useState<RutaConSeguimiento[]>([]);
  const [domiciliarios, setDomiciliarios] = useState<DomiciliarioConUbicacion[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaConSeguimiento | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Estados para IA
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

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

  // Análisis con IA
  const handleAnalyzeTracking = async () => {
    setLoadingAI(true);
    setShowAIPanel(true);
    try {
      // Mapear las rutas al formato TrackingData esperado por el servicio de IA
      const trackingsData = rutasActivas.map(ruta => ({
        numeroOrden: `Ruta ${ruta.numero_ruta}`,
        estado: ruta.estado,
        ubicacionActual: ruta.domiciliario?.latitud_actual && ruta.domiciliario?.longitud_actual
          ? `${ruta.domiciliario.latitud_actual}, ${ruta.domiciliario.longitud_actual}`
          : undefined,
        horaEstimadaEntrega: ruta.fecha_finalizacion || undefined,
        eventos: [
          {
            fecha: ruta.fecha_inicio || new Date().toISOString(),
            descripcion: `Ruta iniciada - ${ruta.entregasCompletadas}/${ruta.totalEntregas} entregas completadas`,
            ubicacion: ruta.domiciliario ? `${ruta.domiciliario.nombres} ${ruta.domiciliario.apellidos}` : 'N/A',
          }
        ],
        destinatario: ruta.domiciliario ? `${ruta.domiciliario.nombres} ${ruta.domiciliario.apellidos}` : 'Sin asignar',
        productos: ruta.siguienteEntrega ? [{
          nombre: `Próxima entrega: ${ruta.siguienteEntrega.numero_pedido}`,
          cantidad: 1
        }] : [],
      }));

      // Usar predictDeliveryIssues que acepta un array de trackings
      const analysisText = await predictDeliveryIssues(trackingsData);
      
      // Crear un objeto de análisis con el texto
      setAiAnalysis({
        predicciones: [{
          tipo: 'analisis_general',
          mensaje: analysisText,
        }],
      });
      
      toast.success("Análisis completado");
    } catch (error) {
      console.error("Error al analizar seguimiento:", error);
      toast.error("Error al realizar el análisis con IA");
      setAiAnalysis(null);
    } finally {
      setLoadingAI(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border shadow-md p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/Menu")}
              className="flex items-center text-dark-text hover:text-primary-400 transition-colors"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Volver al Menú</span>
            </button>
            <h1 className="text-3xl font-bold text-dark-text flex items-center gap-2">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Seguimiento en Tiempo Real
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleAnalyzeTracking}
                disabled={loadingAI || rutasActivas.length === 0}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {loadingAI ? "Analizando..." : "Análisis IA"}
              </button>
              <button
                onClick={() => cargarDatos()}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
              <button
                onClick={handleToggleAutoRefresh}
                className={`${
                  autoRefresh
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {autoRefresh ? "Auto-Actualización ON" : "Auto-Actualización OFF"}
              </button>
            </div>
          </div>
          <p className="text-dark-text-secondary mt-2 text-center">
            Monitoreo de domiciliarios y rutas activas
          </p>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rutas Activas */}
            <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg p-6 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-text-secondary text-sm font-medium">Rutas Activas</p>
                  <p className="text-3xl font-bold text-dark-text mt-2">
                    {rutasActivas.length}
                  </p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Domiciliarios en Ruta */}
            <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg p-6 border-l-4 border-l-cyan-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-text-secondary text-sm font-medium">
                    Domiciliarios en Ruta
                  </p>
                  <p className="text-3xl font-bold text-dark-text mt-2">
                    {domiciliarios.filter((d) => !d.disponible).length}
                  </p>
                </div>
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Entregas en Curso */}
            <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-text-secondary text-sm font-medium">
                    Entregas en Curso
                  </p>
                  <p className="text-3xl font-bold text-dark-text mt-2">
                    {rutasActivas.reduce((sum, ruta) => sum + ruta.entregasPendientes, 0)}
                  </p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Análisis IA */}
          {showAIPanel && aiAnalysis && (
            <div className="mb-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-lg p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Análisis Inteligente de Seguimiento</h3>
                </div>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold transition-colors hover:bg-red-500/20 rounded-lg w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 bg-dark-card/80 rounded-lg p-5 border border-blue-500/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-lg">Resumen de Estado</h4>
                    <p className="text-gray-300 leading-relaxed">{aiAnalysis.resumen}</p>
                  </div>
                </div>
              </div>

              {aiAnalysis.predicciones && aiAnalysis.predicciones.length > 0 && (
                <div className="mb-4 bg-dark-card/80 rounded-lg p-5 border border-orange-500/30 shadow-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-3 text-lg">Análisis de Rutas y Entregas</h4>
                      <div className="prose prose-invert max-w-none">
                        {aiAnalysis.predicciones.map((pred: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-300 whitespace-pre-line leading-relaxed mb-3">
                            {pred.mensaje}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4 bg-dark-card/80 rounded-lg p-5 border border-yellow-500/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-3 text-lg">Recomendaciones</h4>
                    <ul className="space-y-3">
                      {aiAnalysis.recomendaciones?.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 group">
                          <span className="text-yellow-400 mt-1 text-lg">•</span>
                          <span className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-dark-card/80 rounded-lg p-5 border border-purple-500/30 shadow-lg">
                <h4 className="font-semibold text-white mb-3 text-lg">Análisis Detallado</h4>
                <p className="text-gray-300 whitespace-pre-line leading-relaxed">{aiAnalysis.analisis_detallado}</p>
              </div>
            </div>
          )}

          {/* Contenido Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Rutas Activas */}
            <div className="lg:col-span-2">
              <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-dark-text mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Rutas en Curso
                </h2>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-dark-text-secondary">Cargando...</span>
                  </div>
                ) : rutasActivas.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-dark-text-secondary/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-dark-text-secondary">No hay rutas activas en este momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rutasActivas.map((ruta) => (
                      <div
                        key={ruta.id_ruta}
                        className="border border-dark-border rounded-lg p-4 hover:bg-primary-500/10 transition-colors cursor-pointer"
                        onClick={() => cargarDetalleRuta(ruta.id_ruta)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-dark-text">
                              {ruta.numero_ruta}
                            </h3>
                            <p className="text-sm text-dark-text-secondary">
                              {ruta.domiciliario
                                ? `${ruta.domiciliario.nombres} ${ruta.domiciliario.apellidos}`
                                : "Sin domiciliario asignado"}
                            </p>
                            {ruta.domiciliario?.tipo_vehiculo && (
                              <p className="text-xs text-dark-text-secondary/70">
                                {ruta.domiciliario.tipo_vehiculo}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">
                              {ruta.estado}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-dark-text-secondary mb-1">
                            <span>Progreso</span>
                            <span>{ruta.progreso.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-dark-bg rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-primary-600 to-primary-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${ruta.progreso}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Estadísticas */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-dark-text-secondary">Total</p>
                            <p className="text-lg font-bold text-dark-text">
                              {ruta.totalEntregas}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-text-secondary">Completadas</p>
                            <p className="text-lg font-bold text-green-400">
                              {ruta.entregasCompletadas}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-text-secondary">Pendientes</p>
                            <p className="text-lg font-bold text-orange-400">
                              {ruta.entregasPendientes}
                            </p>
                          </div>
                        </div>

                        {/* Ubicación */}
                        {ruta.domiciliario && tieneUbicacion(ruta.domiciliario) && (
                          <div className="mt-3 pt-3 border-t border-dark-border">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span className={`text-xs ${getColorActualizacion(ruta.domiciliario.ultima_actualizacion_ubicacion || null)}`}>
                                Última actualización:{" "}
                                {formatearTiempoDesdeActualizacion(ruta.domiciliario.ultima_actualizacion_ubicacion || null)}
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
              <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-dark-text flex items-center gap-2">
                    <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Domiciliarios
                  </h2>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filtroActivos}
                      onChange={(e) => setFiltroActivos(e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-dark-bg border-dark-border rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-dark-text-secondary">Solo en ruta</span>
                  </label>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : domiciliarios.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-dark-text-secondary text-sm">No hay domiciliarios activos</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {domiciliarios.map((dom) => (
                      <div
                        key={dom.id_domiciliario}
                        className="border border-dark-border rounded-lg p-3 hover:bg-primary-500/10 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-dark-text">
                              {dom.nombres} {dom.apellidos}
                            </h4>
                            {dom.tipo_vehiculo && (
                              <p className="text-xs text-dark-text-secondary">{dom.tipo_vehiculo}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              dom.disponible
                                ? "bg-green-500/20 text-green-300"
                                : "bg-orange-500/20 text-orange-300"
                            }`}
                          >
                            {dom.disponible ? "Disponible" : "Ocupado"}
                          </span>
                        </div>

                        {tieneUbicacion(dom) && (
                          <div className="text-xs text-dark-text-secondary mb-2">
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span className={getColorActualizacion(dom.ultima_actualizacion_ubicacion || null)}>
                                {formatearTiempoDesdeActualizacion(dom.ultima_actualizacion_ubicacion || null)}
                              </span>
                            </div>
                            <div className="text-xs text-dark-text-secondary/70 mt-1">
                              Lat: {parseFloat(dom.latitud_actual!).toFixed(4)}, Lng:{" "}
                              {parseFloat(dom.longitud_actual!).toFixed(4)}
                            </div>
                          </div>
                        )}

                        {tienePermiso("actualizar_ubicacion") && (
                          <button
                            onClick={() => handleSimularMovimiento(dom.id_domiciliario)}
                            className="w-full mt-2 text-xs bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 font-medium py-2 px-3 rounded transition-colors"
                          >
                            Simular Movimiento
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
