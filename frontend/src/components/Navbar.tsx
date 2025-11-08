import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Factory, Briefcase, LogOut } from "lucide-react";
import { useAuth } from "../context/useAuth";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    setToken(null);
    setUser({ id: null, email: null, rol: null, permisos: [] });
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex gap-6">
          <button
            onClick={() => handleNavigation("/Productos")}
            className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ShoppingBag size={20} />
            Productos
          </button>
          <button
            onClick={() => handleNavigation("/Empresas")}
            className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
          >
            <Factory size={20} />
            Empresas
          </button>
          <button
            onClick={() => handleNavigation("/EPS")}
            className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
          >
            <Briefcase size={20} />
            EPS
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 text-white transition-colors"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
