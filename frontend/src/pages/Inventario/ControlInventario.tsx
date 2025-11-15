/**
 * Página de Control de Inventario - RF003
 * Gestión completa de inventario con alertas de stock bajo y movimientos
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
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

  const obtenerColorNivelStock = (producto: ProductoInventario) => {
    const porcentaje = producto.porcentaje_stock || 0;
    if (porcentaje === 0 || producto.stock_actual === 0) return "text-red-600 bg-red-50";
    if (porcentaje <= 50) return "text-orange-600 bg-orange-50";
    if (porcentaje <= 100) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
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

  const obtenerColorTipoMovimiento = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "text-green-600 bg-green-50";
      case "salida":
        return "text-red-600 bg-red-50";
      case "ajuste":
        return "text-blue-600 bg-blue-50";
      case "devolucion":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
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

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Productos</div>
            <div className="text-2xl font-bold text-gray-800">
              {estadisticas.total_productos}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Con Stock</div>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas.productos_con_stock}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600">Sin Stock</div>
            <div className="text-2xl font-bold text-red-600">
              {estadisticas.productos_sin_stock}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600">Stock Bajo</div>
            <div className="text-2xl font-bold text-orange-600">
              {estadisticas.productos_stock_bajo}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Unidades Totales</div>
            <div className="text-2xl font-bold text-purple-600">
              {estadisticas.unidades_totales_stock.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600">Movimientos Hoy</div>
            <div className="text-2xl font-bold text-yellow-600">
              {estadisticas.movimientos_hoy}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setTabActiva("alertas")}
              className={`px-6 py-3 font-medium text-sm ${
                tabActiva === "alertas"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Alertas de Stock Bajo ({alertasStock.length})
            </button>
            <button
              onClick={() => setTabActiva("movimientos")}
              className={`px-6 py-3 font-medium text-sm ${
                tabActiva === "movimientos"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Movimientos de Inventario
            </button>
          </nav>
        </div>

        {/* Contenido Tabs */}
        <div className="p-6">
          {/* Tab: Alertas de Stock Bajo */}
          {tabActiva === "alertas" && (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Cargando alertas...</p>
                </div>
              ) : alertasStock.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    No hay productos con stock bajo
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            CUM
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Stock Actual
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Stock Mínimo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Déficit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {alertasStock.map((producto) => (
                          <tr key={producto.id_producto} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {producto.cum}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">{producto.descripcion}</div>
                              <div className="text-xs text-gray-500">
                                {producto.laboratorio?.nombre}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded ${obtenerColorNivelStock(producto)}`}>
                                {producto.stock_actual} {producto.unidad_medida}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {producto.stock_minimo} {producto.unidad_medida}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                -{producto.deficit || 0} {producto.unidad_medida}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      (producto.porcentaje_stock || 0) <= 50
                                        ? "bg-red-500"
                                        : "bg-yellow-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(100, producto.porcentaje_stock || 0)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">
                                  {producto.porcentaje_stock || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => abrirModalAjustarStock(producto)}
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                  title="Ajustar stock"
                                >
                                  Ajustar
                                </button>
                                <button
                                  onClick={() => abrirModalStockMinimo(producto)}
                                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                  title="Configurar stock mínimo"
                                >
                                  Config
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación Alertas */}
                  {totalPaginasAlertas > 1 && (
                    <div className="mt-4 flex justify-center items-center space-x-2">
                      <button
                        onClick={() => setPaginaAlertas(Math.max(1, paginaAlertas - 1))}
                        disabled={paginaAlertas === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-600">
                        Página {paginaAlertas} de {totalPaginasAlertas}
                      </span>
                      <button
                        onClick={() =>
                          setPaginaAlertas(Math.min(totalPaginasAlertas, paginaAlertas + 1))
                        }
                        disabled={paginaAlertas === totalPaginasAlertas}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Movimientos de Inventario */}
          {tabActiva === "movimientos" && (
            <div>
              {/* Filtros */}
              <div className="mb-4 flex items-center space-x-4">
                <div>
                  <label className="text-sm text-gray-600 mr-2">Tipo:</label>
                  <select
                    value={filtroTipoMovimiento}
                    onChange={(e) => {
                      setFiltroTipoMovimiento(e.target.value);
                      setPaginaMovimientos(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste</option>
                    <option value="devolucion">Devolución</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Cargando movimientos...</p>
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No hay movimientos registrados</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Stock Anterior
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Stock Nuevo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Usuario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Motivo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {movimientos.map((movimiento) => (
                          <tr key={movimiento.id_movimiento} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatearFecha(movimiento.creado_en)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${obtenerColorTipoMovimiento(
                                  movimiento.tipo_movimiento
                                )}`}
                              >
                                {obtenerIconoTipoMovimiento(movimiento.tipo_movimiento)}{" "}
                                {movimiento.tipo_movimiento}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">
                                {movimiento.producto?.descripcion}
                              </div>
                              <div className="text-xs text-gray-500">
                                {movimiento.producto?.cum}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`font-medium ${
                                  movimiento.cantidad >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {movimiento.cantidad > 0 ? "+" : ""}
                                {movimiento.cantidad}{" "}
                                {movimiento.producto?.unidad_medida}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {movimiento.stock_anterior}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {movimiento.stock_nuevo}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {movimiento.usuario?.username || "Sistema"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="max-w-xs truncate" title={movimiento.motivo || ""}>
                                {movimiento.motivo || "-"}
                              </div>
                              {movimiento.numero_referencia && (
                                <div className="text-xs text-gray-400">
                                  Ref: {movimiento.numero_referencia}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación Movimientos */}
                  {totalPaginasMovimientos > 1 && (
                    <div className="mt-4 flex justify-center items-center space-x-2">
                      <button
                        onClick={() =>
                          setPaginaMovimientos(Math.max(1, paginaMovimientos - 1))
                        }
                        disabled={paginaMovimientos === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-600">
                        Página {paginaMovimientos} de {totalPaginasMovimientos}
                      </span>
                      <button
                        onClick={() =>
                          setPaginaMovimientos(
                            Math.min(totalPaginasMovimientos, paginaMovimientos + 1)
                          )
                        }
                        disabled={paginaMovimientos === totalPaginasMovimientos}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ajustar Stock */}
      {modalAjustarStock && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Ajustar Stock
            </h3>
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
                  <option value="ajuste">Ajuste (Agregar)</option>
                  <option value="salida">Salida (Restar)</option>
                  <option value="devolucion">Devolución (Agregar)</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad {formAjuste.tipo_ajuste === "salida" ? "(se restará)" : "(se sumará)"}
                </label>
                <input
                  type="number"
                  value={formAjuste.cantidad}
                  onChange={(e) =>
                    setFormAjuste({ ...formAjuste, cantidad: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
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
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cerrarModales}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Ajustar Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configurar Stock Mínimo */}
      {modalStockMinimo && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Configurar Stock Mínimo
            </h3>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Producto:</div>
              <div className="font-medium text-gray-900">
                {productoSeleccionado.descripcion}
              </div>
            </div>
            <form onSubmit={handleActualizarStockMinimo}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={formStockMinimo.stock_minimo}
                  onChange={(e) =>
                    setFormStockMinimo({
                      ...formStockMinimo,
                      stock_minimo: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Máximo (opcional)
                </label>
                <input
                  type="number"
                  value={formStockMinimo.stock_maximo}
                  onChange={(e) =>
                    setFormStockMinimo({
                      ...formStockMinimo,
                      stock_maximo: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cerrarModales}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Guardar Configuración"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ControlInventario;
