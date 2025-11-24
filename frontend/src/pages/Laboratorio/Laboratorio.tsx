import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { fetchLaboratories, Laboratorio, fetchProductsByLaboratory, Producto } from "../../services/Laboratorio/laboratoriosService";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { analyzeTariff, TariffAnalysisResult, TariffProduct } from "../../services/AI/geminiService";

const Laboratorios: React.FC = () => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Modal states for laboratory details
  const [selectedLab, setSelectedLab] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Details states
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchDetails, setSearchDetails] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedFilterRegulacion, setSelectedFilterRegulacion] = useState("");
  const [currentPageDetails, setCurrentPageDetails] = useState(1);
  const [totalPagesDetails, setTotalPagesDetails] = useState(1);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedExtraFields, setSelectedExtraFields] = useState<string[]>([]);
  const [tempSelectedExtraFields, setTempSelectedExtraFields] = useState<string[]>(selectedExtraFields);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Estados para análisis con IA
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<TariffAnalysisResult | null>(null);

  const itemsPerPage = 9;

  const itemsPerPageDetails = 10;

  // Extra fields list
  const extraFieldsList = [
    { field: "presentacion", label: "Presentación" },
    { field: "registro_sanitario", label: "Registro Sanitario" },
    { field: "regulacion", label: "Regulación" },
    { field: "codigo_barras", label: "Código de Barras" },
  ];

  useEffect(() => {
    const loadLaboratorios = async () => {
      try {
        const response = await fetchLaboratories(currentPage, itemsPerPage, search);
        setLaboratorios(response.data);
        setTotalPages(response.totalPages);
      } catch (error) {
        toast.error("Error al cargar laboratorios");
      } finally {
        setLoading(false);
      }
    };
    loadLaboratorios();
  }, [currentPage, search]);

  // Effect to fetch products when modal filters change
  useEffect(() => {
    if (showModal && selectedLab) {
      fetchProductsForModal(selectedLab);
    }
  }, [currentPageDetails, searchDetails, selectedFilter, selectedFilterRegulacion, selectedExtraFields]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDetails = (id: number) => {
    setSelectedLab(id);
    setShowModal(true);
    setCurrentPageDetails(1);
    setSearchDetails("");
    setSelectedFilter("");
    setSelectedFilterRegulacion("");
    setSelectedExtraFields([]);
    setTempSelectedExtraFields([]);
    fetchProductsForModal(id);
  };

  const fetchProductsForModal = async (labId: number) => {
    setLoadingDetails(true);
    try {
      const filters: Record<string, string> = {
        page: currentPageDetails.toString(),
        limit: itemsPerPageDetails.toString(),
      };

      if (selectedFilter && searchDetails) {
        filters[selectedFilter] = searchDetails;
      }
      if (["regulados", "no_regulados"].includes(selectedFilterRegulacion)) {
        filters["con_regulacion"] = selectedFilterRegulacion;
      }
      if (selectedExtraFields.length > 0) {
        filters["campos"] = selectedExtraFields.join(",");
      }

      const fetchedProductos = await fetchProductsByLaboratory(labId.toString(), filters);
      setProductos(fetchedProductos.productos.lista);
      setTotalPagesDetails(fetchedProductos.productos.totalPaginas);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      toast.error("Error al cargar los productos");
      setProductos([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleTempExtraField = (field: string) => {
    setTempSelectedExtraFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleApplyColumnSelection = () => {
    setSelectedExtraFields(tempSelectedExtraFields);
    setShowColumnSelector(false);
  };

  const handleCancelColumnSelection = () => {
    setTempSelectedExtraFields(selectedExtraFields);
    setShowColumnSelector(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLab(null);
    setProductos([]);
  };

  // Función para analizar productos del laboratorio con IA
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
        regulacion: p.regulacion || undefined,
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
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <header className="bg-primary-900 border-b border-primary-800 shadow-lg p-4 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white hover:text-primary-300 transition-colors px-4 py-2 rounded-lg hover:bg-primary-800"
        >
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver</span>
        </button>
      </header>
      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Laboratorios</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar laboratorio..."
          value={search}
          onChange={handleSearch}
          className="bg-dark-card rounded-lg p-2 text-white w-full max-w-xs shadow-md border border-primary-500/30 focus:border-primary-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center text-white">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {laboratorios.map((lab) => (
            <div
              key={lab.id_laboratorio}
              className="bg-dark-card rounded-3xl shadow-lg p-6 hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer border border-primary-500/30 hover:border-primary-500"
              onClick={() => handleViewDetails(lab.id_laboratorio)}
            >
              <h3 className="text-2xl font-semibold text-white mb-2">{lab.nombre}</h3>
              <p className="text-gray-400">ID: {lab.id_laboratorio}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="text-white">Página {currentPage} de {totalPages}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
      </div>

      {/* Modal for laboratory details */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-primary-500/30 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-primary-700 bg-gradient-to-r from-primary-800 to-primary-900 text-white">
              <h2 className="text-xl font-bold">
                Detalles del Laboratorio: {laboratorios.find(lab => lab.id_laboratorio === selectedLab)?.nombre}
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-300 text-2xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-dark-bg">
              {/* Filters and controls */}
              <div className="mb-4 flex flex-wrap gap-4 items-center relative">
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchDetails}
                    onChange={(e) => setSearchDetails(e.target.value)}
                    className="bg-dark-card rounded-lg p-2 text-white w-full shadow-md pr-8 text-sm border border-primary-500/30 focus:border-primary-500 focus:outline-none"
                  />
                  {searchDetails && (
                    <button
                      onClick={() => setSearchDetails("")}
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
                  <option value="codigo_barras">Código de Barras</option>
                </select>

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

                <button
                  onClick={() => setShowColumnSelector(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white shadow-md transition-all duration-300"
                >
                  Seleccionar columnas
                </button>

                <button
                  onClick={analyzeWithAI}
                  disabled={productos.length === 0}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analizar con IA
                </button>
              </div>

              {/* Column selector modal */}
              {showColumnSelector && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
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

              {/* Pagination */}
              <div className="flex justify-between items-center mb-4 text-sm">
                <button
                  onClick={() => setCurrentPageDetails((prev) => Math.max(prev - 1, 1))}
                  className={`py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded-md transition-all duration-300 ${currentPageDetails === 1 ? "invisible" : ""}`}
                  style={{ width: "100px" }}
                >
                  Anterior
                </button>
                <div className="flex-grow text-center text-white">
                  Página {currentPageDetails} de {totalPagesDetails}
                </div>
                <button
                  onClick={() => setCurrentPageDetails((prev) => Math.min(prev + 1, totalPagesDetails))}
                  className={`py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded-md transition-all duration-300 ${currentPageDetails === totalPagesDetails ? "invisible" : ""}`}
                  style={{ width: "100px" }}
                >
                  Siguiente
                </button>
              </div>

              {/* Products table */}
              {loadingDetails ? (
                <div className="text-center text-white">Cargando...</div>
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
                        Análisis de Productos con IA
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
                        <p className="text-gray-300">Analizando productos con IA...</p>
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
                          <h3 className="text-lg font-semibold text-purple-300 mb-3">Estadísticas</h3>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Laboratorios;
