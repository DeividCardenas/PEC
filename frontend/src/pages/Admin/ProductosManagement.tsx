/**
 * Página de Gestión de Productos
 * Permite ver, crear, editar y eliminar productos farmacéuticos
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Package,
  ArrowLeft,
  Edit2,
  Trash2,
  Search,
  Plus,
  Pill,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  fetchProductos,
  fetchLaboratorios,
  type Producto,
} from "../../services/Admin/admin.Service";

interface ProductoForm {
  cum: string;
  descripcion: string;
  concentracion: string;
  presentacion: string;
  registro_sanitario: string;
  id_laboratorio: number;
  precio_unidad: number;
  precio_presentacion: number;
  iva: number;
  regulacion: string;
  codigo_barras: string;
}

const ProductosManagement: React.FC = () => {
  const navigate = useNavigate();
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [laboratoriosList, setLaboratoriosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para el modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<ProductoForm>({
    cum: "",
    descripcion: "",
    concentracion: "",
    presentacion: "",
    registro_sanitario: "",
    id_laboratorio: 0,
    precio_unidad: 0,
    precio_presentacion: 0,
    iva: 0,
    regulacion: "",
    codigo_barras: "",
  });

  // Cargar Productos y Laboratorios
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Nota: Necesitarás crear estas funciones en admin.Service.ts
      // Por ahora usaré placeholders
      setProductosList([]);
      setLaboratoriosList([]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por búsqueda
  const filteredProductos = productosList.filter(
    (producto) =>
      producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.cum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para crear
  const handleCreate = () => {
    setEditingProducto(null);
    setFormData({
      cum: "",
      descripcion: "",
      concentracion: "",
      presentacion: "",
      registro_sanitario: "",
      id_laboratorio: 0,
      precio_unidad: 0,
      precio_presentacion: 0,
      iva: 0,
      regulacion: "",
      codigo_barras: "",
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Cargando productos...</div>
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
                  Gestión de Productos
                </h1>
                <p className="text-dark-text-secondary mt-1">
                  Administrar catálogo de productos farmacéuticos
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow-primary">
              <Package className="text-white" size={28} />
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
              placeholder="Buscar por CUM, descripción o código de barras..."
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
            Crear Producto
          </Button>
        </div>

        {/* Productos Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    CUM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Laboratorio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-dark-text-secondary"
                  >
                    Funcionalidad de productos en desarrollo - Por favor usa la página de Productos existente
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stats */}
        <div className="mt-8">
          <Card className="bg-primary-900/20 border-primary-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">
                {productosList.length}
              </div>
              <div className="text-sm text-dark-text-secondary mt-1">
                Productos Registrados
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductosManagement;
