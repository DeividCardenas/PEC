import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faEdit,
  faTrash,
  faEye,
  faPlus,
  faCheck,
  faCheckCircle,
  faTimesCircle,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import {
  fetchOrdenes,
  fetchOrden,
  createOrden,
  updateOrden,
  deleteOrden,
  aprobarOrden,
  rechazarOrden,
  completarOrden,
  fetchEstadisticas,
  OrdenCompra,
  CrearOrdenData,
  EstadisticasOrdenes,
} from "../../services/Ordenes/ordenesService";
import { fetchProveedores, Proveedor } from "../../services/Proveedores/proveedoresService";
import { fetchProductos } from "../../services/Productos/productosService";
import { Producto } from "../../types";
import Pagination from "../../components/Pagination";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";

interface ProductoOrden {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
}

const OrdenesCompra = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasOrdenes | null>(null);

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Datos de formularios
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState<string>("");
  const [notasOrden, setNotasOrden] = useState<string>("");
  const [motivoRechazo, setMotivoRechazo] = useState<string>("");
  const [productosOrden, setProductosOrden] = useState<ProductoOrden[]>([]);

  // Búsqueda de proveedores y productos
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busquedaProveedor, setBusquedaProveedor] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadProducto, setCantidadProducto] = useState<number>(1);
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);

  const itemsPerPage = 10;

  // Cargar órdenes
  const fetchOrdenesData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchOrdenes({
        page: currentPage,
        limit: itemsPerPage,
        search,
        estado: estadoFilter || undefined,
      });
      setOrdenes(response.ordenes);
      setTotalPages(response.totalPaginas);
    } catch (error) {
      console.error("Error al obtener órdenes:", error);
      toast.error("Error al cargar las órdenes de compra");
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, estadoFilter]);

  // Cargar estadísticas
  const loadEstadisticas = async () => {
    try {
      const response = await fetchEstadisticas();
      setEstadisticas(response.estadisticas);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  useEffect(() => {
    fetchOrdenesData();
    loadEstadisticas();
  }, [fetchOrdenesData]);

  // Buscar proveedores
  const buscarProveedores = async (termino: string) => {
    if (termino.trim().length < 2) {
      setProveedores([]);
      return;
    }
    try {
      const response = await fetchProveedores({ search: termino, limit: 10, activo: "true" });
      setProveedores(response.proveedores);
    } catch (error) {
      console.error("Error al buscar proveedores:", error);
    }
  };

  // Buscar productos
  const buscarProductos = async (termino: string) => {
    if (termino.trim().length < 2) {
      setProductos([]);
      return;
    }
    try {
      const response = await fetchProductos({ descripcion: termino, limit: 10 });
      setProductos(response.productos);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    }
  };

  // Agregar producto a la orden
  const agregarProducto = () => {
    if (!productoSeleccionado || cantidadProducto <= 0 || precioUnitario <= 0) {
      toast.error("Complete todos los campos del producto");
      return;
    }

    // Verificar si el producto ya está en la lista
    const existe = productosOrden.find((p) => p.id_producto === productoSeleccionado.id_producto);
    if (existe) {
      toast.error("El producto ya está en la orden");
      return;
    }

    setProductosOrden([
      ...productosOrden,
      {
        id_producto: productoSeleccionado.id_producto,
        cantidad: cantidadProducto,
        precio_unitario: precioUnitario,
      },
    ]);

    // Limpiar campos
    setProductoSeleccionado(null);
    setCantidadProducto(1);
    setPrecioUnitario(0);
    setBusquedaProducto("");
  };

  // Eliminar producto de la orden
  const eliminarProducto = (id_producto: number) => {
    setProductosOrden(productosOrden.filter((p) => p.id_producto !== id_producto));
  };

  // Calcular totales
  const calcularTotales = () => {
    const subtotal = productosOrden.reduce(
      (sum, p) => sum + p.cantidad * p.precio_unitario,
      0
    );
    const impuestos = subtotal * 0.19; // Asumiendo 19% de IVA
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  // Crear orden
  const handleCreateOrden = async () => {
    if (!proveedorSeleccionado) {
      toast.error("Debe seleccionar un proveedor");
      return;
    }

    if (productosOrden.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    if (!user || !user.id) {
      toast.error("Usuario no autenticado");
      return;
    }

    try {
      const data: CrearOrdenData = {
        id_proveedor: proveedorSeleccionado,
        id_creado_por: user.id,
        fecha_entrega_estimada: fechaEntrega || undefined,
        notas: notasOrden || undefined,
        detalles: productosOrden,
      };

      await createOrden(data);
      toast.success("Orden de compra creada exitosamente");
      setShowCreateModal(false);
      resetFormulario();
      fetchOrdenesData();
      loadEstadisticas();
    } catch (error: any) {
      console.error("Error al crear orden:", error);
      toast.error(error.response?.data?.msg || "Error al crear la orden");
    }
  };

  // Abrir modal de edición
  const handleOpenEditModal = async (orden: OrdenCompra) => {
    if (orden.estado !== "pendiente") {
      toast.error("Solo se pueden editar órdenes pendientes");
      return;
    }

    try {
      const response = await fetchOrden(orden.id_orden_compra);
      setSelectedOrden(response.orden);
      setProveedorSeleccionado(response.orden.id_proveedor);
      setFechaEntrega(
        response.orden.fecha_entrega_estimada
          ? new Date(response.orden.fecha_entrega_estimada).toISOString().split("T")[0]
          : ""
      );
      setNotasOrden(response.orden.notas || "");
      setProductosOrden(
        response.orden.detalles?.map((d) => ({
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: parseFloat(d.precio_unitario.toString()),
        })) || []
      );
      setShowEditModal(true);
    } catch (error) {
      console.error("Error al cargar orden:", error);
      toast.error("Error al cargar la orden");
    }
  };

  // Editar orden
  const handleEditOrden = async () => {
    if (!selectedOrden) return;

    if (productosOrden.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    try {
      await updateOrden(selectedOrden.id_orden_compra, {
        fecha_entrega_estimada: fechaEntrega || undefined,
        notas: notasOrden || undefined,
        detalles: productosOrden,
      });
      toast.success("Orden actualizada exitosamente");
      setShowEditModal(false);
      resetFormulario();
      fetchOrdenesData();
    } catch (error: any) {
      console.error("Error al actualizar orden:", error);
      toast.error(error.response?.data?.msg || "Error al actualizar la orden");
    }
  };

  // Eliminar orden
  const handleOpenDeleteModal = (orden: OrdenCompra) => {
    if (orden.estado !== "pendiente") {
      toast.error("Solo se pueden eliminar órdenes pendientes");
      return;
    }
    setSelectedOrden(orden);
    setShowDeleteModal(true);
  };

  const handleDeleteOrden = async () => {
    if (!selectedOrden) return;

    try {
      await deleteOrden(selectedOrden.id_orden_compra);
      toast.success("Orden eliminada exitosamente");
      setShowDeleteModal(false);
      setSelectedOrden(null);
      fetchOrdenesData();
      loadEstadisticas();
    } catch (error: any) {
      console.error("Error al eliminar orden:", error);
      toast.error(error.response?.data?.msg || "Error al eliminar la orden");
    }
  };

  // Ver detalles
  const handleOpenDetailsModal = async (orden: OrdenCompra) => {
    try {
      const response = await fetchOrden(orden.id_orden_compra);
      setSelectedOrden(response.orden);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast.error("Error al cargar los detalles de la orden");
    }
  };

  // Aprobar orden
  const handleOpenApprovalModal = (orden: OrdenCompra) => {
    if (orden.estado !== "pendiente") {
      toast.error("Solo se pueden aprobar órdenes pendientes");
      return;
    }
    setSelectedOrden(orden);
    setShowApprovalModal(true);
  };

  const handleAprobarOrden = async () => {
    if (!selectedOrden || !user || !user.id) return;

    try {
      await aprobarOrden(selectedOrden.id_orden_compra, { id_usuario: user.id });
      toast.success("Orden aprobada exitosamente");
      setShowApprovalModal(false);
      setSelectedOrden(null);
      fetchOrdenesData();
      loadEstadisticas();
    } catch (error: any) {
      console.error("Error al aprobar orden:", error);
      toast.error(error.response?.data?.msg || "Error al aprobar la orden");
    }
  };

  // Rechazar orden
  const handleOpenRejectionModal = (orden: OrdenCompra) => {
    if (orden.estado !== "pendiente") {
      toast.error("Solo se pueden rechazar órdenes pendientes");
      return;
    }
    setSelectedOrden(orden);
    setMotivoRechazo("");
    setShowRejectionModal(true);
  };

  const handleRechazarOrden = async () => {
    if (!selectedOrden || !user || !user.id) return;

    if (!motivoRechazo.trim()) {
      toast.error("Debe ingresar un motivo de rechazo");
      return;
    }

    try {
      await rechazarOrden(selectedOrden.id_orden_compra, {
        id_usuario: user.id,
        motivo_rechazo: motivoRechazo,
      });
      toast.success("Orden rechazada exitosamente");
      setShowRejectionModal(false);
      setSelectedOrden(null);
      setMotivoRechazo("");
      fetchOrdenesData();
      loadEstadisticas();
    } catch (error: any) {
      console.error("Error al rechazar orden:", error);
      toast.error(error.response?.data?.msg || "Error al rechazar la orden");
    }
  };

  // Completar orden
  const handleCompletarOrden = async (orden: OrdenCompra) => {
    if (orden.estado !== "aprobada") {
      toast.error("Solo se pueden completar órdenes aprobadas");
      return;
    }

    try {
      await completarOrden(orden.id_orden_compra);
      toast.success("Orden completada exitosamente");
      fetchOrdenesData();
      loadEstadisticas();
    } catch (error: any) {
      console.error("Error al completar orden:", error);
      toast.error(error.response?.data?.msg || "Error al completar la orden");
    }
  };

  // Reset formulario
  const resetFormulario = () => {
    setProveedorSeleccionado(null);
    setFechaEntrega("");
    setNotasOrden("");
    setProductosOrden([]);
    setSelectedOrden(null);
    setBusquedaProveedor("");
    setBusquedaProducto("");
    setProductoSeleccionado(null);
    setCantidadProducto(1);
    setPrecioUnitario(0);
  };

  // Obtener badge de estado
  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      pendiente: { color: "bg-yellow-200 text-yellow-800", icon: faClock },
      aprobada: { color: "bg-green-200 text-green-800", icon: faCheckCircle },
      rechazada: { color: "bg-red-200 text-red-800", icon: faTimesCircle },
      completada: { color: "bg-blue-200 text-blue-800", icon: faCheck },
      cancelada: { color: "bg-gray-200 text-gray-800", icon: faTimes },
    };

    const badge = badges[estado] || badges.pendiente;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color} flex items-center gap-1`}>
        <FontAwesomeIcon icon={badge.icon} />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const totales = calcularTotales();

  return (
    <div className="min-h-screen bg-sky-900 flex flex-col">
      <header className="bg-sky-800 shadow-lg p-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/Menu")}
          className="flex items-center text-white hover:text-gray-200 transition-colors px-4 py-2 rounded-lg hover:bg-sky-700"
        >
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Órdenes de Compra</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Nueva Orden
        </button>
      </header>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Total Órdenes</p>
            <p className="text-2xl font-bold text-indigo-900">{estadisticas.totalOrdenes}</p>
          </div>
          <div className="bg-yellow-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-800">{estadisticas.ordenesPendientes}</p>
          </div>
          <div className="bg-green-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Aprobadas</p>
            <p className="text-2xl font-bold text-green-800">{estadisticas.ordenesAprobadas}</p>
          </div>
          <div className="bg-red-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Rechazadas</p>
            <p className="text-2xl font-bold text-red-800">{estadisticas.ordenesRechazadas}</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Completadas</p>
            <p className="text-2xl font-bold text-blue-800">{estadisticas.ordenesCompletadas}</p>
          </div>
          <div className="bg-indigo-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Monto Total</p>
            <p className="text-xl font-bold text-indigo-800">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(Number(estadisticas.montoTotal))}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar por número, proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-100 rounded-lg p-2 text-gray-950 w-full shadow-md pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-950 text-lg"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="bg-zinc-100 text-black rounded-md p-2 shadow-sm text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Tabla de órdenes */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" color="text-white" text="Cargando órdenes..." />
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="p-3 border-b text-center text-white bg-indigo-900">
                <tr>
                  <th className="p-2">N° Orden</th>
                  <th className="p-2">Proveedor</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Items</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Creado Por</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-stone-200">
                {ordenes.length > 0 ? (
                  ordenes.map((orden) => (
                    <tr key={orden.id_orden_compra} className="hover:bg-violet-300">
                      <td className="p-2 text-center font-medium">{orden.numero_orden}</td>
                      <td className="p-2 text-center">{orden.proveedor?.nombre || "-"}</td>
                      <td className="p-2 text-center">
                        {new Date(orden.fecha_orden).toLocaleDateString("es-CO")}
                      </td>
                      <td className="p-2 text-center flex justify-center">
                        {getEstadoBadge(orden.estado)}
                      </td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                          {orden._count?.detalles || 0}
                        </span>
                      </td>
                      <td className="p-2 text-center font-semibold">
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                        }).format(Number(orden.total))}
                      </td>
                      <td className="p-2 text-center">{orden.creado_por?.username || "-"}</td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleOpenDetailsModal(orden)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Ver detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          {orden.estado === "pendiente" && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(orden)}
                                className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                                title="Editar"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(orden)}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                title="Eliminar"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                              <button
                                onClick={() => handleOpenApprovalModal(orden)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                title="Aprobar"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} />
                              </button>
                              <button
                                onClick={() => handleOpenRejectionModal(orden)}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                title="Rechazar"
                              >
                                <FontAwesomeIcon icon={faTimesCircle} />
                              </button>
                            </>
                          )}
                          {orden.estado === "aprobada" && (
                            <button
                              onClick={() => handleCompletarOrden(orden)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              title="Completar"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-black">
                      No hay órdenes de compra disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Crear Orden */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetFormulario();
        }}
        title="Crear Nueva Orden de Compra"
        size="xl"
      >
        <div className="space-y-4">
          {/* Selección de Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={busquedaProveedor}
              onChange={(e) => {
                setBusquedaProveedor(e.target.value);
                buscarProveedores(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {proveedores.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                {proveedores.map((prov) => (
                  <div
                    key={prov.id_proveedor}
                    onClick={() => {
                      setProveedorSeleccionado(prov.id_proveedor);
                      setBusquedaProveedor(prov.nombre);
                      setProveedores([]);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {prov.nombre} {prov.nit && `- NIT: ${prov.nit}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fecha de Entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Entrega Estimada
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Agregar Productos */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Agregar Productos</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value);
                    buscarProductos(e.target.value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                {productos.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                    {productos.map((prod) => (
                      <div
                        key={prod.id_producto}
                        onClick={() => {
                          setProductoSeleccionado(prod);
                          setBusquedaProducto(prod.descripcion);
                          setPrecioUnitario(parseFloat(prod.precio_unidad.toString()));
                          setProductos([]);
                        }}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {prod.descripcion} - {prod.cum}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={cantidadProducto}
                  onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Precio unitario"
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <button
              onClick={agregarProducto}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Agregar Producto
            </button>
          </div>

          {/* Lista de Productos Agregados */}
          {productosOrden.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Productos en la Orden</h3>
              <div className="max-h-48 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2 text-right">Cant.</th>
                      <th className="p-2 text-right">Precio Unit.</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosOrden.map((prod) => {
                      const producto = productos.find((p) => p.id_producto === prod.id_producto);
                      const productoInfo = productoSeleccionado?.id_producto === prod.id_producto
                        ? productoSeleccionado
                        : producto;
                      return (
                        <tr key={prod.id_producto} className="border-b">
                          <td className="p-2">
                            {productoInfo?.descripcion || `Producto ID: ${prod.id_producto}`}
                          </td>
                          <td className="p-2 text-right">{prod.cantidad}</td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(prod.precio_unitario)}
                          </td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(prod.cantidad * prod.precio_unitario)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => eliminarProducto(prod.id_producto)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="mt-4 bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-sm mb-1">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(totales.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Impuestos (19%):</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(totales.impuestos)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(totales.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notasOrden}
              onChange={(e) => setNotasOrden(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowCreateModal(false);
              resetFormulario();
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateOrden}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Crear Orden
          </button>
        </div>
      </Modal>

      {/* Modal de Editar Orden - Similar al crear pero con datos pre-cargados */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetFormulario();
        }}
        title={`Editar Orden ${selectedOrden?.numero_orden}`}
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Entrega Estimada
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Agregar Productos */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Agregar Productos</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value);
                    buscarProductos(e.target.value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                {productos.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                    {productos.map((prod) => (
                      <div
                        key={prod.id_producto}
                        onClick={() => {
                          setProductoSeleccionado(prod);
                          setBusquedaProducto(prod.descripcion);
                          setPrecioUnitario(parseFloat(prod.precio_unidad.toString()));
                          setProductos([]);
                        }}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {prod.descripcion} - {prod.cum}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={cantidadProducto}
                  onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Precio unitario"
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <button
              onClick={agregarProducto}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Agregar Producto
            </button>
          </div>

          {/* Lista de Productos */}
          {productosOrden.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Productos en la Orden</h3>
              <div className="max-h-48 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2 text-right">Cant.</th>
                      <th className="p-2 text-right">Precio Unit.</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosOrden.map((prod) => {
                      const detalle = selectedOrden?.detalles?.find((d) => d.id_producto === prod.id_producto);
                      return (
                        <tr key={prod.id_producto} className="border-b">
                          <td className="p-2">
                            {detalle?.producto?.descripcion || `Producto ID: ${prod.id_producto}`}
                          </td>
                          <td className="p-2 text-right">{prod.cantidad}</td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(prod.precio_unitario)}
                          </td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(prod.cantidad * prod.precio_unitario)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => eliminarProducto(prod.id_producto)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(totales.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notasOrden}
              onChange={(e) => setNotasOrden(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowEditModal(false);
              resetFormulario();
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleEditOrden}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Guardar Cambios
          </button>
        </div>
      </Modal>

      {/* Modal de Eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedOrden(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-700 mb-6">
          ¿Está seguro que desea eliminar la orden <strong>{selectedOrden?.numero_orden}</strong>? Esta
          acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedOrden(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteOrden}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Eliminar
          </button>
        </div>
      </Modal>

      {/* Modal de Detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrden(null);
        }}
        title={`Detalles de Orden ${selectedOrden?.numero_orden}`}
        size="xl"
      >
        {selectedOrden && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Proveedor</p>
                <p className="font-semibold">{selectedOrden.proveedor?.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                {getEstadoBadge(selectedOrden.estado)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Orden</p>
                <p className="font-semibold">
                  {new Date(selectedOrden.fecha_orden).toLocaleDateString("es-CO")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Entrega</p>
                <p className="font-semibold">
                  {selectedOrden.fecha_entrega_estimada
                    ? new Date(selectedOrden.fecha_entrega_estimada).toLocaleDateString("es-CO")
                    : "No especificada"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Creado por</p>
                <p className="font-semibold">{selectedOrden.creado_por?.username}</p>
              </div>
              {selectedOrden.aprobado_por && (
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedOrden.estado === "aprobada" ? "Aprobado por" : "Rechazado por"}
                  </p>
                  <p className="font-semibold">{selectedOrden.aprobado_por.username}</p>
                </div>
              )}
            </div>

            {selectedOrden.motivo_rechazo && (
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-red-600 font-semibold">Motivo de Rechazo:</p>
                <p className="text-red-800">{selectedOrden.motivo_rechazo}</p>
              </div>
            )}

            {selectedOrden.notas && (
              <div>
                <p className="text-sm text-gray-600">Notas</p>
                <p className="font-semibold">{selectedOrden.notas}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Productos</h3>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Producto</th>
                    <th className="p-2 text-right">Cantidad</th>
                    <th className="p-2 text-right">Precio Unit.</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrden.detalles?.map((detalle) => (
                    <tr key={detalle.id_detalle} className="border-b">
                      <td className="p-2">{detalle.producto?.descripcion}</td>
                      <td className="p-2 text-right">{detalle.cantidad}</td>
                      <td className="p-2 text-right">
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                        }).format(Number(detalle.precio_unitario))}
                      </td>
                      <td className="p-2 text-right">
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                        }).format(Number(detalle.subtotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 bg-gray-50 p-3 rounded space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(Number(selectedOrden.subtotal))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(Number(selectedOrden.impuestos))}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(Number(selectedOrden.total))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedOrden(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* Modal de Aprobar */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedOrden(null);
        }}
        title="Aprobar Orden de Compra"
        size="sm"
      >
        <p className="text-gray-700 mb-6">
          ¿Está seguro que desea aprobar la orden <strong>{selectedOrden?.numero_orden}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowApprovalModal(false);
              setSelectedOrden(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleAprobarOrden}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Aprobar
          </button>
        </div>
      </Modal>

      {/* Modal de Rechazar */}
      <Modal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setSelectedOrden(null);
          setMotivoRechazo("");
        }}
        title="Rechazar Orden de Compra"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Rechazar la orden <strong>{selectedOrden?.numero_orden}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de Rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Explique el motivo del rechazo..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowRejectionModal(false);
              setSelectedOrden(null);
              setMotivoRechazo("");
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleRechazarOrden}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
            Rechazar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OrdenesCompra;
