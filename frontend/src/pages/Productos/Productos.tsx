import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ArrowLeft, Sparkles, Package, Lightbulb, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { fetchProductos } from "../../services/Productos/productosService";
import { analyzeProduct, suggestComplementaryProducts } from "../../services/Productos/productosAIService";
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

  // Estados para IA
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

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

  // Análisis con IA
  const handleAnalyzeProduct = async (producto: Producto) => {
    setSelectedProduct(producto);
    setLoadingAI(true);
    setShowAIModal(true);
    try {
      const analysis = await analyzeProduct(producto);
      setAiAnalysis(analysis);
      toast.success("Análisis completado");
    } catch (error) {
      console.error("Error al analizar producto:", error);
      toast.error("Error al realizar el análisis con IA");
      setAiAnalysis(null);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <header className="bg-primary-900 border-b border-primary-800 shadow-lg p-4 flex items-center">
        <button
          onClick={() => navigate('/Menu')}
          className="flex items-center text-white hover:text-primary-300 transition-colors px-4 py-2 rounded-lg hover:bg-primary-800"
        >
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
      </header>
      <div className="flex-1 p-4">
        {/* Sección de filtros principales */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-dark-bg-secondary border border-dark-border rounded-lg p-2 text-dark-text w-full shadow-md pr-8 text-sm placeholder:text-dark-text-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-text-secondary hover:text-dark-text text-lg"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md p-2 shadow-sm text-sm focus:ring-2 focus:ring-primary-500"
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
            className="bg-dark-bg-secondary border border-dark-border text-dark-text rounded-md p-2 shadow-sm text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Filtrar por Regulación</option>
            <option value="regulados">Productos regulados</option>
            <option value="no_regulados">Productos no regulados</option>
          </select>
        )}

        {/* Botón para abrir el modal de selección de columnas */}
        <button
          onClick={() => setShowColumnSelector(true)}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-md"
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
          <LoadingSpinner size="lg" color="text-primary-500" text="Cargando productos..." />
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-dark-border">
          <table className="min-w-full text-sm">
            <thead className="p-3 border-b border-dark-border text-center text-white bg-primary-900/50">
              <tr>
                <th className="p-2">CUM</th>
                <th className="p-2">Descripción</th>
                {selectedExtraFields.includes("presentacion") && <th className="p-2">Presentación</th>}
                <th className="p-2">Concentración</th>
                <th className="p-2">Laboratorio</th>
                <th className="p-2">Precio Unidad</th>
                <th className="p-2">Precio Presentacion</th>
                {/* RF003: Columnas de inventario */}
                <th className="p-2">Stock Actual</th>
                <th className="p-2">Stock Mínimo</th>
                <th className="p-2">Estado Stock</th>
                {/* Se renderizan las columnas adicionales de forma dinámica */}
                {selectedExtraFields.includes("registro_sanitario") && <th className="p-2">Registro Sanitario</th>}
                {selectedExtraFields.includes("regulacion") && <th className="p-2">Regulación</th>}
                {selectedExtraFields.includes("codigo_barras") && <th className="p-2">Código de Barras</th>}
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-dark-card text-dark-text">
              {productos.length > 0 ? (
                productos.map((producto) => (
                  <tr key={producto.id_producto} className="border-b border-dark-border hover:bg-dark-card-hover transition-colors">
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
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleAnalyzeProduct(producto)}
                        className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded hover:from-purple-700 hover:to-purple-800 transition-all text-xs flex items-center gap-1 mx-auto"
                        title="Analizar con IA"
                      >
                        <Sparkles size={14} />
                        IA
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9 + selectedExtraFields.length} className="text-center py-4 text-dark-text-secondary">
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
                className="mr-2 w-4 h-4 accent-primary-600"
              />
              <span className="text-dark-text">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={handleCancelColumnSelection}
            className="px-4 py-2 rounded bg-dark-bg-secondary hover:bg-dark-bg-tertiary text-dark-text border border-dark-border transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApplyColumnSelection}
            className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-md"
          >
            Aplicar
          </button>
        </div>
      </Modal>

      {/* Modal de Análisis IA */}
      <Modal
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setSelectedProduct(null);
          setAiAnalysis(null);
        }}
        title={`Análisis Inteligente: ${selectedProduct?.descripcion || ''}`}
        size="lg"
      >
        {loadingAI ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-dark-text">Analizando producto...</span>
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Resumen</h4>
                  <p className="text-gray-700 text-sm">{aiAnalysis.resumen}</p>
                </div>
              </div>
            </div>

            {aiAnalysis.productos_complementarios && aiAnalysis.productos_complementarios.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <Package className="text-green-600 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-2">Productos Complementarios</h4>
                    <ul className="space-y-2">
                      {aiAnalysis.productos_complementarios.map((prod: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          {prod}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Lightbulb className="text-yellow-600 mt-1" size={20} />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">Recomendaciones</h4>
                  <ul className="space-y-2">
                    {aiAnalysis.recomendaciones?.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-gray-800 mb-2">Análisis Detallado</h4>
              <p className="text-gray-700 text-sm whitespace-pre-line">{aiAnalysis.analisis_detallado}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudo generar el análisis
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              setShowAIModal(false);
              setSelectedProduct(null);
              setAiAnalysis(null);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Productos;
