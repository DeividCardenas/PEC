/**
 * Rutas para Reportes de Compras (RF005)
 */

const { Router } = require("express");
const router = Router();

const {
  ObtenerReporteCompras,
  ObtenerTopProveedores,
  ObtenerTendencias,
  ExportarReporteCSV,
  ObtenerResumenEjecutivo,
} = require("../../controllers/reportes/Reportes.Controller");

// Rutas de reportes
router.get("/compras", ObtenerReporteCompras);
router.get("/top-proveedores", ObtenerTopProveedores);
router.get("/tendencias", ObtenerTendencias);
router.get("/exportar-csv", ExportarReporteCSV);
router.get("/resumen-ejecutivo", ObtenerResumenEjecutivo);

module.exports = router;
