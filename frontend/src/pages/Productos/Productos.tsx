import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { fetchProductos } from "../../services/Productos/productosService";
import { Producto, ProductParams } from "../../types";
import Pagination from "../../components/Pagination";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";

const Productos = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedFilterRegulacion, setSelectedFilterRegulacion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedExtraFields, setSelectedExtraFields] = useState<string[]>([]);

  // Estado para controlar el modal de selección de columnas
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  // Estado temporal para manejar cambios en el modal sin afectar inmediatamente la consulta
  const [tempSelectedExtraFields, setTempSelectedExtraFields] = useState<string[]>(selectedExtraFields);

  const itemsPerPage = 10;

  // Lista de campos extra disponibles con sus etiquetas
  const extraFieldsList = [
    { field: "presentacion", label: "Presentación" },
    { field: "registro_sanitario", label: "Registro Sanitario" },
    { field: "regulacion", label: "Regulación" },
    { field: "codigo_barras", label: "Código de Barras" },
  ];

  // Manejo de la selección temporal en el modal
  const toggleTempExtraField = (field: string) => {
    setTempSelectedExtraFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Aplica los cambios del modal y actualiza el estado de columnas seleccionadas
  const handleApplyColumnSelection = () => {
    setSelectedExtraFields(tempSelectedExtraFields);
    setShowColumnSelector(false);
  };

  // Cancela la selección y cierra el modal sin cambios
  const handleCancelColumnSelection = () => {
    setTempSelectedExtraFields(selectedExtraFields);
    setShowColumnSelector(false);
  };

  const fetchProductosData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Partial<ProductParams> = {
        page: currentPage,
        limit: itemsPerPage,
        con_regulacion:
          selectedFilterRegulacion === "regulados" || selectedFilterRegulacion === "no_regulados"
            ? selectedFilterRegulacion
            : undefined,
      };

      if (selectedFilter && search) {
        if (["descripcion", "codigo_barras", "cum"].includes(selectedFilter)) {
          (filters as Record<string, string>)[selectedFilter] = search;
        }
      }

      // Si se han seleccionado columnas extra, se unen en una cadena separada por comas
      if (selectedExtraFields.length > 0) {
        filters.campos = selectedExtraFields.join(",");
      }

      const fetchedProductos = await fetchProductos(filters);
      setProductos(fetchedProductos.productos);
      setTotalPages(fetchedProductos.totalPaginas);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      toast.error("Error al cargar los productos");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, selectedFilter, selectedFilterRegulacion, selectedExtraFields]);

  useEffect(() => {
    fetchProductosData();
  }, [fetchProductosData]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm p-4 flex items-center">
        <button
          onClick={() => navigate('/Menu')}
          className="flex items-center text-gray-700 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
      </header>
      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* Sección de filtros principales */}
        <div className="mb-4 flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        >
          <option value="">Filtro</option>
          <option value="descripcion">Descripción</option>
          <option value="codigo_barras">Código de Barras</option>
          <option value="cum">CUM</option>
        </select>

        {/* Mostrar el filtro solo si la columna "Regulación" está seleccionada */}
        {selectedExtraFields.includes("regulacion") && (
          <select
            value={selectedFilterRegulacion}
            onChange={(e) => setSelectedFilterRegulacion(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="">Filtrar por Regulación</option>
            <option value="regulados">Productos regulados</option>
            <option value="no_regulados">Productos no regulados</option>
          </select>
        )}

        {/* Botón para abrir el modal de selección de columnas */}
        <button
          onClick={() => setShowColumnSelector(true)}
          className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-colors"
        >
          Seleccionar columnas
        </button>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Tabla de productos */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="lg" color="text-primary-600" text="Cargando productos..." />
        </div>
      ) : (
        <div className="overflow-x-auto shadow-sm rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="p-3 border-b border-gray-200 text-center bg-gray-50">
              <tr>
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">CUM</th>
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Descripción</th>
                {selectedExtraFields.includes("presentacion") && <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Presentación</th>}
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Concentración</th>
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Laboratorio</th>
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio Unidad</th>
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio Presentacion</th>
                {/* RF003: Columnas de inventario */}
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock Actual</th>
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock Mínimo</th>
                <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado Stock</th>
                {/* Se renderizan las columnas adicionales de forma dinámica */}
                {selectedExtraFields.includes("registro_sanitario") && <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Registro Sanitario</th>}
                {selectedExtraFields.includes("regulacion") && <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Regulación</th>}
                {selectedExtraFields.includes("codigo_barras") && <th className="p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Código de Barras</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.length > 0 ? (
                productos.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-gray-50 transition-colors">
                    <td className="p-2 text-center">{producto.cum}</td>
                    <td className="p-2 text-center">{producto.descripcion}</td>
                    {selectedExtraFields.includes("presentacion") && (
                      <td className="p-2 text-center">{producto.presentacion ?? "-"}</td>
                    )}
                    <td className="p-2 text-center">{producto.concentracion ?? "-"}</td>
                    <td className="p-2 text-center">{producto.laboratorio?.nombre}</td>
                    <td className="p-2 text-center">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                      }).format(Number(producto.precio_unidad))}
                    </td>
                    <td className="p-2 text-center">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                      }).format(Number(producto.precio_presentacion))}
                    </td>
                    {/* RF003: Columnas de inventario */}
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded ${
                        (producto.stock_actual ?? 0) === 0
                          ? 'bg-red-100 text-red-700'
                          : (producto.stock_actual ?? 0) <= (producto.stock_minimo ?? 0)
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {producto.stock_actual ?? 0} {producto.unidad_medida ?? 'unidad'}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {producto.stock_minimo ?? 0} {producto.unidad_medida ?? 'unidad'}
                    </td>
                    <td className="p-2 text-center">
                      {(producto.stock_actual ?? 0) === 0 ? (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                          Sin Stock
                        </span>
                      ) : (producto.stock_actual ?? 0) <= (producto.stock_minimo ?? 0) ? (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                          Normal
                        </span>
                      )}
                    </td>
                    {selectedExtraFields.includes("registro_sanitario") && (
                      <td className="p-2 text-center">{producto.registro_sanitario ?? "-"}</td>
                    )}
                    {selectedExtraFields.includes("regulacion") && (
                      <td className="p-2 text-center">{producto.regulacion ?? "-"}</td>
                    )}
                    {selectedExtraFields.includes("codigo_barras") && (
                      <td className="p-2 text-center">{producto.codigo_barras ?? "-"}</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9 + selectedExtraFields.length} className="text-center py-8 text-gray-500">
                    No hay productos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Modal para seleccionar columnas adicionales */}
      <Modal
        isOpen={showColumnSelector}
        onClose={handleCancelColumnSelection}
        title="Selecciona campos adicionales"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {extraFieldsList.map((item) => (
            <label key={item.field} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={tempSelectedExtraFields.includes(item.field)}
                onChange={() => toggleTempExtraField(item.field)}
                className="mr-2 w-4 h-4"
              />
              <span className="text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={handleCancelColumnSelection}
            className="px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApplyColumnSelection}
            className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            Aplicar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Productos;
