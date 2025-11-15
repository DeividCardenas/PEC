/**
 * Página de Administración del Sistema
 * Solo accesible por usuarios con rol "Administrador"
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  FlaskConical,
  Heart,
  ArrowLeft,
  Shield,
  Database,
  Truck,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useAuth } from "../../context/useAuth";

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const adminModules = [
    {
      title: "Gestión de Usuarios",
      description: "Administrar usuarios y permisos del sistema",
      icon: Users,
      route: "/Admin/Usuarios",
      color: "primary",
      available: true,
    },
    {
      title: "Gestión de Roles",
      description: "Configurar roles y permisos",
      icon: Shield,
      route: "/Admin/Roles",
      color: "secondary",
      available: true,
    },
    {
      title: "Empresas",
      description: "Administrar empresas del sistema",
      icon: Building2,
      route: "/Admin/Empresas",
      color: "accent",
      available: true,
    },
    {
      title: "Laboratorios",
      description: "Gestionar laboratorios farmacéuticos",
      icon: FlaskConical,
      route: "/Admin/Laboratorios",
      color: "primary",
      available: true,
    },
    {
      title: "EPS",
      description: "Administrar entidades de salud",
      icon: Heart,
      route: "/Admin/EPS",
      color: "secondary",
      available: true,
    },
    {
      title: "Proveedores",
      description: "Gestionar proveedores del sistema",
      icon: Truck,
      route: "/Admin/Proveedores",
      color: "secondary",
      available: true,
    },
    {
      title: "Respaldo de Datos",
      description: "Backup y restauración de base de datos",
      icon: Database,
      route: "/Admin/Respaldo",
      color: "danger",
      available: true,
    },
  ];

  const handleNavigation = (route: string, available: boolean) => {
    if (available) {
      navigate(route);
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
                onClick={() => navigate("/Menu")}
                icon={<ArrowLeft size={20} />}
              >
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-dark-text">Panel de Administración</h1>
                <p className="text-dark-text-secondary mt-1">
                  Gestión avanzada del sistema - {user?.email}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-danger-600 to-danger-700 rounded-2xl flex items-center justify-center shadow-glow-danger">
              <Shield className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Alert */}
        <div className="mb-8 bg-danger-900/30 border border-danger-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="text-danger-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-danger-300 font-semibold mb-1">Zona de Administración</h3>
              <p className="text-danger-200 text-sm">
                Esta sección contiene herramientas administrativas sensibles. Los cambios realizados aquí
                afectarán a todo el sistema. Proceda con precaución.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {adminModules.map((module, index) => {
            const IconComponent = module.icon;
            const isAvailable = module.available;

            return (
              <Card
                key={index}
                hoverable={isAvailable}
                onClick={() => handleNavigation(module.route, isAvailable)}
                className={`group ${
                  isAvailable
                    ? "cursor-pointer border border-dark-border hover:border-primary-600 transition-colors"
                    : "cursor-not-allowed opacity-60 border border-dark-border"
                }`}
                padding="lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-14 h-14 rounded-2xl ${
                      isAvailable ? "bg-primary-900/40" : "bg-gray-800"
                    } border border-primary-700 flex items-center justify-center mb-4 ${
                      isAvailable
                        ? "group-hover:scale-110 group-hover:shadow-glow-primary"
                        : ""
                    } transition-all duration-200`}
                  >
                    <IconComponent
                      className={`${
                        isAvailable
                          ? "text-primary-400 group-hover:text-primary-300"
                          : "text-gray-600"
                      }`}
                      size={28}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-text mb-1">{module.title}</h3>
                  <p className="text-sm text-dark-text-secondary mb-2">{module.description}</p>
                  {!isAvailable && (
                    <span className="text-xs text-warning-400 bg-warning-900/30 px-2 py-1 rounded-full mt-2">
                      Próximamente
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-dark-text mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/Admin/Usuarios")}
              icon={<Users size={18} />}
              className="justify-start h-auto py-4"
            >
              <div className="text-left">
                <div className="font-semibold">Gestionar Usuarios</div>
                <div className="text-sm text-dark-text-secondary">
                  Ver y administrar usuarios
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/Admin/Empresas")}
              icon={<Building2 size={18} />}
              className="justify-start h-auto py-4"
            >
              <div className="text-left">
                <div className="font-semibold">Gestionar Empresas</div>
                <div className="text-sm text-dark-text-secondary">
                  Ver y editar empresas
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/Admin/Laboratorios")}
              icon={<FlaskConical size={18} />}
              className="justify-start h-auto py-4"
            >
              <div className="text-left">
                <div className="font-semibold">Gestionar Laboratorios</div>
                <div className="text-sm text-dark-text-secondary">
                  Ver y editar laboratorios
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/Admin/Proveedores")}
              icon={<Truck size={18} />}
              className="justify-start h-auto py-4"
            >
              <div className="text-left">
                <div className="font-semibold">Gestionar Proveedores</div>
                <div className="text-sm text-dark-text-secondary">
                  Ver y editar proveedores
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-dark-text mb-4">Estadísticas del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary-900/20 border-primary-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-400">--</div>
                <div className="text-sm text-dark-text-secondary mt-1">Usuarios Activos</div>
              </div>
            </Card>
            <Card className="bg-secondary-900/20 border-secondary-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-400">--</div>
                <div className="text-sm text-dark-text-secondary mt-1">Empresas</div>
              </div>
            </Card>
            <Card className="bg-accent-900/20 border-accent-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-400">--</div>
                <div className="text-sm text-dark-text-secondary mt-1">Laboratorios</div>
              </div>
            </Card>
            <Card className="bg-success-900/20 border-success-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-success-400">--</div>
                <div className="text-sm text-dark-text-secondary mt-1">EPS Registradas</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-dark-text-muted">
            Sistema PEC - Pharma Elite Care | Panel de Administración | {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
