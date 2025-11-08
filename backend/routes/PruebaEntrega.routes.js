/**
 * Rutas de Prueba de Entrega Digital (RF010)
 */

const express = require("express");
const router = express.Router();
const {
  RegistrarPruebaEntrega,
  ObtenerPruebaEntrega,
  ConfirmarEntregaSinPrueba,
  ObtenerFirma,
  ObtenerFoto,
  ObtenerEstadisticas,
} = require("../controllers/prueba-entrega/PruebaEntrega.Controller");

const { verificarToken } = require("../middleware/authMiddleware");
const { verificarPermiso } = require("../middleware/permisosMiddleware");
const { uploadPruebaEntrega } = require("../middleware/uploadConfig");

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   POST /api/prueba-entrega/:id
 * @desc    Registrar prueba de entrega con firma y/o foto
 * @access  Privado (registrar_prueba_entrega)
 */
router.post(
  "/:id",
  verificarPermiso("registrar_prueba_entrega"),
  uploadPruebaEntrega,
  RegistrarPruebaEntrega
);

/**
 * @route   GET /api/prueba-entrega/:id
 * @desc    Obtener prueba de entrega
 * @access  Privado (ver_entregas)
 */
router.get(
  "/:id",
  verificarPermiso("ver_entregas"),
  ObtenerPruebaEntrega
);

/**
 * @route   POST /api/prueba-entrega/:id/confirmar-sin-prueba
 * @desc    Confirmar entrega sin prueba digital
 * @access  Privado (gestionar_entregas)
 */
router.post(
  "/:id/confirmar-sin-prueba",
  verificarPermiso("gestionar_entregas"),
  ConfirmarEntregaSinPrueba
);

/**
 * @route   GET /api/prueba-entrega/:id/firma
 * @desc    Obtener archivo de firma
 * @access  Privado (ver_entregas)
 */
router.get(
  "/:id/firma",
  verificarPermiso("ver_entregas"),
  ObtenerFirma
);

/**
 * @route   GET /api/prueba-entrega/:id/foto
 * @desc    Obtener archivo de foto
 * @access  Privado (ver_entregas)
 */
router.get(
  "/:id/foto",
  verificarPermiso("ver_entregas"),
  ObtenerFoto
);

/**
 * @route   GET /api/prueba-entrega/estadisticas
 * @desc    Obtener estadísticas de pruebas de entrega
 * @access  Privado (ver_entregas)
 */
router.get(
  "/estadisticas",
  verificarPermiso("ver_entregas"),
  ObtenerEstadisticas
);

module.exports = router;
