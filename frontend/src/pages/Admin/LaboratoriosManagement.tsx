/**
 * Página de Gestión de Laboratorios
 * Permite ver, crear, editar y eliminar laboratorios
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FlaskConical,
  ArrowLeft,
  Edit2,
  Trash2,
  Search,
  Plus,
  Beaker,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  fetchLaboratorios,
  addLaboratorio,
  updateLaboratorio,
  deleteLaboratorio,
} from "../../services/Admin/admin.Service";

interface Laboratorio {
  id_laboratorio: number;
  nombre: string;
}

const LaboratoriosManagement: React.FC = () => {
  const navigate = useNavigate();
  const [laboratoriosList, setLaboratoriosList] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para el modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLaboratorio, setEditingLaboratorio] =
    useState<Laboratorio | null>(null);
  const [formData, setFormData] = useState({ nombre: "" });

  // Cargar Laboratorios
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetchLaboratorios({ limit: 100 });
      setLaboratoriosList(response.data || []);
    } catch (error) {
      console.error("Error al cargar laboratorios:", error);
      toast.error("Error al cargar los laboratorios");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar laboratorios por búsqueda
  const filteredLaboratorios = laboratoriosList.filter((lab) =>
    lab.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para crear
  const handleCreate = () => {
    setEditingLaboratorio(null);
    setFormData({ nombre: "" });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (laboratorio: Laboratorio) => {
    setEditingLaboratorio(laboratorio);
    setFormData({ nombre: laboratorio.nombre });
    setIsModalOpen(true);
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      if (editingLaboratorio) {
        await updateLaboratorio(editingLaboratorio.id_laboratorio, formData);
        toast.success("Laboratorio actualizado correctamente");
      } else {
        await addLaboratorio(formData);
        toast.success("Laboratorio creado correctamente");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error al guardar laboratorio:", error);
      toast.error("Error al guardar el laboratorio");
    }
  };

  // Eliminar laboratorio
  const handleDelete = async (laboratorio: Laboratorio) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el laboratorio "${laboratorio.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteLaboratorio(laboratorio.id_laboratorio);
      toast.success("Laboratorio eliminado correctamente");
      loadData();
    } catch (error) {
      console.error("Error al eliminar laboratorio:", error);
      toast.error("Error al eliminar el laboratorio");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Cargando laboratorios...</div>
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
                  Gestión de Laboratorios
                </h1>
                <p className="text-dark-text-secondary mt-1">
                  Administrar laboratorios farmacéuticos del sistema
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow-primary">
              <FlaskConical className="text-white" size={28} />
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
              placeholder="Buscar laboratorios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            icon={<Plus size={18} />}
          >
            Crear Laboratorio
          </Button>
        </div>

        {/* Laboratorios Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLaboratorios.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-dark-text-secondary">
                No se encontraron laboratorios
              </p>
            </div>
          ) : (
            filteredLaboratorios.map((laboratorio) => (
              <Card
                key={laboratorio.id_laboratorio}
                hoverable
                className="group relative"
                padding="lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-900/40 border border-primary-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-glow-primary transition-all duration-200">
                    <Beaker className="text-primary-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-text mb-4">
                    {laboratorio.nombre}
                  </h3>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleEdit(laboratorio)}
                      className="flex-1 p-2 text-primary-400 hover:bg-primary-900/40 rounded-lg transition-colors"
                      title="Editar laboratorio"
                    >
                      <Edit2 size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => handleDelete(laboratorio)}
                      className="flex-1 p-2 text-danger-400 hover:bg-danger-900/40 rounded-lg transition-colors"
                      title="Eliminar laboratorio"
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
          <Card className="bg-primary-900/20 border-primary-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">
                {laboratoriosList.length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Laboratorios Registrados
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
                {editingLaboratorio
                  ? "Editar Laboratorio"
                  : "Crear Nuevo Laboratorio"}
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
                  Nombre del Laboratorio
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Bayer, Pfizer, Laboratorios Genfar..."
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                {editingLaboratorio ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LaboratoriosManagement;
