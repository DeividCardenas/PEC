/**
 * Página de Gestión de Domiciliarios (RF009)
 * CRUD completo de domiciliarios/repartidores
 */

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { usePermissions, PermissionGuard } from "../../hooks/usePermissions";
import {
  fetchDomiciliarios,
  fetchDomiciliario,
  createDomiciliario,
  updateDomiciliario,
  deleteDomiciliario,
  reactivarDomiciliario,
  cambiarDisponibilidad,
  fetchEstadisticas,
  type Domiciliario,
  type CrearDomiciliarioData,
  type EstadisticasDomiciliarios,
  TIPOS_VEHICULO,
} from "../../services/Domiciliarios/domiciliariosService";
import { FormModal, DetailsModal, DeleteModal } from "./DomiciliariosModals";

const Domiciliarios: React.FC = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [domiciliarios, setDomiciliarios] = useState<Domiciliario[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDomiciliarios | null>(null);
  const [selectedDomiciliario, setSelectedDomiciliario] = useState<Domiciliario | null>(null);

  // Paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [activoFilter, setActivoFilter] = useState<string>("");
  const [disponibleFilter, setDisponibleFilter] = useState<string>("");

  // Loading states
  const [loading, setLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CrearDomiciliarioData>({
    nombres: "",
    apellidos: "",
    numero_identificacion: "",
    telefono: "",
    email: "",
    tipo_vehiculo: "",
    placa_vehiculo: "",
    observaciones: "",
  });

  // Permissions
  const { tienePermiso } = usePermissions();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    cargarDomiciliarios();
    cargarEstadisticas();
  }, [currentPage, search, activoFilter, disponibleFilter]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const cargarDomiciliarios = async () => {
    setLoading(true);
    try {
      const response = await fetchDomiciliarios({
        page: currentPage,
        limit: 10,
        search,
        activo: activoFilter,
        disponible: disponibleFilter,
      });
      setDomiciliarios(response.domiciliarios);
      setTotalPages(response.paginacion.totalPaginas);
    } catch (error) {
      console.error("Error al cargar domiciliarios:", error);
      toast.error("Error al cargar los domiciliarios");
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

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleActivoFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivoFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDisponibleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDisponibleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleLimpiarFiltros = () => {
    setSearch("");
    setActivoFilter("");
    setDisponibleFilter("");
    setCurrentPage(1);
  };

  const handleCrearDomiciliario = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createDomiciliario(formData);
      toast.success("Domiciliario creado exitosamente");
      setShowCreateModal(false);
      resetForm();
      cargarDomiciliarios();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al crear domiciliario:", error);
      toast.error(error.response?.data?.msg || "Error al crear el domiciliario");
    }
  };

  const handleActualizarDomiciliario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDomiciliario) return;

    try {
      await updateDomiciliario(selectedDomiciliario.id_domiciliario, formData);
      toast.success("Domiciliario actualizado exitosamente");
      setShowEditModal(false);
      setSelectedDomiciliario(null);
      resetForm();
      cargarDomiciliarios();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al actualizar domiciliario:", error);
      toast.error(error.response?.data?.msg || "Error al actualizar el domiciliario");
    }
  };

  const handleEliminar = async () => {
    if (!selectedDomiciliario) return;

    try {
      await deleteDomiciliario(selectedDomiciliario.id_domiciliario);
      toast.success("Domiciliario desactivado exitosamente");
      setShowDeleteModal(false);
      setSelectedDomiciliario(null);
      cargarDomiciliarios();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al eliminar domiciliario:", error);
      toast.error(error.response?.data?.msg || "Error al eliminar el domiciliario");
    }
  };

  const handleReactivar = async (id: number) => {
    try {
      await reactivarDomiciliario(id);
      toast.success("Domiciliario reactivado exitosamente");
      cargarDomiciliarios();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al reactivar domiciliario:", error);
      toast.error(error.response?.data?.msg || "Error al reactivar el domiciliario");
    }
  };

  const handleCambiarDisponibilidad = async (id: number, disponible: boolean) => {
    try {
      await cambiarDisponibilidad(id, disponible);
      const mensaje = disponible
        ? "Domiciliario marcado como disponible"
        : "Domiciliario marcado como no disponible";
      toast.success(mensaje);
      cargarDomiciliarios();
      cargarEstadisticas();
    } catch (error: any) {
      console.error("Error al cambiar disponibilidad:", error);
      toast.error(error.response?.data?.msg || "Error al cambiar la disponibilidad");
    }
  };

  const handleVerDetalles = async (domiciliario: Domiciliario) => {
    try {
      const response = await fetchDomiciliario(domiciliario.id_domiciliario);
      setSelectedDomiciliario(response.domiciliario);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast.error("Error al cargar los detalles del domiciliario");
    }
  };

  const handleEditar = (domiciliario: Domiciliario) => {
    setSelectedDomiciliario(domiciliario);
    setFormData({
      nombres: domiciliario.nombres,
      apellidos: domiciliario.apellidos,
      numero_identificacion: domiciliario.numero_identificacion,
      telefono: domiciliario.telefono,
      email: domiciliario.email || "",
      tipo_vehiculo: domiciliario.tipo_vehiculo || "",
      placa_vehiculo: domiciliario.placa_vehiculo || "",
      observaciones: domiciliario.observaciones || "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombres: "",
      apellidos: "",
      numero_identificacion: "",
      telefono: "",
      email: "",
      tipo_vehiculo: "",
      placa_vehiculo: "",
      observaciones: "",
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Gestión de Domiciliarios
            </h1>
            <p className="text-gray-600 mt-2">Administración de repartidores y personal de entrega</p>
          </div>
          <PermissionGuard permission="crear_domiciliarios">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <i className="fas fa-plus"></i>
              Nuevo Domiciliario
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total Domiciliarios</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{estadisticas.totalDomiciliarios}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Activos</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{estadisticas.domiciliariosActivos}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-cyan-500">
            <p className="text-gray-600 text-sm font-medium">Disponibles</p>
            <p className="text-3xl font-bold text-cyan-600 mt-2">{estadisticas.domiciliariosDisponibles}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium">Ocupados</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{estadisticas.domiciliariosOcupados}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Nombre, apellido, identificación..."
              value={search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={activoFilter}
              onChange={handleActivoFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidad</label>
            <select
              value={disponibleFilter}
              onChange={handleDisponibleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">Todos</option>
              <option value="true">Disponibles</option>
              <option value="false">Ocupados</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleLimpiarFiltros} className="text-cyan-600 hover:text-cyan-700 font-medium">
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de Domiciliarios */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-cyan-600 to-blue-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Identificación
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                    </div>
                  </td>
                </tr>
              ) : domiciliarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron domiciliarios
                  </td>
                </tr>
              ) : (
                domiciliarios.map((domiciliario) => (
                  <tr key={domiciliario.id_domiciliario} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {domiciliario.nombres} {domiciliario.apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {domiciliario.numero_identificacion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {domiciliario.telefono}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {domiciliario.tipo_vehiculo || "N/A"}
                      {domiciliario.placa_vehiculo && (
                        <span className="block text-xs text-gray-500">{domiciliario.placa_vehiculo}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            domiciliario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {domiciliario.activo ? "Activo" : "Inactivo"}
                        </span>
                        {domiciliario.activo && (
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              domiciliario.disponible ? "bg-cyan-100 text-cyan-800" : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {domiciliario.disponible ? "Disponible" : "Ocupado"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleVerDetalles(domiciliario)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {domiciliario.activo && (
                          <>
                            <PermissionGuard permission="editar_domiciliarios">
                              <button
                                onClick={() => handleEditar(domiciliario)}
                                className="text-green-600 hover:text-green-900"
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission="editar_domiciliarios">
                              <button
                                onClick={() =>
                                  handleCambiarDisponibilidad(
                                    domiciliario.id_domiciliario,
                                    !domiciliario.disponible
                                  )
                                }
                                className={`${
                                  domiciliario.disponible ? "text-orange-600 hover:text-orange-900" : "text-cyan-600 hover:text-cyan-900"
                                }`}
                                title={domiciliario.disponible ? "Marcar como ocupado" : "Marcar como disponible"}
                              >
                                <i className={`fas ${domiciliario.disponible ? "fa-user-clock" : "fa-user-check"}`}></i>
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission="eliminar_domiciliarios">
                              <button
                                onClick={() => {
                                  setSelectedDomiciliario(domiciliario);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Desactivar"
                              >
                                <i className="fas fa-user-slash"></i>
                              </button>
                            </PermissionGuard>
                          </>
                        )}
                        {!domiciliario.activo && (
                          <PermissionGuard permission="editar_domiciliarios">
                            <button
                              onClick={() => handleReactivar(domiciliario.id_domiciliario)}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivar"
                            >
                              <i className="fas fa-user-check"></i>
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

      {/* Modal Crear - Continuing in next file due to length */}
    </div>
  );
};

export default Domiciliarios;
