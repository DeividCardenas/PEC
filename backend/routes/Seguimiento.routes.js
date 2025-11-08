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
} = require("../controllers/seguimiento/Seguimiento.Controller");

const { verificarToken } = require("../middleware/authMiddleware");
const { verificarPermiso } = require("../middleware/permisosMiddleware");

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   PUT /api/seguimiento/domiciliario/:id/ubicacion
 * @desc    Actualizar ubicación de un domiciliario
 * @access  Privado (actualizar_ubicacion)
 */
router.put(
  "/domiciliario/:id/ubicacion",
  verificarPermiso("actualizar_ubicacion"),
  ActualizarUbicacion
);

/**
 * @route   GET /api/seguimiento/domiciliario/:id/ubicacion
 * @desc    Obtener ubicación actual de un domiciliario
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/domiciliario/:id/ubicacion",
  verificarPermiso("ver_seguimiento"),
  ObtenerUbicacionDomiciliario
);

/**
 * @route   GET /api/seguimiento/domiciliarios
 * @desc    Obtener ubicaciones de todos los domiciliarios activos
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/domiciliarios",
  verificarPermiso("ver_seguimiento"),
  ObtenerUbicacionesDomiciliarios
);

/**
 * @route   GET /api/seguimiento/ruta/:id
 * @desc    Obtener información de seguimiento de una ruta
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/ruta/:id",
  verificarPermiso("ver_seguimiento"),
  ObtenerSeguimientoRuta
);

/**
 * @route   GET /api/seguimiento/rutas-activas
 * @desc    Obtener todas las rutas activas con ubicaciones
 * @access  Privado (ver_seguimiento)
 */
router.get(
  "/rutas-activas",
  verificarPermiso("ver_seguimiento"),
  ObtenerRutasActivas
);

/**
 * @route   POST /api/seguimiento/domiciliario/:id/simular-movimiento
 * @desc    Simular movimiento de un domiciliario (desarrollo/testing)
 * @access  Privado (actualizar_ubicacion)
 */
router.post(
  "/domiciliario/:id/simular-movimiento",
  verificarPermiso("actualizar_ubicacion"),
  SimularMovimiento
);

module.exports = router;
