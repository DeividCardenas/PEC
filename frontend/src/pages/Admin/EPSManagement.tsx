/**
 * Página de Gestión de EPS
 * Permite ver, crear, editar y eliminar EPS
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Heart,
  ArrowLeft,
  Edit2,
  Trash2,
  Search,
  Plus,
  Building,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  fetchEps,
  addEps,
  updateEps,
  deleteEps,
} from "../../services/Admin/admin.Service";

interface Eps {
  id_eps: number;
  nombre: string;
}

const EPSManagement: React.FC = () => {
  const navigate = useNavigate();
  const [epsList, setEpsList] = useState<Eps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para el modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEps, setEditingEps] = useState<Eps | null>(null);
  const [formData, setFormData] = useState({ nombre: "" });

  // Cargar EPS
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetchEps({ limit: 100 });
      setEpsList(response.eps || []);
    } catch (error) {
      console.error("Error al cargar EPS:", error);
      toast.error("Error al cargar las EPS");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar EPS por búsqueda
  const filteredEps = epsList.filter((eps) =>
    eps.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para crear
  const handleCreate = () => {
    setEditingEps(null);
    setFormData({ nombre: "" });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (eps: Eps) => {
    setEditingEps(eps);
    setFormData({ nombre: eps.nombre });
    setIsModalOpen(true);
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      if (editingEps) {
        await updateEps(editingEps.id_eps, formData);
        toast.success("EPS actualizada correctamente");
      } else {
        await addEps(formData);
        toast.success("EPS creada correctamente");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error al guardar EPS:", error);
      toast.error("Error al guardar la EPS");
    }
  };

  // Eliminar EPS
  const handleDelete = async (eps: Eps) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar la EPS "${eps.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteEps(eps.id_eps);
      toast.success("EPS eliminada correctamente");
      loadData();
    } catch (error) {
      console.error("Error al eliminar EPS:", error);
      toast.error("Error al eliminar la EPS");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Cargando EPS...</div>
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
                  Gestión de EPS
                </h1>
                <p className="text-dark-text-secondary mt-1">
                  Administrar entidades de salud del sistema
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-600 to-success-700 rounded-2xl flex items-center justify-center shadow-glow-success">
              <Heart className="text-white" size={28} />
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
              placeholder="Buscar EPS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-success-600 focus:border-transparent"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            icon={<Plus size={18} />}
          >
            Crear EPS
          </Button>
        </div>

        {/* EPS Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEps.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-dark-text-secondary">No se encontraron EPS</p>
            </div>
          ) : (
            filteredEps.map((eps) => (
              <Card
                key={eps.id_eps}
                hoverable
                className="group relative"
                padding="lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-success-900/40 border border-success-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-glow-success transition-all duration-200">
                    <Building className="text-success-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-text mb-4">
                    {eps.nombre}
                  </h3>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleEdit(eps)}
                      className="flex-1 p-2 text-primary-400 hover:bg-primary-900/40 rounded-lg transition-colors"
                      title="Editar EPS"
                    >
                      <Edit2 size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => handleDelete(eps)}
                      className="flex-1 p-2 text-danger-400 hover:bg-danger-900/40 rounded-lg transition-colors"
                      title="Eliminar EPS"
                    >
                      <Trash2 size={18} className="mx-auto" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8">
          <Card className="bg-success-900/20 border-success-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-400">
                {epsList.length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                EPS Registradas
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text">
                {editingEps ? "Editar EPS" : "Crear Nueva EPS"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-dark-text-secondary hover:text-dark-text transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Nombre de la EPS
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: SURA, Salud Total, Nueva EPS..."
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-success-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} className="flex-1">
                {editingEps ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EPSManagement;
