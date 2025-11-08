/**
 * Página de Gestión de Entregas (RF008)
 * CRUD completo de pedidos de entrega a pacientes con integración a inventario
 */

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { usePermissions, PermissionGuard } from "../../hooks/usePermissions";
import {
  fetchEntregas,
  fetchEntrega,
  createEntrega,
  updateEntrega,
  cambiarEstadoEntrega,
  cancelarEntrega,
  fetchEstadisticas,
  type Entrega,
  type CrearEntregaData,
  type ProductoEntrega,
  type EstadisticasEntregas,
  getEstadoColor,
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
  ESTADOS_ENTREGA,
} from "../../services/Entregas/entregasService";
import { fetchPacientes, type Paciente } from "../../services/Pacientes/pacientesService";
import {
  CreateEntregaModal,
  DetailsModal,
  EstadoModal,
  CancelarModal,
} from "./EntregasModals";

const Entregas: React.FC = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEntregas | null>(null);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  // Paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CrearEntregaData>({
    id_paciente: 0,
    fecha_entrega_programada: "",
    direccion_entrega: "",
    ciudad_entrega: "",
    departamento_entrega: "",
    barrio_entrega: "",
    observaciones_direccion: "",
    observaciones: "",
    productos: [],
  });

  const [productosEntrega, setProductosEntrega] = useState<ProductoEntrega[]>([]);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [observacionesDespacho, setObservacionesDespacho] = useState("");
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  // Permissions
  const { tienePermiso } = usePermissions();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    cargarEntregas();
    cargarEstadisticas();
    cargarPacientes();
  }, [currentPage, search, estadoFilter, fechaDesde, fechaHasta]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const cargarEntregas = async () => {
    setLoading(true);
    try {
      const response = await fetchEntregas({
        page: currentPage,
        limit: 10,
        search,
        estado: estadoFilter,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      });
      setEntregas(response.entregas);
      setTotalPages(response.paginacion.totalPaginas);
    } catch (error) {
      console.error("Error al cargar entregas:", error);
      toast.error("Error al cargar las entregas");
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetchEstadisticas();
      setEstadisticas(response.estadisticas);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const cargarPacientes = async () => {
    try {
      const response = await fetchPacientes({ limit: 1000, activo: "true" });
      setPacientes(response.pacientes);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleEstadoFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstadoFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFechaDesde(e.target.value);
    setCurrentPage(1);
  };

  const handleFechaHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFechaHasta(e.target.value);
    setCurrentPage(1);
  };

  const handleLimpiarFiltros = () => {
    setSearch("");
    setEstadoFilter("");
    setFechaDesde("");
    setFechaHasta("");
    setCurrentPage(1);
  };

  const handlePacienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id_paciente = parseInt(e.target.value);
    const paciente = pacientes.find((p) => p.id_paciente === id_paciente);

    if (paciente) {
      setFormData({
        ...formData,
        id_paciente,
        direccion_entrega: paciente.direccion,
        ciudad_entrega: paciente.ciudad,
        departamento_entrega: paciente.departamento,
        barrio_entrega: paciente.barrio || "",
      });
    } else {
      setFormData({
        ...formData,
        id_paciente: 0,
        direccion_entrega: "",
        ciudad_entrega: "",
        departamento_entrega: "",
        barrio_entrega: "",
      });
    }
  };

  const handleAgregarProducto = () => {
    setProductosEntrega([
      ...productosEntrega,
      { id_producto: 0, cantidad: 1, precio_unitario: 0, observaciones: "" },
    ]);
  };

  const handleEliminarProducto = (index: number) => {
    const nuevosProductos = productosEntrega.filter((_, i) => i !== index);
    setProductosEntrega(nuevosProductos);
  };

  const handleProductoChange = (index: number, field: string, value: any) => {
    const nuevosProductos = [...productosEntrega];
    nuevosProductos[index] = { ...nuevosProductos[index], [field]: value };
    setProductosEntrega(nuevosProductos);
  };

  const calcularTotal = (): number => {
    return productosEntrega.reduce((total, item) => {
      return total + (item.cantidad * item.precio_unitario);
    }, 0);
  };

  const handleCrearEntrega = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.id_paciente === 0) {
      toast.error("Debe seleccionar un paciente");
      return;
    }

    if (productosEntrega.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    // Validar que todos los productos tengan datos completos
    const productosInvalidos = productosEntrega.filter(
      (p) => p.id_producto === 0 || p.cantidad <= 0 || p.precio_unitario <= 0
    );

    if (productosInvalidos.length > 0) {
      toast.error("Todos los productos deben tener producto seleccionado, cantidad y precio válidos");
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        productos: productosEntrega,
      };

      await createEntrega(dataToSend);
      toast.success("Entrega creada exitosamente");
      setShowCreateModal(false);
      resetForm();
      cargarEntregas();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al crear entrega:", error);
      toast.error(error.response?.data?.msg || "Error al crear la entrega");
    }
  };

  const handleCambiarEstado = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntrega || !nuevoEstado) return;

    try {
      await cambiarEstadoEntrega(selectedEntrega.id_entrega, {
        nuevo_estado: nuevoEstado,
        observaciones_despacho: observacionesDespacho,
      });
      toast.success(`Estado cambiado a ${nuevoEstado} exitosamente`);
      setShowEstadoModal(false);
      setNuevoEstado("");
      setObservacionesDespacho("");
      setSelectedEntrega(null);
      cargarEntregas();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      toast.error(error.response?.data?.msg || "Error al cambiar el estado");
    }
  };

  const handleCancelar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntrega || !motivoCancelacion) {
      toast.error("Debe proporcionar un motivo de cancelación");
      return;
    }

    try {
      await cancelarEntrega(selectedEntrega.id_entrega, { motivo: motivoCancelacion });
      toast.success("Entrega cancelada exitosamente e inventario devuelto");
      setShowCancelarModal(false);
      setMotivoCancelacion("");
      setSelectedEntrega(null);
      cargarEntregas();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al cancelar entrega:", error);
      toast.error(error.response?.data?.msg || "Error al cancelar la entrega");
    }
  };

  const handleVerDetalles = async (entrega: Entrega) => {
    try {
      const response = await fetchEntrega(entrega.id_entrega);
      setSelectedEntrega(response.entrega);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast.error("Error al cargar los detalles de la entrega");
    }
  };

  const resetForm = () => {
    setFormData({
      id_paciente: 0,
      fecha_entrega_programada: "",
      direccion_entrega: "",
      ciudad_entrega: "",
      departamento_entrega: "",
      barrio_entrega: "",
      observaciones_direccion: "",
      observaciones: "",
      productos: [],
    });
    setProductosEntrega([]);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Gestión de Entregas
            </h1>
            <p className="text-gray-600 mt-2">Pedidos de entrega a pacientes con control de inventario</p>
          </div>
          <PermissionGuard permission="crear_entregas">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <i className="fas fa-plus"></i>
              Nueva Entrega
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total Entregas</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{estadisticas.totalEntregas}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-medium">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{estadisticas.entregasPendientes}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-indigo-500">
            <p className="text-gray-600 text-sm font-medium">En Preparación</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{estadisticas.entregasEnPreparacion}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium">Despachadas</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{estadisticas.entregasDespachadas}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Entregadas</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{estadisticas.entregasEntregadas}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium">Canceladas</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{estadisticas.entregasCanceladas}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Número de pedido, paciente..."
              value={search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={estadoFilter}
              onChange={handleEstadoFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_ENTREGA.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={handleFechaDesdeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={handleFechaHastaChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleLimpiarFiltros}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de Entregas */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Número Pedido
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Fecha Pedido
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : entregas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron entregas
                  </td>
                </tr>
              ) : (
                entregas.map((entrega) => (
                  <tr key={entrega.id_entrega} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-indigo-600">
                        {entrega.numero_pedido}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {entrega.paciente?.nombres} {entrega.paciente?.apellidos}
                        </div>
                        <div className="text-gray-500">{entrega.paciente?.numero_identificacion}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(entrega.fecha_pedido)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(entrega.estado)}`}>
                        {entrega.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatearMoneda(entrega.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entrega.detalles?.length || 0} producto(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleVerDetalles(entrega)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {entrega.estado !== "Cancelado" && entrega.estado !== "Entregado" && (
                          <PermissionGuard permission="despachar_entregas">
                            <button
                              onClick={() => {
                                setSelectedEntrega(entrega);
                                setShowEstadoModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              title="Cambiar estado"
                            >
                              <i className="fas fa-exchange-alt"></i>
                            </button>
                          </PermissionGuard>
                        )}
                        {entrega.estado !== "Cancelado" && entrega.estado !== "Entregado" && (
                          <PermissionGuard permission="cancelar_entregas">
                            <button
                              onClick={() => {
                                setSelectedEntrega(entrega);
                                setShowCancelarModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Cancelar entrega"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          </PermissionGuard>
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
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Entrega - Due to length, I'll create this in the next part */}
      {showCreateModal && (
        <CreateEntregaModal
          formData={formData}
          setFormData={setFormData}
          productosEntrega={productosEntrega}
          setProductosEntrega={setProductosEntrega}
          pacientes={pacientes}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          onSubmit={handleCrearEntrega}
          onPacienteChange={handlePacienteChange}
          onAgregarProducto={handleAgregarProducto}
          onEliminarProducto={handleEliminarProducto}
          onProductoChange={handleProductoChange}
          calcularTotal={calcularTotal}
        />
      )}

      {/* Modal Detalles */}
      {showDetailsModal && selectedEntrega && (
        <DetailsModal
          entrega={selectedEntrega}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEntrega(null);
          }}
        />
      )}

      {/* Modal Cambiar Estado */}
      {showEstadoModal && selectedEntrega && (
        <EstadoModal
          entrega={selectedEntrega}
          nuevoEstado={nuevoEstado}
          setNuevoEstado={setNuevoEstado}
          observacionesDespacho={observacionesDespacho}
          setObservacionesDespacho={setObservacionesDespacho}
          onClose={() => {
            setShowEstadoModal(false);
            setNuevoEstado("");
            setObservacionesDespacho("");
            setSelectedEntrega(null);
          }}
          onSubmit={handleCambiarEstado}
        />
      )}

      {/* Modal Cancelar */}
      {showCancelarModal && selectedEntrega && (
        <CancelarModal
          entrega={selectedEntrega}
          motivoCancelacion={motivoCancelacion}
          setMotivoCancelacion={setMotivoCancelacion}
          onClose={() => {
            setShowCancelarModal(false);
            setMotivoCancelacion("");
            setSelectedEntrega(null);
          }}
          onSubmit={handleCancelar}
        />
      )}
    </div>
  );
};

// Component file continues in next message due to length...
export default Entregas;
