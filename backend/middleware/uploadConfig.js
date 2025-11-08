/**
 * Configuración de Multer para Upload de Archivos
 * RF010 - Prueba de Entrega Digital
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, "../uploads/entregas");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: tipo_idEntrega_timestamp.ext
    const idEntrega = req.params.id;
    const tipo = file.fieldname; // 'firma' o 'foto'
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${tipo}_${idEntrega}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)"
      ),
      false
    );
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB por archivo
  },
});

// Middleware para manejar múltiples archivos de prueba de entrega
const uploadPruebaEntrega = upload.fields([
  { name: "firma", maxCount: 1 },
  { name: "foto", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadPruebaEntrega,
};
