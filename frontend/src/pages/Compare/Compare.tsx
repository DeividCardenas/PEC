import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { fetchCompareByProducto } from '../../services/Shared/compareService';
import { fetchProductos } from '../../services/Productos/productosService';
import { axiosInstance } from '../../services/Shared/axiosInstance';

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

    if (loading) return <div>Cargando...</div>;
    if (!currentResults || currentResults.length === 0) {
      return <div className="text-gray-600">No se encontraron tarifas para los productos seleccionados con las compañías seleccionadas.</div>;
    }

    const mapByEmpresa: Record<number, any[]> = {};
    currentResults.forEach((r: any) => {
      const id = r.empresa_id || r.eps_id || 0;
      if (!mapByEmpresa[id]) mapByEmpresa[id] = [];
      mapByEmpresa[id].push(r);
    });
    const selected = selectedEmpresas.slice(0,2);

    return (
      <div className="overflow-auto max-h-80 p-2 border rounded bg-white">
        {productIds.length > 1 && (
          <div className="mb-2">
            <div className="text-sm font-medium">Productos:</div>
            <div className="text-sm">{productIds.map(id => productNames[id] || `#${id}`).join(' · ')}</div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selected.map((empId) => (
            <div key={empId} className="border rounded p-3 bg-gray-50">
              <h4 className="font-medium mb-2">{(empresaList.find(e => e.id_empresa === empId) || {}).nombre || 'Compañía'}</h4>
              {(!mapByEmpresa[empId] || mapByEmpresa[empId].length === 0) ? (
                <div className="text-gray-600">No hay tarifas para esta compañía.</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {mapByEmpresa[empId].map((r: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 font-medium">{(productNames[r.productoId || r.id_producto] || r.descripcion || r.producto_descripcion) ? `${productNames[r.productoId || r.id_producto] || r.descripcion || r.producto_descripcion} · ${r.tarifario_nombre || 'Tarifario'}` : (r.tarifario_nombre || 'Tarifario')}</td>
                        <td className="p-2 text-right">{formatCurrency(r.precio)}</td>
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
    <div className="min-h-screen bg-sky-900 flex flex-col">
      <header className="bg-sky-800 shadow-lg p-4 flex items-center">
        <button onClick={() => navigate('/Menu')} className="flex items-center text-white hover:text-gray-200 transition-colors px-4 py-2 rounded-lg hover:bg-sky-700">
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
      </header>

      <div className="flex-1 p-4">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Comparar precio entre 2 compañías</h2>

          <p className="mb-4 text-sm text-gray-600">Busca un producto y selecciona exactamente dos compañías para comparar sus precios.</p>

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setShowModal(true); setStep(1); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Comparar entre 2 compañías</button>
            <button onClick={() => { setProductoId(null); setProductoCum(''); setResultados({}); setSelectedProducts([]); }} className="px-3 py-2 bg-gray-200 rounded">Limpiar</button>
          </div>

          {/* Compact preview on main page */}
          {selectedProducts.length > 0 && selectedEmpresas.length === 2 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">Vista previa comparativa</div>
                <div className="flex gap-2">
                  <button onClick={exportCSV} className="px-3 py-1 bg-gray-100 rounded" disabled={loading}>
                    {loading ? 'Exportando...' : 'Exportar CSV'}
                  </button>
                  <button onClick={exportPDF} className="px-3 py-1 bg-green-600 text-white rounded" disabled={loading}>
                    {loading ? 'Exportando...' : 'Exportar PDF'}
                  </button>
                </div>
              </div>
              {renderResultsPanel()}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Comparador — Paso {step} de 2</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-red-100 rounded">Cerrar</button>
                  </div>
                </div>

                {/* Step 1: Buscar producto */}
                {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Buscar producto (nombre)</label>
              <input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Escribe el nombre del producto..." className="mt-2 p-2 border rounded w-full" />
                    {loadingSuggestions && <div className="text-sm text-gray-500 mt-2">Buscando...</div>}
                    {suggestions.length > 0 && (
                      <div className="bg-gray-50 border rounded mt-2 max-h-48 overflow-auto">
                          {suggestions.map((s: any) => (
                          <div key={s.id_producto} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={async () => {
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
                            <div className="text-sm"><strong>{s.descripcion}</strong> <span className="text-xs text-gray-500">({s.cum})</span></div>
                            <div className="text-xs text-gray-500">{s.presentacion || ''} {s.laboratorio?.nombre ? `· ${s.laboratorio.nombre}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                      <button onClick={() => setShowModal(false)} className="px-3 py-2 bg-gray-100 rounded">Cancelar</button>
                      <button onClick={() => setStep(2)} disabled={selectedProducts.length === 0} className="px-3 py-2 bg-indigo-600 text-white rounded">Siguiente</button>
                    </div>
                  </div>
                )}

                {/* show selected products chips */}
                {selectedProducts.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium">Productos seleccionados:</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedProducts.map(p => (
                        <div key={p.id_producto} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-2">
                          <div className="text-sm">{p.descripcion} <span className="text-xs text-gray-500">({p.cum})</span></div>
                          <button onClick={() => setSelectedProducts(prev => prev.filter(x => x.id_producto !== p.id_producto))} className="text-red-500 text-xs">x</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Seleccionar 2 empresas */}
                {step === 2 && (
                  <div>
                    <p className="text-sm text-gray-700">Selecciona exactamente dos compañías para comparar. (Máximo 2)</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-auto border rounded p-2">
                      {empresaList.map(emp => {
                        const checked = selectedEmpresas.includes(emp.id_empresa);
                        const disabled = !checked && selectedEmpresas.length >= 2;
                        return (
                          <label key={emp.id_empresa} className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 ${disabled ? 'opacity-50' : ''}`}>
                            <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmpresas(prev => [...prev, emp.id_empresa].slice(0,2));
                              } else {
                                setSelectedEmpresas(prev => prev.filter(id => id !== emp.id_empresa));
                              }
                            }} />
                            <span className="text-sm">{emp.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                    {detectedCompaniesNames.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">Empresas detectadas para este producto: {detectedCompaniesNames.join(', ')}</div>
                    )}

                    <div className="mt-4 flex justify-between">
                      <button onClick={() => setStep(1)} className="px-3 py-2 bg-gray-100 rounded">Atrás</button>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedEmpresas([]); }} className="px-3 py-2 bg-gray-100 rounded">Quitar selección</button>
                        <button onClick={() => {
                          const productIds = selectedProducts.map(p => p.id_producto);
                          if (productIds.length === 1) {
                            doCompare(false, { productoId: productIds[0] });
                          } else {
                            doCompareMultiple(productIds, selectedEmpresas.slice(0,2));
                          }
                        }} disabled={selectedEmpresas.length !== 2} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Mostrar comparación</button>
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