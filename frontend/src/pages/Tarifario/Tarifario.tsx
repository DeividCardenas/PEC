import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { fetchTarifarioPorId, ProductoEnTarifario } from "../../services/Tarifario/tarifariosService";
import { analyzeTariff, TariffAnalysisResult, TariffProduct } from "../../services/AI/geminiService";

const TarifariosPage = () => {
  const { id_tarifario } = useParams<{ id_tarifario: string }>();
  const [productos, setProductos] = useState<ProductoEnTarifario[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedFilterRegulacion, setSelectedFilterRegulacion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estados para columnas adicionales
  const [selectedExtraFields, setSelectedExtraFields] = useState<string[]>([]);
  const [tempSelectedExtraFields, setTempSelectedExtraFields] = useState<string[]>(selectedExtraFields);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Estados para análisis con IA
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<TariffAnalysisResult | null>(null);

  const itemsPerPage = 10;

  // Lista de campos extra disponibles
  const extraFieldsList = [
    { field: "presentacion", label: "Presentación" },
    { field: "registro_sanitario", label: "Registro Sanitario" },
    { field: "regulacion", label: "Regulación" },
    { field: "codigo_barras", label: "Código de Barras" },
  ];

  // Construir filtros de búsqueda y paginación
  const buildFilters = useCallback(() => {
    const filters: Record<string, string> = {
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    };

    if (selectedFilter && search) {
      filters[selectedFilter] = search;
    }
    if (["regulados", "no_regulados"].includes(selectedFilterRegulacion)) {
      filters["con_regulacion"] = selectedFilterRegulacion;
    }
    if (selectedExtraFields.length > 0) {
      filters["campos"] = selectedExtraFields.join(",");
    }
    return filters;
  }, [currentPage, selectedFilter, search, selectedFilterRegulacion, selectedExtraFields]);

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

  // Función para obtener el tarifario y sus productos utilizando los filtros generados
  const fetchTarifarioData = useCallback(async () => {
    if (!id_tarifario) return;
    const tarifarioId = Number(id_tarifario);
    if (isNaN(tarifarioId)) {
      toast.error("ID de tarifario no válido");
      return;
    }
    setLoading(true);
    try {
      const filters = buildFilters();
      const tarifarioResponse = await fetchTarifarioPorId(tarifarioId, currentPage, itemsPerPage, filters);
      setProductos(tarifarioResponse.productos.lista);
      setTotalPages(tarifarioResponse.productos.totalPaginas);
    } catch (error) {
      console.error("Error al cargar el tarifario:", error);
      toast.error("Error al cargar el tarifario. Ver consola para más detalles.");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [id_tarifario, currentPage, itemsPerPage, buildFilters]);

  // Actualizar los productos cuando cambie la página o los filtros
  useEffect(() => {
    fetchTarifarioData();
  }, [currentPage, fetchTarifarioData]);

  // Reinicia la página a 1 cuando cambian los filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedFilter, selectedFilterRegulacion, selectedExtraFields]);

  // Función para analizar el tarifario con IA
  const analyzeWithAI = async () => {
    if (productos.length === 0) {
      toast.warning("No hay productos para analizar");
      return;
    }

    setLoadingAI(true);
    setShowAIPanel(true);

    try {
      // Convertir productos al formato esperado por la IA
      const tariffProducts: TariffProduct[] = productos.map((p) => ({
        descripcion: p.descripcion,
        cum: p.cum,
        precio_unidad: Number(p.precio_unidad),
        precio_presentacion: Number(p.precio_presentacion),
        concentracion: p.concentracion,
        regulacion: p.regulacion,
      }));

      const analysis = await analyzeTariff(tariffProducts);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Error al analizar con IA:", error);
      toast.error("Hubo un error al realizar el análisis con IA. Por favor, intenta de nuevo.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="relative p-6 bg-dark-bg min-h-screen flex flex-col">
      {/* Sección de filtros y controles */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-dark-card rounded-lg p-2 text-white w-full shadow-md pr-8 text-sm border border-primary-500/30 focus:border-primary-500 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-lg transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="bg-dark-card text-white rounded-md p-2 shadow-sm text-sm border border-primary-500/30 focus:border-primary-500 focus:outline-none"
        >
          <option value="">Filtro</option>
          <option value="descripcion">Descripción</option>
          <option value="cum">CUM</option>
        </select>

        {/* Mostrar el filtro de regulación solo si la columna "regulacion" está seleccionada */}
        {selectedExtraFields.includes("regulacion") && (
          <select
            value={selectedFilterRegulacion}
            onChange={(e) => setSelectedFilterRegulacion(e.target.value)}
            className="bg-dark-card text-white rounded-md p-2 shadow-sm text-sm border border-primary-500/30 focus:border-primary-500 focus:outline-none"
          >
            <option value="">Filtrar por Regulación</option>
            <option value="regulados">Productos regulados</option>
            <option value="no_regulados">Productos no regulados</option>
          </select>
        )}

        {/* Botón para abrir el modal de selección de columnas */}
        <button
          onClick={() => setShowColumnSelector(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white shadow-md transition-all duration-300"
        >
          Seleccionar columnas
        </button>

        {/* Botón para análisis con IA */}
        <button
          onClick={analyzeWithAI}
          disabled={productos.length === 0}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analizar con IA
        </button>
      </div>

      {/* Modal para seleccionar columnas adicionales */}
      {showColumnSelector && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-dark-card rounded-lg p-6 w-11/12 max-w-md border border-primary-500/30 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-white">Selecciona campos adicionales</h2>
            <div className="flex flex-col gap-3">
              {extraFieldsList.map((item) => (
                <label key={item.field} className="flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempSelectedExtraFields.includes(item.field)}
                    onChange={() => toggleTempExtraField(item.field)}
                    className="mr-2 accent-primary-600"
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancelColumnSelection}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyColumnSelection}
                className="px-4 py-2 rounded bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white transition-all duration-300"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paginación */}
      <div className="flex justify-between items-center mb-4 text-sm w-full">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className={`py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded-md transition-all duration-300 ${currentPage === 1 ? "invisible" : ""}`}
          style={{ width: "100px" }}
        >
          Anterior
        </button>
        <div className="flex-grow text-center text-white">
          Página {currentPage} de {totalPages}
        </div>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className={`py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded-md transition-all duration-300 ${currentPage === totalPages ? "invisible" : ""}`}
          style={{ width: "100px" }}
        >
          Siguiente
        </button>
      </div>

      {/* Tabla de productos */}
      {loading ? (
        <div className="text-center text-white">Cargando tarifario...</div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="p-3 border-b text-center text-white bg-gradient-to-r from-primary-700 to-primary-900">
              <tr>
                <th className="p-2">CUM</th>
                <th className="p-2">Descripción</th>
                {selectedExtraFields.includes("presentacion") && (
                  <th className="p-2">Presentación</th>
                )}
                <th className="p-2">Concentración</th>
                <th className="p-2">Precio Unidad</th>
                <th className="p-2">Precio Presentación</th>
                {selectedExtraFields.includes("registro_sanitario") && (
                  <th className="p-2">Registro Sanitario</th>
                )}
                {selectedExtraFields.includes("regulacion") && (
                  <th className="p-2">Regulación</th>
                )}
                {selectedExtraFields.includes("codigo_barras") && (
                  <th className="p-2">Código de Barras</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-dark-card text-gray-300">
              {productos.length > 0 ? (
                productos.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-primary-900/30 border-b border-primary-500/10 transition-colors">
                    <td className="p-2 text-center">{producto.cum}</td>
                    <td className="p-2 text-center">{producto.descripcion}</td>
                    {selectedExtraFields.includes("presentacion") && (
                      <td className="p-2 text-center">{producto.presentacion ?? "-"}</td>
                    )}
                    <td className="p-2 text-center">{producto.concentracion}</td>
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
                  <td
                    colSpan={
                      6 +
                      (selectedExtraFields.includes("presentacion") ? 1 : 0) +
                      (selectedExtraFields.includes("registro_sanitario") ? 1 : 0) +
                      (selectedExtraFields.includes("regulacion") ? 1 : 0) +
                      (selectedExtraFields.includes("codigo_barras") ? 1 : 0)
                    }
                    className="text-center py-4 text-gray-400"
                  >
                    No hay productos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Panel de Análisis con IA */}
      {showAIPanel && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
          <div className="bg-dark-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">✨</span>
                Análisis de Tarifario con IA
              </h2>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {loadingAI ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Analizando tarifario con IA...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 p-4 rounded-lg border border-purple-500/30">
                  <h3 className="text-lg font-semibold text-purple-300 mb-2">Resumen Ejecutivo</h3>
                  <p className="text-gray-200">{aiAnalysis.resumen}</p>
                </div>

                {/* Estadísticas */}
                <div className="bg-dark-bg p-4 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Estadísticas del Tarifario</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Total Productos</p>
                      <p className="text-xl font-bold text-white">{aiAnalysis.estadisticas.totalProductos}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Precio Promedio</p>
                      <p className="text-xl font-bold text-white">
                        ${aiAnalysis.estadisticas.precioPromedio.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Precio Mínimo</p>
                      <p className="text-xl font-bold text-green-300">
                        ${aiAnalysis.estadisticas.precioMinimo.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">Precio Máximo</p>
                      <p className="text-xl font-bold text-red-300">
                        ${aiAnalysis.estadisticas.precioMaximo.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-dark-bg p-4 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Insights Importantes</h3>
                  <ul className="space-y-2">
                    {aiAnalysis.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-200">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recomendaciones */}
                <div className="bg-dark-bg p-4 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Recomendaciones Estratégicas</h3>
                  <ul className="space-y-2">
                    {aiAnalysis.recomendaciones.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-200">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Productos Destacados */}
                <div className="bg-dark-bg p-4 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Productos Destacados</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-red-300 mb-2">Más Caros</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.productosDestacados.masCaros.map((prod, idx) => (
                          <li key={idx} className="text-sm text-gray-300">• {prod}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-green-300 mb-2">Más Económicos</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.productosDestacados.masEconomicos.map((prod, idx) => (
                          <li key={idx} className="text-sm text-gray-300">• {prod}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {aiAnalysis.productosDestacados.mejorRelacionCalidadPrecio &&
                   aiAnalysis.productosDestacados.mejorRelacionCalidadPrecio.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-blue-300 mb-2">Mejor Relación Calidad-Precio</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.productosDestacados.mejorRelacionCalidadPrecio.map((prod, idx) => (
                          <li key={idx} className="text-sm text-gray-300">• {prod}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No hay análisis disponible
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TarifariosPage;
