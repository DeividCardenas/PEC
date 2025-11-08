/**
 * Componentes Modales para Gestión de Domiciliarios
 */

import React from "react";
import {
  type Domiciliario,
  type CrearDomiciliarioData,
  TIPOS_VEHICULO,
} from "../../services/Domiciliarios/domiciliariosService";

// ============================================================================
// CREATE/EDIT MODAL
// ============================================================================

interface FormModalProps {
  show: boolean;
  isEdit: boolean;
  formData: CrearDomiciliarioData;
  setFormData: React.Dispatch<React.SetStateAction<CrearDomiciliarioData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const FormModal: React.FC<FormModalProps> = ({
  show,
  isEdit,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{isEdit ? "Editar Domiciliario" : "Nuevo Domiciliario"}</h2>
          <p className="text-cyan-100 mt-1">
            {isEdit ? "Actualizar información del domiciliario" : "Registrar nuevo repartidor"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {/* Información Personal */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-user text-blue-600"></i>
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Identificación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numero_identificacion}
                  onChange={(e) => setFormData({ ...formData, numero_identificacion: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-phone text-green-600"></i>
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Información de Vehículo */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-motorcycle text-purple-600"></i>
              Información de Vehículo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vehículo</label>
                <select
                  value={formData.tipo_vehiculo}
                  onChange={(e) => setFormData({ ...formData, tipo_vehiculo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Seleccione tipo de vehículo</option>
                  {TIPOS_VEHICULO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Placa del Vehículo</label>
                <input
                  type="text"
                  value={formData.placa_vehiculo}
                  onChange={(e) => setFormData({ ...formData, placa_vehiculo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-comment text-gray-600"></i>
              Observaciones
            </h3>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              placeholder="Observaciones adicionales sobre el domiciliario..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg"
            >
              <i className="fas fa-save mr-2"></i>
              {isEdit ? "Actualizar" : "Crear"} Domiciliario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// DETAILS MODAL
// ============================================================================

interface DetailsModalProps {
  show: boolean;
  domiciliario: Domiciliario | null;
  onClose: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ show, domiciliario, onClose }) => {
  if (!show || !domiciliario) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">Detalles del Domiciliario</h2>
          <p className="text-blue-100 mt-1">
            {domiciliario.nombres} {domiciliario.apellidos}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombres Completos</p>
                <p className="font-medium">
                  {domiciliario.nombres} {domiciliario.apellidos}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Número de Identificación</p>
                <p className="font-medium">{domiciliario.numero_identificacion}</p>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{domiciliario.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{domiciliario.email || "No especificado"}</p>
              </div>
            </div>
          </div>

          {/* Información de Vehículo */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Vehículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tipo de Vehículo</p>
                <p className="font-medium">{domiciliario.tipo_vehiculo || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Placa del Vehículo</p>
                <p className="font-medium">{domiciliario.placa_vehiculo || "No especificada"}</p>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    domiciliario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {domiciliario.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              {domiciliario.activo && (
                <div>
                  <p className="text-sm text-gray-600">Disponibilidad</p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                      domiciliario.disponible ? "bg-cyan-100 text-cyan-800" : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {domiciliario.disponible ? "Disponible" : "Ocupado"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          {domiciliario.observaciones && (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Observaciones</h3>
              <p className="font-medium whitespace-pre-wrap">{domiciliario.observaciones}</p>
            </div>
          )}

          {/* Estadísticas de Rutas */}
          {domiciliario._count && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas</h3>
              <div>
                <p className="text-sm text-gray-600">Total de Rutas Asignadas</p>
                <p className="text-2xl font-bold text-indigo-600">{domiciliario._count.rutas}</p>
              </div>
            </div>
          )}
        </div>

        {/* Botón Cerrar */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DELETE MODAL
// ============================================================================

interface DeleteModalProps {
  show: boolean;
  domiciliario: Domiciliario | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ show, domiciliario, onClose, onConfirm }) => {
  if (!show || !domiciliario) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">Desactivar Domiciliario</h2>
        </div>

        <div className="p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-yellow-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  El domiciliario será desactivado (soft delete). No se puede desactivar si tiene rutas activas.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-4">
            ¿Está seguro que desea desactivar al domiciliario{" "}
            <span className="font-semibold">
              {domiciliario.nombres} {domiciliario.apellidos}
            </span>
            ?
          </p>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg font-semibold"
            >
              Desactivar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
