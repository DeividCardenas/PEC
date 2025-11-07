const { Router } = require("express");
const router = Router();

const {
  MostrarOrdenes,
  MostrarOrden,
  CrearOrden,
  EditarOrden,
  EliminarOrden,
  AprobarOrden,
  RechazarOrden,
  CompletarOrden,
  ObtenerEstadisticas,
} = require("../../controllers/ordenes/OrdenCompra.Controller");

// Rutas de órdenes de compra
router.get("/", MostrarOrdenes);
router.get("/estadisticas", ObtenerEstadisticas);
router.get("/:id_orden_compra", MostrarOrden);
router.post("/", CrearOrden);
router.put("/:id_orden_compra", EditarOrden);
router.delete("/:id_orden_compra", EliminarOrden);

// Rutas de aprobación/rechazo
router.put("/:id_orden_compra/aprobar", AprobarOrden);
router.put("/:id_orden_compra/rechazar", RechazarOrden);
router.put("/:id_orden_compra/completar", CompletarOrden);

module.exports = router;
