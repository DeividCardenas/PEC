const { Router } = require("express");
const router = Router();

const {
  ObtenerAlertasStockBajo,
  ObtenerMovimientosInventario,
  ObtenerMovimientosProducto,
  AjustarStock,
  ObtenerEstadisticasInventario,
  ActualizarStockMinimo,
} = require("../../controllers/inventario/Inventario.Controller");

// Rutas de inventario - RF003

// Estadísticas y alertas
router.get("/estadisticas", ObtenerEstadisticasInventario);
router.get("/alertas", ObtenerAlertasStockBajo);

// Movimientos de inventario
router.get("/movimientos", ObtenerMovimientosInventario);
router.get("/productos/:id_producto/movimientos", ObtenerMovimientosProducto);

// Ajustes de stock
router.post("/ajustar", AjustarStock);
router.put("/productos/:id_producto/stock-minimo", ActualizarStockMinimo);

module.exports = router;
