/**
 * Rutas para Gestión de Respaldos de Base de Datos
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Middleware de autenticación
const { VerificarAcceso } = require("../../middlewares/authMiddleware.enhanced");

// Controladores
const {
  createBackup,
  restoreBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
} = require("../../controllers/admin/Backup.Controller");

// Configurar multer para subir archivos de backup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../backups/temp"));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `restore_${timestamp}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos .sql
    if (file.originalname.endsWith(".sql")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos .sql"));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // Límite de 100 MB
  },
});

// Rutas (solo para administradores)
router.post(
  "/create",
  VerificarAcceso({ rolesPermitidos: ["admin"] }),
  createBackup
);

router.post(
  "/restore",
  VerificarAcceso({ rolesPermitidos: ["admin"] }),
  upload.single("backup"),
  restoreBackup
);

router.get(
  "/list",
  VerificarAcceso({ rolesPermitidos: ["admin"] }),
  listBackups
);

router.get(
  "/download/:filename",
  VerificarAcceso({ rolesPermitidos: ["admin"] }),
  downloadBackup
);

router.delete(
  "/:filename",
  VerificarAcceso({ rolesPermitidos: ["admin"] }),
  deleteBackup
);

module.exports = router;
