/**
 * Página de Gestión de Proveedores
 * Permite ver, crear, editar, eliminar y cambiar estado de proveedores
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Truck,
  ArrowLeft,
  Edit2,
  Trash2,
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  fetchProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  type Proveedor,
  type CrearProveedorData,
} from "../../services/Proveedores/proveedoresService";

const ProveedoresManagement: React.FC = () => {
  const navigate = useNavigate();
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para el modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(
    null
  );
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

  // Cargar Proveedores
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetchProveedores({ limit: 100 });
      setProveedoresList(response.proveedores || []);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      toast.error("Error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar proveedores por búsqueda
  const filteredProveedores = proveedoresList.filter(
    (proveedor) =>
      proveedor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.laboratorio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.nit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para crear
  const handleCreate = () => {
    setEditingProveedor(null);
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
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre || "",
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
    setIsModalOpen(true);
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (!formData.nombre?.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      if (editingProveedor) {
        await updateProveedor(editingProveedor.id_proveedor, formData);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await createProveedor(formData);
        toast.success("Proveedor creado correctamente");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      toast.error("Error al guardar el proveedor");
    }
  };

  // Cambiar estado del proveedor
  const handleToggleActivo = async (proveedor: Proveedor) => {
    try {
      await updateProveedor(proveedor.id_proveedor, {
        activo: !proveedor.activo,
      });
      toast.success(
        `Proveedor ${!proveedor.activo ? "activado" : "desactivado"} correctamente`
      );
      loadData();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error("Error al cambiar el estado del proveedor");
    }
  };

  // Eliminar proveedor
  const handleDelete = async (proveedor: Proveedor) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el proveedor "${proveedor.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteProveedor(proveedor.id_proveedor);
      toast.success("Proveedor eliminado correctamente");
      loadData();
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      toast.error("Error al eliminar el proveedor");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Cargando proveedores...</div>
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
                  Gestión de Proveedores
                </h1>
                <p className="text-dark-text-secondary mt-1">
                  Administrar proveedores del sistema
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-600 to-secondary-700 rounded-2xl flex items-center justify-center shadow-glow-secondary">
              <Truck className="text-white" size={28} />
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
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            icon={<Plus size={18} />}
          >
            Crear Proveedor
          </Button>
        </div>

        {/* Proveedores Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Laboratorio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Contacto
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
                {filteredProveedores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-dark-text-secondary"
                    >
                      No se encontraron proveedores
                    </td>
                  </tr>
                ) : (
                  filteredProveedores.map((proveedor) => (
                    <tr
                      key={proveedor.id_proveedor}
                      className="hover:bg-dark-bg/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary-900/40 border border-secondary-700 rounded-full flex items-center justify-center">
                            <Building className="text-secondary-400" size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-dark-text">
                              {proveedor.nombre}
                            </div>
                            {proveedor.nit && (
                              <div className="text-xs text-dark-text-secondary">
                                NIT: {proveedor.nit}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-dark-text">
                          {proveedor.laboratorio || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {proveedor.email && (
                            <div className="flex items-center gap-2 text-dark-text-secondary text-sm">
                              <Mail size={14} />
                              <span>{proveedor.email}</span>
                            </div>
                          )}
                          {proveedor.telefono && (
                            <div className="flex items-center gap-2 text-dark-text-secondary text-sm">
                              <Phone size={14} />
                              <span>{proveedor.telefono}</span>
                            </div>
                          )}
                          {proveedor.ciudad && (
                            <div className="flex items-center gap-2 text-dark-text-secondary text-sm">
                              <MapPin size={14} />
                              <span>{proveedor.ciudad}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActivo(proveedor)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            proveedor.activo
                              ? "bg-success-900/40 text-success-300 border-success-700 hover:bg-success-900/60"
                              : "bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700"
                          }`}
                        >
                          {proveedor.activo ? (
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
                            onClick={() => handleEdit(proveedor)}
                            className="p-2 text-primary-400 hover:bg-primary-900/40 rounded-lg transition-colors"
                            title="Editar proveedor"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(proveedor)}
                            className="p-2 text-danger-400 hover:bg-danger-900/40 rounded-lg transition-colors"
                            title="Eliminar proveedor"
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
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-secondary-900/20 border-secondary-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-400">
                {proveedoresList.length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Total Proveedores
              </div>
            </div>
          </Card>
          <Card className="bg-success-900/20 border-success-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-400">
                {proveedoresList.filter((p) => p.activo).length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Proveedores Activos
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text">
                {editingProveedor
                  ? "Editar Proveedor"
                  : "Crear Nuevo Proveedor"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-dark-text-secondary hover:text-dark-text transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Laboratorio
                </label>
                <input
                  type="text"
                  value={formData.laboratorio}
                  onChange={(e) =>
                    setFormData({ ...formData, laboratorio: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Tipo
                </label>
                <input
                  type="text"
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Titular
                </label>
                <input
                  type="text"
                  value={formData.titular}
                  onChange={(e) =>
                    setFormData({ ...formData, titular: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  NIT
                </label>
                <input
                  type="text"
                  value={formData.nit}
                  onChange={(e) =>
                    setFormData({ ...formData, nit: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) =>
                    setFormData({ ...formData, ciudad: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  País
                </label>
                <input
                  type="text"
                  value={formData.pais}
                  onChange={(e) =>
                    setFormData({ ...formData, pais: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
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
                {editingProveedor ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProveedoresManagement;
