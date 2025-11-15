/**
 * Página de Gestión de Entregas (RF008)
 * CRUD completo de pedidos de entrega a pacientes con integración a inventario
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Plus,
  Eye,
  Repeat,
  Ban,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import { usePermissions } from "../../hooks/usePermissions";
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
import Button from "../../components/Button";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import Table, { Column } from "../../components/Table";
import Card, { CardContent } from "../../components/Card";
import Pagination from "../../components/Pagination";

const Entregas: React.FC = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const navigate = useNavigate();
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
      return total + item.cantidad * item.precio_unitario;
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
  // TABLE COLUMNS
  // ============================================================================

  const getEstadoBadgeVariant = (estado: string): "default" | "warning" | "info" | "success" | "danger" => {
    switch (estado) {
      case "Pendiente de Despacho":
        return "warning";
      case "En Preparación":
        return "info";
      case "Despachado":
        return "info";
      case "Entregado":
        return "success";
      case "Cancelado":
        return "danger";
      default:
        return "default";
    }
  };

  const columns: Column<Entrega>[] = [
    {
      key: "numero_pedido",
      title: "Número Pedido",
      align: "left",
      render: (val) => <span className="font-mono font-semibold text-primary-600">{val}</span>,
    },
    {
      key: "paciente",
      title: "Paciente",
      align: "left",
      render: (val: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {val?.nombres} {val?.apellidos}
          </div>
          <div className="text-gray-500">{val?.numero_identificacion}</div>
        </div>
      ),
    },
    {
      key: "fecha_pedido",
      title: "Fecha Pedido",
      align: "center",
      render: (val) => formatearFecha(val),
    },
    {
      key: "estado",
      title: "Estado",
      align: "center",
      render: (val) => <Badge variant={getEstadoBadgeVariant(val)}>{val}</Badge>,
    },
    {
      key: "total",
      title: "Total",
      align: "right",
      render: (val) => <span className="font-semibold">{formatearMoneda(val)}</span>,
    },
    {
      key: "detalles",
      title: "Productos",
      align: "center",
      render: (val: any) => `${val?.length || 0} producto(s)`,
    },
    {
      key: "id_entrega",
      title: "Acciones",
      align: "center",
      render: (_, row) => (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleVerDetalles(row)}
            icon={<Eye size={16} />}
            title="Ver detalles"
          />
          {row.estado !== "Cancelado" && row.estado !== "Entregado" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedEntrega(row);
                setShowEstadoModal(true);
              }}
              icon={<Repeat size={16} className="text-purple-600" />}
              title="Cambiar estado"
            />
          )}
          {row.estado !== "Cancelado" && row.estado !== "Entregado" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedEntrega(row);
                setShowCancelarModal(true);
              }}
              icon={<Ban size={16} className="text-red-600" />}
              title="Cancelar entrega"
            />
          )}
        </div>
      ),
    },
  ];

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
            <ArrowLeft size={24} className="mr-2" />
            <span className="font-medium">Volver al Menú</span>
          </button>
          <h1 className="text-3xl font-bold text-dark-text flex items-center gap-2">
            <Package size={32} />
            Gestión de Entregas
          </h1>
          <Button variant="success" onClick={() => setShowCreateModal(true)} icon={<Plus size={20} />}>
            Nueva Entrega
          </Button>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
      {/* Estadísticas */}
      {estadisticas && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{estadisticas.totalEntregas}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Package size={20} className="text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{estadisticas.entregasPendientes}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock size={20} className="text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">En Preparación</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{estadisticas.entregasEnPreparacion}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <PackageCheck size={20} className="text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Despachadas</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{estadisticas.entregasDespachadas}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Truck size={20} className="text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Entregadas</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{estadisticas.entregasEntregadas}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Canceladas</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{estadisticas.entregasCanceladas}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <XCircle size={20} className="text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 space-y-4">
              {/* Primera fila: Búsqueda y Estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  variant="search"
                  placeholder="Número de pedido, paciente..."
                  value={search}
                  onChange={handleSearchChange}
                  clearable
                  onClear={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                />

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Estado</label>
                  <select
                    value={estadoFilter}
                    onChange={handleEstadoFilterChange}
                    className="w-full px-4 py-2.5 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    <option value="">Todos los estados</option>
                    {ESTADOS_ENTREGA.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Segunda fila: Fechas y Botón limpiar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input label="Desde" type="date" value={fechaDesde} onChange={handleFechaDesdeChange} />

                <Input label="Hasta" type="date" value={fechaHasta} onChange={handleFechaHastaChange} />

                <Button variant="ghost" onClick={handleLimpiarFiltros} className="w-full md:w-auto">
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Paginación */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* Tabla de Entregas */}
            <Table
              columns={columns}
              data={entregas}
              keyExtractor={(row) => row.id_entrega}
              loading={loading}
              striped
              hoverable
              emptyMessage="No se encontraron entregas"
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal Crear Entrega */}
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
    </div>
    </div>
  );
};

export default Entregas;
