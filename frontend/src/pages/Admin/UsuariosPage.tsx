/**
 * Página de Gestión de Usuarios
 * Permite al administrador ver, editar, cambiar estado y eliminar usuarios
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Users,
  ArrowLeft,
  Edit2,
  Trash2,
  Shield,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Search,
  Plus,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  fetchUsers,
  fetchRoles,
  updateUser,
  deleteUser,
  type Usuario,
  type Rol,
  type UserUpdateData,
} from "../../services/Admin/admin.Service";

const UsuariosPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para el modal de edición
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    id_rol: 0,
    estado: true,
  });

  // Cargar usuarios y roles
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        fetchUsers({ limit: 100 }),
        fetchRoles(),
      ]);
      setUsuarios(usersResponse.usuarios || []);
      setRoles(rolesResponse);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal de edición
  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setEditForm({
      username: usuario.username,
      email: usuario.email,
      id_rol: usuario.id_rol,
      estado: usuario.estado ?? true,
    });
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const updateData: UserUpdateData = {
        username: editForm.username,
        email: editForm.email,
        id_rol: editForm.id_rol,
        estado: editForm.estado,
      };

      await updateUser(editingUser.id_usuario, updateData);
      toast.success("Usuario actualizado correctamente");
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast.error("Error al actualizar el usuario");
    }
  };

  // Cambiar estado del usuario
  const handleToggleEstado = async (usuario: Usuario) => {
    try {
      const newEstado = !usuario.estado;
      await updateUser(usuario.id_usuario, { estado: newEstado });
      toast.success(
        `Usuario ${newEstado ? "activado" : "desactivado"} correctamente`
      );
      loadData();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error("Error al cambiar el estado del usuario");
    }
  };

  // Eliminar usuario
  const handleDelete = async (usuario: Usuario) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar al usuario "${usuario.username}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteUser(usuario.id_usuario);
      toast.success("Usuario eliminado correctamente");
      loadData();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar el usuario");
    }
  };

  // Obtener color del badge del rol
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "administrador":
        return "bg-danger-900/40 text-danger-300 border-danger-700";
      case "farmacéutico":
      case "farmaceutico":
        return "bg-primary-900/40 text-primary-300 border-primary-700";
      case "auxiliar":
        return "bg-secondary-900/40 text-secondary-300 border-secondary-700";
      case "contador":
        return "bg-accent-900/40 text-accent-300 border-accent-700";
      default:
        return "bg-gray-800 text-gray-300 border-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/Admin")}
                icon={<ArrowLeft size={20} />}
              >
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-dark-text">
                  Gestión de Usuarios
                </h1>
                <p className="text-dark-text-secondary mt-1">
                  Administrar usuarios del sistema
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow-primary">
              <Users className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/Admin/Crear")}
            icon={<Plus size={18} />}
          >
            Crear Usuario
          </Button>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-dark-text-secondary"
                    >
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr
                      key={usuario.id_usuario}
                      className="hover:bg-dark-bg/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-900/40 border border-primary-700 rounded-full flex items-center justify-center">
                            <User className="text-primary-400" size={20} />
                          </div>
                          <div className="font-medium text-dark-text">
                            {usuario.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-dark-text-secondary">
                          <Mail size={16} />
                          <span>{usuario.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            usuario.rol.nombre
                          )}`}
                        >
                          <Shield size={14} />
                          {usuario.rol.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEstado(usuario)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            usuario.estado ?? true
                              ? "bg-success-900/40 text-success-300 border-success-700 hover:bg-success-900/60"
                              : "bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700"
                          }`}
                        >
                          {usuario.estado ?? true ? (
                            <>
                              <CheckCircle size={14} />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle size={14} />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="p-2 text-primary-400 hover:bg-primary-900/40 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(usuario)}
                            className="p-2 text-danger-400 hover:bg-danger-900/40 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary-900/20 border-primary-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">
                {usuarios.length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Total Usuarios
              </div>
            </div>
          </Card>
          <Card className="bg-success-900/20 border-success-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-400">
                {usuarios.filter((u) => u.estado ?? true).length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Usuarios Activos
              </div>
            </div>
          </Card>
          <Card className="bg-secondary-900/20 border-secondary-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-400">
                {roles.length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Roles Disponibles
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text">
                Editar Usuario
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-dark-text-secondary hover:text-dark-text transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Rol
                </label>
                <select
                  value={editForm.id_rol}
                  onChange={(e) =>
                    setEditForm({ ...editForm, id_rol: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  {roles.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="estado"
                  checked={editForm.estado}
                  onChange={(e) =>
                    setEditForm({ ...editForm, estado: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 bg-dark-bg border-dark-border rounded focus:ring-primary-600 focus:ring-2"
                />
                <label
                  htmlFor="estado"
                  className="text-sm font-medium text-dark-text"
                >
                  Usuario Activo
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setEditingUser(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} className="flex-1">
                Guardar Cambios
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
