import React, { useState } from "react";
import {
  fetchEmpresas,
  fetchEps,
  fetchLaboratorios,
  fetchUsers,
  updateUser,
  updateEps,
  updateLaboratorio,
  updateEmpresa,
  deleteUser,
  deleteEps,
  deleteLaboratorio,
  deleteEmpresa
} from "../../services/Admin/admin.Service";
import Sidebar from "../../components/Sidebar";
import MobileSidebar from "../../components/MobileSidebar";
import Header from "../../components/Header";
import { useAuth } from '../../context/useAuth';
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";


const AdminDashboard: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState<any>(null);
  const [perPage, setPerPage] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>("");
  const [editForm, setEditForm] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleMenuToggle = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
  };

  // Nota: La protección de autenticación y rol ahora está manejada por ProtectedRoute en App.tsx

  const fetchData = async (type: string) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      setCurrentSection(type);
      let response;
      const defaultFilters = { page, limit: perPage, nombre: searchQuery };

      switch (type) {
        case "users":
          response = await fetchUsers(defaultFilters);
          break;
        case "eps":
          response = await fetchEps(defaultFilters);
          break;
        case "laboratorios":
          response = await fetchLaboratorios(defaultFilters);
          break;
        case "empresas":
          response = await fetchEmpresas(defaultFilters);
          break;
        default:
          throw new Error("Tipo de datos no válido");
      }
      setData(response);
      // update totalPages and current page if API returns paginaActual/totalPaginas
      const respAny: any = response;

      // If service returned normalized { data, page, totalPages }
      if (respAny && Array.isArray(respAny.data)) {
        setTotalPages(Number(respAny.totalPages ?? 1));
        const current = respAny.page ?? page;
        if (Number(current) !== page) setPage(Number(current));
      } else {
        const total = respAny?.totalPaginas ?? respAny?.totalPages ?? 1;
        const current = respAny?.paginaActual ?? respAny?.currentPage ?? respAny?.page ?? page;
        setTotalPages(Number(total));
        if (Number(current) !== page) setPage(Number(current));
      }
    } catch (err) {
      console.error(`Error al obtener ${type}:`, err);
      // Attempt to read server message if provided
      const serverMsg = (err as any)?.response?.data?.msg || (err as any)?.response?.data?.mensaje || (err as any)?.message;
      setError(serverMsg ? `No se pudo cargar la información de ${type}: ${serverMsg}` : `No se pudo cargar la información de ${type}. Intente nuevamente más tarde.`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to normalize data for rendering in this component
  const getNormalizedData = (raw: any, section: string) => {
    if (!raw) return { items: [], page: page, totalPages };

    // If service already returned normalized shape
    if (Array.isArray(raw.data)) return { items: raw.data, page: raw.page ?? page, totalPages: raw.totalPages ?? totalPages };

    // Users
    if (Array.isArray(raw.usuarios)) return { items: raw.usuarios, page: raw.paginaActual ?? raw.page ?? page, totalPages: raw.totalPaginas ?? raw.totalPages ?? totalPages };

    // EPS
    if (Array.isArray(raw.eps)) return { items: raw.eps, page: raw.paginaActual ?? raw.page ?? page, totalPages: raw.totalPaginas ?? raw.totalPages ?? totalPages };

    // Empresas structure: raw.data (array of empresas) OR raw.empresas
    if (Array.isArray(raw.data) && section === 'empresas') return { items: raw.data, page: raw.page ?? raw.paginaActual ?? page, totalPages: raw.totalPages ?? raw.totalPaginas ?? totalPages };
    if (Array.isArray(raw.empresas)) return { items: raw.empresas, page: raw.paginaActual ?? raw.page ?? page, totalPages: raw.totalPaginas ?? raw.totalPages ?? totalPages };

    // Laboratorios: previously expected raw.data
    if (Array.isArray(raw.data) && section === 'laboratorios') return { items: raw.data, page: raw.page ?? raw.paginaActual ?? page, totalPages: raw.totalPages ?? raw.totalPaginas ?? totalPages };

    // Fallback
    return { items: [], page, totalPages };
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    // Inicializar el formulario de edición con los datos actuales
    if (currentSection === "users") {
      setEditForm({
        username: item.username,
        email: item.email,
        rol_id: item.rol.id_rol
      });
    } else if (currentSection === "eps" || currentSection === "laboratorios") {
      setEditForm({
        nombre: item.nombre
      });
    } else if (currentSection === "empresas") {
      setEditForm({
        nombre: item.nombre
      });
    }
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
    setEditForm({});
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === "rol_id" ? parseInt(value) : value
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (currentSection) {
        case "users":
          await updateUser(selectedItem.id_usuario, editForm);
          break;
        case "eps":
          await updateEps(selectedItem.id_eps, editForm);
          break;
        case "laboratorios":
          await updateLaboratorio(selectedItem.id_laboratorio, editForm);
          break;
        case "empresas":
          await updateEmpresa(selectedItem.id_empresa, editForm);
          break;
        default:
          throw new Error("Sección no válida para actualización");
      }
      
      showSuccessMessage("Información actualizada correctamente");
      closeModals();
      // Recargar los datos para reflejar los cambios
      fetchData(currentSection);
    } catch (error) {
      console.error("Error al actualizar:", error);
      setError("No se pudo actualizar la información. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      switch (currentSection) {
        case "users":
          await deleteUser(selectedItem.id_usuario);
          break;
        case "eps":
          await deleteEps(selectedItem.id_eps);
          break;
        case "laboratorios":
          await deleteLaboratorio(selectedItem.id_laboratorio);
          break;
        case "empresas":
          await deleteEmpresa(selectedItem.id_empresa);
          break;
        default:
          throw new Error("Sección no válida para eliminación");
      }
      
      showSuccessMessage("Elemento eliminado correctamente");
      closeModals();
      // Recargar los datos para reflejar los cambios
      fetchData(currentSection);
    } catch (error) {
      console.error("Error al eliminar:", error);
      setError("No se pudo eliminar el elemento. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el formulario de edición según el tipo de elemento
  const renderEditForm = () => {
    if (!selectedItem) return null;

    if (currentSection === "users") {
      return (
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
            <input
              type="text"
              name="username"
              value={editForm.username || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={editForm.email || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              name="rol_id"
              value={editForm.rol_id || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Seleccionar rol</option>
              <option value="1">Administrador</option>
              <option value="2">Usuario</option>
              <option value="3">Técnico</option>
            </select>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={closeModals}
              className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      );
    } else {
      // Formulario para EPS, laboratorios y empresas (solo nombre)
      return (
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={editForm.nombre || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={closeModals}
              className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="min-h-screen bg-sky-900 flex flex-row p-0 overflow-hidden relative">
      {/* Si navigate no está disponible, muestra un mensaje de error */}
      {!navigate && (
        <div className="text-red-500 p-4">
          Error: El componente no está dentro de un Router. Asegúrate de que AdminPage se renderiza dentro de &lt;BrowserRouter&gt;.
        </div>
      )}

      {/* Sidebar fijo a la izquierda */}
      <div className="hidden md:block">
        {isSidebarOpen && <Sidebar />}
      </div>
      {/* Sidebar móvil */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={handleMenuToggle} />

        {!isSidebarOpen && window.innerWidth >= 768 && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-md shadow-lg hover:bg-gray-700 transition"
          >
            <Menu size={24} />
          </button>
        )}

        <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-6">
          <h1 className="text-4xl font-bold text-white mb-8 text-center drop-shadow-lg">
            Panel de Administración
          </h1>

          {/* Botón de redirección a Crear */}
          <div className="w-full flex justify-end mb-4">
            {user?.rol === 'Administrador' && (
              <button
                onClick={() => navigate("/Admin/Crear")}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-2xl shadow transition"
              >
                Crear
              </button>
            )}
          </div>

          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded w-full max-w-lg mx-auto">
              <p>{successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-4xl mb-10">
            <button
              onClick={() => fetchData("users")}
              className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all p-6 flex flex-col items-center justify-center text-center focus:outline-none border-4 ${currentSection === "users" ? "border-blue-600" : "border-transparent"}`}
              aria-label="Ver Usuarios"
            >
              <span className="text-indigo-900 text-3xl font-semibold mb-2">Usuarios</span>
              <span className="text-gray-600">Gestiona los usuarios aquí</span>
            </button>
            <button
              onClick={() => fetchData("eps")}
              className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all p-6 flex flex-col items-center justify-center text-center focus:outline-none border-4 ${currentSection === "eps" ? "border-green-600" : "border-transparent"}`}
              aria-label="Ver EPS"
            >
              <span className="text-indigo-900 text-3xl font-semibold mb-2">EPS</span>
              <span className="text-gray-600">Gestiona las EPS aquí</span>
            </button>
            <button
              onClick={() => fetchData("laboratorios")}
              className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all p-6 flex flex-col items-center justify-center text-center focus:outline-none border-4 ${currentSection === "laboratorios" ? "border-yellow-600" : "border-transparent"}`}
              aria-label="Ver Laboratorios"
            >
              <span className="text-indigo-900 text-3xl font-semibold mb-2">Laboratorios</span>
              <span className="text-gray-600">Gestiona los laboratorios aquí</span>
            </button>
            <button
              onClick={() => fetchData("empresas")}
              className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all p-6 flex flex-col items-center justify-center text-center focus:outline-none border-4 ${currentSection === "empresas" ? "border-purple-600" : "border-transparent"}`}
              aria-label="Ver Empresas"
            >
              <span className="text-indigo-900 text-3xl font-semibold mb-2">Empresas</span>
              <span className="text-gray-600">Gestiona las empresas aquí</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded w-full max-w-lg mx-auto">
              <div className="flex items-start justify-between gap-4">
                <p className="flex-1">{error}</p>
                <div className="flex-shrink-0 ml-4">
                  <button onClick={() => fetchData(currentSection || 'laboratorios')} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Reintentar</button>
                </div>
              </div>
            </div>
          )}

          <div className="w-full max-w-4xl">
            <div className="bg-white p-6 rounded-3xl shadow-lg">
              {/* Search & per-page controls */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-1/2">
                  <input type="text" placeholder="Buscar por nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border p-2 rounded" />
                  <button onClick={() => fetchData(currentSection || 'users')} className="bg-indigo-600 text-white px-3 py-2 rounded">Buscar</button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Por página:</label>
                  <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); fetchData(currentSection || 'users'); }} className="border p-2 rounded">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Cargando datos...</p>
                </div>
              ) : data ? (
                (() => {
                  const normalized = getNormalizedData(data, currentSection);
                  if (Array.isArray(normalized.items) && currentSection === 'users') {
                    // Renderizar usuarios
                    return (
                      <div>
                        <h2 className="text-lg font-semibold mb-3">Usuarios</h2>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {normalized.items.map((usuario: any) => (
                                <tr key={usuario.id_usuario}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.id_usuario}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.username}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.rol.nombre}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                      onClick={() => handleEdit(usuario)}
                                      className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(usuario)}
                                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }
                  else if (Array.isArray(data.eps) || (normalized.items && currentSection === 'eps')) {
                    // Renderizar EPS
                    return (
                      <div>
                        <h2 className="text-lg font-semibold mb-3">EPS</h2>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(normalized.items && currentSection === 'eps' ? normalized.items : data.eps).map((eps: any) => (
                                <tr key={eps.id_eps}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eps.id_eps}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{eps.nombre}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                      onClick={() => handleEdit(eps)}
                                      className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(eps)}
                                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }
                  else if (currentSection === "laboratorios") {
                    // Renderizar laboratorios
                    return (
                      <div>
                        <h2 className="text-lg font-semibold mb-3">Laboratorios</h2>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              { (normalized.items && currentSection === 'laboratorios' ? normalized.items : (data.data || [])).map((laboratorio: any) => (
                                <tr key={laboratorio.id_laboratorio}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laboratorio.id_laboratorio}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{laboratorio.nombre}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                      onClick={() => handleEdit(laboratorio)}
                                      className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(laboratorio)}
                                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }
                  else if (currentSection === "empresas") {
                    // Renderizar empresas
                    return (
                      <div>
                        <h2 className="text-lg font-semibold mb-3">Empresas</h2>
                        {(normalized.items && currentSection === 'empresas' ? normalized.items : (data.data || [])).map((empresa: any) => (
                          <div key={empresa.id_empresa} className="mb-6 border rounded-lg shadow-sm">
                            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                              <div>
                                <span className="font-medium">ID: {empresa.id_empresa}</span> - 
                                <span className="font-medium ml-2">Nombre: {empresa.nombre}</span>
                              </div>
                              <div>
                                <button
                                  onClick={() => handleEdit(empresa)}
                                  className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(empresa)}
                                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                            {empresa.laboratorios && empresa.laboratorios.length > 0 && (
                              <div className="p-4">
                                <h3 className="font-medium mb-2">Laboratorios:</h3>
                                <div className="pl-4">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {empresa.laboratorios.map((laboratorio: any) => (
                                        <tr key={laboratorio.id_laboratorio}>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laboratorio.id_laboratorio}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{laboratorio.nombre}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                              onClick={() => handleEdit(laboratorio)}
                                              className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600"
                                            >
                                              Editar
                                            </button>
                                            <button
                                              onClick={() => handleDelete(laboratorio)}
                                              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                            >
                                              Eliminar
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  else {
                    return (
                      <div className="text-center py-4">
                        <p className="text-gray-600">No se encontraron datos para mostrar.</p>
                      </div>
                    );
                  }
                })()
              ) : (
                <p className="text-center text-gray-500 py-4">Seleccione una opción para cargar datos.</p>
              )}
            </div>
          </div>
          {/* Pagination controls */}
          {data && (
            <div className="w-full max-w-4xl mt-4 flex items-center justify-center gap-4">
              <button onClick={() => { if (page > 1) { setPage(page - 1); fetchData(currentSection); } }} className="px-4 py-2 bg-gray-200 rounded" disabled={page <= 1}>Anterior</button>
              <div className="text-sm text-gray-700">Página {page} de {totalPages}</div>
              <button onClick={() => { if (page < totalPages) { setPage(page + 1); fetchData(currentSection); } }} className="px-4 py-2 bg-gray-200 rounded" disabled={page >= totalPages}>Siguiente</button>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Ir a:</label>
                <input type="number" min={1} max={totalPages} value={page} onChange={(e) => {
                  const v = Number(e.target.value || 1);
                  if (v >= 1 && v <= totalPages) {
                    setPage(v);
                    fetchData(currentSection);
                  } else if (v < 1) {
                    setPage(1);
                    fetchData(currentSection);
                  } else if (v > totalPages) {
                    setPage(totalPages);
                    fetchData(currentSection);
                  }
                }} className="w-20 px-2 py-1 border rounded" />
              </div>
            </div>
          )}
        </main>

        {/* Modal para Editar */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-3xl shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Editar Información</h2>
              <p className="mb-4 text-gray-600">Editando: {selectedItem?.username || selectedItem?.nombre}</p>
              {renderEditForm()}
            </div>
          </div>
        )}

        {/* Modal para Confirmar Eliminación */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-3xl shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Confirmar Eliminación</h2>
              <p className="mb-4 text-gray-600">¿Estás seguro de que deseas eliminar a {selectedItem?.username || selectedItem?.nombre}?</p>
              <p className="mb-4 text-red-600 text-sm">Esta acción no se puede deshacer.</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={closeModals}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-gray-600"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  disabled={loading}
                >
                  {loading ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;