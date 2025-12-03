/**
 * Controlador de Respaldo de Base de Datos
 * Permite crear y restaurar backups de la base de datos
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const prisma = require("../../config/database");

const execAsync = promisify(exec);

/**
 * Crear backup de la base de datos usando Prisma (método alternativo)
 * Este método funciona sin necesidad de mysqldump
 */
const createBackupWithPrisma = async (filepath) => {
  const stream = fs.createWriteStream(filepath);
  
  stream.write(`-- Backup de Base de Datos PEC\n`);
  stream.write(`-- Fecha: ${new Date().toISOString()}\n`);
  stream.write(`-- Generado por Sistema PEC\n\n`);
  stream.write(`SET FOREIGN_KEY_CHECKS=0;\n\n`);

  try {
    // Obtener todas las tablas
    const tables = [
      'usuarios', 'roles', 'permisos', 'permisos_roles',
      'productos', 'laboratorios', 'empresas', 'eps',
      'tarifarios', 'tarifarios_productos', 'permisos_tarifarios',
      'empresas_laboratorios', 'proveedores', 'ordenes_compra',
      'detalles_orden_compra', 'movimientos_inventario',
      'pacientes', 'entregas', 'detalles_entrega',
      'domiciliarios', 'rutas', 'entregas_rutas'
    ];

    for (const tableName of tables) {
      try {
        // Obtener datos de la tabla
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}`);
        
        if (data && data.length > 0) {
          stream.write(`-- Tabla: ${tableName}\n`);
          stream.write(`TRUNCATE TABLE \`${tableName}\`;\n`);
          
          // Insertar datos
          for (const row of data) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? '1' : '0';
              if (Buffer.isBuffer(val)) return `'${val.toString('hex')}'`;
              return val;
            });
            
            stream.write(`INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`);
          }
          stream.write('\n');
        }
      } catch (err) {
        console.log(`Tabla ${tableName} no existe o error al exportar:`, err.message);
      }
    }

    stream.write(`SET FOREIGN_KEY_CHECKS=1;\n`);
    stream.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  } catch (error) {
    stream.end();
    throw error;
  }
};

/**
 * Crear backup de la base de datos
 * POST /admin/backup/create
 */
const createBackup = async (req, res) => {
  try {
    // Obtener configuración de la base de datos desde .env
    const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_LOCAL;
    
    if (!dbUrl) {
      return res.status(500).json({
        msg: "No se encontró la configuración de la base de datos",
      });
    }

    // Crear directorio de backups si no existe
    const backupsDir = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Nombre del archivo de backup con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const database = dbUrl.match(/\/([^/?]+)(?:\?|$)/)?.[1] || 'PEC';
    const filename = `backup_${database}_${timestamp}.sql`;
    const filepath = path.join(backupsDir, filename);

    console.log("Creando backup de la base de datos...");

    // Intentar primero con mysqldump
    try {
      // Parsear la URL de conexión
      const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = dbUrl.match(urlPattern);

      if (match) {
        const [, user, password, host, port, database] = match;
        const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database}`;
        
        const { stdout, stderr } = await execAsync(command);

        if (stderr && !stderr.includes("Warning")) {
          throw new Error("mysqldump error");
        }

        fs.writeFileSync(filepath, stdout);
        console.log("Backup creado con mysqldump");
      } else {
        throw new Error("URL format invalid");
      }
    } catch (mysqldumpError) {
      // Si mysqldump falla, usar método alternativo con Prisma
      console.log("mysqldump no disponible, usando método alternativo...");
      await createBackupWithPrisma(filepath);
      console.log("Backup creado con método alternativo");
    }

    // Obtener información del archivo
    const stats = fs.statSync(filepath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

    console.log(`Backup creado exitosamente: ${filename} (${fileSizeInMB} MB)`);

    // Enviar el archivo como descarga
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error("Error al enviar el archivo:", err);
        return res.status(500).json({
          msg: "Error al descargar el respaldo",
        });
      }
    });
  } catch (error) {
    console.error("Error al crear backup:", error);
    
    return res.status(500).json({
      msg: "Error al crear el respaldo de la base de datos",
      error: error.message,
    });
  }
};

/**
 * Restaurar base de datos desde backup
 * POST /admin/backup/restore
 */
const restoreBackup = async (req, res) => {
  try {
    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({
        msg: "No se ha proporcionado un archivo de respaldo",
      });
    }

    const backupFile = req.file.path;

    // Obtener configuración de la base de datos
    const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_LOCAL;
    
    if (!dbUrl) {
      return res.status(500).json({
        msg: "No se encontró la configuración de la base de datos",
      });
    }

    // Parsear la URL de conexión
    const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = dbUrl.match(urlPattern);

    if (!match) {
      return res.status(500).json({
        msg: "Formato de URL de base de datos inválido",
      });
    }

    const [, user, password, host, port, database] = match;

    // Comando mysql para restaurar
    const command = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < "${backupFile}"`;

    console.log("Restaurando base de datos desde backup...");

    // Ejecutar el comando de restauración
    await execAsync(command);

    console.log("Base de datos restaurada exitosamente");

    // Eliminar el archivo temporal
    fs.unlinkSync(backupFile);

    return res.status(200).json({
      msg: "Base de datos restaurada exitosamente",
    });
  } catch (error) {
    console.error("Error al restaurar backup:", error);

    // Eliminar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      msg: "Error al restaurar la base de datos",
      error: error.message,
    });
  }
};

