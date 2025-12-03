/**
 * Página de Respaldo de Datos
 * Permite crear backups y restaurar la base de datos del sistema
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Database,
  ArrowLeft,
  Download,
  Upload,
  AlertTriangle,
  Shield,
  HardDrive,
  Clock,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";

interface BackupRecord {
  id: number;
  fecha: string;
  tamaño: string;
  tipo: string;
}

const RespaldoManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Historial de respaldos (esto vendría de la API en producción)
  const [backupHistory] = useState<BackupRecord[]>([
    {
      id: 1,
      fecha: new Date().toISOString(),
      tamaño: "2.3 MB",
      tipo: "Manual",
    },
  ]);

  // Crear backup de la base de datos
  const handleCreateBackup = async () => {
    if (
      !window.confirm(
        "¿Está seguro de crear un respaldo de la base de datos? Este proceso puede tardar varios minutos."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/pec";

      const response = await fetch(`${baseURL}/admin/backup/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || "Error al crear el respaldo");
      }

      // Descargar el archivo de backup
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().split("T")[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Respaldo creado y descargado correctamente");
    } catch (error) {
      console.error("Error al crear respaldo:", error);
      toast.error("Error al crear el respaldo de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  // Restaurar base de datos desde archivo
  const handleRestoreBackup = async () => {
    if (!uploadedFile) {
      toast.error("Por favor seleccione un archivo de respaldo");
      return;
    }

    if (
      !window.confirm(
        "⚠️ ADVERTENCIA: Esta acción sobrescribirá TODOS los datos actuales de la base de datos. ¿Está absolutamente seguro de continuar?"
      )
    ) {
      return;
    }

    // Doble confirmación para operación crítica
    const confirmText = window.prompt(
      'Para confirmar, escriba "RESTAURAR" (en mayúsculas):'
    );

    if (confirmText !== "RESTAURAR") {
      toast.warning("Operación cancelada");
      return;
    }

    try {
      setLoading(true);
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/pec";

      const formData = new FormData();
      formData.append("backup", uploadedFile);

      const response = await fetch(`${baseURL}/admin/backup/restore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || "Error al restaurar el respaldo");
      }

      toast.success(
        "Base de datos restaurada correctamente. Se recomienda reiniciar la sesión."
      );
      setUploadedFile(null);

      // Opcional: redirigir al login después de restaurar
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Error al restaurar respaldo:", error);
      toast.error("Error al restaurar la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".sql") || file.name.endsWith(".backup")) {
        setUploadedFile(file);
        toast.info(`Archivo seleccionado: ${file.name}`);
      } else {
        toast.error("Por favor seleccione un archivo .sql o .backup válido");
        e.target.value = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/Admin")}
                icon={<ArrowLeft size={20} />}
              >
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-dark-text">
                  Respaldo de Datos
                </h1>
                <p className="text-dark-text-secondary mt-1">
                  Backup y restauración de la base de datos del sistema
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-danger-600 to-danger-700 rounded-2xl flex items-center justify-center shadow-glow-danger">
              <Database className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Warning Alert */}
        <div className="mb-8 bg-danger-900/30 border border-danger-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="text-danger-400 flex-shrink-0 mt-0.5"
              size={24}
            />
            <div>
              <h3 className="text-danger-300 font-semibold mb-2">
                Operación Crítica del Sistema
              </h3>
              <p className="text-danger-200 text-sm mb-2">
                Las operaciones de respaldo y restauración afectan directamente
                la integridad de los datos del sistema.
              </p>
              <ul className="text-danger-200 text-sm list-disc list-inside space-y-1">
                <li>
                  El respaldo creará una copia completa de la base de datos
                  actual
                </li>
                <li>
                  La restauración sobrescribirá TODOS los datos existentes
                </li>
                <li>
                  Solo usuarios administradores pueden realizar estas acciones
                </li>
                <li>Se recomienda hacer respaldos de forma regular</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Crear Respaldo */}
          <Card className="border-primary-700">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-900/40 border border-primary-700 rounded-xl flex items-center justify-center">
                  <Download className="text-primary-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-dark-text">
                    Crear Respaldo
                  </h2>
                  <p className="text-sm text-dark-text-secondary">
                    Descargar backup de la BD
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-dark-text-secondary mb-4">
                  Genera un archivo SQL con todos los datos actuales de la base
                  de datos. Este archivo se descargará automáticamente en su
                  equipo.
                </p>

                <div className="bg-primary-900/20 border border-primary-700 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Shield className="text-primary-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-primary-200">
                      <strong>Incluye:</strong> Usuarios, Empresas,
                      Laboratorios, EPS, Proveedores, Productos, Órdenes de
                      Compra y todas las configuraciones del sistema.
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleCreateBackup}
                icon={<Download size={18} />}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Creando respaldo..." : "Descargar Respaldo"}
              </Button>
            </div>
          </Card>

          {/* Restaurar Respaldo */}
          <Card className="border-danger-700">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-danger-900/40 border border-danger-700 rounded-xl flex items-center justify-center">
                  <Upload className="text-danger-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-dark-text">
                    Restaurar Respaldo
                  </h2>
                  <p className="text-sm text-dark-text-secondary">
                    Recuperar BD desde archivo
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-dark-text-secondary mb-4">
                  Carga un archivo de respaldo previamente creado para
                  restaurar la base de datos a un estado anterior.
                </p>

                <div className="bg-danger-900/20 border border-danger-700 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-danger-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-danger-200">
                      <strong>Advertencia:</strong> Esta acción eliminará todos
                      los datos actuales y los reemplazará con los datos del
                      archivo de respaldo. Esta operación NO se puede deshacer.
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Seleccionar archivo de respaldo (.sql)
                  </label>
                  <input
                    type="file"
                    accept=".sql,.backup"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-danger-900/40 file:text-danger-300 hover:file:bg-danger-900/60 file:cursor-pointer cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger-600"
                  />
                  {uploadedFile && (
                    <p className="text-xs text-success-400 mt-2">
                      ✓ {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="danger"
                onClick={handleRestoreBackup}
                icon={<Upload size={18} />}
                disabled={loading || !uploadedFile}
                className="w-full"
              >
                {loading ? "Restaurando..." : "Restaurar Base de Datos"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Backup History */}
        <Card className="border-secondary-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-secondary-900/40 border border-secondary-700 rounded-xl flex items-center justify-center">
              <Clock className="text-secondary-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-text">
                Historial de Respaldos
              </h2>
              <p className="text-sm text-dark-text-secondary">
                Últimas operaciones de backup realizadas
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-text-secondary uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {backupHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-dark-text-secondary"
                    >
                      No hay respaldos registrados aún
                    </td>
                  </tr>
                ) : (
                  backupHistory.map((backup) => (
                    <tr key={backup.id} className="hover:bg-dark-bg/50">
                      <td className="px-6 py-4 text-dark-text">
                        {new Date(backup.fecha).toLocaleString("es-CO")}
                      </td>
                      <td className="px-6 py-4 text-dark-text">
                        {backup.tamaño}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-secondary-900/40 text-secondary-300">
                          {backup.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-success-900/40 text-success-300">
                          Completado
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary-900/20 border-primary-700">
            <div className="flex items-center gap-3">
              <HardDrive className="text-primary-400" size={32} />
              <div>
                <div className="text-2xl font-bold text-primary-400">--</div>
                <div className="text-sm text-dark-text-secondary">
                  Tamaño BD Actual
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-secondary-900/20 border-secondary-700">
            <div className="flex items-center gap-3">
              <Database className="text-secondary-400" size={32} />
              <div>
                <div className="text-2xl font-bold text-secondary-400">
                  {backupHistory.length}
                </div>
                <div className="text-sm text-dark-text-secondary">
                  Respaldos Totales
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-success-900/20 border-success-700">
            <div className="flex items-center gap-3">
              <Clock className="text-success-400" size={32} />
              <div>
                <div className="text-2xl font-bold text-success-400">
                  {backupHistory.length > 0
                    ? new Date(backupHistory[0].fecha).toLocaleDateString(
                        "es-CO"
                      )
                    : "--"}
                </div>
                <div className="text-sm text-dark-text-secondary">
                  Último Respaldo
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Best Practices */}
        <div className="mt-8">
          <Card className="bg-warning-900/20 border-warning-700">
            <div className="flex items-start gap-3">
              <Shield className="text-warning-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-warning-300 font-semibold mb-2">
                  Mejores Prácticas de Respaldo
                </h3>
                <ul className="text-warning-200 text-sm space-y-1 list-disc list-inside">
                  <li>Realice respaldos de forma regular (diaria o semanal)</li>
                  <li>
                    Almacene los archivos de respaldo en ubicaciones seguras y
                    múltiples
                  </li>
                  <li>
                    Verifique la integridad de los respaldos antes de depender
                    de ellos
                  </li>
                  <li>
                    Mantenga al menos 3 copias de respaldo en diferentes
                    ubicaciones
                  </li>
                  <li>
                    Documente el proceso de restauración y pruébelo
                    periódicamente
                  </li>
                  <li>
                    Notifique a todos los usuarios antes de realizar una
                    restauración
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RespaldoManagement;
