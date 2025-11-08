/**
 * Página de Gestión de Pacientes (RF007)
 * CRUD completo para gestión de pacientes/clientes para entregas
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  UserCheck,
  IdCard,
  Phone,
  MapPin,
  Activity,
  TrendingUp,
  UserX,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  fetchPacientes,
  fetchPaciente,
  createPaciente,
  updatePaciente,
  deletePaciente,
  reactivarPaciente,
  fetchEstadisticas,
  Paciente,
  CrearPacienteData,
  EstadisticasPacientes,
} from "../../services/Pacientes/pacientesService";
import { usePermissions } from "../../hooks/usePermissions";
import { PermissionGuard } from "../../components/PermissionGuard";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import Table, { Column } from "../../components/Table";
import Card, { CardContent } from "../../components/Card";

const Pacientes = () => {
  const navigate = useNavigate();
  const { tienePermiso } = usePermissions();

  // Estados de datos
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPacientes | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  // Estados de paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [activoFilter, setActivoFilter] = useState<string>("");

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<CrearPacienteData>({
    tipo_identificacion: "CC",
    numero_identificacion: "",
    nombres: "",
    apellidos: "",
    telefono_principal: "",
    direccion: "",
    ciudad: "",
    departamento: "",
  });

  const itemsPerPage = 10;

  // Cargar pacientes
  const cargarPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchPacientes({
        page: currentPage,
        limit: itemsPerPage,
        search,
        activo: activoFilter,
      });
      setPacientes(response.pacientes);
      setTotalPages(response.paginacion.totalPaginas);
    } catch (error: any) {
      console.error("Error al cargar pacientes:", error);
      toast.error("Error al cargar los pacientes");
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, activoFilter]);

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const response = await fetchEstadisticas();
      setEstadisticas(response.estadisticas);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  useEffect(() => {
    cargarPacientes();
    cargarEstadisticas();
  }, [cargarPacientes]);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      tipo_identificacion: "CC",
      numero_identificacion: "",
      nombres: "",
      apellidos: "",
      telefono_principal: "",
      direccion: "",
      ciudad: "",
      departamento: "",
    });
    setSelectedPaciente(null);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Crear paciente
  const handleCreatePaciente = async () => {
    try {
      // Validaciones
      if (!formData.numero_identificacion || !formData.nombres || !formData.apellidos) {
        toast.error("Por favor complete los campos requeridos");
        return;
      }

      if (!formData.telefono_principal) {
        toast.error("El teléfono principal es requerido");
        return;
      }

      if (!formData.direccion || !formData.ciudad || !formData.departamento) {
        toast.error("La dirección completa es requerida");
        return;
      }

      await createPaciente(formData);
      toast.success("Paciente creado exitosamente");
      setShowCreateModal(false);
      resetForm();
      cargarPacientes();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al crear paciente:", error);
      toast.error(error.response?.data?.msg || "Error al crear el paciente");
    }
  };

  // Abrir modal de edición
  const handleOpenEditModal = async (paciente: Paciente) => {
    try {
      const response = await fetchPaciente(paciente.id_paciente);
      setSelectedPaciente(response.paciente);
      setFormData({
        tipo_identificacion: response.paciente.tipo_identificacion,
        numero_identificacion: response.paciente.numero_identificacion,
        nombres: response.paciente.nombres,
        apellidos: response.paciente.apellidos,
        fecha_nacimiento: response.paciente.fecha_nacimiento
          ? response.paciente.fecha_nacimiento.split("T")[0]
          : "",
        genero: response.paciente.genero || "",
        telefono_principal: response.paciente.telefono_principal,
        telefono_secundario: response.paciente.telefono_secundario || "",
        email: response.paciente.email || "",
        direccion: response.paciente.direccion,
        ciudad: response.paciente.ciudad,
        departamento: response.paciente.departamento,
        codigo_postal: response.paciente.codigo_postal || "",
        barrio: response.paciente.barrio || "",
        eps: response.paciente.eps || "",
        tipo_afiliacion: response.paciente.tipo_afiliacion || "",
        observaciones: response.paciente.observaciones || "",
      });
      setShowEditModal(true);
    } catch (error: any) {
      console.error("Error al cargar paciente:", error);
      toast.error("Error al cargar los datos del paciente");
    }
  };

  // Editar paciente
  const handleEditPaciente = async () => {
    if (!selectedPaciente) return;

    try {
      await updatePaciente(selectedPaciente.id_paciente, formData);
      toast.success("Paciente actualizado exitosamente");
      setShowEditModal(false);
      resetForm();
      cargarPacientes();
    } catch (error: any) {
      console.error("Error al actualizar paciente:", error);
      toast.error(error.response?.data?.msg || "Error al actualizar el paciente");
    }
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setShowDeleteModal(true);
  };

  // Eliminar paciente
  const handleDeletePaciente = async () => {
    if (!selectedPaciente) return;

    try {
      await deletePaciente(selectedPaciente.id_paciente);
      toast.success("Paciente desactivado exitosamente");
      setShowDeleteModal(false);
      setSelectedPaciente(null);
      cargarPacientes();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al eliminar paciente:", error);
      toast.error(error.response?.data?.msg || "Error al desactivar el paciente");
    }
  };

  // Reactivar paciente
  const handleReactivarPaciente = async (paciente: Paciente) => {
    try {
      await reactivarPaciente(paciente.id_paciente);
      toast.success("Paciente reactivado exitosamente");
      cargarPacientes();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al reactivar paciente:", error);
      toast.error(error.response?.data?.msg || "Error al reactivar el paciente");
    }
  };

  // Ver detalles
  const handleOpenDetailsModal = async (paciente: Paciente) => {
    try {
      const response = await fetchPaciente(paciente.id_paciente);
      setSelectedPaciente(response.paciente);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error("Error al cargar detalles:", error);
      toast.error("Error al cargar los detalles del paciente");
    }
  };

  // Calcular edad
  const calcularEdad = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  // Definir columnas de la tabla
  const columns: Column<Paciente>[] = [
    {
      key: "numero_identificacion",
      title: "Identificación",
      align: "center",
      render: (val, row) => (
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-600">{row.tipo_identificacion}</span>
          <span className="font-medium">{val}</span>
        </div>
      ),
    },
    { key: "nombres", title: "Nombres", align: "left" },
    { key: "apellidos", title: "Apellidos", align: "left" },
    {
      key: "telefono_principal",
      title: "Teléfono",
      align: "center",
      render: (val) => (
        <div className="flex items-center justify-center gap-1">
          <Phone size={14} className="text-primary-600" />
          {val}
        </div>
      ),
    },
    { key: "ciudad", title: "Ciudad", align: "center" },
    { key: "eps", title: "EPS", align: "center", render: (val) => val || "N/A" },
    {
      key: "activo",
      title: "Estado",
      align: "center",
      render: (val) => <Badge variant={val ? "success" : "danger"}>{val ? "Activo" : "Inactivo"}</Badge>,
    },
    {
      key: "id_paciente",
      title: "Acciones",
      align: "center",
      render: (_, row) => (
        <div className="flex justify-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenDetailsModal(row)}
            icon={<Eye size={16} />}
            title="Ver detalles"
          />
          {row.activo ? (
            <>
              <PermissionGuard permission="editar_pacientes">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEditModal(row)}
                  icon={<Edit2 size={16} />}
                  title="Editar"
                />
              </PermissionGuard>
              <PermissionGuard permission="eliminar_pacientes">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDeleteModal(row)}
                  icon={<Trash2 size={16} className="text-red-600" />}
                  title="Desactivar"
                />
              </PermissionGuard>
            </>
          ) : (
            <PermissionGuard permission="editar_pacientes">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReactivarPaciente(row)}
                icon={<UserCheck size={16} className="text-green-600" />}
                title="Reactivar"
              />
            </PermissionGuard>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/Menu")} icon={<ArrowLeft size={20} />}>
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Users size={32} />
                  Gestión de Pacientes
                </h1>
                <p className="text-gray-600 mt-1">Administra los pacientes y su información médica</p>
              </div>
            </div>
            <PermissionGuard permission="crear_pacientes">
              <Button
                variant="success"
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                icon={<UserPlus size={20} />}
              >
                Nuevo Paciente
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{estadisticas.totalPacientes}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users size={24} className="text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pacientes Activos</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{estadisticas.pacientesActivos}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <UserCheck size={24} className="text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pacientes Inactivos</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{estadisticas.pacientesInactivos}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <UserX size={24} className="text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa de Actividad</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {estadisticas.totalPacientes > 0
                        ? Math.round((estadisticas.pacientesActivos / estadisticas.totalPacientes) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp size={24} className="text-blue-600" />
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
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <Input
                  variant="search"
                  placeholder="Buscar por nombre, identificación, teléfono..."
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
                  <option value="">Todos los estados</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>

            {/* Paginación */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* Tabla de pacientes */}
            <Table
              columns={columns}
              data={pacientes}
              keyExtractor={(row) => row.id_paciente}
              loading={loading}
              striped
              hoverable
              emptyMessage="No hay pacientes disponibles"
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal de Crear/Editar Paciente */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
          resetForm();
        }}
        title={showCreateModal ? "Nuevo Paciente" : "Editar Paciente"}
        size="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Información de Identificación */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
              <IdCard className="text-primary-600" size={20} />
              Información de Identificación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo ID <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo_identificacion"
                  value={formData.tipo_identificacion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="RC">Registro Civil</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>
              <Input
                label="Número Identificación"
                required
                name="numero_identificacion"
                value={formData.numero_identificacion}
                onChange={handleInputChange}
                placeholder="Número de documento"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                <select
                  name="genero"
                  value={formData.genero || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-gray-900">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Nombres"
                required
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                placeholder="Nombres completos"
              />
              <Input
                label="Apellidos"
                required
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                placeholder="Apellidos completos"
              />
              <Input
                label="Fecha Nacimiento"
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento || ""}
                onChange={handleInputChange}
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
              <Phone className="text-primary-600" size={20} />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Teléfono Principal"
                required
                type="tel"
                name="telefono_principal"
                value={formData.telefono_principal}
                onChange={handleInputChange}
                placeholder="Número principal"
              />
              <Input
                label="Teléfono Secundario"
                type="tel"
                name="telefono_secundario"
                value={formData.telefono_secundario || ""}
                onChange={handleInputChange}
                placeholder="Número alternativo"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
              <MapPin className="text-primary-600" size={20} />
              Dirección
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Input
                label="Dirección"
                required
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Dirección completa"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Ciudad"
                  required
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  placeholder="Ciudad"
                />
                <Input
                  label="Departamento"
                  required
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  placeholder="Departamento"
                />
                <Input
                  label="Código Postal"
                  name="codigo_postal"
                  value={formData.codigo_postal || ""}
                  onChange={handleInputChange}
                  placeholder="Código postal"
                />
              </div>
              <Input
                label="Barrio"
                name="barrio"
                value={formData.barrio || ""}
                onChange={handleInputChange}
                placeholder="Barrio o localidad"
              />
            </div>
          </div>

          {/* Información de Salud */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
              <Activity className="text-primary-600" size={20} />
              Información de Salud
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="EPS" name="eps" value={formData.eps || ""} onChange={handleInputChange} placeholder="EPS del paciente" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Afiliación</label>
                <select
                  name="tipo_afiliacion"
                  value={formData.tipo_afiliacion || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Contributivo">Contributivo</option>
                  <option value="Subsidiado">Subsidiado</option>
                  <option value="Particular">Particular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button variant="success" onClick={showCreateModal ? handleCreatePaciente : handleEditPaciente} icon={<UserPlus size={20} />}>
            {showCreateModal ? "Crear Paciente" : "Guardar Cambios"}
          </Button>
        </div>
      </Modal>

      {/* Modal de Eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPaciente(null);
        }}
        title="Confirmar Desactivación"
        size="sm"
      >
        <p className="text-gray-700 mb-6">
          ¿Está seguro que desea desactivar al paciente{" "}
          <strong>
            {selectedPaciente?.nombres} {selectedPaciente?.apellidos}
          </strong>
          ? El paciente no será eliminado, solo marcado como inactivo.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedPaciente(null);
            }}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeletePaciente} icon={<Trash2 size={20} />}>
            Desactivar
          </Button>
        </div>
      </Modal>

      {/* Modal de Detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPaciente(null);
        }}
        title={`Detalles de ${selectedPaciente?.nombres} ${selectedPaciente?.apellidos}`}
        size="lg"
      >
        {selectedPaciente && (
          <div className="space-y-4">
            {/* Información General */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-primary-800">Información General</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Identificación:</span>
                  <p className="font-medium">
                    {selectedPaciente.tipo_identificacion} {selectedPaciente.numero_identificacion}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Género:</span>
                  <p className="font-medium">{selectedPaciente.genero || "No especificado"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fecha Nacimiento:</span>
                  <p className="font-medium">
                    {selectedPaciente.fecha_nacimiento
                      ? new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString("es-CO")
                      : "No especificada"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Edad:</span>
                  <p className="font-medium">{calcularEdad(selectedPaciente.fecha_nacimiento)}</p>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-primary-800">Contacto</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Teléfono Principal:</span>
                  <p className="font-medium">{selectedPaciente.telefono_principal}</p>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono Secundario:</span>
                  <p className="font-medium">{selectedPaciente.telefono_secundario || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{selectedPaciente.email || "No especificado"}</p>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-primary-800">Dirección</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Dirección:</span> {selectedPaciente.direccion}
                </p>
                <p>
                  <span className="text-gray-600">Ciudad:</span> {selectedPaciente.ciudad}
                </p>
                <p>
                  <span className="text-gray-600">Departamento:</span> {selectedPaciente.departamento}
                </p>
                {selectedPaciente.barrio && (
                  <p>
                    <span className="text-gray-600">Barrio:</span> {selectedPaciente.barrio}
                  </p>
                )}
                {selectedPaciente.codigo_postal && (
                  <p>
                    <span className="text-gray-600">Código Postal:</span> {selectedPaciente.codigo_postal}
                  </p>
                )}
              </div>
            </div>

            {/* Información de Salud */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-primary-800">Información de Salud</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">EPS:</span>
                  <p className="font-medium">{selectedPaciente.eps || "No especificada"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo Afiliación:</span>
                  <p className="font-medium">{selectedPaciente.tipo_afiliacion || "No especificado"}</p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {selectedPaciente.observaciones && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-primary-800">Observaciones</h3>
                <p className="text-sm text-gray-700">{selectedPaciente.observaciones}</p>
              </div>
            )}

            {/* Estado */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-primary-800">Estado</h3>
              <div className="flex items-center gap-3">
                <Badge variant={selectedPaciente.activo ? "success" : "danger"}>
                  {selectedPaciente.activo ? "Activo" : "Inactivo"}
                </Badge>
                <span className="text-xs text-gray-600">
                  Registrado: {new Date(selectedPaciente.createdAt).toLocaleDateString("es-CO")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedPaciente(null);
            }}
          >
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Pacientes;
