import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute";

// Login se carga síncronamente (primera página que ven los usuarios)
import Login from "./pages/Auth/Login";

// Lazy loading para páginas principales
const Menu = lazy(() => import("./pages/Menu/Menu"));
const Productos = lazy(() => import("./pages/Productos/Productos"));

// Lazy loading para módulo Laboratorio
const Laboratorios = lazy(() => import("./pages/Laboratorio/Laboratorio"));
const LaboratorioDetalles = lazy(() => import("./pages/Laboratorio/LaboratorioDetalles"));

// Lazy loading para módulo Empresa
const EmpresasPage = lazy(() => import("./pages/Empresa/Empresas"));
const EmpresaDetalles = lazy(() => import("./pages/Empresa/EmpresaDetalles"));

// Lazy loading para módulo Proveedores
const Proveedores = lazy(() => import("./pages/Proveedores/Proveedores"));

// Lazy loading para módulo EPS
const EPSPage = lazy(() => import("./pages/EPS/EPS"));

// Lazy loading para módulo Tarifario
const TarifariosPage = lazy(() => import("./pages/Tarifario/Tarifario"));
const TarifariosList = lazy(() => import("./pages/Tarifario/TarifariosList"));

// Lazy loading para módulo Admin (solo para administradores)
const AdminPage = lazy(() => import("./pages/Admin/AdminPage"));
const CrearPage = lazy(() => import("./pages/Admin/CrearPage"));

// Lazy loading para módulo Compare
const Compare = lazy(() => import("./pages/Compare/Compare"));

// Componente de carga mientras se cargan los módulos
const LoadingFallback = () => (
  <div className="min-h-screen bg-sky-900 flex items-center justify-center">
    <div className="text-white text-xl">Cargando...</div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Login />} />

            {/* Rutas protegidas que requieren autenticación */}
            <Route
              path="/Menu"
              element={
                <ProtectedRoute>
                  <Menu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Productos"
              element={
                <ProtectedRoute>
                  <Productos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Laboratorio"
              element={
                <ProtectedRoute>
                  <Laboratorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/laboratorio/:laboratorioId"
              element={
                <ProtectedRoute>
                  <LaboratorioDetalles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Proveedores"
              element={
                <ProtectedRoute>
                  <Proveedores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Empresas"
              element={
                <ProtectedRoute>
                  <EmpresasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/EPS"
              element={
                <ProtectedRoute>
                  <EPSPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tarifario"
              element={
                <ProtectedRoute>
                  <TarifariosList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tarifario/:id_tarifario"
              element={
                <ProtectedRoute>
                  <TarifariosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comparar"
              element={
                <ProtectedRoute>
                  <Compare />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Empresa/:id_empresa"
              element={
                <ProtectedRoute>
                  <EmpresaDetalles />
                </ProtectedRoute>
              }
            />

            {/* Rutas de administrador (solo para rol Administrador) */}
            <Route
              path="/Admin"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/Crear"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <CrearPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>

        {/* Toasts para notificaciones */}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
      </div>
    </Router>
  );
};

export default App;
