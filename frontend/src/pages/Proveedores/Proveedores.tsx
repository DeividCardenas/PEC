import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, Eye, X } from "lucide-react";
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
import Button from "../../components/Button";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import Table, { Column } from "../../components/Table";
import Card, { CardContent } from "../../components/Card";

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

  // Definir columnas de la tabla de proveedores
  const columns: Column<Proveedor>[] = [
    { key: 'nombre', title: 'Nombre', align: 'left' },
    { key: 'nit', title: 'NIT', align: 'center', render: (val) => val || '-' },
    { key: 'titular', title: 'Titular', align: 'center', render: (val) => val || '-' },
    { key: 'ciudad', title: 'Ciudad', align: 'center', render: (val) => val || '-' },
    { key: 'telefono', title: 'Teléfono', align: 'center', render: (val) => val || '-' },
    { key: 'email', title: 'Email', align: 'center', render: (val) => val || '-' },
    {
      key: 'activo',
      title: 'Estado',
      align: 'center',
      render: (val) => (
        <Badge variant={val ? 'success' : 'danger'}>
          {val ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: '_count',
      title: 'Transacciones',
      align: 'center',
      render: (val: any) => <Badge variant="info">{val?.transacciones || 0}</Badge>
    },
    {
      key: 'id_proveedor',
      title: 'Acciones',
      align: 'center',
      render: (_, row) => (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenTransactionsModal(row)}
            icon={<Eye size={16} />}
            title="Ver transacciones"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEditModal(row)}
            icon={<Edit2 size={16} />}
            title="Editar"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenDeleteModal(row)}
            icon={<Trash2 size={16} className="text-red-600" />}
            title="Eliminar"
          />
        </div>
      )
    }
  ];

  // Definir columnas de la tabla de transacciones
  const transactionColumns: Column<Transaccion>[] = [
    {
      key: 'fecha_emision',
      title: 'Fecha',
      align: 'center',
      render: (val) => new Date(val).toLocaleDateString("es-CO")
    },
    { key: 'tipo', title: 'Tipo', align: 'center', render: (val) => <span className="capitalize">{val}</span> },
    { key: 'concepto', title: 'Concepto', align: 'left' },
    {
      key: 'monto',
      title: 'Monto',
      align: 'right',
      render: (val) => new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
      }).format(Number(val))
    },
    {
      key: 'estado',
      title: 'Estado',
      align: 'center',
      render: (val) => (
        <Badge variant={
          val === 'completada' ? 'success' :
          val === 'pendiente' ? 'warning' :
          'danger'
        }>
          {val}
        </Badge>
      )
    },
    { key: 'numero_factura', title: 'N° Factura', align: 'center', render: (val) => val || '-' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/Menu")}
                icon={<ArrowLeft size={20} />}
              >
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
                <p className="text-gray-600 mt-1">Administra los proveedores y sus transacciones</p>
              </div>
            </div>
            <Button
              variant="success"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={20} />}
            >
              Nuevo Proveedor
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <Input
                  variant="search"
                  placeholder="Buscar por nombre, NIT, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  clearable
                  onClear={() => setSearch("")}
                />
              </div>
              <div className="w-full sm:w-auto">
                <select
                  value={activoFilter}
                  onChange={(e) => setActivoFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="">Todos los proveedores</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />

            {/* Tabla de proveedores */}
            <Table
              columns={columns}
              data={proveedores}
              keyExtractor={(row) => row.id_proveedor}
              loading={loading}
              striped
              hoverable
              emptyMessage="No hay proveedores disponibles"
            />
          </CardContent>
        </Card>
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
          <Input
            label="Nombre"
            required
            value={formData.nombre}
            onChange={(e) => handleFormChange("nombre", e.target.value)}
            placeholder="Nombre del proveedor"
          />

          <Input
            label="NIT"
            value={formData.nit}
            onChange={(e) => handleFormChange("nit", e.target.value)}
            placeholder="NIT del proveedor"
          />

          <Input
            label="Laboratorio"
            value={formData.laboratorio}
            onChange={(e) => handleFormChange("laboratorio", e.target.value)}
            placeholder="Laboratorio asociado"
          />

          <Input
            label="Tipo"
            value={formData.tipo}
            onChange={(e) => handleFormChange("tipo", e.target.value)}
            placeholder="Tipo de proveedor"
          />

          <Input
            label="Titular"
            value={formData.titular}
            onChange={(e) => handleFormChange("titular", e.target.value)}
            placeholder="Titular del proveedor"
          />

          <Input
            label="Teléfono"
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleFormChange("telefono", e.target.value)}
            placeholder="Número de teléfono"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="correo@ejemplo.com"
          />

          <Input
            label="Ciudad"
            value={formData.ciudad}
            onChange={(e) => handleFormChange("ciudad", e.target.value)}
            placeholder="Ciudad"
          />

          <Input
            label="País"
            value={formData.pais}
            onChange={(e) => handleFormChange("pais", e.target.value)}
            placeholder="País"
          />

          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => handleFormChange("direccion", e.target.value)}
            placeholder="Dirección completa"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleFormChange("notas", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              resetFormData();
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleCreateProveedor}
            icon={<Plus size={20} />}
          >
            Crear Proveedor
          </Button>
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
          <Input
            label="Nombre"
            required
            value={formData.nombre}
            onChange={(e) => handleFormChange("nombre", e.target.value)}
            placeholder="Nombre del proveedor"
          />

          <Input
            label="NIT"
            value={formData.nit}
            onChange={(e) => handleFormChange("nit", e.target.value)}
            placeholder="NIT del proveedor"
          />

          <Input
            label="Laboratorio"
            value={formData.laboratorio}
            onChange={(e) => handleFormChange("laboratorio", e.target.value)}
            placeholder="Laboratorio asociado"
          />

          <Input
            label="Tipo"
            value={formData.tipo}
            onChange={(e) => handleFormChange("tipo", e.target.value)}
            placeholder="Tipo de proveedor"
          />

          <Input
            label="Titular"
            value={formData.titular}
            onChange={(e) => handleFormChange("titular", e.target.value)}
            placeholder="Titular del proveedor"
          />

          <Input
            label="Teléfono"
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleFormChange("telefono", e.target.value)}
            placeholder="Número de teléfono"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="correo@ejemplo.com"
          />

          <Input
            label="Ciudad"
            value={formData.ciudad}
            onChange={(e) => handleFormChange("ciudad", e.target.value)}
            placeholder="Ciudad"
          />

          <Input
            label="País"
            value={formData.pais}
            onChange={(e) => handleFormChange("pais", e.target.value)}
            placeholder="País"
          />

          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => handleFormChange("direccion", e.target.value)}
            placeholder="Dirección completa"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleFormChange("notas", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowEditModal(false);
              resetFormData();
              setSelectedProveedor(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleEditProveedor}
            icon={<Edit2 size={20} />}
          >
            Guardar Cambios
          </Button>
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
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedProveedor(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteProveedor}
            icon={<Trash2 size={20} />}
          >
            Eliminar
          </Button>
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
          <Button
            variant="success"
            onClick={handleOpenCreateTransactionModal}
            icon={<Plus size={20} />}
          >
            Nueva Transacción
          </Button>
        </div>

        <div className="mb-4">
          <Table
            columns={transactionColumns}
            data={transacciones}
            keyExtractor={(row) => row.id_transaccion}
            striped
            hoverable
            emptyMessage="No hay transacciones registradas"
          />
        </div>

        <Pagination
          currentPage={transaccionesPage}
          totalPages={transaccionesTotalPages}
          onPageChange={setTransaccionesPage}
        />

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowTransactionsModal(false);
              setSelectedProveedor(null);
              setTransacciones([]);
            }}
          >
            Cerrar
          </Button>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={transactionFormData.tipo}
              onChange={(e) => handleTransactionFormChange("tipo", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              <option value="compra">Compra</option>
              <option value="devolucion">Devolución</option>
              <option value="pago">Pago</option>
            </select>
          </div>

          <Input
            label="Monto"
            required
            type="number"
            value={transactionFormData.monto.toString()}
            onChange={(e) => handleTransactionFormChange("monto", parseFloat(e.target.value))}
            placeholder="0.00"
          />

          <div className="md:col-span-2">
            <Input
              label="Concepto"
              required
              value={transactionFormData.concepto}
              onChange={(e) => handleTransactionFormChange("concepto", e.target.value)}
              placeholder="Descripción de la transacción"
            />
          </div>

          <Input
            label="Cantidad"
            type="number"
            value={transactionFormData.cantidad?.toString() || ""}
            onChange={(e) =>
              handleTransactionFormChange("cantidad", e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="Cantidad de items"
          />

          <Input
            label="N° Factura"
            value={transactionFormData.numero_factura}
            onChange={(e) => handleTransactionFormChange("numero_factura", e.target.value)}
            placeholder="Número de factura"
          />

          <Input
            label="Fecha Emisión"
            type="date"
            value={transactionFormData.fecha_emision}
            onChange={(e) => handleTransactionFormChange("fecha_emision", e.target.value)}
          />

          <Input
            label="Fecha Vencimiento"
            type="date"
            value={transactionFormData.fecha_vencimiento}
            onChange={(e) => handleTransactionFormChange("fecha_vencimiento", e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={transactionFormData.estado}
              onChange={(e) => handleTransactionFormChange("estado", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={transactionFormData.notas}
              onChange={(e) => handleTransactionFormChange("notas", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateTransactionModal(false);
              resetTransactionFormData();
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleCreateTransaccion}
            icon={<Plus size={20} />}
          >
            Crear Transacción
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Proveedores;
