/**
 * Página de Control de Inventario - RF003
 * Gestión completa de inventario con alertas de stock bajo y movimientos
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Settings, Plus } from "lucide-react";
import {
  obtenerAlertasStockBajo,
  obtenerMovimientosInventario,
  obtenerEstadisticasInventario,
  ajustarStock,
  actualizarStockMinimo,
  ProductoInventario,
  MovimientoInventario,
  EstadisticasInventario,
} from "../../services/Inventario/inventarioService";
import { analyzeInventoryStatus } from "../../services/Inventario/inventarioAIService";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import Table, { Column } from "../../components/Table";
import Card, { CardContent } from "../../components/Card";
import Pagination from "../../components/Pagination";

const ControlInventario: React.FC = () => {
  const navigate = useNavigate();
  // ===== ESTADOS =====
  const [estadisticas, setEstadisticas] = useState<EstadisticasInventario | null>(null);
  const [alertasStock, setAlertasStock] = useState<ProductoInventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabActiva, setTabActiva] = useState<"alertas" | "movimientos">("alertas");

  // Paginación alertas
  const [paginaAlertas, setPaginaAlertas] = useState(1);
  const [totalPaginasAlertas, setTotalPaginasAlertas] = useState(1);
  const limiteAlertas = 10;

  // Paginación movimientos
  const [paginaMovimientos, setPaginaMovimientos] = useState(1);
  const [totalPaginasMovimientos, setTotalPaginasMovimientos] = useState(1);
  const limiteMovimientos = 20;

  // Filtros movimientos
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string>("");

  // Modales
  const [modalAjustarStock, setModalAjustarStock] = useState(false);
  const [modalStockMinimo, setModalStockMinimo] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoInventario | null>(null);

  // Formularios
  const [formAjuste, setFormAjuste] = useState({
    cantidad: 0,
    motivo: "",
    tipo_ajuste: "ajuste" as "ajuste" | "salida" | "devolucion",
  });

  const [formStockMinimo, setFormStockMinimo] = useState({
    stock_minimo: 0,
    stock_maximo: 0,
  });

  // Estados para IA
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // ===== EFECTOS =====
  useEffect(() => {
    cargarEstadisticas();
    cargarAlertas();
    cargarMovimientos();
  }, []);

  useEffect(() => {
    cargarAlertas();
  }, [paginaAlertas]);

  useEffect(() => {
    cargarMovimientos();
  }, [paginaMovimientos, filtroTipoMovimiento]);

  // ===== FUNCIONES DE CARGA =====
  const cargarEstadisticas = async () => {
    try {
      const response = await obtenerEstadisticasInventario();
      setEstadisticas(response.data);
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error);
      toast.error("Error al cargar estadísticas de inventario");
    }
  };

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const response = await obtenerAlertasStockBajo(paginaAlertas, limiteAlertas);
      setAlertasStock(response.data.productos);
      setTotalPaginasAlertas(response.data.total_paginas);
    } catch (error: any) {
      console.error("Error al cargar alertas:", error);
      toast.error("Error al cargar alertas de stock bajo");
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const response = await obtenerMovimientosInventario(
        paginaMovimientos,
        limiteMovimientos,
        filtroTipoMovimiento || undefined
      );
      setMovimientos(response.data.movimientos);
      setTotalPaginasMovimientos(response.data.total_paginas);
    } catch (error: any) {
      console.error("Error al cargar movimientos:", error);
      toast.error("Error al cargar movimientos de inventario");
    } finally {
      setLoading(false);
    }
  };

  // ===== MANEJADORES DE MODALES =====
  const abrirModalAjustarStock = (producto: ProductoInventario) => {
    setProductoSeleccionado(producto);
    setFormAjuste({
      cantidad: 0,
      motivo: "",
      tipo_ajuste: "ajuste",
    });
    setModalAjustarStock(true);
  };

  const abrirModalStockMinimo = (producto: ProductoInventario) => {
    setProductoSeleccionado(producto);
    setFormStockMinimo({
      stock_minimo: producto.stock_minimo || 0,
      stock_maximo: producto.stock_maximo || 0,
    });
    setModalStockMinimo(true);
  };

  const cerrarModales = () => {
    setModalAjustarStock(false);
    setModalStockMinimo(false);
    setProductoSeleccionado(null);
  };

  // ===== MANEJADORES DE FORMULARIOS =====
  const handleAjustarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) return;

    if (!formAjuste.motivo.trim()) {
      toast.error("Debe proporcionar un motivo para el ajuste");
      return;
    }

    if (formAjuste.cantidad === 0) {
      toast.error("La cantidad no puede ser cero");
      return;
    }

    try {
      setLoading(true);
      await ajustarStock({
        id_producto: productoSeleccionado.id_producto,
        cantidad: formAjuste.cantidad,
        motivo: formAjuste.motivo,
        tipo_ajuste: formAjuste.tipo_ajuste,
      });
      toast.success("Stock ajustado exitosamente");
      cerrarModales();
      cargarEstadisticas();
      cargarAlertas();
      cargarMovimientos();
    } catch (error: any) {
      console.error("Error al ajustar stock:", error);
      toast.error(error.response?.data?.msg || "Error al ajustar stock");
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarStockMinimo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) return;

    if (formStockMinimo.stock_minimo < 0) {
      toast.error("El stock mínimo no puede ser negativo");
      return;
    }

    if (formStockMinimo.stock_maximo && formStockMinimo.stock_maximo < formStockMinimo.stock_minimo) {
      toast.error("El stock máximo no puede ser menor que el stock mínimo");
      return;
    }

    try {
      setLoading(true);
      await actualizarStockMinimo(productoSeleccionado.id_producto, {
        stock_minimo: formStockMinimo.stock_minimo,
        stock_maximo: formStockMinimo.stock_maximo || undefined,
      });
      toast.success("Stock mínimo actualizado exitosamente");
      cerrarModales();
      cargarEstadisticas();
      cargarAlertas();
    } catch (error: any) {
      console.error("Error al actualizar stock mínimo:", error);
      toast.error(error.response?.data?.msg || "Error al actualizar stock mínimo");
    } finally {
      setLoading(false);
    }
  };

  // ===== UTILIDADES =====
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerIconoTipoMovimiento = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "↑";
      case "salida":
        return "↓";
      case "ajuste":
        return "⚙️";
      case "devolucion":
        return "↶";
      default:
        return "•";
    }
  };

  // ===== DEFINICIÓN DE COLUMNAS =====
  const alertasColumns: Column<ProductoInventario>[] = [
    { key: 'cum', title: 'CUM', align: 'center' },
    {
      key: 'descripcion',
      title: 'Producto',
      align: 'left',
      render: (val, row) => (
        <div>
          <div className="font-medium">{val}</div>
          <div className="text-xs text-gray-500">{row.laboratorio?.nombre}</div>
        </div>
      ),
    },
    {
      key: 'stock_actual',
      title: 'Stock Actual',
      align: 'center',
      render: (val, row) => (
        <Badge variant={
          val === 0 ? 'danger' :
          (row.porcentaje_stock || 0) <= 50 ? 'warning' :
          'success'
        }>
          {val} {row.unidad_medida}
        </Badge>
      ),
    },
    {
      key: 'stock_minimo',
      title: 'Stock Mínimo',
      align: 'center',
      render: (val, row) => `${val} ${row.unidad_medida}`,
    },
    {
      key: 'deficit',
      title: 'Déficit',
      align: 'center',
      render: (val, row) => (
        <Badge variant="danger">
          -{val || 0} {row.unidad_medida}
        </Badge>
      ),
    },
    {
      key: 'porcentaje_stock',
      title: 'Estado',
      align: 'center',
      render: (val) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                (val || 0) <= 50 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(100, val || 0)}%` }}
            />
          </div>
          <span className="text-xs">{val || 0}%</span>
        </div>
      ),
    },
    {
      key: 'id_producto',
      title: 'Acciones',
      align: 'center',
      render: (_, row) => (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => abrirModalAjustarStock(row)}
            icon={<Plus size={16} />}
          >
            Ajustar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => abrirModalStockMinimo(row)}
            icon={<Settings size={16} />}
          >
            Config
          </Button>
        </div>
      ),
    },
  ];

  const movimientosColumns: Column<MovimientoInventario>[] = [
    {
      key: 'fecha_movimiento',
      title: 'Fecha',
      align: 'center',
      render: (val) => formatearFecha(val),
    },
    {
      key: 'tipo_movimiento',
      title: 'Tipo',
      align: 'center',
      render: (val) => (
        <Badge variant={
          val === 'entrada' ? 'success' :
          val === 'salida' ? 'danger' :
          val === 'ajuste' ? 'info' :
          'warning'
        }>
          {obtenerIconoTipoMovimiento(val)} {val.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'producto',
      title: 'Producto',
      align: 'left',
      render: (val: any) => (
        <div>
          <div className="font-medium">{val?.descripcion}</div>
          <div className="text-xs text-gray-500">CUM: {val?.cum}</div>
        </div>
      ),
    },
    {
      key: 'cantidad',
      title: 'Cantidad',
      align: 'center',
      render: (val, row: any) => `${val} ${row.producto?.unidad_medida}`,
    },
    {
      key: 'stock_anterior',
      title: 'Stock Anterior',
      align: 'center',
      render: (val, row: any) => `${val} ${row.producto?.unidad_medida}`,
    },
    {
      key: 'stock_nuevo',
      title: 'Stock Nuevo',
      align: 'center',
      render: (val, row: any) => `${val} ${row.producto?.unidad_medida}`,
    },
    {
      key: 'motivo',
      title: 'Motivo',
      align: 'left',
      render: (val) => val || 'N/A',
    },
    {
      key: 'usuario',
      title: 'Usuario',
      align: 'center',
      render: (val: any) => val?.nombre || 'Sistema',
    },
  ];

  // ===== FUNCIONES DE IA =====
  const handleAnalyzeInventory = async () => {
    setLoadingAI(true);
    setShowAIPanel(true);
    try {
      // Map ProductoInventario -> InventoryItem expected by analyzeInventoryStatus
      const itemsForAI = alertasStock.map((p) => ({
        descripcion: p.descripcion,
        cum: p.cum,
        stock_actual: p.stock_actual,
        stock_minimo: p.stock_minimo,
        unidad_medida: p.unidad_medida,
        // try common field names for unit price, fall back to 0 if missing
        precio_unidad: (p as any).precio_unidad ?? (p as any).precio_unitario ?? 0,
        laboratorio: p.laboratorio?.nombre ?? "",
      }));
      const analysis = await analyzeInventoryStatus(itemsForAI);
      setAiAnalysis(analysis);
      toast.success("Análisis completado");
    } catch (error) {
      console.error("Error al analizar inventario:", error);
      toast.error("Error al realizar el análisis con IA");
      setAiAnalysis(null);
    } finally {
      setLoadingAI(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/Menu")}
            className="flex items-center text-dark-text hover:text-primary-400 transition-colors px-4 py-2 rounded-lg hover:bg-dark-bg"
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="font-medium">Volver al Menú</span>
          </button>
          <h1 className="text-3xl font-bold text-dark-text">Control de Inventario</h1>
          <div className="w-40"></div> {/* Spacer para centrar el título */}
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Botón de Análisis IA */}
          <div className="mb-6 flex justify-end">
            <Button
              variant="primary"
              onClick={handleAnalyzeInventory}
              disabled={loadingAI || alertasStock.length === 0}
              icon={<Sparkles size={20} />}
            >
              {loadingAI ? "Analizando..." : "Análisis Inteligente con IA"}
            </Button>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card hoverable>
                <CardContent>
                  <div className="border-l-4 border-blue-500 pl-3">
                    <div className="text-sm text-gray-600">Total Productos</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {estadisticas.total_productos}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card hoverable>
                <CardContent>
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="text-sm text-gray-600">Con Stock</div>
                    <div className="text-2xl font-bold text-green-600">
                      {estadisticas.productos_con_stock}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card hoverable>
                <CardContent>
                  <div className="border-l-4 border-red-500 pl-3">
                    <div className="text-sm text-gray-600">Sin Stock</div>
                    <div className="text-2xl font-bold text-red-600">
                      {estadisticas.productos_sin_stock}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card hoverable>
                <CardContent>
                  <div className="border-l-4 border-orange-500 pl-3">
                    <div className="text-sm text-gray-600">Stock Bajo</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {estadisticas.productos_stock_bajo}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card hoverable>
                <CardContent>
                  <div className="border-l-4 border-purple-500 pl-3">
                    <div className="text-sm text-gray-600">Unidades Totales</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {estadisticas.unidades_totales_stock.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card hoverable>
                <CardContent>
                  <div className="border-l-4 border-yellow-500 pl-3">
                    <div className="text-sm text-gray-600">Movimientos Hoy</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {estadisticas.movimientos_hoy}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Panel de Análisis IA */}
          {showAIPanel && aiAnalysis && (
            <div className="mb-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-lg p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Sparkles className="text-purple-400" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Análisis Inteligente de Inventario</h3>
                </div>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold transition-colors hover:bg-red-500/20 rounded-lg w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* Resumen */}
              <div className="mb-4 bg-white/10 rounded-lg p-5 border border-blue-500/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-blue-400 mt-1 flex-shrink-0" size={22} />
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-lg">Resumen Ejecutivo</h4>
                    <p className="text-gray-200 leading-relaxed">{aiAnalysis.resumen}</p>
                  </div>
                </div>
              </div>

              {/* Alertas Críticas */}
              {aiAnalysis.alertas_criticas && aiAnalysis.alertas_criticas.length > 0 && (
                <div className="mb-4 bg-white/10 rounded-lg p-5 border border-red-500/30 shadow-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-400 mt-1 flex-shrink-0" size={22} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-3 text-lg">Alertas Críticas</h4>
                      <ul className="space-y-2">
                        {aiAnalysis.alertas_criticas.map((alerta: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-200 flex items-start gap-2">
                            <span className="text-red-400 text-lg">•</span>
                            <span>{alerta}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Productos Prioritarios */}
              {aiAnalysis.productos_prioritarios && aiAnalysis.productos_prioritarios.length > 0 && (
                <div className="mb-4 bg-white/10 rounded-lg p-5 border border-yellow-500/30 shadow-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="text-yellow-400 mt-1 flex-shrink-0" size={22} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-3 text-lg">Productos Prioritarios</h4>
                      <div className="space-y-2">
                        {aiAnalysis.productos_prioritarios.map((producto: any, idx: number) => (
                          <div key={idx} className="bg-white/5 rounded p-3 border border-yellow-500/20">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-white">{producto.nombre}</p>
                                <p className="text-sm text-gray-300">Prioridad: {producto.prioridad}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-300 mt-2">{producto.razon}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              <div className="mb-4 bg-white/10 rounded-lg p-5 border border-green-500/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="text-green-400 mt-1 flex-shrink-0" size={22} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-3 text-lg">Recomendaciones</h4>
                    <ul className="space-y-3">
                      {aiAnalysis.recomendaciones.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 group">
                          <span className="text-green-400 mt-1 text-lg">•</span>
                          <span className="text-gray-200 leading-relaxed group-hover:text-white transition-colors">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Análisis Detallado */}
              <div className="bg-white/10 rounded-lg p-5 border border-purple-500/30 shadow-lg">
                <h4 className="font-semibold text-white mb-3 text-lg">Análisis Detallado</h4>
                <p className="text-gray-200 whitespace-pre-line leading-relaxed">{aiAnalysis.analisis_detallado}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Card>
            <div className="border-b border-dark-border">
              <nav className="flex">
                <button
                  onClick={() => setTabActiva("alertas")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    tabActiva === "alertas"
                      ? "border-b-2 border-primary-500 text-primary-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Alertas de Stock Bajo ({alertasStock.length})
                </button>
                <button
                  onClick={() => setTabActiva("movimientos")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    tabActiva === "movimientos"
                      ? "border-b-2 border-primary-500 text-primary-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Movimientos de Inventario
                </button>
              </nav>
            </div>

            <CardContent>
              {/* Tab: Alertas de Stock Bajo */}
              {tabActiva === "alertas" && (
                <div>
                  <Pagination
                    currentPage={paginaAlertas}
                    totalPages={totalPaginasAlertas}
                    onPageChange={setPaginaAlertas}
                  />
                  
                  <Table
                    columns={alertasColumns}
                    data={alertasStock}
                    keyExtractor={(row) => row.id_producto}
                    loading={loading}
                    striped
                    hoverable
                    emptyMessage="No hay productos con stock bajo"
                  />
                </div>
              )}

              {/* Tab: Movimientos de Inventario */}
              {tabActiva === "movimientos" && (
                <div>
                  {/* Filtros */}
                  <div className="mb-4">
                    <select
                      value={filtroTipoMovimiento}
                      onChange={(e) => {
                        setFiltroTipoMovimiento(e.target.value);
                        setPaginaMovimientos(1);
                      }}
                      className="px-4 py-2.5 border border-dark-border rounded-xl bg-dark-card text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="">Todos los tipos</option>
                      <option value="entrada">Entrada</option>
                      <option value="salida">Salida</option>
                      <option value="ajuste">Ajuste</option>
                      <option value="devolucion">Devolución</option>
                    </select>
                  </div>

                  <Pagination
                    currentPage={paginaMovimientos}
                    totalPages={totalPaginasMovimientos}
                    onPageChange={setPaginaMovimientos}
                  />
                  
                  <Table
                    columns={movimientosColumns}
                    data={movimientos}
                    keyExtractor={(row) => row.id_movimiento}
                    loading={loading}
                    striped
                    hoverable
                    emptyMessage="No hay movimientos registrados"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal: Ajustar Stock */}
          <Modal
            isOpen={modalAjustarStock}
            onClose={cerrarModales}
            title="Ajustar Stock"
            size="md"
          >
            {productoSeleccionado && (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Producto:</div>
                  <div className="font-medium text-gray-900">
                    {productoSeleccionado.descripcion}
                  </div>
                  <div className="text-sm text-gray-500">
                    Stock actual: {productoSeleccionado.stock_actual}{" "}
                    {productoSeleccionado.unidad_medida}
                  </div>
                </div>
                <form onSubmit={handleAjustarStock}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de ajuste
                    </label>
                    <select
                      value={formAjuste.tipo_ajuste}
                      onChange={(e) =>
                        setFormAjuste({
                          ...formAjuste,
                          tipo_ajuste: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="ajuste">Ajuste</option>
                      <option value="salida">Salida</option>
                      <option value="devolucion">Devolución</option>
                    </select>
                  </div>
                  <Input
                    label="Cantidad"
                    type="number"
                    value={formAjuste.cantidad.toString()}
                    onChange={(e) =>
                      setFormAjuste({ ...formAjuste, cantidad: parseInt(e.target.value) || 0 })
                    }
                    required
                    min="1"
                  />
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo
                    </label>
                    <textarea
                      value={formAjuste.motivo}
                      onChange={(e) =>
                        setFormAjuste({ ...formAjuste, motivo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                      placeholder="Ingrese el motivo del ajuste"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={cerrarModales}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="success"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Ajustando..." : "Ajustar Stock"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Modal>

          {/* Modal: Configurar Stock Mínimo */}
          <Modal
            isOpen={modalStockMinimo}
            onClose={cerrarModales}
            title="Configurar Stock Mínimo"
            size="md"
          >
            {productoSeleccionado && (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Producto:</div>
                  <div className="font-medium text-gray-900">
                    {productoSeleccionado.descripcion}
                  </div>
                </div>
                <form onSubmit={handleActualizarStockMinimo}>
                  <Input
                    label="Stock Mínimo"
                    type="number"
                    value={formStockMinimo.stock_minimo.toString()}
                    onChange={(e) =>
                      setFormStockMinimo({
                        ...formStockMinimo,
                        stock_minimo: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    min="0"
                  />
                  <Input
                    label="Stock Máximo (opcional)"
                    type="number"
                    value={formStockMinimo.stock_maximo.toString()}
                    onChange={(e) =>
                      setFormStockMinimo({
                        ...formStockMinimo,
                        stock_maximo: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={cerrarModales}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="success"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Actualizando..." : "Actualizar"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ControlInventario;
