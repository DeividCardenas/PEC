# Guía de Protección de Rutas con Auth Middleware (RF006)

## 📋 Índice
- [Introducción](#introducción)
- [Middleware Disponibles](#middleware-disponibles)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Matriz de Permisos por Módulo](#matriz-de-permisos-por-módulo)
- [Aplicación a Todas las Rutas](#aplicación-a-todas-las-rutas)

---

## 🎯 Introducción

Este documento proporciona una guía completa para proteger todas las rutas del backend usando el sistema mejorado de autenticación y autorización.

**Archivos clave:**
- `middlewares/authMiddleware.enhanced.js` - Middleware mejorado (RECOMENDADO)
- `middlewares/authMiddleware.js` - Middleware original (compatible)

---

## 🛡️ Middleware Disponibles

### 1. VerificarAcceso (Principal)

Middleware completo con verificación de roles y permisos.

```javascript
const { VerificarAcceso } = require('../middlewares/authMiddleware.enhanced');

// Uso básico
router.get('/ruta', VerificarAcceso({}), controller);

// Con roles
router.get('/ruta', VerificarAcceso({
  rolesPermitidos: ['Administrador', 'Comprador']
}), controller);

// Con permisos
router.post('/productos', VerificarAcceso({
  permisosRequeridos: ['crear_productos']
}), crearProducto);

// Con múltiples permisos (AL MENOS UNO)
router.get('/productos', VerificarAcceso({
  permisosRequeridos: ['ver_productos', 'editar_productos']
}), obtenerProductos);

// Requiere TODOS los permisos
router.delete('/productos/:id', VerificarAcceso({
  permisosRequeridos: ['eliminar_productos', 'ver_productos'],
  requiereTodosLosPermisos: true
}), eliminarProducto);
```

### 2. SoloAutenticado (Simplificado)

Solo verifica que el usuario esté autenticado, sin verificar permisos específicos.

```javascript
const { SoloAutenticado } = require('../middlewares/authMiddleware.enhanced');

router.get('/perfil', SoloAutenticado, obtenerPerfil);
```

---

## 📚 Ejemplos de Uso por Módulo

### Módulo: Productos

```javascript
const { VerificarAcceso } = require('../middlewares/authMiddleware.enhanced');

// Ver productos (cualquier usuario autenticado con permiso)
router.get('/',
  VerificarAcceso({ permisosRequeridos: ['ver_productos'] }),
  ObtenerProductos
);

// Crear producto (solo Administrador y Comprador)
router.post('/',
  VerificarAcceso({
    permisosRequeridos: ['crear_productos']
  }),
  CrearProducto
);

// Editar producto
router.put('/:id',
  VerificarAcceso({ permisosRequeridos: ['editar_productos'] }),
  ActualizarProducto
);

// Eliminar producto (solo Administrador)
router.delete('/:id',
  VerificarAcceso({
    rolesPermitidos: ['Administrador'],
    permisosRequeridos: ['eliminar_productos']
  }),
  EliminarProducto
);
```

### Módulo: Órdenes de Compra

```javascript
// Ver órdenes
router.get('/',
  VerificarAcceso({ permisosRequeridos: ['ver_ordenes'] }),
  ObtenerOrdenes
);

// Crear orden (Comprador)
router.post('/',
  VerificarAcceso({ permisosRequeridos: ['crear_ordenes'] }),
  CrearOrden
);

// Aprobar orden (Contador)
router.put('/:id/aprobar',
  VerificarAcceso({ permisosRequeridos: ['aprobar_ordenes'] }),
  AprobarOrden
);

// Completar orden (Despachador)
router.put('/:id/completar',
  VerificarAcceso({ permisosRequeridos: ['completar_ordenes'] }),
  CompletarOrden
);

// Marcar en proceso (Comprador o Despachador)
router.put('/:id/en-proceso',
  VerificarAcceso({
    permisosRequeridos: ['marcar_orden_en_proceso']
  }),
  MarcarEnProceso
);
```

### Módulo: Inventario

```javascript
// Ver inventario
router.get('/',
  VerificarAcceso({ permisosRequeridos: ['ver_inventario'] }),
  ObtenerInventario
);

// Ajustar stock (Despachador)
router.post('/ajustar',
  VerificarAcceso({ permisosRequeridos: ['ajustar_inventario'] }),
  AjustarStock
);

// Ver movimientos
router.get('/movimientos',
  VerificarAcceso({ permisosRequeridos: ['ver_movimientos_inventario'] }),
  ObtenerMovimientos
);
```

### Módulo: Reportes

```javascript
// Ver reportes (Contador, Auditor, Administrador)
router.get('/compras',
  VerificarAcceso({ permisosRequeridos: ['ver_reportes_compras'] }),
  ObtenerReporteCompras
);

// Exportar reportes
router.get('/exportar-csv',
  VerificarAcceso({ permisosRequeridos: ['exportar_reportes'] }),
  ExportarReporteCSV
);

// Resumen ejecutivo (Contador, Administrador)
router.get('/resumen-ejecutivo',
  VerificarAcceso({ permisosRequeridos: ['ver_resumen_ejecutivo'] }),
  ObtenerResumenEjecutivo
);
```

### Módulo: Usuarios (Solo Administrador)

```javascript
// Ver usuarios
router.get('/',
  VerificarAcceso({
    rolesPermitidos: ['Administrador'],
    permisosRequeridos: ['ver_usuarios']
  }),
  ObtenerUsuarios
);

// Crear usuario
router.post('/',
  VerificarAcceso({
    rolesPermitidos: ['Administrador'],
    permisosRequeridos: ['crear_usuarios']
  }),
  CrearUsuario
);

// Eliminar usuario
router.delete('/:id',
  VerificarAcceso({
    rolesPermitidos: ['Administrador'],
    permisosRequeridos: ['eliminar_usuarios']
  }),
  EliminarUsuario
);
```

---

## 📊 Matriz de Permisos por Módulo

### Productos
| Permiso | Admin | Comprador | Despachador | Contador | Auditor | Operador |
|---------|:-----:|:---------:|:-----------:|:--------:|:-------:|:--------:|
| ver_productos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| crear_productos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| editar_productos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| eliminar_productos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Proveedores
| Permiso | Admin | Comprador | Despachador | Contador | Auditor | Operador |
|---------|:-----:|:---------:|:-----------:|:--------:|:-------:|:--------:|
| ver_proveedores | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| crear_proveedores | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| editar_proveedores | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| eliminar_proveedores | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Órdenes de Compra
| Permiso | Admin | Comprador | Despachador | Contador | Auditor | Operador |
|---------|:-----:|:---------:|:-----------:|:--------:|:-------:|:--------:|
| ver_ordenes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| crear_ordenes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| editar_ordenes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| eliminar_ordenes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| aprobar_ordenes | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| rechazar_ordenes | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| completar_ordenes | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| marcar_orden_en_proceso | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ver_historial_ordenes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Inventario
| Permiso | Admin | Comprador | Despachador | Contador | Auditor | Operador |
|---------|:-----:|:---------:|:-----------:|:--------:|:-------:|:--------:|
| ver_inventario | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ajustar_inventario | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ver_movimientos_inventario | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| actualizar_stock_minimo | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Reportes
| Permiso | Admin | Comprador | Despachador | Contador | Auditor | Operador |
|---------|:-----:|:---------:|:-----------:|:--------:|:-------:|:--------:|
| ver_reportes_compras | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| exportar_reportes | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| ver_resumen_ejecutivo | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |

### Usuarios, Roles y Permisos (Solo Administrador)
| Permiso | Admin | Comprador | Despachador | Contador | Auditor | Operador |
|---------|:-----:|:---------:|:-----------:|:--------:|:-------:|:--------:|
| ver_usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| crear_usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| editar_usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| eliminar_usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ver_roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| crear_roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| editar_roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| eliminar_roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 Aplicación a Todas las Rutas

### Checklist de Rutas a Proteger

#### ✅ Ya Protegidas
- [x] Tarifarios

#### 🔴 Necesitan Protección

**Productos:**
- [ ] GET /pec/productos
- [ ] POST /pec/productos
- [ ] PUT /pec/productos/:id
- [ ] DELETE /pec/productos/:id

**Proveedores:**
- [ ] GET /pec/proveedores
- [ ] POST /pec/proveedores
- [ ] PUT /pec/proveedores/:id
- [ ] DELETE /pec/proveedores/:id

**Laboratorios:**
- [ ] GET /pec/laboratorios
- [ ] POST /pec/laboratorios
- [ ] PUT /pec/laboratorios/:id
- [ ] DELETE /pec/laboratorios/:id

**Órdenes de Compra:**
- [ ] GET /pec/ordenes-compra
- [ ] POST /pec/ordenes-compra
- [ ] PUT /pec/ordenes-compra/:id
- [ ] DELETE /pec/ordenes-compra/:id
- [ ] PUT /pec/ordenes-compra/:id/aprobar
- [ ] PUT /pec/ordenes-compra/:id/rechazar
- [ ] PUT /pec/ordenes-compra/:id/completar
- [ ] PUT /pec/ordenes-compra/:id/en-proceso
- [ ] GET /pec/ordenes-compra/:id/historial

**Inventario:**
- [ ] GET /pec/inventario
- [ ] POST /pec/inventario/ajustar
- [ ] GET /pec/inventario/movimientos

**Reportes:**
- [ ] GET /pec/reportes/compras
- [ ] GET /pec/reportes/exportar-csv
- [ ] GET /pec/reportes/resumen-ejecutivo

**Usuarios:**
- [ ] GET /pec/usuarios
- [ ] POST /pec/usuarios
- [ ] PUT /pec/usuarios/:id
- [ ] DELETE /pec/usuarios/:id

**Roles:**
- [ ] GET /pec/roles
- [ ] POST /pec/roles
- [ ] PUT /pec/roles/:id
- [ ] DELETE /pec/roles/:id

**Permisos:**
- [ ] GET /pec/permisos
- [ ] POST /pec/permisos
- [ ] PUT /pec/permisos/:id
- [ ] DELETE /pec/permisos/:id

---

## 💡 Mejores Prácticas

1. **Principio de Mínimo Privilegio**: Otorgar solo los permisos necesarios
2. **Separación de Responsabilidades**: Comprador crea, Contador aprueba
3. **Administrador siempre tiene acceso**: El middleware ya lo maneja automáticamente
4. **Auditor solo lectura**: Todos los permisos `ver_*`
5. **Usar caché de permisos**: Ya implementado en el middleware mejorado
6. **Logging de accesos**: Activado por defecto para auditoría

---

## 🚀 Implementación Rápida

Para proteger un archivo de rutas completo:

```javascript
const router = require('express').Router();
const { VerificarAcceso } = require('../middlewares/authMiddleware.enhanced');

// Proteger TODAS las rutas de este módulo (requiere autenticación mínima)
router.use(VerificarAcceso({}));

// Ahora agregar rutas específicas con permisos adicionales
router.get('/',
  VerificarAcceso({ permisosRequeridos: ['ver_productos'] }),
  ObtenerProductos
);

router.post('/',
  VerificarAcceso({ permisosRequeridos: ['crear_productos'] }),
  CrearProducto
);
```

---

## 📝 Notas Finales

- **IMPORTANTE**: Aplicar protección a TODAS las rutas excepto `/login` y `/health`
- Ejecutar el script SQL `roles_y_permisos.sql` antes de usar este sistema
- El Administrador siempre tiene acceso completo (hardcoded en el middleware)
- Los permisos se cachean por 5 minutos para mejorar performance
- Usar `invalidarCacheUsuario(id)` cuando se cambien permisos de un usuario
