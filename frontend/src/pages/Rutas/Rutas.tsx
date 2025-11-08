/**
 * Página de Optimización de Rutas (RF009)
 */

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  fetchRutas,
  fetchRuta,
  createRuta,
  asignarDomiciliario,
  cambiarEstadoRuta,
  cancelarRuta,
  fetchEstadisticas,
  type Ruta,
  type RutasParams,
  type CrearRutaData,
  type EstadisticasRutas,
  ESTADOS_RUTA,
  getEstadoColor,
} from "../../services/Rutas/rutasService";
import { fetchDomiciliarios, type Domiciliario } from "../../services/Domiciliarios/domiciliariosService";
import { fetchEntregas, type Entrega } from "../../services/Entregas/entregasService";
import { usePermissions } from "../../hooks/usePermissions";
import {
  FormModal,
  DetailsModal,
  AssignDomiciliarioModal,
  ChangeStatusModal,
  CancelModal,
} from "./RutasModals";

const Rutas: React.FC = () => {
  // ============================================================================
  // PERMISOS
  // ============================================================================
  const { hasPermission } = usePermissions();

  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasRutas | null>(null);
  const [domiciliarios, setDomiciliarios] = useState<Domiciliario[]>([]);
  const [entregasPendientes, setEntregasPendientes] = useState<Entrega[]>([]);

  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [porPagina] = useState(10);

  // Filtros
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroDomiciliario, setFiltroDomiciliario] = useState<string>("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form data para crear ruta
  const [entregasSeleccionadas, setEntregasSeleccionadas] = useState<number[]>([]);
  const [domiciliarioSeleccionado, setDomiciliarioSeleccionado] = useState<number | null>(null);
  const [fechaProgramada, setFechaProgramada] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");

  // Form data para asignar domiciliario
  const [nuevoDomiciliarioId, setNuevoDomiciliarioId] = useState<number | null>(null);

  // Form data para cambiar estado
  const [nuevoEstado, setNuevoEstado] = useState<string>("");

  // Form data para cancelar
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>("");

  // ============================================================================
  // EFECTOS
  // ============================================================================
  useEffect(() => {
    cargarRutas();
    cargarEstadisticas();
    cargarDomiciliarios();
  }, [paginaActual, search, filtroEstado, filtroDomiciliario, filtroFechaDesde, filtroFechaHasta]);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================
  const cargarRutas = async () => {
    setLoading(true);
    try {
      const params: RutasParams = {
        page: paginaActual,
        limit: porPagina,
      };

      if (search) params.search = search;
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroDomiciliario) params.id_domiciliario = parseInt(filtroDomiciliario);
      if (filtroFechaDesde) params.fecha_desde = filtroFechaDesde;
      if (filtroFechaHasta) params.fecha_hasta = filtroFechaHasta;

      const response = await fetchRutas(params);
      setRutas(response.rutas);
      setTotalPaginas(response.paginacion.totalPaginas);
    } catch (error: any) {
      console.error("Error al cargar rutas:", error);
      toast.error(error.response?.data?.message || "Error al cargar rutas");
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetchEstadisticas();
      setEstadisticas(response.estadisticas);
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const cargarDomiciliarios = async () => {
    try {
      const response = await fetchDomiciliarios({ activo: "true", limit: 1000 });
      setDomiciliarios(response.domiciliarios);
    } catch (error: any) {
      console.error("Error al cargar domiciliarios:", error);
    }
  };

  const cargarEntregasPendientes = async () => {
    try {
      const response = await fetchEntregas({
        estado: "Pendiente de Despacho",
        limit: 1000
      });
      setEntregasPendientes(response.entregas);
    } catch (error: any) {
      console.error("Error al cargar entregas pendientes:", error);
      toast.error("Error al cargar entregas pendientes");
    }
  };

  const cargarDetalleRuta = async (id: number) => {
    try {
      const response = await fetchRuta(id);
      setRutaSeleccionada(response.ruta);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error("Error al cargar detalle de ruta:", error);
      toast.error(error.response?.data?.message || "Error al cargar detalle de ruta");
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleCrearRuta = () => {
    setEntregasSeleccionadas([]);
    setDomiciliarioSeleccionado(null);
    setFechaProgramada("");
    setObservaciones("");
    cargarEntregasPendientes();
    setShowCreateModal(true);
  };

  const handleSubmitCrearRuta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entregasSeleccionadas.length === 0) {
      toast.warning("Debe seleccionar al menos una entrega");
      return;
    }

    try {
      const dataToSend: CrearRutaData = {
        entregas: entregasSeleccionadas,
        id_domiciliario: domiciliarioSeleccionado || undefined,
        fecha_programada: fechaProgramada || undefined,
        observaciones: observaciones || undefined,
      };

      await createRuta(dataToSend);
      toast.success("Ruta optimizada creada exitosamente");
      setShowCreateModal(false);
      cargarRutas();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al crear ruta:", error);
      toast.error(error.response?.data?.message || "Error al crear ruta");
    }
  };

  const handleAsignarDomiciliario = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setNuevoDomiciliarioId(ruta.id_domiciliario || null);
    setShowAssignModal(true);
  };

  const handleSubmitAsignarDomiciliario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rutaSeleccionada || !nuevoDomiciliarioId) {
      toast.warning("Debe seleccionar un domiciliario");
      return;
    }

    try {
      await asignarDomiciliario(rutaSeleccionada.id_ruta, nuevoDomiciliarioId);
      toast.success("Domiciliario asignado exitosamente");
      setShowAssignModal(false);
      cargarRutas();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al asignar domiciliario:", error);
      toast.error(error.response?.data?.message || "Error al asignar domiciliario");
    }
  };

  const handleCambiarEstado = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setNuevoEstado(ruta.estado);
    setShowChangeStatusModal(true);
  };

  const handleSubmitCambiarEstado = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rutaSeleccionada || !nuevoEstado) {
      toast.warning("Debe seleccionar un estado");
      return;
    }

    try {
      await cambiarEstadoRuta(rutaSeleccionada.id_ruta, nuevoEstado);
      toast.success("Estado cambiado exitosamente");
      setShowChangeStatusModal(false);
      cargarRutas();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      toast.error(error.response?.data?.message || "Error al cambiar estado");
    }
  };

  const handleCancelar = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setMotivoCancelacion("");
    setShowCancelModal(true);
  };

  const handleSubmitCancelar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rutaSeleccionada) return;

    if (!motivoCancelacion.trim()) {
      toast.warning("Debe ingresar el motivo de cancelación");
      return;
    }

    try {
      await cancelarRuta(rutaSeleccionada.id_ruta, motivoCancelacion);
      toast.success("Ruta cancelada exitosamente");
      setShowCancelModal(false);
      cargarRutas();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al cancelar ruta:", error);
      toast.error(error.response?.data?.message || "Error al cancelar ruta");
    }
  };

  const handleToggleEntrega = (idEntrega: number) => {
    setEntregasSeleccionadas((prev) =>
      prev.includes(idEntrega)
        ? prev.filter((id) => id !== idEntrega)
        : [...prev, idEntrega]
    );
  };

  const handleSeleccionarTodasEntregas = () => {
    if (entregasSeleccionadas.length === entregasPendientes.length) {
      setEntregasSeleccionadas([]);
    } else {
      setEntregasSeleccionadas(entregasPendientes.map((e) => e.id_entrega));
    }
  };

  // ============================================================================
  // PAGINACIÓN
  // ============================================================================
  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const handlePaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================
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

  const formatearFechaCorta = (fecha: string | null | undefined): string => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-CO");
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
              Optimización de Rutas
            </h1>
            <p className="text-gray-600">
              Gestión de rutas optimizadas de entrega
            </p>
          </div>
          {hasPermission("crear_rutas") && (
            <button
              onClick={handleCrearRuta}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nueva Ruta Optimizada
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total Rutas */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Rutas</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {estadisticas.totalRutas}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg
                    className="w-8 h-8 text-blue-600"
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

            {/* Rutas Pendientes */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pendientes</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {estadisticas.rutasPendientes}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg
                    className="w-8 h-8 text-yellow-600"
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
                </div>
              </div>
            </div>

            {/* Rutas En Curso */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">En Curso</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {estadisticas.rutasEnCurso}
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Rutas Completadas */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completadas</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {estadisticas.rutasCompletadas}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Distancia Total */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Distancia Total</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {estadisticas.distanciaTotal.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">kilómetros</p>
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Número de ruta..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {ESTADOS_RUTA.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            {/* Domiciliario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domiciliario
              </label>
              <select
                value={filtroDomiciliario}
                onChange={(e) => {
                  setFiltroDomiciliario(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {domiciliarios.map((dom) => (
                  <option key={dom.id_domiciliario} value={dom.id_domiciliario}>
                    {dom.nombres} {dom.apellidos}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => {
                  setFiltroFechaDesde(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => {
                  setFiltroFechaHasta(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Rutas */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Número de Ruta
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Domiciliario
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Fecha Programada
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Entregas
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Distancia
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Tiempo Est.
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : rutas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron rutas
                    </td>
                  </tr>
                ) : (
                  rutas.map((ruta) => (
                    <tr
                      key={ruta.id_ruta}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {ruta.numero_ruta}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {ruta.domiciliario
                            ? `${ruta.domiciliario.nombres} ${ruta.domiciliario.apellidos}`
                            : "Sin asignar"}
                        </div>
                        {ruta.domiciliario?.tipo_vehiculo && (
                          <div className="text-xs text-gray-500">
                            {ruta.domiciliario.tipo_vehiculo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatearFechaCorta(ruta.fecha_programada)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(
                            ruta.estado
                          )}`}
                        >
                          {ruta.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ruta._count?.entregas || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ruta.distancia_total_km
                          ? `${parseFloat(ruta.distancia_total_km).toFixed(1)} km`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ruta.tiempo_estimado_min
                          ? `${ruta.tiempo_estimado_min} min`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {/* Ver Detalle */}
                          {hasPermission("ver_rutas") && (
                            <button
                              onClick={() => cargarDetalleRuta(ruta.id_ruta)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                              title="Ver detalle"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Asignar Domiciliario */}
                          {ruta.estado === "Pendiente" && hasPermission("asignar_rutas") && (
                            <button
                              onClick={() => handleAsignarDomiciliario(ruta)}
                              className="text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors"
                              title="Asignar domiciliario"
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
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Cambiar Estado */}
                          {ruta.estado !== "Cancelada" &&
                            ruta.estado !== "Completada" && hasPermission("gestionar_rutas") && (
                              <button
                                onClick={() => handleCambiarEstado(ruta)}
                                className="text-green-600 hover:text-green-800 font-medium text-sm transition-colors"
                                title="Cambiar estado"
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </button>
                            )}

                          {/* Cancelar Ruta */}
                          {ruta.estado !== "Cancelada" &&
                            ruta.estado !== "Completada" && hasPermission("cancelar_rutas") && (
                              <button
                                onClick={() => handleCancelar(ruta)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                                title="Cancelar ruta"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Página {paginaActual} de {totalPaginas}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePaginaAnterior}
                    disabled={paginaActual === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handlePaginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FormModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitCrearRuta}
        entregasPendientes={entregasPendientes}
        entregasSeleccionadas={entregasSeleccionadas}
        domiciliarios={domiciliarios}
        domiciliarioSeleccionado={domiciliarioSeleccionado}
        setDomiciliarioSeleccionado={setDomiciliarioSeleccionado}
        fechaProgramada={fechaProgramada}
        setFechaProgramada={setFechaProgramada}
        observaciones={observaciones}
        setObservaciones={setObservaciones}
        onToggleEntrega={handleToggleEntrega}
        onSeleccionarTodas={handleSeleccionarTodasEntregas}
      />

      <DetailsModal
        show={showDetailsModal}
        ruta={rutaSeleccionada}
        onClose={() => setShowDetailsModal(false)}
      />

      <AssignDomiciliarioModal
        show={showAssignModal}
        ruta={rutaSeleccionada}
        domiciliarios={domiciliarios}
        nuevoDomiciliarioId={nuevoDomiciliarioId}
        setNuevoDomiciliarioId={setNuevoDomiciliarioId}
        onClose={() => setShowAssignModal(false)}
        onSubmit={handleSubmitAsignarDomiciliario}
      />

      <ChangeStatusModal
        show={showChangeStatusModal}
        ruta={rutaSeleccionada}
        nuevoEstado={nuevoEstado}
        setNuevoEstado={setNuevoEstado}
        onClose={() => setShowChangeStatusModal(false)}
        onSubmit={handleSubmitCambiarEstado}
      />

      <CancelModal
        show={showCancelModal}
        ruta={rutaSeleccionada}
        motivoCancelacion={motivoCancelacion}
        setMotivoCancelacion={setMotivoCancelacion}
        onClose={() => setShowCancelModal(false)}
        onSubmit={handleSubmitCancelar}
      />
    </div>
  );
};

export default Rutas;
