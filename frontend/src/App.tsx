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
const AccessDenied = lazy(() => import("./pages/AccessDenied/AccessDenied"));

// Lazy loading para módulo Laboratorio
const Laboratorios = lazy(() => import("./pages/Laboratorio/Laboratorio"));
const LaboratorioDetalles = lazy(() => import("./pages/Laboratorio/LaboratorioDetalles"));

// Lazy loading para módulo Empresa
const EmpresasPage = lazy(() => import("./pages/Empresa/Empresas"));
const EmpresaDetalles = lazy(() => import("./pages/Empresa/EmpresaDetalles"));

// Lazy loading para módulo Proveedores
const Proveedores = lazy(() => import("./pages/Proveedores/Proveedores"));

// Lazy loading para módulo Órdenes de Compra
const OrdenesCompra = lazy(() => import("./pages/Ordenes/OrdenesCompra"));

// Lazy loading para módulo EPS
const EPSPage = lazy(() => import("./pages/EPS/EPS"));

// Lazy loading para módulo Tarifario
const TarifariosPage = lazy(() => import("./pages/Tarifario/Tarifario"));
const TarifariosList = lazy(() => import("./pages/Tarifario/TarifariosList"));

// Lazy loading para módulo Admin (solo para administradores)
const AdminPage = lazy(() => import("./pages/Admin/AdminPage"));
const UsuariosPage = lazy(() => import("./pages/Admin/UsuariosPage"));
const EPSManagement = lazy(() => import("./pages/Admin/EPSManagement"));
const EmpresasManagement = lazy(() => import("./pages/Admin/EmpresasManagement"));
const LaboratoriosManagement = lazy(() => import("./pages/Admin/LaboratoriosManagement"));
const ProveedoresManagement = lazy(() => import("./pages/Admin/ProveedoresManagement"));
const ProductosManagement = lazy(() => import("./pages/Admin/ProductosManagement"));
const RolesManagement = lazy(() => import("./pages/Admin/RolesManagement"));
const RespaldoManagement = lazy(() => import("./pages/Admin/RespaldoManagement"));

// Lazy loading para módulo Compare
const Compare = lazy(() => import("./pages/Compare/Compare"));

// Lazy loading para módulos adicionales
const ControlInventario = lazy(() => import("./pages/Inventario/ControlInventario"));
const ReportesCompras = lazy(() => import("./pages/Reportes/ReportesCompras"));
const Pacientes = lazy(() => import("./pages/Pacientes/Pacientes"));
const Entregas = lazy(() => import("./pages/Entregas/Entregas"));
const Rutas = lazy(() => import("./pages/Rutas/Rutas"));
const Seguimiento = lazy(() => import("./pages/Seguimiento/Seguimiento"));

// Componente de carga mientras se cargan los módulos
const LoadingFallback = () => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <div className="text-dark-text text-xl">Cargando...</div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Rutas protegidas que requieren autenticación */}
            <Route
              path="/Menu"
              element={
                <ProtectedRoute requirePermission={false}>
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
              path="/Ordenes"
              element={
                <ProtectedRoute>
                  <OrdenesCompra />
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
            <Route
              path="/Inventario"
              element={
                <ProtectedRoute>
                  <ControlInventario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Reportes"
              element={
                <ProtectedRoute>
                  <ReportesCompras />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Pacientes"
              element={
                <ProtectedRoute>
                  <Pacientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Entregas"
              element={
                <ProtectedRoute>
                  <Entregas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Rutas"
              element={
                <ProtectedRoute>
                  <Rutas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Seguimiento"
              element={
                <ProtectedRoute>
                  <Seguimiento />
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
              path="/Admin/Usuarios"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/EPS"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <EPSManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/Empresas"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <EmpresasManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/Laboratorios"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <LaboratoriosManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/Proveedores"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <ProveedoresManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/Productos"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <ProductosManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/Roles"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <RolesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Admin/Respaldo"
              element={
                <ProtectedRoute allowedRoles={["Administrador"]} redirectTo="/Menu">
                  <RespaldoManagement />
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
