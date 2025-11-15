/**
 * Página de Gestión de Roles
 * Permite ver, crear, editar y eliminar roles del sistema
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Shield,
  ArrowLeft,
  Edit2,
  Trash2,
  Search,
  Plus,
  UserCog,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  fetchRoles,
  type Rol,
} from "../../services/Admin/admin.Service";

const RolesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [rolesList, setRolesList] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar Roles
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const roles = await fetchRoles();
      setRolesList(roles);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      toast.error("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar roles por búsqueda
  const filteredRoles = rolesList.filter((rol) =>
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Cargando roles...</div>
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
                  Gestión de Roles
                </h1>
                <p className="text-dark-text-secondary mt-1">
                  Administrar roles y permisos del sistema
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-danger-600 to-danger-700 rounded-2xl flex items-center justify-center shadow-glow-danger">
              <Shield className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-danger-600 focus:border-transparent"
          />
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRoles.map((rol) => (
            <Card
              key={rol.id_rol}
              hoverable
              className="group relative"
              padding="lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-danger-900/40 border border-danger-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-glow-danger transition-all duration-200">
                  <UserCog className="text-danger-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-dark-text mb-2">
                  {rol.nombre}
                </h3>
                <span className="text-xs text-dark-text-secondary">
                  ID: {rol.id_rol}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Message */}
        <div className="mt-8">
          <Card className="bg-warning-900/20 border-warning-700">
            <div className="flex items-start gap-3">
              <Shield className="text-warning-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-warning-300 font-semibold mb-1">
                  Gestión de Roles y Permisos
                </h3>
                <p className="text-warning-200 text-sm">
                  La funcionalidad completa de CRUD para roles y asignación de permisos
                  estará disponible próximamente. Actualmente puedes ver los roles existentes.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="mt-6">
          <Card className="bg-danger-900/20 border-danger-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-danger-400">
                {rolesList.length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Roles en el Sistema
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RolesManagement;
