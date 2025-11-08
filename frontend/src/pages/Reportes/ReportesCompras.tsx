/**
 * Página de Reportes de Compras (RF005)
 * Genera reportes de compras por período, proveedor, laboratorio y otros criterios
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, TrendingUp, Users, Package } from "lucide-react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faChartBar,
  faTable,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchReporteCompras,
  fetchTopProveedores,
  fetchTendencias,
  exportarReporteCSV,
  fetchResumenEjecutivo,
  FiltrosReporte,
  ReporteComprasResponse,
  TopProveedorData,
  TendenciaData,
  ResumenEjecutivoResponse,
} from "../../services/Reportes/reportesService";
import { fetchProveedores } from "../../services/Proveedores/proveedoresService";
import { fetchLaboratorios } from "../../services/Empresa/empresasService";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";

const ReportesCompras = () => {
  const navigate = useNavigate();

  // Estados de datos
  const [reporte, setReporte] = useState<ReporteComprasResponse | null>(null);
  const [resumenEjecutivo, setResumenEjecutivo] = useState<ResumenEjecutivoResponse | null>(null);
  const [topProveedores, setTopProveedores] = useState<TopProveedorData[]>([]);
  const [tendencias, setTendencias] = useState<TendenciaData[]>([]);

  // Estados de UI
  const [tabActiva, setTabActiva] = useState<"reporte" | "resumen" | "tendencias">("reporte");
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    page: 1,
    limit: 20,
  });
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | undefined>();
  const [laboratorioSeleccionado, setLaboratorioSeleccionado] = useState<number | undefined>();
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [agruparPor, setAgruparPor] = useState<"proveedor" | "laboratorio" | "mes" | "estado" | "">(
    ""
  );

  // Listas para dropdowns
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [laboratorios, setLaboratorios] = useState<any[]>([]);

  // Cargar proveedores y laboratorios
  useEffect(() => {
    cargarProveedores();
    cargarLaboratorios();
  }, []);

  const cargarProveedores = async () => {
    try {
      const response = await fetchProveedores({ limit: 1000, activo: "true" });
      setProveedores(response.proveedores);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  const cargarLaboratorios = async () => {
    try {
      const response = await fetchLaboratorios({ limit: 1000 });
      setLaboratorios(response.laboratorios);
    } catch (error) {
      console.error("Error al cargar laboratorios:", error);
    }
  };

  // Cargar reporte
  const cargarReporte = async () => {
    setLoading(true);
    try {
      const response = await fetchReporteCompras(filtros);
      setReporte(response);
    } catch (error: any) {
      console.error("Error al cargar reporte:", error);
      toast.error("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  // Cargar resumen ejecutivo
  const cargarResumenEjecutivo = async () => {
    setLoading(true);
    try {
      const response = await fetchResumenEjecutivo(filtros.fecha_desde, filtros.fecha_hasta);
      setResumenEjecutivo(response);

      // También cargar top proveedores
      const topProvResponse = await fetchTopProveedores(
        filtros.fecha_desde,
        filtros.fecha_hasta,
        5
      );
      setTopProveedores(topProvResponse.topProveedores);
    } catch (error: any) {
      console.error("Error al cargar resumen ejecutivo:", error);
      toast.error("Error al generar el resumen ejecutivo");
    } finally {
      setLoading(false);
    }
  };

  // Cargar tendencias
  const cargarTendencias = async () => {
    setLoading(true);
    try {
      const response = await fetchTendencias(
        filtros.fecha_desde,
        filtros.fecha_hasta,
        filtros.id_proveedor
      );
      setTendencias(response.tendencias);
    } catch (error: any) {
      console.error("Error al cargar tendencias:", error);
      toast.error("Error al generar tendencias");
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    const nuevosFiltros: FiltrosReporte = {
      ...filtros,
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      id_proveedor: proveedorSeleccionado || undefined,
      id_laboratorio: laboratorioSeleccionado || undefined,
      estado: estadoSeleccionado || undefined,
      agrupar_por: agruparPor || undefined,
      page: 1,
    };
    setFiltros(nuevosFiltros);
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setProveedorSeleccionado(undefined);
    setLaboratorioSeleccionado(undefined);
    setEstadoSeleccionado("");
    setAgruparPor("");
    setFiltros({ page: 1, limit: 20 });
  };

  // Exportar a CSV
  const handleExportarCSV = async () => {
    setExportando(true);
    try {
      const blob = await exportarReporteCSV(filtros);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_compras_${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Reporte exportado exitosamente");
    } catch (error: any) {
      console.error("Error al exportar reporte:", error);
      toast.error("Error al exportar el reporte");
    } finally {
      setExportando(false);
    }
  };

  // Cargar datos según tab activa
  useEffect(() => {
    if (tabActiva === "reporte") {
      cargarReporte();
    } else if (tabActiva === "resumen") {
      cargarResumenEjecutivo();
    } else if (tabActiva === "tendencias") {
      cargarTendencias();
    }
  }, [filtros, tabActiva]);

  // Cambiar página
  const handleCambiarPagina = (nuevaPagina: number) => {
    setFiltros({ ...filtros, page: nuevaPagina });
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <header className="bg-primary-900 border-b border-primary-800 shadow-lg p-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/Menu")}
          className="flex items-center text-white hover:text-primary-300 transition-colors px-4 py-2 rounded-lg hover:bg-primary-800"
        >
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faChartBar} />
          Reportes de Compras
        </h1>
        <div className="w-32"></div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Filtros */}
        <div className="bg-dark-card border border-dark-border rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faFilter} className="text-primary-400" />
            <h2 className="text-lg font-semibold text-dark-text">Filtros de Búsqueda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Fecha Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full p-2 bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full p-2 bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Proveedor</label>
              <select
                value={proveedorSeleccionado || ""}
                onChange={(e) =>
                  setProveedorSeleccionado(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full p-2 bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((prov) => (
                  <option key={prov.id_proveedor} value={prov.id_proveedor}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Laboratorio */}
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Laboratorio</label>
              <select
                value={laboratorioSeleccionado || ""}
                onChange={(e) =>
                  setLaboratorioSeleccionado(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full p-2 bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los laboratorios</option>
                {laboratorios.map((lab) => (
                  <option key={lab.id_laboratorio} value={lab.id_laboratorio}>
                    {lab.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Estado</label>
              <select
                value={estadoSeleccionado}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                className="w-full p-2 bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completada">Completada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>

            {/* Agrupar por */}
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">Agrupar Por</label>
              <select
                value={agruparPor}
                onChange={(e) =>
                  setAgruparPor(e.target.value as "proveedor" | "laboratorio" | "mes" | "estado" | "")
                }
                className="w-full p-2 bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sin agrupación</option>
                <option value="proveedor">Proveedor</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="mes">Mes</option>
                <option value="estado">Estado</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAplicarFiltros}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 shadow-md transition-colors"
            >
              <FontAwesomeIcon icon={faFilter} />
              Aplicar Filtros
            </button>
            <button
              onClick={handleLimpiarFiltros}
              className="px-4 py-2 bg-dark-bg-secondary hover:bg-dark-bg-tertiary border border-dark-border text-dark-text rounded-lg transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleExportarCSV}
              disabled={exportando}
              className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-md transition-colors"
            >
              <FontAwesomeIcon icon={faFileExcel} />
              {exportando ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-dark-card border border-dark-border rounded-lg shadow-lg">
          <div className="border-b border-dark-border px-4">
            <div className="flex gap-4">
              <button
                onClick={() => setTabActiva("reporte")}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  tabActiva === "reporte"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-dark-text-secondary hover:text-dark-text"
                }`}
              >
                <FontAwesomeIcon icon={faTable} className="mr-2" />
                Reporte Detallado
              </button>
              <button
                onClick={() => setTabActiva("resumen")}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  tabActiva === "resumen"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-dark-text-secondary hover:text-dark-text"
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                Resumen Ejecutivo
              </button>
              <button
                onClick={() => setTabActiva("tendencias")}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  tabActiva === "tendencias"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-dark-text-secondary hover:text-dark-text"
                }`}
              >
                <TrendingUp size={16} className="inline mr-2" />
                Tendencias
              </button>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" color="text-primary-500" text="Generando reporte..." />
              </div>
            ) : (
              <>
                {/* Tab de Reporte */}
                {tabActiva === "reporte" && reporte && (
                  <div className="space-y-4">
                    {/* Estadísticas generales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-primary-900/30 border border-primary-700 rounded-lg p-4">
                        <p className="text-sm text-dark-text-secondary">Total Órdenes</p>
                        <p className="text-2xl font-bold text-primary-400">
                          {reporte.estadisticas.totalOrdenes}
                        </p>
                      </div>
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                        <p className="text-sm text-dark-text-secondary">Monto Total</p>
                        <p className="text-xl font-bold text-green-400">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(Number(reporte.estadisticas.montoTotal))}
                        </p>
                      </div>
                      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                        <p className="text-sm text-dark-text-secondary">Promedio por Orden</p>
                        <p className="text-xl font-bold text-blue-400">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(Number(reporte.estadisticas.promedioOrden))}
                        </p>
                      </div>
                      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                        <p className="text-sm text-dark-text-secondary">Total Impuestos</p>
                        <p className="text-xl font-bold text-purple-400">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(Number(reporte.estadisticas.impuestosTotal))}
                        </p>
                      </div>
                    </div>

                    {/* Datos agrupados */}
                    {reporte.datosAgrupados && reporte.datosAgrupados.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3 text-dark-text">
                          Datos Agrupados por {filtros.agrupar_por}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-dark-bg-secondary border border-dark-border rounded-lg">
                            <thead className="bg-primary-900/50 text-dark-text">
                              <tr>
                                {filtros.agrupar_por === "proveedor" && (
                                  <>
                                    <th className="p-3 text-left">Proveedor</th>
                                    <th className="p-3 text-right">Órdenes</th>
                                    <th className="p-3 text-right">Monto Total</th>
                                  </>
                                )}
                                {filtros.agrupar_por === "laboratorio" && (
                                  <>
                                    <th className="p-3 text-left">Laboratorio</th>
                                    <th className="p-3 text-right">Productos</th>
                                    <th className="p-3 text-right">Unidades</th>
                                    <th className="p-3 text-right">Monto Total</th>
                                  </>
                                )}
                                {filtros.agrupar_por === "mes" && (
                                  <>
                                    <th className="p-3 text-left">Período</th>
                                    <th className="p-3 text-right">Órdenes</th>
                                    <th className="p-3 text-right">Monto Total</th>
                                  </>
                                )}
                                {filtros.agrupar_por === "estado" && (
                                  <>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-right">Órdenes</th>
                                    <th className="p-3 text-right">Monto Total</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody className="text-dark-text">
                              {reporte.datosAgrupados.map((dato, index) => (
                                <tr key={index} className="border-t border-dark-border hover:bg-dark-card-hover">
                                  {filtros.agrupar_por === "proveedor" && (
                                    <>
                                      <td className="p-3">{dato.proveedor?.nombre}</td>
                                      <td className="p-3 text-right">{dato.cantidadOrdenes}</td>
                                      <td className="p-3 text-right font-semibold">
                                        {new Intl.NumberFormat("es-CO", {
                                          style: "currency",
                                          currency: "COP",
                                          minimumFractionDigits: 0,
                                        }).format(Number(dato.montoTotal))}
                                      </td>
                                    </>
                                  )}
                                  {filtros.agrupar_por === "laboratorio" && (
                                    <>
                                      <td className="p-3">{dato.laboratorio?.nombre}</td>
                                      <td className="p-3 text-right">{dato.cantidadProductos}</td>
                                      <td className="p-3 text-right">{dato.cantidadUnidades}</td>
                                      <td className="p-3 text-right font-semibold">
                                        {new Intl.NumberFormat("es-CO", {
                                          style: "currency",
                                          currency: "COP",
                                          minimumFractionDigits: 0,
                                        }).format(Number(dato.montoTotal))}
                                      </td>
                                    </>
                                  )}
                                  {filtros.agrupar_por === "mes" && (
                                    <>
                                      <td className="p-3">{dato.periodo}</td>
                                      <td className="p-3 text-right">{dato.cantidadOrdenes}</td>
                                      <td className="p-3 text-right font-semibold">
                                        {new Intl.NumberFormat("es-CO", {
                                          style: "currency",
                                          currency: "COP",
                                          minimumFractionDigits: 0,
                                        }).format(Number(dato.montoTotal))}
                                      </td>
                                    </>
                                  )}
                                  {filtros.agrupar_por === "estado" && (
                                    <>
                                      <td className="p-3 capitalize">{dato.estado}</td>
                                      <td className="p-3 text-right">{dato.cantidadOrdenes}</td>
                                      <td className="p-3 text-right font-semibold">
                                        {new Intl.NumberFormat("es-CO", {
                                          style: "currency",
                                          currency: "COP",
                                          minimumFractionDigits: 0,
                                        }).format(Number(dato.montoTotal))}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Lista de órdenes */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-dark-text">
                        Órdenes ({reporte.paginacion.total})
                      </h3>

                      <Pagination
                        currentPage={reporte.paginacion.pagina}
                        totalPages={reporte.paginacion.totalPaginas}
                        onPageChange={handleCambiarPagina}
                      />

                      <div className="overflow-x-auto mt-3">
                        <table className="min-w-full bg-dark-bg-secondary border border-dark-border rounded-lg text-sm">
                          <thead className="bg-primary-900/50 text-white">
                            <tr>
                              <th className="p-2 text-left">N° Orden</th>
                              <th className="p-2 text-left">Fecha</th>
                              <th className="p-2 text-left">Proveedor</th>
                              <th className="p-2 text-center">Estado</th>
                              <th className="p-2 text-right">Subtotal</th>
                              <th className="p-2 text-right">Impuestos</th>
                              <th className="p-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="text-dark-text">
                            {reporte.ordenes.map((orden) => (
                              <tr key={orden.id_orden_compra} className="border-t border-dark-border hover:bg-dark-card-hover">
                                <td className="p-2 font-medium">{orden.numero_orden}</td>
                                <td className="p-2">
                                  {new Date(orden.fecha_orden).toLocaleDateString("es-CO")}
                                </td>
                                <td className="p-2">{orden.proveedor?.nombre}</td>
                                <td className="p-2 text-center">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      orden.estado === "completada"
                                        ? "bg-blue-100 text-blue-800"
                                        : orden.estado === "aprobada"
                                        ? "bg-green-100 text-green-800"
                                        : orden.estado === "en_proceso"
                                        ? "bg-cyan-100 text-cyan-800"
                                        : orden.estado === "rechazada"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {orden.estado === "en_proceso"
                                      ? "En Proceso"
                                      : orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}
                                  </span>
                                </td>
                                <td className="p-2 text-right">
                                  {new Intl.NumberFormat("es-CO", {
                                    style: "currency",
                                    currency: "COP",
                                    minimumFractionDigits: 0,
                                  }).format(Number(orden.subtotal))}
                                </td>
                                <td className="p-2 text-right">
                                  {new Intl.NumberFormat("es-CO", {
                                    style: "currency",
                                    currency: "COP",
                                    minimumFractionDigits: 0,
                                  }).format(Number(orden.impuestos))}
                                </td>
                                <td className="p-2 text-right font-semibold">
                                  {new Intl.NumberFormat("es-CO", {
                                    style: "currency",
                                    currency: "COP",
                                    minimumFractionDigits: 0,
                                  }).format(Number(orden.total))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab de Resumen Ejecutivo */}
                {tabActiva === "resumen" && resumenEjecutivo && (
                  <div className="space-y-6">
                    {/* Período */}
                    <div className="bg-primary-900/30 border border-primary-700 rounded-lg p-4">
                      <h3 className="font-semibold text-primary-400 mb-2">Período del Reporte</h3>
                      <p className="text-dark-text">
                        Desde: <strong>{resumenEjecutivo.periodo.desde}</strong> - Hasta:{" "}
                        <strong>{resumenEjecutivo.periodo.hasta}</strong>
                      </p>
                    </div>

                    {/* Estadísticas Generales */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-dark-text">Estadísticas Generales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-primary-900/30 border-2 border-primary-700 rounded-lg p-4">
                          <p className="text-sm text-dark-text-secondary">Total Órdenes</p>
                          <p className="text-3xl font-bold text-primary-400">
                            {resumenEjecutivo.estadisticasGenerales.totalOrdenes}
                          </p>
                        </div>
                        <div className="bg-green-900/30 border-2 border-green-700 rounded-lg p-4">
                          <p className="text-sm text-dark-text-secondary">Monto Total</p>
                          <p className="text-2xl font-bold text-green-400">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(Number(resumenEjecutivo.estadisticasGenerales.montoTotal))}
                          </p>
                        </div>
                        <div className="bg-blue-900/30 border-2 border-blue-700 rounded-lg p-4">
                          <p className="text-sm text-dark-text-secondary">Promedio por Orden</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(Number(resumenEjecutivo.estadisticasGenerales.promedioOrden))}
                          </p>
                        </div>
                        <div className="bg-purple-900/30 border-2 border-purple-700 rounded-lg p-4">
                          <p className="text-sm text-dark-text-secondary">Total Impuestos</p>
                          <p className="text-2xl font-bold text-purple-400">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(Number(resumenEjecutivo.estadisticasGenerales.impuestosTotal))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Top Proveedores */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-dark-text">
                        <Users size={20} />
                        Top 5 Proveedores
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resumenEjecutivo.topProveedores.map((dato, index) => (
                          <div
                            key={index}
                            className="bg-primary-900/30 rounded-lg p-4 border border-primary-700"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-dark-text">
                                  {index + 1}. {dato.proveedor?.nombre}
                                </p>
                                <p className="text-sm text-dark-text-secondary">
                                  {dato.cantidadOrdenes} órdenes
                                </p>
                              </div>
                              <p className="text-lg font-bold text-primary-400">
                                {new Intl.NumberFormat("es-CO", {
                                  style: "currency",
                                  currency: "COP",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(Number(dato.montoTotal))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Laboratorios */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-dark-text">
                        <Package size={20} />
                        Top 5 Laboratorios
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resumenEjecutivo.topLaboratorios.map((dato, index) => (
                          <div
                            key={index}
                            className="bg-green-900/30 rounded-lg p-4 border border-green-700"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-dark-text">
                                  {index + 1}. {dato.laboratorio?.nombre}
                                </p>
                                <p className="text-sm text-dark-text-secondary">
                                  {dato.cantidadProductos} productos - {dato.cantidadUnidades}{" "}
                                  unidades
                                </p>
                              </div>
                              <p className="text-lg font-bold text-green-400">
                                {new Intl.NumberFormat("es-CO", {
                                  style: "currency",
                                  currency: "COP",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(Number(dato.montoTotal))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Distribución por Estado */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-dark-text">Distribución por Estado</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {resumenEjecutivo.distribucionEstados.map((dist) => (
                          <div
                            key={dist.estado}
                            className="bg-dark-bg-secondary rounded-lg p-4 border-2 border-dark-border text-center"
                          >
                            <p className="text-sm text-dark-text-secondary capitalize">{dist.estado === "en_proceso" ? "En Proceso" : dist.estado}</p>
                            <p className="text-2xl font-bold text-dark-text my-1">
                              {dist.cantidadOrdenes}
                            </p>
                            <p className="text-xs font-semibold text-primary-400">
                              {new Intl.NumberFormat("es-CO", {
                                style: "currency",
                                currency: "COP",
                                minimumFractionDigits: 0,
                                notation: "compact",
                              }).format(Number(dist.montoTotal))}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab de Tendencias */}
                {tabActiva === "tendencias" && tendencias.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-dark-text">Tendencias Mensuales</h3>

                    {/* Gráfico simple de barras con CSS */}
                    <div className="space-y-3">
                      {tendencias.map((tend) => {
                        const maxMonto = Math.max(...tendencias.map((t) => t.montoTotal));
                        const porcentaje = (tend.montoTotal / maxMonto) * 100;

                        return (
                          <div key={tend.periodo} className="bg-dark-bg-secondary rounded-lg p-4 border border-dark-border">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="font-semibold text-dark-text">{tend.periodo}</p>
                                <p className="text-sm text-dark-text-secondary">
                                  {tend.cantidadOrdenes} órdenes
                                </p>
                              </div>
                              <p className="text-lg font-bold text-primary-400">
                                {new Intl.NumberFormat("es-CO", {
                                  style: "currency",
                                  currency: "COP",
                                  minimumFractionDigits: 0,
                                }).format(tend.montoTotal)}
                              </p>
                            </div>
                            <div className="w-full bg-dark-border rounded-full h-4">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${porcentaje}%` }}
                              ></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-dark-text-secondary">
                              <div>
                                Completadas:{" "}
                                <span className="font-semibold text-green-400">
                                  {tend.ordenesCompletadas}
                                </span>
                              </div>
                              <div>
                                Rechazadas:{" "}
                                <span className="font-semibold text-red-400">
                                  {tend.ordenesRechazadas}
                                </span>
                              </div>
                              <div>
                                Pendientes:{" "}
                                <span className="font-semibold text-yellow-400">
                                  {tend.ordenesPendientes}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mensaje si no hay datos */}
                {tabActiva === "reporte" && reporte && reporte.ordenes.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-dark-text-secondary text-lg">
                      No se encontraron órdenes con los filtros aplicados
                    </p>
                  </div>
                )}
                {tabActiva === "tendencias" && tendencias.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-dark-text-secondary text-lg">No hay datos de tendencias disponibles</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesCompras;
