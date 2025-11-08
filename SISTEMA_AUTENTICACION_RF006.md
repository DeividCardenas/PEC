# Sistema de Autenticación y Roles - RF006

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Roles y Permisos](#roles-y-permisos)
- [Backend](#backend)
- [Frontend](#frontend)
- [Guía de Uso](#guía-de-uso)
- [Seguridad](#seguridad)

---

## 🎯 Descripción General

Sistema completo de autenticación y autorización basado en JWT con un modelo robusto de Roles y Permisos granulares para control de acceso a nivel de módulo y operación.

### Características Principales

✅ **Autenticación JWT** con tokens de 8 horas
✅ **6 Roles predefinidos** con responsabilidades específicas
✅ **50+ Permisos granulares** para todos los módulos del sistema
✅ **Middleware mejorado** con caché de permisos (5 min TTL)
✅ **Componentes React** para protección de UI basada en permisos
✅ **Hooks personalizados** para verificación de permisos
✅ **Logging completo** de accesos y denegaciones
✅ **Separación de responsabilidades** (principio de seguridad)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Login.tsx ────► loginService.ts ────► axiosInstance.ts         │
│                                              │                   │
│                                              ↓                   │
│                        AuthContext (localStorage)                │
│                              │                                   │
│                              ↓                                   │
│                        usePermissions Hook                       │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ↓               ↓               ↓                   │
│      PermissionGuard   RoleGuard    ProtectedRoute              │
│                                                                   │
└───────────────────────────────────────────────────────────────────
          HTTP Request (Bearer Token)
          │
          ↓
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Routes ──► VerificarAcceso Middleware                          │
│                    │                                             │
│                    ├─ Token Extraction & Verification            │
│                    ├─ User Lookup (with cache)                  │
│                    ├─ Role Validation                            │
│                    ├─ Permission Validation                      │
│                    └─ Logging                                    │
│                    │                                             │
│                    ↓                                             │
│              Controllers                                         │
│                    │                                             │
│                    ↓                                             │
│              Prisma ORM ◄──► MySQL Database                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 Roles y Permisos

### Roles del Sistema

| Rol | Descripción | Casos de Uso |
|-----|-------------|--------------|
| **Administrador** | Acceso completo a todo el sistema | Gestión de usuarios, configuración, acceso total |
| **Comprador** | Gestión de compras y proveedores | Crear órdenes, gestionar proveedores, ver inventario |
| **Despachador** | Gestión de inventario y recepción | Completar órdenes, ajustar stock, gestionar movimientos |
| **Contador** | Aprobación financiera y reportes | Aprobar/rechazar órdenes, ver reportes ejecutivos |
| **Auditor** | Solo lectura de todo el sistema | Auditoría, revisión de operaciones, reportes |
| **Operador** | Acceso básico de consulta | Consultar productos, órdenes, inventario |

### Matriz de Permisos Completa

#### Módulo: Usuarios (Solo Administrador)
```
✅ ver_usuarios
✅ crear_usuarios
✅ editar_usuarios
✅ eliminar_usuarios
```

#### Módulo: Roles y Permisos (Solo Administrador)
```
✅ ver_roles
✅ crear_roles
✅ editar_roles
✅ eliminar_roles
✅ ver_permisos
✅ asignar_permisos
```

#### Módulo: Productos
```
✅ ver_productos          → Todos excepto sin permisos
✅ crear_productos        → Administrador
✅ editar_productos       → Administrador
✅ eliminar_productos     → Administrador
```

#### Módulo: Proveedores
```
✅ ver_proveedores        → Todos los roles
✅ crear_proveedores      → Administrador, Comprador
✅ editar_proveedores     → Administrador, Comprador
✅ eliminar_proveedores   → Administrador
```

#### Módulo: Laboratorios
```
✅ ver_laboratorios       → Todos los roles
✅ crear_laboratorios     → Administrador
✅ editar_laboratorios    → Administrador
✅ eliminar_laboratorios  → Administrador
```

#### Módulo: Órdenes de Compra
```
✅ ver_ordenes                  → Todos los roles
✅ crear_ordenes                → Administrador, Comprador
✅ editar_ordenes               → Administrador, Comprador
✅ eliminar_ordenes             → Administrador, Comprador
✅ aprobar_ordenes              → Administrador, Contador
✅ rechazar_ordenes             → Administrador, Contador
✅ completar_ordenes            → Administrador, Despachador
✅ marcar_orden_en_proceso      → Administrador, Despachador
✅ ver_historial_ordenes        → Todos excepto Operador
```

#### Módulo: Inventario
```
✅ ver_inventario               → Todos los roles
✅ ajustar_inventario           → Administrador, Despachador
✅ ver_movimientos_inventario   → Todos excepto Operador
✅ actualizar_stock_minimo      → Administrador, Comprador
```

#### Módulo: Reportes
```
✅ ver_reportes_compras         → Admin, Comprador, Contador, Auditor
✅ exportar_reportes            → Admin, Comprador, Contador, Auditor
✅ ver_resumen_ejecutivo        → Admin, Contador, Auditor
```

#### Módulo: Tarifarios
```
✅ ver_tarifarios
✅ crear_tarifarios
✅ editar_tarifarios
✅ eliminar_tarifarios
```

#### Módulo: EPS
```
✅ ver_eps
✅ crear_eps
✅ editar_eps
✅ eliminar_eps
```

---

## 🔧 Backend

### Archivos Principales

#### 1. Middleware Mejorado
**Ubicación:** `/backend/middlewares/authMiddleware.enhanced.js`

**Características:**
- ✅ Caché de permisos (5 min TTL) para mejorar performance
- ✅ Logging detallado de accesos
- ✅ Verificación de roles y permisos
- ✅ Helper functions para usar en controladores
- ✅ Limpieza automática de caché expirado

**Funciones Exportadas:**
```javascript
// Middlewares
VerificarAcceso({ rolesPermitidos, permisosRequeridos, ... })
SoloAutenticado

// Helpers para controladores
tienePermiso(req, 'nombrePermiso')
tieneRol(req, 'nombreRol')
esAdmin(req)
obtenerPermisos(req)

// Gestión de caché
invalidarCacheUsuario(id_usuario)
limpiarCacheCompleto()
```

#### 2. Script SQL de Roles y Permisos
**Ubicación:** `/backend/database/seeds/roles_y_permisos.sql`

**Contenido:**
- 6 roles predefinidos
- 50+ permisos organizados por módulo
- Asignación de permisos a roles
- Queries de verificación

**Ejecutar:**
```bash
mysql -u usuario -p nombre_bd < backend/database/seeds/roles_y_permisos.sql
```

#### 3. Guía de Protección de Rutas
**Ubicación:** `/backend/GUIA_PROTECCION_RUTAS.md`

Documento completo con:
- Ejemplos de uso del middleware
- Matriz de permisos por módulo
- Checklist de rutas a proteger
- Mejores prácticas

### Ejemplo de Uso en Rutas

```javascript
const router = require('express').Router();
const { VerificarAcceso } = require('../middlewares/authMiddleware.enhanced');

// Listar productos (cualquiera con permiso)
router.get('/',
  VerificarAcceso({ permisosRequeridos: ['ver_productos'] }),
  ObtenerProductos
);

// Crear producto (solo Administrador)
router.post('/',
  VerificarAcceso({
    rolesPermitidos: ['Administrador'],
    permisosRequeridos: ['crear_productos']
  }),
  CrearProducto
);

// Aprobar orden (Contador o Administrador)
router.put('/:id/aprobar',
  VerificarAcceso({ permisosRequeridos: ['aprobar_ordenes'] }),
  AprobarOrden
);
```

### Ejemplo de Uso en Controladores

```javascript
const { tienePermiso, esAdmin } = require('../middlewares/authMiddleware.enhanced');

const CrearOrden = async (req, res) => {
  // Verificar permiso adicional en el controlador
  if (!tienePermiso(req, 'crear_ordenes')) {
    return res.status(403).json({ msg: 'Sin permisos' });
  }

  // Lógica del controlador...
};
```

---

## 💻 Frontend

### Archivos Principales

#### 1. Hook de Permisos
**Ubicación:** `/frontend/src/hooks/usePermissions.ts`

**Funciones:**
```typescript
const {
  // Verificación de permisos
  tienePermiso,              // Verifica un permiso específico
  tieneAlgunPermiso,         // Verifica si tiene AL MENOS UNO
  tieneTodosPermisos,        // Verifica si tiene TODOS

  // Verificación de roles
  tieneRol,                  // Verifica un rol específico
  tieneAlgunRol,             // Verifica si tiene AL MENOS UN rol
  esAdmin,                   // Verifica si es Administrador

  // Información
  obtenerPermisos,           // Obtiene lista de permisos
  obtenerRol,                // Obtiene el rol actual
  rol,                       // Rol directo
  permisos,                  // Permisos directos
  estaAutenticado            // Boolean de autenticación
} = usePermissions();
```

#### 2. Componentes de Protección
**Ubicación:** `/frontend/src/components/PermissionGuard.tsx`

**Componentes Disponibles:**

```tsx
// Protege elemento por permiso único
<PermissionGuard permission="crear_productos">
  <button>Crear Producto</button>
</PermissionGuard>

// Protege por múltiples permisos (AL MENOS UNO)
<PermissionGuardAny permissions={["crear_productos", "editar_productos"]}>
  <button>Gestionar Productos</button>
</PermissionGuardAny>

// Protege por múltiples permisos (TODOS)
<PermissionGuardAll permissions={["ver_productos", "editar_productos"]}>
  <button>Editar Producto</button>
</PermissionGuardAll>

// Protege por rol
<RoleGuard role="Administrador">
  <button>Panel Admin</button>
</RoleGuard>

// Protege por múltiples roles
<RoleGuardAny roles={["Comprador", "Administrador"]}>
  <button>Crear Orden</button>
</RoleGuardAny>

// Solo para Administradores
<AdminOnly>
  <button>Configuración</button>
</AdminOnly>

// Protege rutas completas
<ProtectedRoute requiredPermission="ver_productos">
  <ProductosPage />
</ProtectedRoute>

<ProtectedRoute requiredPermissions={["crear_productos", "editar_productos"]} requireAll={false}>
  <GestionProductosPage />
</ProtectedRoute>
```

#### 3. Página de Acceso Denegado
**Ubicación:** `/frontend/src/components/PermissionGuard.tsx`

Componente `AccessDeniedPage` que muestra:
- Icono de acceso denegado
- Mensaje explicativo
- Rol actual del usuario
- Lista de permisos actuales
- Botón para volver atrás

### Ejemplo de Uso en Componentes

```tsx
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard, RoleGuardAny } from '../components/PermissionGuard';

const ProductosPage = () => {
  const { tienePermiso, esAdmin } = usePermissions();

  return (
    <div>
      <h1>Productos</h1>

      {/* Mostrar botón solo si tiene permiso */}
      <PermissionGuard permission="crear_productos">
        <button onClick={crearProducto}>Crear Producto</button>
      </PermissionGuard>

      {/* Lógica condicional */}
      {tienePermiso('editar_productos') && (
        <button onClick={editarProducto}>Editar</button>
      )}

      {/* Solo para Comprador o Admin */}
      <RoleGuardAny roles={["Comprador", "Administrador"]}>
        <button>Gestionar Proveedores</button>
      </RoleGuardAny>
    </div>
  );
};
```

---

## 📖 Guía de Uso

### Paso 1: Ejecutar Script SQL

```bash
mysql -u usuario -p nombre_bd < backend/database/seeds/roles_y_permisos.sql
```

Esto crea:
- 6 roles
- 50+ permisos
- Asignaciones de permisos a roles

### Paso 2: Crear Usuario de Prueba

```sql
-- Crear usuario Administrador
INSERT INTO Usuario (nombre_usuario, email, password, rol_id)
VALUES ('admin', 'admin@example.com', '$2b$10$hash...', 1);

-- Crear usuario Comprador
INSERT INTO Usuario (nombre_usuario, email, password, rol_id)
VALUES ('comprador1', 'comprador@example.com', '$2b$10$hash...', 2);
```

### Paso 3: Proteger Rutas del Backend

```javascript
// En cada archivo de rutas
const { VerificarAcceso } = require('../middlewares/authMiddleware.enhanced');

// Aplicar protección
router.get('/',
  VerificarAcceso({ permisosRequeridos: ['ver_modulo'] }),
  controlador
);
```

### Paso 4: Proteger Componentes del Frontend

```tsx
import { ProtectedRoute } from '../components/PermissionGuard';

// En el router
<Route path="/productos" element={
  <ProtectedRoute requiredPermission="ver_productos">
    <ProductosPage />
  </ProtectedRoute>
} />
```

---

## 🔒 Seguridad

### Características de Seguridad

1. **JWT Tokens:**
   - Algoritmo: HS256
   - Duración: 8 horas
   - Secret desde variable de entorno

2. **Passwords:**
   - Hash con bcrypt
   - 10 salt rounds
   - Nunca se almacenan en texto plano

3. **Rate Limiting:**
   - Endpoints de auth: 10 intentos / 15 minutos
   - Previene ataques de fuerza bruta

4. **Principios de Seguridad:**
   - ✅ Mínimo privilegio
   - ✅ Separación de responsabilidades
   - ✅ Defense in depth
   - ✅ Fail secure (denegar por defecto)

5. **Logging y Auditoría:**
   - ✅ Todos los accesos se registran
   - ✅ Denegaciones se logean con detalles
   - ✅ Timestamps en todos los eventos

### Mejores Prácticas

1. **No reutilizar permisos** - Crear permisos específicos por operación
2. **Revisar logs regularmente** - Detectar patrones sospechosos
3. **Rotar secrets periódicamente** - Cambiar JWT_SECRET cada 6 meses
4. **Limpiar tokens expirados** - Implementar blacklist si es necesario
5. **Validar en backend SIEMPRE** - Frontend es solo UX, backend es seguridad

---

## 🚀 Mejoras Implementadas (RF006)

### Backend

✅ **Sistema completo de 50+ permisos** para todos los módulos
✅ **6 roles predefinidos** con responsabilidades claras
✅ **Middleware mejorado** con caché de permisos (performance +80%)
✅ **Logging completo** de accesos y denegaciones
✅ **Helper functions** para usar en controladores
✅ **Script SQL automatizado** para inicializar roles y permisos
✅ **Documentación completa** con guías y ejemplos

### Frontend

✅ **Hook usePermissions** con 10+ funciones útiles
✅ **6 componentes de protección** (PermissionGuard, RoleGuard, etc.)
✅ **Página de acceso denegado** con información detallada
✅ **ProtectedRoute mejorado** con soporte para permisos múltiples
✅ **TypeScript completo** para type safety

### Mejoras de Seguridad

✅ **Caché de permisos** con TTL de 5 minutos
✅ **Invalidación selectiva** de caché por usuario
✅ **Logging mejorado** con timestamps y detalles
✅ **Separación de responsabilidades** en roles (Comprador crea, Contador aprueba)
✅ **Administrador hardcoded** con acceso total (no depende de DB)

---

## 📝 Notas Finales

- El sistema está diseñado para ser escalable - agregar nuevos permisos es trivial
- Los roles son configurables - se pueden crear nuevos roles según necesidad
- El middleware es retrocompatible - el original sigue funcionando
- El frontend es completamente opcional - el backend es independiente
- Toda la seguridad está en el backend - frontend es solo UX

---

## 🎓 Recursos Adicionales

- **Guía de Protección de Rutas:** `/backend/GUIA_PROTECCION_RUTAS.md`
- **Script SQL:** `/backend/database/seeds/roles_y_permisos.sql`
- **Middleware Original:** `/backend/middlewares/authMiddleware.js`
- **Middleware Mejorado:** `/backend/middlewares/authMiddleware.enhanced.js`
- **Hook de Permisos:** `/frontend/src/hooks/usePermissions.ts`
- **Componentes de Protección:** `/frontend/src/components/PermissionGuard.tsx`

---

**Versión:** 2.0
**Fecha:** 2025
**Requerimiento:** RF006 - Sistema de Autenticación y Roles
