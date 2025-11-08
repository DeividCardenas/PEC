import React from "react";
import { LayoutDashboard, Shield, FlaskConical, Building2, Settings } from "lucide-react";

const Sidebar: React.FC = () => {
  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/eps", label: "EPS", icon: Shield },
    { href: "/Laboratorio", label: "Laboratorios", icon: FlaskConical },
    { href: "/empresas", label: "Empresas", icon: Building2 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Panel de Admin
            </h1>
            <p className="text-xs text-gray-600">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-50 group text-gray-700"
              >
                <item.icon
                  size={20}
                  className="text-gray-500 group-hover:text-primary-600 transition-colors duration-200"
                />
                <span className="font-medium group-hover:text-gray-900 transition-colors duration-200">
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2024 Pharma Elite Care
        </div>
      </div>
    </div>
  );
};

export default Sidebar;