/**
 * Rutas para Optimización de Rutas (RF009)
 */

const express = require("express");
const router = express.Router();

// Middleware de autenticación
const { VerificarAcceso } = require("../../middlewares/authMiddleware.enhanced");

// Controladores
const {
  ObtenerRutas,
  ObtenerRuta,
  CrearRuta,
  AsignarDomiciliario,
  CambiarEstadoRuta,
  CancelarRuta,
  ObtenerEstadisticasRutas,
} = require("../../controllers/rutas/Ruta.Controller");

// Rutas especiales (deben ir antes de las rutas con :id)
router.get(
  "/estadisticas",
  VerificarAcceso({ permisosRequeridos: ["ver_rutas"] }),
  ObtenerEstadisticasRutas
);

// Rutas CRUD
router.get(
  "/",
  VerificarAcceso({ permisosRequeridos: ["ver_rutas"] }),
  ObtenerRutas
);

router.get(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["ver_rutas"] }),
  ObtenerRuta
);

router.post(
  "/",
  VerificarAcceso({ permisosRequeridos: ["crear_rutas"] }),
  CrearRuta
);

router.put(
  "/:id/asignar-domiciliario",
  VerificarAcceso({ permisosRequeridos: ["asignar_rutas"] }),
  AsignarDomiciliario
);

router.put(
  "/:id/estado",
  VerificarAcceso({ permisosRequeridos: ["gestionar_rutas"] }),
  CambiarEstadoRuta
);

router.put(
  "/:id/cancelar",
  VerificarAcceso({ permisosRequeridos: ["cancelar_rutas"] }),
  CancelarRuta
);

module.exports = router;
