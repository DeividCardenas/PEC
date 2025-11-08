/**
 * Rutas de Seguimiento en Tiempo Real (RF010)
 */

const express = require("express");
const router = express.Router();
const {
  ActualizarUbicacion,
  ObtenerUbicacionDomiciliario,
  ObtenerUbicacionesDomiciliarios,
  ObtenerSeguimientoRuta,
  ObtenerRutasActivas,
  SimularMovimiento,
} = require("../../controllers/seguimiento/Seguimiento.Controller");

const { VerificarAcceso } = require("../../middlewares/authMiddleware.enhanced");

/**
 * @route   PUT /api/seguimiento/domiciliario/:id/ubicacion
 * @desc    Actualizar ubicación de un domiciliario
 * @access  Privado (actualizar_ubicacion)
 */
router.put(
  "/domiciliario/:id/ubicacion",
  VerificarAcceso({ permisosRequeridos: ["actualizar_ubicacion"] }),
  ActualizarUbicacion
);

/**
 * @route   GET /api/seguimiento/domiciliario/:id/ubicacion
 * @desc    Obtener ubicación actual de un domiciliario
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/domiciliario/:id/ubicacion",
  VerificarAcceso({ permisosRequeridos: ["ver_seguimiento"] }),
  ObtenerUbicacionDomiciliario
);

/**
 * @route   GET /api/seguimiento/domiciliarios
 * @desc    Obtener ubicaciones de todos los domiciliarios activos
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/domiciliarios",
  VerificarAcceso({ permisosRequeridos: ["ver_seguimiento"] }),
  ObtenerUbicacionesDomiciliarios
);

/**
 * @route   GET /api/seguimiento/ruta/:id
 * @desc    Obtener información de seguimiento de una ruta
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/ruta/:id",
  VerificarAcceso({ permisosRequeridos: ["ver_seguimiento"] }),
  ObtenerSeguimientoRuta
);

/**
 * @route   GET /api/seguimiento/rutas-activas
 * @desc    Obtener todas las rutas activas con ubicaciones
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/rutas-activas",
  VerificarAcceso({ permisosRequeridos: ["ver_seguimiento"] }),
  ObtenerRutasActivas
);

/**
 * @route   POST /api/seguimiento/domiciliario/:id/simular-movimiento
 * @desc    Simular movimiento de un domiciliario (desarrollo/testing)
 * @access  Privado (actualizar_ubicacion)
 */
router.post(
  "/domiciliario/:id/simular-movimiento",
  VerificarAcceso({ permisosRequeridos: ["actualizar_ubicacion"] }),
  SimularMovimiento
);

module.exports = router;
