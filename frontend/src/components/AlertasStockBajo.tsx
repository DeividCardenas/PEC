/**
 * Componente de Alertas de Stock Bajo
 * RF003 - Muestra productos con stock bajo para usar en dashboard
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerAlertasStockBajo,
  ProductoInventario,
} from "../services/Inventario/inventarioService";

interface AlertasStockBajoProps {
  limite?: number;
  mostrarTitulo?: boolean;
}

const AlertasStockBajo: React.FC<AlertasStockBajoProps> = ({
  limite = 5,
  mostrarTitulo = true,
}) => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState<ProductoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarAlertas();
  }, [limite]);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerAlertasStockBajo(1, limite, "stock_actual", "asc");
      setAlertas(response.data.productos);
    } catch (err: any) {
      console.error("Error al cargar alertas de stock:", err);
      setError("Error al cargar alertas de stock bajo");
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorNivelStock = (producto: ProductoInventario) => {
    if (producto.stock_actual === 0) return "bg-red-100 text-red-700";
    if ((producto.porcentaje_stock || 0) <= 50) return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const irAInventario = () => {
    navigate("/inventario");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {mostrarTitulo && (
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Alertas de Stock Bajo
          </h3>
        )}
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {mostrarTitulo && (
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Alertas de Stock Bajo
          </h3>
        )}
        <div className="text-center py-6">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={cargarAlertas}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {mostrarTitulo && (
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Alertas de Stock Bajo
          </h3>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
            {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}
          </span>
        </div>
      )}

      <div className="p-4">
        {alertas.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-green-600 text-4xl mb-2">✓</div>
            <p className="text-gray-600 text-sm">
              No hay productos con stock bajo
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Todos los productos tienen stock adecuado
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {alertas.map((producto) => (
                <div
                  key={producto.id_producto}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {producto.descripcion}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        CUM: {producto.cum}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${obtenerColorNivelStock(
                        producto
                      )}`}
                    >
                      {producto.stock_actual === 0 ? "Sin stock" : "Stock bajo"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Actual:</span>
                      <div className="font-semibold text-gray-900">
                        {producto.stock_actual} {producto.unidad_medida}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Mínimo:</span>
                      <div className="font-semibold text-gray-900">
                        {producto.stock_minimo} {producto.unidad_medida}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Déficit:</span>
                      <div className="font-semibold text-red-600">
                        -{producto.deficit || 0} {producto.unidad_medida}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          producto.stock_actual === 0
                            ? "bg-red-500"
                            : (producto.porcentaje_stock || 0) <= 50
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${Math.min(100, producto.porcentaje_stock || 0)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {producto.porcentaje_stock || 0}% del stock mínimo
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={irAInventario}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Ver todas las alertas →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertasStockBajo;
