/**
 * Página de Optimización de Rutas (RF009)
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, UserPlus, CheckCircle, XCircle } from "lucide-react";
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
import Table, { Column } from "../../components/Table";
import Card, { CardContent } from "../../components/Card";
import Button from "../../components/Button";
import Pagination from "../../components/Pagination";
import {
  FormModal,
  DetailsModal,
  AssignDomiciliarioModal,
  ChangeStatusModal,
  CancelModal,
} from "./RutasModals";

const Rutas: React.FC = () => {
  // ============================================================================
  // HOOKS
  // ============================================================================
  const navigate = useNavigate();
  const { tienePermiso } = usePermissions();

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
  // HELPERS
  // ============================================================================
  const formatearFechaCorta = (fecha: string | null | undefined): string => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-CO");
  };

  // ============================================================================
  // DEFINICIÓN DE COLUMNAS
  // ============================================================================
  const rutasColumns: Column<Ruta>[] = [
    {
      key: 'numero_ruta',
      title: 'Número de Ruta',
      align: 'left',
      render: (val) => <div className="font-medium text-gray-900">{val}</div>,
    },
    {
      key: 'domiciliario',
      title: 'Domiciliario',
      align: 'left',
      render: (val: any) => (
        <div>
          <div className="text-sm text-gray-900">
            {val ? `${val.nombres} ${val.apellidos}` : 'Sin asignar'}
          </div>
          {val?.tipo_vehiculo && (
            <div className="text-xs text-gray-500">{val.tipo_vehiculo}</div>
          )}
        </div>
      ),
    },
    {
      key: 'fecha_programada',
      title: 'Fecha Programada',
      align: 'left',
      render: (val) => <div className="text-sm text-gray-900">{formatearFechaCorta(val)}</div>,
    },
    {
      key: 'estado',
      title: 'Estado',
      align: 'center',
      render: (val) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(val)}`}>
          {val}
        </span>
      ),
    },
    {
      key: '_count',
      title: 'Entregas',
      align: 'center',
      render: (val: any) => <div className="text-sm text-gray-900">{val?.entregas || 0}</div>,
    },
    {
      key: 'distancia_total_km',
      title: 'Distancia',
      align: 'center',
      render: (val) => (
        <div className="text-sm text-gray-900">
          {val ? `${parseFloat(val).toFixed(1)} km` : 'N/A'}
        </div>
      ),
    },
    {
      key: 'tiempo_estimado_min',
      title: 'Tiempo Est.',
      align: 'center',
      render: (val) => (
        <div className="text-sm text-gray-900">
          {val ? `${val} min` : 'N/A'}
        </div>
      ),
    },
    {
      key: 'id_ruta',
      title: 'Acciones',
      align: 'center',
      render: (_, ruta) => (
        <div className="flex justify-center gap-2">
          {tienePermiso('ver_rutas') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cargarDetalleRuta(ruta.id_ruta)}
              icon={<Eye size={16} />}
              title="Ver detalle"
            />
          )}
          {ruta.estado === 'Pendiente' && tienePermiso('asignar_rutas') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAsignarDomiciliario(ruta)}
              icon={<UserPlus size={16} />}
              title="Asignar domiciliario"
            />
          )}
          {ruta.estado !== 'Cancelada' && ruta.estado !== 'Completada' && tienePermiso('gestionar_rutas') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCambiarEstado(ruta)}
              icon={<CheckCircle size={16} />}
              title="Cambiar estado"
            />
          )}
          {ruta.estado !== 'Cancelada' && ruta.estado !== 'Completada' && tienePermiso('cancelar_rutas') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCancelar(ruta)}
              icon={<XCircle size={16} />}
              title="Cancelar ruta"
            />
          )}
        </div>
      ),
    },
  ];

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
        entregas_ids: entregasSeleccionadas,
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
      await asignarDomiciliario(rutaSeleccionada.id_ruta, { id_domiciliario: nuevoDomiciliarioId });
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
      await cambiarEstadoRuta(rutaSeleccionada.id_ruta, { nuevo_estado: nuevoEstado });
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
      await cancelarRuta(rutaSeleccionada.id_ruta, { motivo: motivoCancelacion });
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
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/Menu")}
            className="flex items-center text-dark-text hover:text-primary-400 transition-colors px-4 py-2 rounded-lg hover:bg-dark-bg"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Volver al Menú</span>
          </button>

          <h1 className="text-3xl font-bold text-dark-text flex items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Optimización de Rutas
          </h1>

          {tienePermiso("crear_rutas") && (
            <button
              onClick={handleCrearRuta}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Ruta Optimizada
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

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
                    {estadisticas.distanciaTotal ? estadisticas.distanciaTotal.toFixed(1) : '0.0'}
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
      <Card>
        <CardContent>
          <Pagination
            currentPage={paginaActual}
            totalPages={totalPaginas}
            onPageChange={setPaginaActual}
          />
          
          <Table
            columns={rutasColumns}
            data={rutas}
            keyExtractor={(row) => row.id_ruta}
            loading={loading}
            striped
            hoverable
            emptyMessage="No se encontraron rutas"
          />
        </CardContent>
      </Card>

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
      </div>
    </div>
  );
};

export default Rutas;
