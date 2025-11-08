/**
 * Rutas para Gestión de Domiciliarios (RF009)
 */

const express = require("express");
const router = express.Router();

// Middleware de autenticación
const { VerificarAcceso } = require("../../middlewares/authMiddleware.enhanced");

// Controladores
const {
  ObtenerDomiciliarios,
  ObtenerDomiciliario,
  CrearDomiciliario,
  ActualizarDomiciliario,
  EliminarDomiciliario,
  ReactivarDomiciliario,
  ObtenerEstadisticasDomiciliarios,
  CambiarDisponibilidad,
} = require("../../controllers/domiciliarios/Domiciliario.Controller");

// Rutas especiales (deben ir antes de las rutas con :id)
router.get(
  "/estadisticas",
  VerificarAcceso({ permisosRequeridos: ["ver_domiciliarios"] }),
  ObtenerEstadisticasDomiciliarios
);

// Rutas CRUD
router.get(
  "/",
  VerificarAcceso({ permisosRequeridos: ["ver_domiciliarios"] }),
  ObtenerDomiciliarios
);

router.get(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["ver_domiciliarios"] }),
  ObtenerDomiciliario
);

router.post(
  "/",
  VerificarAcceso({ permisosRequeridos: ["crear_domiciliarios"] }),
  CrearDomiciliario
);

router.put(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["editar_domiciliarios"] }),
  ActualizarDomiciliario
);

router.delete(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["eliminar_domiciliarios"] }),
  EliminarDomiciliario
);

router.put(
  "/:id/reactivar",
  VerificarAcceso({ permisosRequeridos: ["editar_domiciliarios"] }),
  ReactivarDomiciliario
);

router.put(
  "/:id/disponibilidad",
  VerificarAcceso({ permisosRequeridos: ["editar_domiciliarios"] }),
  CambiarDisponibilidad
);

module.exports = router;
