/**
 * Componentes Modales para Gestión de Entregas
 */

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  type Entrega,
  type CrearEntregaData,
  type ProductoEntrega,
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
  getEstadoColor,
  ESTADOS_ENTREGA,
} from "../../services/Entregas/entregasService";
import { type Paciente } from "../../services/Pacientes/pacientesService";
import { fetchProductos, type Producto } from "../../services/Productos/productosService";

// ============================================================================
// CREATE ENTREGA MODAL
// ============================================================================

interface CreateEntregaModalProps {
  formData: CrearEntregaData;
  setFormData: React.Dispatch<React.SetStateAction<CrearEntregaData>>;
  productosEntrega: ProductoEntrega[];
  setProductosEntrega: React.Dispatch<React.SetStateAction<ProductoEntrega[]>>;
  pacientes: Paciente[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onPacienteChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAgregarProducto: () => void;
  onEliminarProducto: (index: number) => void;
  onProductoChange: (index: number, field: string, value: any) => void;
  calcularTotal: () => number;
}

export const CreateEntregaModal: React.FC<CreateEntregaModalProps> = ({
  formData,
  setFormData,
  productosEntrega,
  setProductosEntrega,
  pacientes,
  onClose,
  onSubmit,
  onPacienteChange,
  onAgregarProducto,
  onEliminarProducto,
  onProductoChange,
  calcularTotal,
}) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoadingProductos(true);
    try {
      const response = await fetchProductos({ limit: 1000 });
      setProductos(response.productos);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setLoadingProductos(false);
    }
  };

  const getProductoDisponible = (id_producto: number) => {
    const producto = productos.find((p) => p.id_producto === id_producto);
    return producto?.stock_actual || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">Nueva Entrega</h2>
          <p className="text-indigo-100 mt-1">Crear pedido de entrega a paciente</p>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {/* Sección: Selección de Paciente */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-user-injured text-blue-600"></i>
              Selección de Paciente
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_paciente}
                  onChange={onPacienteChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={0}>Seleccione un paciente</option>
                  {pacientes.map((paciente) => (
                    <option key={paciente.id_paciente} value={paciente.id_paciente}>
                      {paciente.nombres} {paciente.apellidos} - {paciente.numero_identificacion}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Dirección de Entrega */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-green-600"></i>
              Dirección de Entrega
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.direccion_entrega}
                  onChange={(e) => setFormData({ ...formData, direccion_entrega: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ciudad_entrega}
                  onChange={(e) => setFormData({ ...formData, ciudad_entrega: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.departamento_entrega}
                  onChange={(e) => setFormData({ ...formData, departamento_entrega: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barrio</label>
                <input
                  type="text"
                  value={formData.barrio_entrega}
                  onChange={(e) => setFormData({ ...formData, barrio_entrega: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Programada de Entrega
                </label>
                <input
                  type="date"
                  value={formData.fecha_entrega_programada}
                  onChange={(e) => setFormData({ ...formData, fecha_entrega_programada: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones de Dirección
                </label>
                <textarea
                  value={formData.observaciones_direccion}
                  onChange={(e) => setFormData({ ...formData, observaciones_direccion: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Sección: Productos */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i className="fas fa-pills text-purple-600"></i>
                Productos de la Entrega
              </h3>
              <button
                type="button"
                onClick={onAgregarProducto}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Agregar Producto
              </button>
            </div>

            {productosEntrega.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-box-open text-4xl mb-2"></i>
                <p>No hay productos agregados. Haga clic en "Agregar Producto" para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {productosEntrega.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Producto <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.id_producto}
                          onChange={(e) => onProductoChange(index, "id_producto", parseInt(e.target.value))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={0}>Seleccione un producto</option>
                          {productos.map((producto) => (
                            <option key={producto.id_producto} value={producto.id_producto}>
                              {producto.descripcion} (Stock: {producto.stock_actual})
                            </option>
                          ))}
                        </select>
                        {item.id_producto > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Stock disponible: {getProductoDisponible(item.id_producto)}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => onProductoChange(index, "cantidad", parseInt(e.target.value) || 0)}
                          min="1"
                          max={getProductoDisponible(item.id_producto)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Precio Unit. <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) => onProductoChange(index, "precio_unitario", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtotal</label>
                        <input
                          type="text"
                          value={formatearMoneda(item.cantidad * item.precio_unitario)}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => onEliminarProducto(index)}
                          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                          title="Eliminar producto"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {productosEntrega.length > 0 && (
              <div className="mt-6 bg-white rounded-lg p-4 border-2 border-purple-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total de la Entrega:</span>
                  <span className="text-2xl font-bold text-purple-600">{formatearMoneda(calcularTotal())}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sección: Observaciones */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-comment text-gray-600"></i>
              Observaciones Generales
            </h3>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Observaciones o instrucciones especiales para la entrega..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg"
            >
              <i className="fas fa-save mr-2"></i>
              Crear Entrega
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// DETAILS MODAL
// ============================================================================

interface DetailsModalProps {
  entrega: Entrega;
  onClose: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ entrega, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold">Detalles de Entrega</h2>
          <p className="text-blue-100 mt-1">Pedido: {entrega.numero_pedido}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Estado y Fechas */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado y Fechas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(entrega.estado)}`}>
                  {entrega.estado}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Pedido</p>
                <p className="font-medium">{formatearFechaHora(entrega.fecha_pedido)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha Programada</p>
                <p className="font-medium">{formatearFecha(entrega.fecha_entrega_programada)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Entrega Real</p>
                <p className="font-medium">{formatearFecha(entrega.fecha_entrega_real)}</p>
              </div>
            </div>
          </div>

          {/* Información del Paciente */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-medium">{entrega.paciente?.nombres} {entrega.paciente?.apellidos}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Identificación</p>
                <p className="font-medium">{entrega.paciente?.numero_identificacion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{entrega.paciente?.telefono_principal}</p>
              </div>
            </div>
          </div>

          {/* Dirección de Entrega */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dirección de Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{entrega.direccion_entrega}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ciudad</p>
                <p className="font-medium">{entrega.ciudad_entrega}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Departamento</p>
                <p className="font-medium">{entrega.departamento_entrega}</p>
              </div>
              {entrega.barrio_entrega && (
                <div>
                  <p className="text-sm text-gray-600">Barrio</p>
                  <p className="font-medium">{entrega.barrio_entrega}</p>
                </div>
              )}
              {entrega.observaciones_direccion && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Observaciones de Dirección</p>
                  <p className="font-medium">{entrega.observaciones_direccion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos de la Entrega</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">CUM</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Precio Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entrega.detalles?.map((detalle) => (
                    <tr key={detalle.id_detalle_entrega}>
                      <td className="px-4 py-3 text-sm">{detalle.producto.descripcion}</td>
                      <td className="px-4 py-3 text-sm font-mono">{detalle.producto.cum}</td>
                      <td className="px-4 py-3 text-sm text-right">{detalle.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatearMoneda(detalle.precio_unitario)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{formatearMoneda(detalle.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-orange-100">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">TOTAL:</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600 text-lg">
                      {formatearMoneda(entrega.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          {(entrega.observaciones || entrega.observaciones_despacho) && (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Observaciones</h3>
              {entrega.observaciones && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Observaciones Generales</p>
                  <p className="font-medium whitespace-pre-wrap">{entrega.observaciones}</p>
                </div>
              )}
              {entrega.observaciones_despacho && (
                <div>
                  <p className="text-sm text-gray-600">Observaciones de Despacho</p>
                  <p className="font-medium whitespace-pre-wrap">{entrega.observaciones_despacho}</p>
                </div>
              )}
            </div>
          )}

          {/* Usuarios */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Usuarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Creado por</p>
                <p className="font-medium">{entrega.usuario_creador?.username}</p>
                <p className="text-sm text-gray-500">{entrega.usuario_creador?.email}</p>
              </div>
              {entrega.usuario_despachador && (
                <div>
                  <p className="text-sm text-gray-600">Despachado por</p>
                  <p className="font-medium">{entrega.usuario_despachador.username}</p>
                  <p className="text-sm text-gray-500">{entrega.usuario_despachador.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón Cerrar */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ESTADO MODAL
// ============================================================================

interface EstadoModalProps {
  entrega: Entrega;
  nuevoEstado: string;
  setNuevoEstado: React.Dispatch<React.SetStateAction<string>>;
  observacionesDespacho: string;
  setObservacionesDespacho: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EstadoModal: React.FC<EstadoModalProps> = ({
  entrega,
  nuevoEstado,
  setNuevoEstado,
  observacionesDespacho,
  setObservacionesDespacho,
  onClose,
  onSubmit,
}) => {
  const estadosDisponibles = ESTADOS_ENTREGA.filter((e) => e !== "Cancelado");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">Cambiar Estado de Entrega</h2>
          <p className="text-purple-100 mt-1">Pedido: {entrega.numero_pedido}</p>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado Actual
            </label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(entrega.estado)}`}>
              {entrega.estado}
            </span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Estado <span className="text-red-500">*</span>
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccione un estado</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado} disabled={estado === entrega.estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones de Despacho
            </label>
            <textarea
              value={observacionesDespacho}
              onChange={(e) => setObservacionesDespacho(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Notas sobre el cambio de estado..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold"
            >
              Cambiar Estado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// CANCELAR MODAL
// ============================================================================

interface CancelarModalProps {
  entrega: Entrega;
  motivoCancelacion: string;
  setMotivoCancelacion: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CancelarModal: React.FC<CancelarModalProps> = ({
  entrega,
  motivoCancelacion,
  setMotivoCancelacion,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">Cancelar Entrega</h2>
          <p className="text-red-100 mt-1">Pedido: {entrega.numero_pedido}</p>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-yellow-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Al cancelar esta entrega, los productos serán devueltos al inventario automáticamente.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de Cancelación <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Explique el motivo de la cancelación..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Volver
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg font-semibold"
            >
              Confirmar Cancelación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
