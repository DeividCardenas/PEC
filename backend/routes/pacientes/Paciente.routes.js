/**
 * Rutas para Gestión de Pacientes (RF007)
 */

const { Router } = require("express");
const router = Router();

// Importar middleware de autenticación (usar el mejorado si está disponible, sino el original)
let VerificarAcceso;
try {
  VerificarAcceso = require("../../middlewares/authMiddleware.enhanced").VerificarAcceso;
} catch (error) {
  VerificarAcceso = require("../../middlewares/authMiddleware").VerificarAcceso;
}

const {
  ObtenerPacientes,
  ObtenerPaciente,
  CrearPaciente,
  ActualizarPaciente,
  EliminarPaciente,
  ReactivarPaciente,
  ObtenerEstadisticasPacientes,
  BuscarPorIdentificacion,
} = require("../../controllers/pacientes/Paciente.Controller");

// Rutas de estadísticas (debe ir antes de /:id para evitar conflictos)
router.get(
  "/estadisticas",
  VerificarAcceso({ permisosRequeridos: ["ver_pacientes"] }),
  ObtenerEstadisticasPacientes
);

// Buscar por número de identificación
router.get(
  "/buscar/:numero_identificacion",
  VerificarAcceso({ permisosRequeridos: ["ver_pacientes"] }),
  BuscarPorIdentificacion
);

// Rutas CRUD
router.get(
  "/",
  VerificarAcceso({ permisosRequeridos: ["ver_pacientes"] }),
  ObtenerPacientes
);

router.get(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["ver_pacientes"] }),
  ObtenerPaciente
);

router.post(
  "/",
  VerificarAcceso({ permisosRequeridos: ["crear_pacientes"] }),
  CrearPaciente
);

router.put(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["editar_pacientes"] }),
  ActualizarPaciente
);

router.delete(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["eliminar_pacientes"] }),
  EliminarPaciente
);

router.put(
  "/:id/reactivar",
  VerificarAcceso({ permisosRequeridos: ["editar_pacientes"] }),
  ReactivarPaciente
);

module.exports = router;
