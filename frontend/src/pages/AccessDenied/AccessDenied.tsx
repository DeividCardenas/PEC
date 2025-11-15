import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';
import { useAuth } from '../../context/useAuth';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-dark-card border border-dark-border rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-danger-900/30 border-2 border-danger-600 flex items-center justify-center">
              <ShieldAlert className="text-danger-500" size={48} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-dark-text mb-3">
            Acceso Denegado
          </h1>

          {/* Description */}
          <p className="text-dark-text-secondary mb-2">
            No tienes permisos para acceder a esta página.
          </p>

          {user?.rol && (
            <p className="text-sm text-dark-text-muted mb-6">
              Tu rol actual: <span className="text-primary-400 font-semibold">{user.rol}</span>
            </p>
          )}

          {/* Message */}
          <div className="bg-danger-900/20 border border-danger-700 rounded-lg p-4 mb-8">
            <p className="text-sm text-dark-text-secondary">
              Si crees que deberías tener acceso a este módulo, contacta con tu administrador del sistema.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={18} />}
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/Menu')}
              icon={<Home size={18} />}
              className="flex-1"
            >
              Ir al Menú
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-dark-text-muted">
            Sistema PEC - Pharma Elite Care
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
