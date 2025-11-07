import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faEdit, faTrash, faEye, faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import {
  fetchProveedores,
  fetchProveedor,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  fetchTransacciones,
  createTransaccion,
  Proveedor,
  Transaccion,
  CrearProveedorData,
  EditarProveedorData,
  CrearTransaccionData,
} from "../../services/Proveedores/proveedoresService";
import Pagination from "../../components/Pagination";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";

const Proveedores = () => {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [search, setSearch] = useState("");
  const [activoFilter, setActivoFilter] = useState<string>(""); // "", "true", "false"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estados para los modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showCreateTransactionModal, setShowCreateTransactionModal] = useState(false);

  // Estados para formularios
  const [formData, setFormData] = useState<CrearProveedorData>({
    nombre: "",
    laboratorio: "",
    tipo: "",
    titular: "",
    direccion: "",
    telefono: "",
    email: "",
    nit: "",
    ciudad: "",
    pais: "",
    notas: "",
  });

  const [transactionFormData, setTransactionFormData] = useState<CrearTransaccionData>({
    tipo: "compra",
    concepto: "",
    monto: 0,
    cantidad: undefined,
    numero_factura: "",
    fecha_emision: new Date().toISOString().split("T")[0],
    fecha_vencimiento: "",
    estado: "pendiente",
    notas: "",
  });

  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [transaccionesTotal, setTransaccionesTotal] = useState(0);
  const [transaccionesPage, setTransaccionesPage] = useState(1);
  const [transaccionesTotalPages, setTransaccionesTotalPages] = useState(1);

  const itemsPerPage = 10;

  // Cargar proveedores
  const fetchProveedoresData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchProveedores({
        page: currentPage,
        limit: itemsPerPage,
        search,
        activo: activoFilter !== "" ? activoFilter : undefined,
      });
      setProveedores(response.proveedores);
      setTotalPages(response.totalPaginas);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      toast.error("Error al cargar los proveedores");
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, activoFilter]);

  useEffect(() => {
    fetchProveedoresData();
  }, [fetchProveedoresData]);

  // Cargar transacciones de un proveedor
  const loadTransacciones = async (id_proveedor: number) => {
    try {
      const response = await fetchTransacciones(id_proveedor, {
        page: transaccionesPage,
        limit: 10,
      });
      setTransacciones(response.transacciones);
      setTransaccionesTotal(response.totales.total);
      setTransaccionesTotalPages(response.totalPaginas);
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
      toast.error("Error al cargar el historial de transacciones");
    }
  };

  // Handlers para crear proveedor
  const handleCreateProveedor = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      await createProveedor(formData);
      toast.success("Proveedor creado exitosamente");
      setShowCreateModal(false);
      resetFormData();
      fetchProveedoresData();
    } catch (error: any) {
      console.error("Error al crear proveedor:", error);
      toast.error(error.response?.data?.msg || "Error al crear proveedor");
    }
  };

  // Handlers para editar proveedor
  const handleOpenEditModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      laboratorio: proveedor.laboratorio || "",
      tipo: proveedor.tipo || "",
      titular: proveedor.titular || "",
      direccion: proveedor.direccion || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
      nit: proveedor.nit || "",
      ciudad: proveedor.ciudad || "",
      pais: proveedor.pais || "",
      notas: proveedor.notas || "",
    });
    setShowEditModal(true);
  };

  const handleEditProveedor = async () => {
    if (!selectedProveedor) return;

    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      const dataToUpdate: EditarProveedorData = {
        ...formData,
        activo: selectedProveedor.activo,
      };

      await updateProveedor(selectedProveedor.id_proveedor, dataToUpdate);
      toast.success("Proveedor actualizado exitosamente");
      setShowEditModal(false);
      resetFormData();
      setSelectedProveedor(null);
      fetchProveedoresData();
    } catch (error: any) {
      console.error("Error al actualizar proveedor:", error);
      toast.error(error.response?.data?.msg || "Error al actualizar proveedor");
    }
  };

  // Handlers para eliminar proveedor
  const handleOpenDeleteModal = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setShowDeleteModal(true);
  };

  const handleDeleteProveedor = async () => {
    if (!selectedProveedor) return;

    try {
      await deleteProveedor(selectedProveedor.id_proveedor);
      toast.success("Proveedor eliminado exitosamente");
      setShowDeleteModal(false);
      setSelectedProveedor(null);
      fetchProveedoresData();
    } catch (error: any) {
      console.error("Error al eliminar proveedor:", error);
      toast.error(error.response?.data?.msg || "Error al eliminar proveedor");
    }
  };

  // Handlers para ver transacciones
  const handleOpenTransactionsModal = async (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setShowTransactionsModal(true);
    setTransaccionesPage(1);
    await loadTransacciones(proveedor.id_proveedor);
  };

  // Actualizar transacciones cuando cambia la página
  useEffect(() => {
    if (showTransactionsModal && selectedProveedor) {
      loadTransacciones(selectedProveedor.id_proveedor);
    }
  }, [transaccionesPage]);

  // Handlers para crear transacción
  const handleOpenCreateTransactionModal = () => {
    setShowCreateTransactionModal(true);
  };

  const handleCreateTransaccion = async () => {
    if (!selectedProveedor) return;

    if (!transactionFormData.concepto.trim() || transactionFormData.monto <= 0) {
      toast.error("El concepto y monto son requeridos");
      return;
    }

    try {
      await createTransaccion(selectedProveedor.id_proveedor, transactionFormData);
      toast.success("Transacción creada exitosamente");
      setShowCreateTransactionModal(false);
      resetTransactionFormData();
      loadTransacciones(selectedProveedor.id_proveedor);
    } catch (error: any) {
      console.error("Error al crear transacción:", error);
      toast.error(error.response?.data?.msg || "Error al crear transacción");
    }
  };

  // Helpers
  const resetFormData = () => {
    setFormData({
      nombre: "",
      laboratorio: "",
      tipo: "",
      titular: "",
      direccion: "",
      telefono: "",
      email: "",
      nit: "",
      ciudad: "",
      pais: "",
      notas: "",
    });
  };

  const resetTransactionFormData = () => {
    setTransactionFormData({
      tipo: "compra",
      concepto: "",
      monto: 0,
      cantidad: undefined,
      numero_factura: "",
      fecha_emision: new Date().toISOString().split("T")[0],
      fecha_vencimiento: "",
      estado: "pendiente",
      notas: "",
    });
  };

  const handleFormChange = (field: keyof CrearProveedorData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTransactionFormChange = (field: keyof CrearTransaccionData, value: any) => {
    setTransactionFormData((prev) => ({ ...prev, [field]: value }));
  };

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
        <h1 className="text-2xl font-bold text-white">Gestión de Proveedores</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Nuevo Proveedor
        </button>
      </header>

      <div className="flex-1 p-4">
        {/* Sección de filtros */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar por nombre, NIT, email..."
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
            value={activoFilter}
            onChange={(e) => setActivoFilter(e.target.value)}
            className="bg-zinc-100 text-black rounded-md p-2 shadow-sm text-sm"
          >
            <option value="">Todos los proveedores</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Tabla de proveedores */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" color="text-white" text="Cargando proveedores..." />
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="p-3 border-b text-center text-white bg-indigo-900">
                <tr>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">NIT</th>
                  <th className="p-2">Titular</th>
                  <th className="p-2">Ciudad</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Transacciones</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-stone-200">
                {proveedores.length > 0 ? (
                  proveedores.map((proveedor) => (
                    <tr key={proveedor.id_proveedor} className="hover:bg-violet-300">
                      <td className="p-2 text-center font-medium">{proveedor.nombre}</td>
                      <td className="p-2 text-center">{proveedor.nit || "-"}</td>
                      <td className="p-2 text-center">{proveedor.titular || "-"}</td>
                      <td className="p-2 text-center">{proveedor.ciudad || "-"}</td>
                      <td className="p-2 text-center">{proveedor.telefono || "-"}</td>
                      <td className="p-2 text-center">{proveedor.email || "-"}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            proveedor.activo
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {proveedor.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                          {proveedor._count?.transacciones || 0}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenTransactionsModal(proveedor)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Ver transacciones"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(proveedor)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(proveedor)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-black">
                      No hay proveedores disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Crear Proveedor */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetFormData();
        }}
        title="Crear Nuevo Proveedor"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleFormChange("nombre", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
            <input
              type="text"
              value={formData.nit}
              onChange={(e) => handleFormChange("nit", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
            <input
              type="text"
              value={formData.laboratorio}
              onChange={(e) => handleFormChange("laboratorio", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <input
              type="text"
              value={formData.tipo}
              onChange={(e) => handleFormChange("tipo", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titular</label>
            <input
              type="text"
              value={formData.titular}
              onChange={(e) => handleFormChange("titular", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => handleFormChange("telefono", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={formData.ciudad}
              onChange={(e) => handleFormChange("ciudad", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <input
              type="text"
              value={formData.pais}
              onChange={(e) => handleFormChange("pais", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => handleFormChange("direccion", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleFormChange("notas", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowCreateModal(false);
              resetFormData();
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateProveedor}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Crear
          </button>
        </div>
      </Modal>

      {/* Modal de Editar Proveedor */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetFormData();
          setSelectedProveedor(null);
        }}
        title="Editar Proveedor"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleFormChange("nombre", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
            <input
              type="text"
              value={formData.nit}
              onChange={(e) => handleFormChange("nit", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
            <input
              type="text"
              value={formData.laboratorio}
              onChange={(e) => handleFormChange("laboratorio", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <input
              type="text"
              value={formData.tipo}
              onChange={(e) => handleFormChange("tipo", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titular</label>
            <input
              type="text"
              value={formData.titular}
              onChange={(e) => handleFormChange("titular", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => handleFormChange("telefono", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={formData.ciudad}
              onChange={(e) => handleFormChange("ciudad", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <input
              type="text"
              value={formData.pais}
              onChange={(e) => handleFormChange("pais", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => handleFormChange("direccion", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleFormChange("notas", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowEditModal(false);
              resetFormData();
              setSelectedProveedor(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleEditProveedor}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Guardar Cambios
          </button>
        </div>
      </Modal>

      {/* Modal de Eliminar Proveedor */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProveedor(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-700 mb-6">
          ¿Está seguro que desea eliminar el proveedor <strong>{selectedProveedor?.nombre}</strong>? Esta
          acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedProveedor(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteProveedor}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Eliminar
          </button>
        </div>
      </Modal>

      {/* Modal de Transacciones */}
      <Modal
        isOpen={showTransactionsModal}
        onClose={() => {
          setShowTransactionsModal(false);
          setSelectedProveedor(null);
          setTransacciones([]);
        }}
        title={`Historial de Transacciones - ${selectedProveedor?.nombre}`}
        size="xl"
      >
        <div className="mb-4">
          <button
            onClick={handleOpenCreateTransactionModal}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nueva Transacción
          </button>
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm">
            <thead className="bg-indigo-900 text-white">
              <tr>
                <th className="p-2">Fecha</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Concepto</th>
                <th className="p-2">Monto</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Factura</th>
              </tr>
            </thead>
            <tbody className="bg-stone-100">
              {transacciones.length > 0 ? (
                transacciones.map((transaccion) => (
                  <tr key={transaccion.id_transaccion} className="hover:bg-violet-200">
                    <td className="p-2 text-center">
                      {new Date(transaccion.fecha_emision).toLocaleDateString("es-CO")}
                    </td>
                    <td className="p-2 text-center capitalize">{transaccion.tipo}</td>
                    <td className="p-2 text-center">{transaccion.concepto}</td>
                    <td className="p-2 text-center">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                      }).format(Number(transaccion.monto))}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transaccion.estado === "completada"
                            ? "bg-green-200 text-green-800"
                            : transaccion.estado === "pendiente"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {transaccion.estado}
                      </span>
                    </td>
                    <td className="p-2 text-center">{transaccion.numero_factura || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No hay transacciones registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={transaccionesPage}
          totalPages={transaccionesTotalPages}
          onPageChange={setTransaccionesPage}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setShowTransactionsModal(false);
              setSelectedProveedor(null);
              setTransacciones([]);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* Modal de Crear Transacción */}
      <Modal
        isOpen={showCreateTransactionModal}
        onClose={() => {
          setShowCreateTransactionModal(false);
          resetTransactionFormData();
        }}
        title="Crear Nueva Transacción"
        size="md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={transactionFormData.tipo}
              onChange={(e) => handleTransactionFormChange("tipo", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="compra">Compra</option>
              <option value="devolucion">Devolución</option>
              <option value="pago">Pago</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={transactionFormData.monto}
              onChange={(e) => handleTransactionFormChange("monto", parseFloat(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={transactionFormData.concepto}
              onChange={(e) => handleTransactionFormChange("concepto", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              value={transactionFormData.cantidad || ""}
              onChange={(e) =>
                handleTransactionFormChange("cantidad", e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° Factura</label>
            <input
              type="text"
              value={transactionFormData.numero_factura}
              onChange={(e) => handleTransactionFormChange("numero_factura", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión</label>
            <input
              type="date"
              value={transactionFormData.fecha_emision}
              onChange={(e) => handleTransactionFormChange("fecha_emision", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
            <input
              type="date"
              value={transactionFormData.fecha_vencimiento}
              onChange={(e) => handleTransactionFormChange("fecha_vencimiento", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={transactionFormData.estado}
              onChange={(e) => handleTransactionFormChange("estado", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={transactionFormData.notas}
              onChange={(e) => handleTransactionFormChange("notas", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowCreateTransactionModal(false);
              resetTransactionFormData();
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateTransaccion}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Crear Transacción
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Proveedores;
