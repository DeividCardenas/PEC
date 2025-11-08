/**
 * Componente Modal de Prueba de Entrega Digital (RF010)
 */

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  registrarPruebaEntrega,
  fetchPruebaEntrega,
  getFirmaUrl,
  getFotoUrl,
  validarTamanoArchivo,
  validarTipoArchivo,
  base64AFile,
  validarCanvasNoVacio,
  limpiarCanvas,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type PruebaEntrega,
} from "../../services/PruebaEntrega/pruebaEntregaService";

// ============================================================================
// INTERFACES
// ============================================================================

interface PruebaEntregaModalProps {
  show: boolean;
  idEntrega: number;
  numeroPedido: string;
  nombrePaciente: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const PruebaEntregaModal: React.FC<PruebaEntregaModalProps> = ({
  show,
  idEntrega,
  numeroPedido,
  nombrePaciente,
  onClose,
  onSuccess,
}) => {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [identificacionReceptor, setIdentificacionReceptor] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modoFirma, setModoFirma] = useState<"dibujar" | "subir">("dibujar");

  // Canvas para firma
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);

  // ============================================================================
  // EFECTOS
  // ============================================================================
  useEffect(() => {
    if (show && canvasRef.current) {
      inicializarCanvas();
    }
  }, [show]);

  // ============================================================================
  // FUNCIONES DE CANVAS
  // ============================================================================
  const inicializarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const iniciarDibujo = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDibujando(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const dibujar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const finalizarDibujo = () => {
    setDibujando(false);
  };

  const handleLimpiarFirma = () => {
    if (canvasRef.current) {
      limpiarCanvas(canvasRef.current);
    }
  };

  // ============================================================================
  // FUNCIONES DE ARCHIVO
  // ============================================================================
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validarTipoArchivo(file)) {
      toast.error("Tipo de archivo no válido. Solo se permiten imágenes.");
      return;
    }

    if (!validarTamanoArchivo(file)) {
      toast.error("El archivo es muy grande. Máximo 5MB.");
      return;
    }

    setFotoFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEliminarFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!nombreReceptor.trim()) {
      toast.warning("Ingrese el nombre del receptor");
      return;
    }

    if (!identificacionReceptor.trim()) {
      toast.warning("Ingrese la identificación del receptor");
      return;
    }

    // Validar que haya al menos firma o foto
    const canvas = canvasRef.current;
    let firmaFile: File | undefined = undefined;

    if (modoFirma === "dibujar") {
      if (canvas && validarCanvasNoVacio(canvas)) {
        // Convertir canvas a File
        canvas.toBlob((blob) => {
          if (blob) {
            firmaFile = new File([blob], `firma_${idEntrega}.png`, {
              type: "image/png",
            });
          }
        });

        // Esperar a que se genere el blob
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!canvas) {
          firmaFile = undefined;
        } else {
          canvas.toBlob((blob) => {
            if (blob) {
              firmaFile = new File([blob], `firma_${idEntrega}.png`, {
                type: "image/png",
              });
            }
          });
        }
      }
    }

    if (!firmaFile && !fotoFile) {
      toast.warning("Debe proporcionar al menos una firma o una foto de evidencia");
      return;
    }

    setLoading(true);
    try {
      // Preparar datos
      const formData = {
        nombre_receptor: nombreReceptor,
        identificacion_receptor: identificacionReceptor,
        observaciones_entrega: observaciones || undefined,
        firma: firmaFile,
        foto: fotoFile || undefined,
      };

      await registrarPruebaEntrega(idEntrega, formData);
      toast.success("Prueba de entrega registrada exitosamente");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error al registrar prueba de entrega:", error);
      toast.error(error.response?.data?.message || "Error al registrar prueba de entrega");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================
  const handleClose = () => {
    setNombreReceptor("");
    setIdentificacionReceptor("");
    setObservaciones("");
    setFotoFile(null);
    setFotoPreview(null);
    if (canvasRef.current) {
      limpiarCanvas(canvasRef.current);
    }
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Prueba de Entrega Digital</h2>
              <p className="text-green-100 mt-1">
                {numeroPedido} - {nombrePaciente}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Datos del Receptor */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Datos del Receptor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nombreReceptor}
                    onChange={(e) => setNombreReceptor(e.target.value)}
                    required
                    placeholder="Quien recibe la entrega"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identificación *
                  </label>
                  <input
                    type="text"
                    value={identificacionReceptor}
                    onChange={(e) => setIdentificacionReceptor(e.target.value)}
                    required
                    placeholder="Número de identificación"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Firma Digital */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                Firma Digital
              </h3>

              <div className="mb-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModoFirma("dibujar")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      modoFirma === "dibujar"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Dibujar Firma
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoFirma("subir")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      modoFirma === "subir"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Subir Imagen
                  </button>
                </div>
              </div>

              {modoFirma === "dibujar" ? (
                <div>
                  <div className="border-2 border-purple-300 rounded-lg bg-white">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      onMouseDown={iniciarDibujo}
                      onMouseMove={dibujar}
                      onMouseUp={finalizarDibujo}
                      onMouseLeave={finalizarDibujo}
                      className="w-full cursor-crosshair"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLimpiarFirma}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Limpiar Firma
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir Imagen de Firma
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Foto de Evidencia */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">
                Foto de Evidencia
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir Foto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 5MB - Formatos: JPG, PNG, GIF, WEBP
                </p>
              </div>

              {fotoPreview && (
                <div className="mt-4">
                  <div className="relative inline-block">
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="max-w-full h-48 object-contain border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleEliminarFoto}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales sobre la entrega..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Nota Informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">
                    Información Importante
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Debe proporcionar al menos una firma o una foto</li>
                    <li>• La entrega se marcará como "Entregado" automáticamente</li>
                    <li>• Los archivos se almacenan de forma segura</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registrando..." : "Confirmar Entrega"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PruebaEntregaModal;
