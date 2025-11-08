/**
 * Página de Gestión de Pacientes (RF007)
 * CRUD completo para gestión de pacientes/clientes para entregas
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, Search, Activity } from "lucide-react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faEye,
  faUserCheck,
  faTimes,
  faIdCard,
  faPhone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
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
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-emerald-900 to-green-900 flex flex-col">
      <header className="bg-teal-800 shadow-lg p-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/Menu")}
          className="flex items-center text-white hover:text-gray-200 transition-colors px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={28} />
          Gestión de Pacientes
        </h1>
        <PermissionGuard permission="crear_pacientes">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors"
          >
            <UserPlus size={20} className="mr-2" />
            Nuevo Paciente
          </button>
        </PermissionGuard>
      </header>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Total Pacientes</p>
            <p className="text-2xl font-bold text-teal-900">{estadisticas.totalPacientes}</p>
          </div>
          <div className="bg-green-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Activos</p>
            <p className="text-2xl font-bold text-green-800">{estadisticas.pacientesActivos}</p>
          </div>
          <div className="bg-red-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm">Inactivos</p>
            <p className="text-2xl font-bold text-red-800">{estadisticas.pacientesInactivos}</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-sm flex items-center gap-1">
              <Activity size={16} />
              Tasa Actividad
            </p>
            <p className="text-2xl font-bold text-blue-800">
              {estadisticas.totalPacientes > 0
                ? Math.round((estadisticas.pacientesActivos / estadisticas.totalPacientes) * 100)
                : 0}
              %
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, identificación, teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-100 rounded-lg p-2 pl-10 text-gray-950 w-full shadow-md text-sm"
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
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Paginación */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        {/* Tabla de pacientes */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" color="text-white" text="Cargando pacientes..." />
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="p-3 border-b text-center text-white bg-teal-900">
                <tr>
                  <th className="p-2">Identificación</th>
                  <th className="p-2">Nombres</th>
                  <th className="p-2">Apellidos</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Ciudad</th>
                  <th className="p-2">EPS</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-stone-200">
                {pacientes.length > 0 ? (
                  pacientes.map((paciente) => (
                    <tr key={paciente.id_paciente} className="hover:bg-emerald-200">
                      <td className="p-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-600">{paciente.tipo_identificacion}</span>
                          <span className="font-medium">{paciente.numero_identificacion}</span>
                        </div>
                      </td>
                      <td className="p-2 text-center">{paciente.nombres}</td>
                      <td className="p-2 text-center">{paciente.apellidos}</td>
                      <td className="p-2 text-center">
                        <FontAwesomeIcon icon={faPhone} className="mr-1 text-teal-600" />
                        {paciente.telefono_principal}
                      </td>
                      <td className="p-2 text-center">{paciente.ciudad}</td>
                      <td className="p-2 text-center">{paciente.eps || "N/A"}</td>
                      <td className="p-2 text-center">
                        {paciente.activo ? (
                          <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-semibold">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleOpenDetailsModal(paciente)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Ver detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          {paciente.activo ? (
                            <>
                              <PermissionGuard permission="editar_pacientes">
                                <button
                                  onClick={() => handleOpenEditModal(paciente)}
                                  className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                                  title="Editar"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                              </PermissionGuard>
                              <PermissionGuard permission="eliminar_pacientes">
                                <button
                                  onClick={() => handleOpenDeleteModal(paciente)}
                                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                  title="Desactivar"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </PermissionGuard>
                            </>
                          ) : (
                            <PermissionGuard permission="editar_pacientes">
                              <button
                                onClick={() => handleReactivarPaciente(paciente)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                title="Reactivar"
                              >
                                <FontAwesomeIcon icon={faUserCheck} />
                              </button>
                            </PermissionGuard>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-black">
                      No hay pacientes disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Información de Identificación */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faIdCard} className="text-teal-600" />
              Información de Identificación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo ID <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo_identificacion"
                  value={formData.tipo_identificacion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="RC">Registro Civil</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número Identificación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="numero_identificacion"
                  value={formData.numero_identificacion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select
                  name="genero"
                  value={formData.genero || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
            <h3 className="font-semibold mb-3">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faPhone} className="text-teal-600" />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Principal <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telefono_principal"
                  value={formData.telefono_principal}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Secundario</label>
                <input
                  type="tel"
                  name="telefono_secundario"
                  value={formData.telefono_secundario || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-teal-600" />
              Dirección
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={formData.codigo_postal || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                <input
                  type="text"
                  name="barrio"
                  value={formData.barrio || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Información de Salud */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Información de Salud</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EPS</label>
                <input
                  type="text"
                  name="eps"
                  value={formData.eps || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Afiliación</label>
                <select
                  name="tipo_afiliacion"
                  value={formData.tipo_afiliacion || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones || ""}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
              resetForm();
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={showCreateModal ? handleCreatePaciente : handleEditPaciente}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            {showCreateModal ? "Crear Paciente" : "Guardar Cambios"}
          </button>
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
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedPaciente(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeletePaciente}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Desactivar
          </button>
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
              <h3 className="font-semibold mb-3 text-teal-800">Información General</h3>
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
              <h3 className="font-semibold mb-3 text-teal-800">Contacto</h3>
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
              <h3 className="font-semibold mb-3 text-teal-800">Dirección</h3>
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
              <h3 className="font-semibold mb-3 text-teal-800">Información de Salud</h3>
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
                <h3 className="font-semibold mb-2 text-teal-800">Observaciones</h3>
                <p className="text-sm text-gray-700">{selectedPaciente.observaciones}</p>
              </div>
            )}

            {/* Estado */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-teal-800">Estado</h3>
              <div className="flex items-center gap-3">
                {selectedPaciente.activo ? (
                  <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                    Activo
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-semibold">
                    Inactivo
                  </span>
                )}
                <span className="text-xs text-gray-600">
                  Registrado: {new Date(selectedPaciente.createdAt).toLocaleDateString("es-CO")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedPaciente(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Pacientes;
