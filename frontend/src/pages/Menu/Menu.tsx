import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  LogOut,
  Factory,
  Briefcase,
  Settings,
  Truck,
  FlaskConical,
  FileText,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  MapPin,
  Hospital,
  Activity,
  BarChart3
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { hasPermission } from "../../config/roles";

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, setUser, user } = useAuth();

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    setToken(null);
    setUser({ id: null, email: null, rol: null, permisos: [] });
    localStorage.removeItem("token");
    navigate("/");
  };

  const allMenuSections = [
    {
      title: "Módulo de Compras",
      icon: ShoppingCart,
      color: "primary",
      items: [
        { name: "Proveedores", route: "/Proveedores", icon: Truck, description: "Gestión de proveedores" },
        { name: "Órdenes de Compra", route: "/Ordenes", icon: FileText, description: "Gestionar órdenes" },
        { name: "Inventario", route: "/Inventario", icon: Package, description: "Control de stock" },
        { name: "Reportes", route: "/Reportes", icon: BarChart3, description: "Reportes de compras" },
      ]
    },
    {
      title: "Módulo de Entregas",
      icon: Truck,
      color: "secondary",
      items: [
        { name: "Pacientes", route: "/Pacientes", icon: Users, description: "Gestión de pacientes" },
        { name: "Entregas", route: "/Entregas", icon: Package, description: "Gestionar entregas" },
        { name: "Rutas", route: "/Rutas", icon: MapPin, description: "Optimización de rutas" },
        { name: "Seguimiento", route: "/Seguimiento", icon: Activity, description: "Seguimiento en tiempo real" },
      ]
    },
    {
      title: "Configuración General",
      icon: Settings,
      color: "accent",
      items: [
        { name: "Productos", route: "/Productos", icon: ShoppingBag, description: "Catálogo de productos" },
        { name: "Empresas", route: "/Empresas", icon: Factory, description: "Gestión de empresas" },
        { name: "Laboratorios", route: "/Laboratorio", icon: FlaskConical, description: "Administrar laboratorios" },
        { name: "EPS", route: "/EPS", icon: Briefcase, description: "Entidades de salud" },
        { name: "Tarifario", route: "/Tarifario", icon: TrendingUp, description: "Gestión de tarifas" },
        { name: "Comparar Precios", route: "/comparar", icon: BarChart3, description: "Comparación de precios" },
      ]
    },
  ];

  // Filtrar las secciones y items basándose en los permisos del usuario
  const menuSections = allMenuSections.map(section => ({
    ...section,
    items: section.items.filter(item => hasPermission(user?.rol || null, item.route))
  })).filter(section => section.items.length > 0); // Solo mostrar secciones que tengan items

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow-primary">
                <Hospital className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-dark-text">Panel de Control</h1>
                <p className="text-dark-text-secondary mt-1">Bienvenido, {user?.email || 'Usuario'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.rol === "Administrador" && (
                <Button
                  variant="outline"
                  onClick={() => handleNavigation("/Admin")}
                  icon={<Settings size={18} />}
                >
                  Administración
                </Button>
              )}
              <Button
                variant="danger"
                onClick={handleLogout}
                icon={<LogOut size={18} />}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-10">
          {menuSections.map((section, idx) => (
            <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-primary-900/30 border border-primary-700 flex items-center justify-center`}>
                  <section.icon className="text-primary-400" size={22} />
                </div>
                <h2 className="text-2xl font-bold text-dark-text">{section.title}</h2>
              </div>

              {/* Section Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.items.map((item) => (
                  <Card
                    key={item.route}
                    hoverable
                    onClick={() => handleNavigation(item.route)}
                    className="group cursor-pointer border border-dark-border hover:border-primary-600 transition-colors"
                    padding="lg"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary-900/40 border border-primary-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-glow-primary transition-all duration-200">
                        <item.icon className="text-primary-400 group-hover:text-primary-300" size={28} />
                      </div>
                      <h3 className="text-lg font-semibold text-dark-text mb-1">{item.name}</h3>
                      <p className="text-sm text-dark-text-secondary">{item.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-dark-text-muted">
            Sistema PEC - Pharma Elite Care | Versión 1.0 | {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
