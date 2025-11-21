import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { fetchCompareByProducto } from '../../services/Shared/compareService';
import { fetchProductos } from '../../services/Productos/productosService';
import { axiosInstance } from '../../services/Shared/axiosInstance';
import { analyzePriceComparison, type PriceComparisonData, type AIAnalysisResult } from '../../services/AI/geminiService';

const formatCurrency = (value: number | string) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(num);
};

const Compare: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // data state
  const [productoId, setProductoId] = useState<number | null>(null);
  const [productoCum, setProductoCum] = useState<string>('');
  // support multiple selected products
  const [selectedProducts, setSelectedProducts] = useState<Array<any>>([]);
  // productContext removed; use selectedProducts for product info
  const [detectedCompaniesNames, setDetectedCompaniesNames] = useState<string[]>([]);
  const [queryText, setQueryText] = useState<string>('');
  const [empresaList, setEmpresaList] = useState<any[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<any>(null);
  // resultados per productId
  const [resultados, setResultados] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);

  // modal + stepper state
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Nota: La protección de autenticación ahora está manejada por ProtectedRoute en App.tsx

  // Load Empresas and EPS once
  useEffect(() => {
    const load = async () => {
      try {
        const empRes = await axiosInstance.get('/empresa');
        setEmpresaList((empRes.data && empRes.data.data) ? empRes.data.data : (empRes.data || []));
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  // Autocomplete
  useEffect(() => {
    if (!queryText || queryText.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
    // request extra fields 'presentacion' and laboratorio.nombre for context
    const resp = await fetchProductos({ descripcion: queryText, limit: 6, campos: 'presentacion' });
    const prods = resp && resp.productos ? resp.productos : [];
        // each prod should include laboratorio { nombre }
        setSuggestions(prods);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [queryText]);

  const doCompare = async (useCum = false, opts?: { productoId?: number; productoCum?: string }) => {
    const pid = opts?.productoId ?? productoId;
    const pcum = opts?.productoCum ?? productoCum;
    if (!pid && !pcum) return;
    setLoading(true);
    try {
      let data: any = { resultados: [] };
      if (useCum && pcum) {
        const url = `/compare/producto/${pid ?? ''}`;
        const resp = await axiosInstance.get(url, { params: { cum: String(pcum), empresaIds: selectedEmpresas.join(',') } });
        data = resp.data;
      } else if (pid) {
        data = await fetchCompareByProducto(pid as number, { empresaIds: selectedEmpresas });
      }
      // attach product description to each row for reliable display
      const prodInfo = selectedProducts.find(p => Number(p.id_producto) === Number(pid));
      const descripcion = prodInfo?.descripcion || prodInfo?.cum || '';
      const rows = (data.resultados || []).map((r: any) => ({ ...r, producto_descripcion: r.producto_descripcion || descripcion, productoId: Number(pid) }));
      // store resultados per product id
      setResultados(prev => ({ ...prev, [Number(pid)]: rows }));
      // close modal and rely on main preview to show results
      setShowModal(false);
    } catch (error) {
      console.error('Error al comparar:', error);
      setResultados(prev => ({ ...prev, [Number(pid)]: [] }));
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const doCompareMultiple = async (productIds: number[], empresaIds: number[]) : Promise<Record<number, any[]>> => {
    if (!productIds || productIds.length === 0) return {};
    setLoading(true);
    try {
      const next: Record<number, any[]> = { ...resultados };
      for (const pid of productIds) {
        try {
          const data = await fetchCompareByProducto(pid, { empresaIds });
          const prodInfo = selectedProducts.find(p => Number(p.id_producto) === Number(pid));
          const descripcion = prodInfo?.descripcion || prodInfo?.cum || '';
          next[pid] = (data.resultados || []).map((r: any) => ({ ...r, producto_descripcion: r.producto_descripcion || descripcion, productoId: Number(pid) }));
        } catch (e) {
          next[pid] = [];
        }
      }
      setResultados(next);
      // close modal and show preview on main page
      setShowModal(false);
      return next;
    } finally {
      setLoading(false);
    }
  };

  // When entering step 2, try to auto-select 2 companies based on intersection or union across selected products
  useEffect(() => {
    const tryAutoSelectCompanies = async () => {
      if (step !== 2) return;
      if (!selectedProducts || selectedProducts.length === 0) return;
      if (selectedEmpresas && selectedEmpresas.length >= 2) return; // already selected

      try {
        const allProductIds = selectedProducts.map(p => p.id_producto);
        const companiesPerProduct: Record<number, number[]> = {};
        for (const pid of allProductIds) {
          const r = await fetchCompareByProducto(pid);
          const rows2 = r && r.resultados ? r.resultados : [];
          companiesPerProduct[pid] = rows2.map((x: any) => x.empresa_id || x.eps_id).filter(Boolean);
        }
        // compute intersection
        let intersection: number[] = companiesPerProduct[allProductIds[0]] || [];
        for (const pid of allProductIds.slice(1)) {
          intersection = intersection.filter(id => (companiesPerProduct[pid] || []).includes(id));
        }
        if (intersection.length >= 2) {
          setSelectedEmpresas(intersection.slice(0, 2));
          return;
        }
        // otherwise compute union and pick first two
        const unionSet = new Set<number>();
        Object.values(companiesPerProduct).forEach(arr => arr.forEach(v => unionSet.add(v)));
        const union = Array.from(unionSet);
        if (union.length >= 2) {
          setSelectedEmpresas(union.slice(0, 2));
        }
      } catch (e) {
        // ignore
      }
    };
    tryAutoSelectCompanies();
  }, [step]);

  const analyzeWithAI = async () => {
    setLoadingAI(true);
    setShowAIPanel(true);
    try {
      // Preparar datos para el análisis
      const productIds = selectedProducts.length > 0
        ? selectedProducts.map(p => p.id_producto)
        : (productoId ? [productoId] : []);

      if (productIds.length === 0 || selectedEmpresas.length !== 2) {
        alert('Por favor, selecciona productos y exactamente 2 empresas para analizar.');
        return;
      }

      // Obtener los datos de comparación
      const comparisonsData: PriceComparisonData[] = [];

      for (const pid of productIds) {
        const rows = resultados[pid] || [];
        const prodInfo = selectedProducts.find(p => p.id_producto === pid);

        // Filtrar resultados por las empresas seleccionadas
        const empresa1Data = rows.find(r => (r.empresa_id || r.eps_id) === selectedEmpresas[0]);
        const empresa2Data = rows.find(r => (r.empresa_id || r.eps_id) === selectedEmpresas[1]);

        if (empresa1Data && empresa2Data) {
          const empresa1Info = empresaList.find(e => e.id_empresa === selectedEmpresas[0]);
          const empresa2Info = empresaList.find(e => e.id_empresa === selectedEmpresas[1]);

          comparisonsData.push({
            producto: prodInfo?.descripcion || empresa1Data.producto_descripcion || `Producto ${pid}`,
            empresa1: {
              nombre: empresa1Info?.nombre || empresa1Data.empresa_nombre || 'Empresa 1',
              precio: Number(empresa1Data.precio) || 0,
              precioUnidad: Number(empresa1Data.precio_unidad) || undefined,
              precioEmpaque: Number(empresa1Data.precio_empaque) || undefined,
              tarifario: empresa1Data.tarifario_nombre || undefined
            },
            empresa2: {
              nombre: empresa2Info?.nombre || empresa2Data.empresa_nombre || 'Empresa 2',
              precio: Number(empresa2Data.precio) || 0,
              precioUnidad: Number(empresa2Data.precio_unidad) || undefined,
              precioEmpaque: Number(empresa2Data.precio_empaque) || undefined,
              tarifario: empresa2Data.tarifario_nombre || undefined
            }
          });
        }
      }

      if (comparisonsData.length === 0) {
        alert('No hay suficientes datos de comparación para analizar.');
        return;
      }

      // Llamar al servicio de IA
      const analysis = await analyzePriceComparison(comparisonsData);
      setAiAnalysis(analysis);

    } catch (error) {
      console.error('Error al analizar con IA:', error);
      alert('Hubo un error al realizar el análisis con IA. Por favor, intenta de nuevo.');
      setAiAnalysis(null);
    } finally {
      setLoadingAI(false);
    }
  };

  const exportCSV = async () => {
    setLoading(true);
    try {
      // Ensure we have resultados for all selected products. If not, fetch them.
      const productIds = selectedProducts.length > 0 ? selectedProducts.map(p => p.id_producto) : (productoId ? [productoId] : []);
      
      // Fetch results for ALL productIds to ensure exports are complete
      const fetched = await doCompareMultiple(productIds, selectedEmpresas.slice(0, 2));
      
      // Combine fetched results with existing ones
      const allResults: any[] = [];
      for (const pid of productIds) {
        const rows = fetched[pid] || resultados[pid] || [];
        allResults.push(...rows);
      }
      
      if (!allResults || allResults.length === 0) {
        alert('No hay datos para exportar');
        return;
      }
      
      const headers = ['producto_id', 'producto_descripcion', 'tarifario_nombre', 'empresa_nombre', 'eps_nombre', 'precio', 'precio_unidad', 'precio_empaque'];
      const rows = allResults.map((r: any) => headers.map(h => {
        if (h === 'producto_id') return (r.productoId || r.id_producto || '').toString();
        if (h === 'producto_descripcion') return (r.producto_descripcion || r.descripcion || '').toString().replace(/,/g, '');
        return (r[h] ?? '').toString().replace(/,/g, '');
      }).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparativo_${productoCum || productoId || 'multi'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      // Ensure we have resultados for all selected products. If not, fetch them.
      const productIds = selectedProducts.length > 0 ? selectedProducts.map(p => p.id_producto) : (productoId ? [productoId] : []);
      
      // Fetch results for ALL productIds to ensure exports are complete
      const fetched = await doCompareMultiple(productIds, selectedEmpresas.slice(0, 2));
      
      // Combine fetched results with existing ones
      const allResults: any[] = [];
      for (const pid of productIds) {
        const rows = fetched[pid] || resultados[pid] || [];
        allResults.push(...rows);
      }
      
      if (!allResults || allResults.length === 0) {
        alert('No hay datos para exportar');
        return;
      }
      
      // dynamic import to avoid bundling if not used
      // @ts-ignore
      const { default: jsPDF } = await import('jspdf');
      // @ts-ignore
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      
      const headers = ['Producto', 'Tarifario', 'Empresa/EPS', 'Precio', 'Precio unidad', 'Precio empaque'];
      
      // group results by producto id
      const grouped: Record<string, any[]> = {};
      allResults.forEach((r: any) => {
        const pid = String(r.productoId || r.id_producto || '');
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(r);
      });
      
      let y = 30;
      const productInfo: Record<string, any> = {};
      selectedProducts.forEach(p => { productInfo[p.id_producto] = p; });
      
      for (const pid of Object.keys(grouped)) {
        const rows = grouped[pid].map((r: any) => [
          (r.producto_descripcion || r.descripcion || productInfo[pid]?.descripcion || `Producto ${pid}`),
          r.tarifario_nombre || '-',
          r.empresa_nombre || r.eps_nombre || '-',
          formatCurrency(r.precio),
          formatCurrency(r.precio_unidad),
          formatCurrency(r.precio_empaque)
        ]);
        
        const productCum = grouped[pid][0]?.cum || productInfo[pid]?.cum || pid;
        doc.text(`Comparativo producto ${productCum}`, 14, y - 8);
        
        // @ts-ignore
        autoTable(doc, { startY: y, head: [headers], body: rows });
        
        // estimate next y position (autoTable will add height but we approximate)
        y += 30 + (rows.length * 8);
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
      }
      
      doc.save(`comparativo_${productoCum || productoId || 'multi'}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  // Simple modal UI with three steps
  const renderResultsPanel = () => {
    // Reuse same rendering logic as inside modal step 3
    const productIds = selectedProducts.length > 0 ? selectedProducts.map(p => p.id_producto) : (productoId ? [productoId] : []);
    const productNames: Record<number, string> = {};
    selectedProducts.forEach(p => { productNames[p.id_producto] = p.descripcion || (`Producto ${p.id_producto}`); });
    const currentResults: any[] = (productIds.length > 0)
      ? productIds.map(id => resultados[id] || []).flat()
      : Object.values(resultados).flat();

    if (loading) return <div className="text-gray-400 text-center py-4">Cargando...</div>;
    if (!currentResults || currentResults.length === 0) {
      return <div className="text-gray-400 text-center py-8 bg-dark-card/50 rounded-lg border border-gray-700">No se encontraron tarifas para los productos seleccionados con las compañías seleccionadas.</div>;
    }

    const mapByEmpresa: Record<number, any[]> = {};
    currentResults.forEach((r: any) => {
      const id = r.empresa_id || r.eps_id || 0;
      if (!mapByEmpresa[id]) mapByEmpresa[id] = [];
      mapByEmpresa[id].push(r);
    });
    const selected = selectedEmpresas.slice(0,2);

    return (
      <div className="overflow-auto max-h-96 p-4 border border-primary-800 rounded-lg bg-dark-card/50">
        {productIds.length > 1 && (
          <div className="mb-4 pb-3 border-b border-gray-700">
            <div className="text-sm font-medium text-gray-300">Productos:</div>
            <div className="text-sm text-gray-400 mt-1">{productIds.map(id => productNames[id] || `#${id}`).join(' · ')}</div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selected.map((empId) => (
            <div key={empId} className="border border-primary-700 rounded-lg p-4 bg-dark-hover/30 hover:bg-dark-hover/50 transition-colors">
              <h4 className="font-semibold mb-3 text-white text-lg border-b border-primary-700 pb-2">{(empresaList.find(e => e.id_empresa === empId) || {}).nombre || 'Compañía'}</h4>
              {(!mapByEmpresa[empId] || mapByEmpresa[empId].length === 0) ? (
                <div className="text-gray-400 text-center py-4">No hay tarifas para esta compañía.</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {mapByEmpresa[empId].map((r: any, i: number) => (
                      <tr key={i} className="border-b border-gray-700 hover:bg-primary-900/20 transition-colors">
                        <td className="p-3 font-medium text-gray-300">{(productNames[r.productoId || r.id_producto] || r.descripcion || r.producto_descripcion) ? `${productNames[r.productoId || r.id_producto] || r.descripcion || r.producto_descripcion} · ${r.tarifario_nombre || 'Tarifario'}` : (r.tarifario_nombre || 'Tarifario')}</td>
                        <td className="p-3 text-right font-semibold text-primary-300">{formatCurrency(r.precio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <header className="bg-primary-900 border-b border-primary-800 shadow-lg p-4 flex items-center">
        <button onClick={() => navigate('/Menu')} className="flex items-center text-white hover:text-primary-300 transition-colors px-4 py-2 rounded-lg hover:bg-primary-800">
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
      </header>

      <div className="flex-1 p-6">
        <div className="bg-dark-card rounded-lg shadow-2xl border border-primary-800 p-6">
          <h2 className="text-2xl font-bold mb-3 text-gradient">Comparar precio entre 2 compañías</h2>

          <p className="mb-6 text-sm text-gray-400">Busca un producto y selecciona exactamente dos compañías para comparar sus precios y obtener análisis inteligente con IA.</p>

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setShowModal(true); setStep(1); }}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-primary-500/50 font-medium"
            >
              Comparar entre 2 compañías
            </button>
            <button
              onClick={() => {
                setProductoId(null);
                setProductoCum('');
                setResultados({});
                setSelectedProducts([]);
                setAiAnalysis(null);
                setShowAIPanel(false);
              }}
              className="px-3 py-2 bg-dark-hover text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600"
            >
              Limpiar
            </button>
          </div>

          {/* Compact preview on main page */}
          {selectedProducts.length > 0 && selectedEmpresas.length === 2 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold text-white">Vista previa comparativa</div>
                <div className="flex gap-2">
                  <button
                    onClick={analyzeWithAI}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-purple-500/50 flex items-center gap-2 font-medium"
                    disabled={loadingAI}
                  >
                    <Sparkles size={18} />
                    {loadingAI ? 'Analizando...' : 'Análisis IA'}
                  </button>
                  <button
                    onClick={exportCSV}
                    className="px-4 py-2 bg-dark-hover text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600 font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Exportando...' : 'Exportar CSV'}
                  </button>
                  <button
                    onClick={exportPDF}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-green-500/50 font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Exportando...' : 'Exportar PDF'}
                  </button>
                </div>
              </div>
              {renderResultsPanel()}
            </div>
          )}

          {/* AI Analysis Panel */}
          {showAIPanel && aiAnalysis && (
            <div className="mb-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-lg p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Sparkles className="text-purple-400" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gradient">Análisis Inteligente con IA</h3>
                </div>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold transition-colors hover:bg-red-500/20 rounded-lg w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* Resumen */}
              <div className="mb-4 bg-dark-card/80 rounded-lg p-5 border border-blue-500/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-blue-400 mt-1 flex-shrink-0" size={22} />
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-lg">Resumen Ejecutivo</h4>
                    <p className="text-gray-300 leading-relaxed">{aiAnalysis.resumen}</p>
                  </div>
                </div>
              </div>

              {/* Ahorro Potencial */}
              <div className="mb-4 bg-dark-card/80 rounded-lg p-5 border border-green-500/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <TrendingDown className="text-green-400 mt-1 flex-shrink-0" size={22} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-3 text-lg">Ahorro Potencial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 hover:bg-green-900/40 transition-colors">
                        <div className="text-xs text-green-300 mb-1 font-medium">Monto</div>
                        <div className="text-xl font-bold text-green-400">
                          {formatCurrency(aiAnalysis.ahorroPotencial.monto)}
                        </div>
                      </div>
                      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 hover:bg-green-900/40 transition-colors">
                        <div className="text-xs text-green-300 mb-1 font-medium">Porcentaje</div>
                        <div className="text-xl font-bold text-green-400">
                          {aiAnalysis.ahorroPotencial.porcentaje.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 hover:bg-green-900/40 transition-colors">
                        <div className="text-xs text-green-300 mb-1 font-medium">Mejor Opción</div>
                        <div className="text-sm font-bold text-green-400 mt-1">
                          {aiAnalysis.ahorroPotencial.mejorOpcion}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="mb-4 bg-dark-card/80 rounded-lg p-5 border border-yellow-500/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="text-yellow-400 mt-1 flex-shrink-0" size={22} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-3 text-lg">Recomendaciones</h4>
                    <ul className="space-y-3">
                      {aiAnalysis.recomendaciones.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 group">
                          <span className="text-yellow-400 mt-1 text-lg">•</span>
                          <span className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Análisis Detallado */}
              <div className="bg-dark-card/80 rounded-lg p-5 border border-purple-500/30 shadow-lg">
                <h4 className="font-semibold text-white mb-3 text-lg">Análisis Detallado</h4>
                <p className="text-gray-300 whitespace-pre-line leading-relaxed">{aiAnalysis.analisisDetallado}</p>
              </div>

              {/* Patrones (si existen) */}
              {aiAnalysis.patrones && aiAnalysis.patrones.length > 0 && (
                <div className="mt-4 bg-dark-card/80 rounded-lg p-5 border border-indigo-500/30 shadow-lg">
                  <h4 className="font-semibold text-white mb-3 text-lg">Patrones Detectados</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.patrones.map((patron, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 rounded-full text-sm font-medium hover:bg-indigo-900/60 transition-colors"
                      >
                        {patron}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-dark-card w-full max-w-3xl rounded-lg shadow-2xl border border-primary-800 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gradient">Comparador — Paso {step} de 2</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors border border-red-500/30 font-medium"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                {/* Step 1: Buscar producto */}
                {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Buscar producto (nombre)</label>
              <input
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Escribe el nombre del producto..."
                className="mt-2 p-3 border border-gray-600 rounded-lg w-full bg-dark-hover text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
                    {loadingSuggestions && <div className="text-sm text-gray-400 mt-3">Buscando...</div>}
                    {suggestions.length > 0 && (
                      <div className="bg-dark-hover border border-gray-600 rounded-lg mt-3 max-h-64 overflow-auto">
                          {suggestions.map((s: any) => (
                          <div key={s.id_producto} className="p-3 hover:bg-primary-900/30 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0" onClick={async () => {
                            // Add product to the selectedProducts list instead of replacing
                            const already = selectedProducts.find(p => p.id_producto === s.id_producto);
                            if (!already) {
                              const prod = { id_producto: s.id_producto, cum: s.cum, descripcion: s.descripcion, presentacion: s.presentacion, laboratorio: s.laboratorio };
                              setSelectedProducts(prev => [...prev, prod]);
                            }
                            // keep single product context for header (for preview)
                            setProductoId(s.id_producto);
                            setProductoCum(s.cum);
                            setSuggestions([]);
                            setQueryText('');
                            try {
                              // After adding a product, fetch companies that have it (but DO NOT auto-advance to step 3)
                              const resp = await fetchCompareByProducto(s.id_producto);
                              const rows = resp && resp.resultados ? resp.resultados : [];
                              // store detected company names for UI (union of names)
                              const empresaNames = rows.map((r: any) => r.empresa_nombre || r.eps_nombre).filter(Boolean);
                              setDetectedCompaniesNames(prev => Array.from(new Set([...prev, ...empresaNames])));
                              // compute intersection across selectedProducts to preselect companies only (no auto-run)
                              const allProductIds = [...(selectedProducts.map(p => p.id_producto)), s.id_producto];
                              const companiesPerProduct: Record<number, number[]> = {};
                              for (const pid of allProductIds) {
                                const r = await fetchCompareByProducto(pid);
                                const rows2 = r && r.resultados ? r.resultados : [];
                                companiesPerProduct[pid] = rows2.map((x: any) => x.empresa_id).filter(Boolean);
                              }
                              // intersection
                              let intersection = companiesPerProduct[allProductIds[0]] || [];
                              for (const pid of allProductIds.slice(1)) {
                                intersection = intersection.filter(id => (companiesPerProduct[pid] || []).includes(id));
                              }
                              // Preselect intersection if available (do not change step)
                              if (intersection.length > 0) {
                                setSelectedEmpresas(intersection.slice(0, 2));
                              }
                            } catch (e) {
                              // ignore
                            }
                          }}>
                            <div className="text-sm text-white"><strong>{s.descripcion}</strong> <span className="text-xs text-gray-400">({s.cum})</span></div>
                            <div className="text-xs text-gray-400 mt-1">{s.presentacion || ''} {s.laboratorio?.nombre ? `· ${s.laboratorio.nombre}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-dark-hover text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        disabled={selectedProducts.length === 0}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-primary-500/50 font-medium"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}

                {/* show selected products chips */}
                {selectedProducts.length > 0 && (
                  <div className="mt-4 bg-dark-hover/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm font-medium text-gray-300 mb-2">Productos seleccionados:</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedProducts.map(p => (
                        <div key={p.id_producto} className="px-3 py-2 bg-primary-900/30 border border-primary-700 rounded-lg flex items-center gap-2 hover:bg-primary-900/50 transition-colors">
                          <div className="text-sm text-white">{p.descripcion} <span className="text-xs text-gray-400">({p.cum})</span></div>
                          <button
                            onClick={() => setSelectedProducts(prev => prev.filter(x => x.id_producto !== p.id_producto))}
                            className="text-red-400 hover:text-red-300 text-sm font-bold ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Seleccionar 2 empresas */}
                {step === 2 && (
                  <div>
                    <p className="text-sm text-gray-300 mb-4">Selecciona exactamente dos compañías para comparar. (Máximo 2)</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-auto border border-gray-700 rounded-lg p-4 bg-dark-hover/30">
                      {empresaList.map(emp => {
                        const checked = selectedEmpresas.includes(emp.id_empresa);
                        const disabled = !checked && selectedEmpresas.length >= 2;
                        return (
                          <label key={emp.id_empresa} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-primary-900/30 transition-colors border border-gray-700 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'bg-primary-900/40 border-primary-600' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmpresas(prev => [...prev, emp.id_empresa].slice(0,2));
                                } else {
                                  setSelectedEmpresas(prev => prev.filter(id => id !== emp.id_empresa));
                                }
                              }}
                              className="w-4 h-4 text-primary-600 bg-dark-hover border-gray-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-white font-medium">{emp.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                    {detectedCompaniesNames.length > 0 && (
                      <div className="mt-3 text-sm text-gray-400 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                        <span className="text-blue-400 font-medium">Empresas detectadas:</span> {detectedCompaniesNames.join(', ')}
                      </div>
                    )}

                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 bg-dark-hover text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-600"
                      >
                        Atrás
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedEmpresas([]); }}
                          className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors border border-yellow-500/30 font-medium"
                        >
                          Quitar selección
                        </button>
                        <button
                          onClick={() => {
                            const productIds = selectedProducts.map(p => p.id_producto);
                            if (productIds.length === 1) {
                              doCompare(false, { productoId: productIds[0] });
                            } else {
                              doCompareMultiple(productIds, selectedEmpresas.slice(0,2));
                            }
                          }}
                          disabled={selectedEmpresas.length !== 2}
                          className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-primary-500/50 font-medium"
                        >
                          Mostrar comparación
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compare;