/**
 * Listar backups disponibles
 * GET /admin/backup/list
 */
const listBackups = async (req, res) => {
  try {
    const backupsDir = path.join(__dirname, "../../backups");

    // Crear directorio si no existe
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      return res.status(200).json({
        backups: [],
      });
    }

    // Leer archivos del directorio
    const files = fs.readdirSync(backupsDir);

    // Filtrar solo archivos .sql
    const backupFiles = files
      .filter((file) => file.endsWith(".sql"))
      .map((file) => {
        const filepath = path.join(backupsDir, file);
        const stats = fs.statSync(filepath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        return {
          nombre: file,
          fecha: stats.mtime,
          tamaño: `${fileSizeInMB} MB`,
          ruta: filepath,
        };
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más recientes primero

    return res.status(200).json({
      backups: backupFiles,
    });
  } catch (error) {
    console.error("Error al listar backups:", error);
    return res.status(500).json({
      msg: "Error al listar los respaldos",
      error: error.message,
    });
  }
};

/**
 * Descargar un backup específico
 * GET /admin/backup/download/:filename
 */
const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const backupsDir = path.join(__dirname, "../../backups");
    const filepath = path.join(backupsDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        msg: "Archivo de respaldo no encontrado",
      });
    }

    // Verificar que es un archivo .sql
    if (!filename.endsWith(".sql")) {
      return res.status(400).json({
        msg: "Archivo inválido",
      });
    }

    // Enviar el archivo
    res.download(filepath, filename);
  } catch (error) {
    console.error("Error al descargar backup:", error);
    return res.status(500).json({
      msg: "Error al descargar el respaldo",
      error: error.message,
    });
  }
};

/**
 * Eliminar un backup específico
 * DELETE /admin/backup/:filename
 */
const deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const backupsDir = path.join(__dirname, "../../backups");
    const filepath = path.join(backupsDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        msg: "Archivo de respaldo no encontrado",
      });
    }

    // Verificar que es un archivo .sql
    if (!filename.endsWith(".sql")) {
      return res.status(400).json({
        msg: "Archivo inválido",
      });
    }

    // Eliminar el archivo
    fs.unlinkSync(filepath);

    return res.status(200).json({
      msg: "Respaldo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar backup:", error);
    return res.status(500).json({
      msg: "Error al eliminar el respaldo",
      error: error.message,
    });
  }
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
};
